# Quest-Agent — Hunt 1 (02.10.2026)

**Was geprüft wurde und wie:**
- **Kein Browser-Test.** Der Browser war während des ganzen Laufs voll (9 Tabs, Limit erreicht). Keiner davon gehört mir. Fremde Tabs schließe ich nicht, tab-10 sowieso nicht. Deshalb ist jede Aussage unten durch **Lesen von Code** belegt. **Durchgespielt** heißt hier: jeden Pfad im Code von Start bis Ende verfolgt.
- **Kein Spielstand angefasst.** `localStorage` habe ich weder gelesen noch geschrieben.
- **Code geändert während des Laufs.** Der Code ist nicht eingefroren: `src/game.js` wuchs während des Laufs von 19 126 auf 19 183 Zeilen (Änderung 10:03), `src/data.js` wurde um 09:52 geändert. Die Zeilennummern unten gelten für den Stand **02.10. ca. 10:05**. Zusätzlich nenne ich immer den Funktionsnamen als Anker.
- **Arbeitsteilung.** Fünf Lese-Helfer haben Teilgebiete kartiert: Blutkult, Varon/Belagerung, Kette/Goblins/Omega, Aurelion/Seevolk/Kerker, Ahnenfeind/Gewölbe/Bosse. Ihre wichtigsten Behauptungen habe ich selbst am Code nachgeprüft (siehe „geprüft“ bei den Kandidaten). Ungeprüfte Helfer-Aussagen sind als **(Helfer, ungeprüft)** markiert.
- **Bekannte Fehler.** RB-001…RB-060 und SC-01…04 melde ich nicht erneut.

---

## Übersicht

Testergebnis: **ok** = alle Pfade im Code erreichbar · **Lücke** = ein Sandbox-Fall ist nicht behandelt · **bricht** = mindestens ein Pfad hängt fest oder ist unmöglich.

| # | Questreihe | Testergebnis (Code) | heutige Kernaufgabe | vorgeschlagene Kernaufgabe |
|---|---|---|---|---|
| 1 | Eren-Anfang (Havel, Elena, Jorun, Mara) | bricht (QA-06), Lücke | töten, sammeln, finden | Wem gehört die Grube? (Wirtschaftsentscheid) |
| 2 | Paladinprüfungen (Kelan) | **bricht (QA-01)** | Untote töten, Siegel holen, Schrein halten | Ein Dorf durch einen echten Totenüberfall bringen |
| 3 | Pakt der Stillen Schar (Morvath → Ysra/Vhal) | ok, Lücke | Siegel und Urne holen | Eine Hand als Preis; welche Prothese, von wem |
| 4 | Ruf des Hains (Mira → Druide) | ok, Lücke | Wölfe töten, Kraut bringen | Holzfällerbetrieb vom Hain wegbewegen (Wirtschaft) |
| 5 | Probe der Stillen Hand (Ilva → Mönch) | ok | ausweichen, Tote töten | Einen Gesuchten lebend vor Gericht bringen |
| 6 | Klassen-Questreihen (12 Aufträge, 4 Titel) | **bricht (QA-02)**, Lücke (QA-14) | töten und bringen → Rüstungsteil | je Titel eine eigene Tat (siehe Blatt 6) |
| 7 | Todesritter-Schwüre (Sael) | ok, Lücke | Jäger, Automaten, Ritter töten | Den eigenen Ahnen aus dem Grab richten |
| 8 | Totenland: Grabräuber, Überfall, Heer der Toten | ok, Lücke | töten · Dorf/Stadt einnehmen | Grabgut über die Märkte zurückverfolgen |
| 9 | Einzelaufträge (Oda, Lioba, Quirin, Rook) | Lücke (QA-16) | holen, töten, bringen | Bericht ändert die Kriegskarte; Lied ändert den Ruf |
| 10 | Regionalbosse (Tomas, Gerold, Brann) | Lücke (QA-15, QA-16) | Boss töten | Machtvakuum besetzen: wer füllt die Lücke |
| 11 | Rangreihen (6 Fraktionen, 40 Aufträge) | Lücke (QA-13) | N töten oder N bringen | je Rang eine Fraktionstat in der Simulation |
| 12 | Aufträge am Brett, beim Verteidigungsmeister und von Bewohnern (15 Arten) | ok, Lücke | töten, liefern, begleiten, abgehen | Auftrag aus echtem Mangel; Tod des Gebers = Erbe übernimmt |
| 13 | Gefährten-Auftrag und Gerüchte | Lücke (Helfer) | Elite töten, Spur folgen | Die Wunde des Gefährten: Prothese und wer zahlt |
| 14 | König Varon (Audienz, Dienst, Verräter, Ritterschlag) | **bricht (QA-05)**, Lücke | töten, reden, Namen nennen | Beweis beschaffen, verkaufen oder vorlegen (Hofpolitik) |
| 15 | Varonheim: Fall, Exil, Rückeroberung | Lücke (S3 fehlt) | Wellen abwehren | Luftbrücke: versorgen oder den König ausfliegen |
| 16 | Blutkult (§5g.2) | **bricht (QA-03)**, Lücke (QA-11) | Spuren, Anklage, Katakomben, Wahl | bleibt (schon eigen); Spuren sichtbar machen |
| 17 | Eisenmark: Tribut, Pferch, Entlaufene | **bricht (QA-07, QA-08)** | rauben/zurückgeben, Schlüssel, jagen | Freikauf über den Sklavenmarkt (Wirtschaft) |
| 18 | Grisk / Freie vom Grubenhort | Lücke (QA-12) | finden, töten, Holz und Stein | Erste Goblin-Handelsroute in eine Menschenstadt |
| 19 | Dodon / Sturm von Morrgrund | Lücke (QA-10) | Brot, Eisen, töten → Sturm | Den Goblinrat überzeugen (NPC-Ziele) |
| 20 | Rotfall und Omega | bricht (QA-09) | Bruchstücke sammeln → Ritual | bleibt; Wissen über Gespräche statt Liste |
| 21 | Seevolk (Salzbund, Sturmklinge, Weißbart) | **bricht (QA-04)**, QA-12 | töten, bringen → Seite wählen | Seehandel oder Kaperfahrt mit dem eigenen Schiff |
| 22 | Aurelion: Intrige, Ratssitz, Gericht | Lücke, Ausnutzung (QA-17, QA-18) | Bote/Mord, Gunst sammeln | Bionik eines Hauses: dein Körper gehört dem Haus |
| 23 | Kerker Salzhafen (Mo, Rask) | ok, kleine Lücke | Mann finden, Kiste öffnen | Diebstahl im Kontor bewegt Preise |
| 24 | Anomalie | ok | Schutzzauber im Zentrum | Kristall an Aurelion oder Versiegelung durch den Orden |
| 25 | Ahnenfeind (+ Entführung) | Lücke (QA-19) | Mörder des Vorgängers töten | Lösegeld, Duell oder Rettung des Kindes |
| 26 | Gewölbe | Ausnutzung (QA-20) | Ebenen säubern, Hort | Bergung: was du hochbringst, kauft Aurelion |
| 27 | Feldzüge (Kette-Feldzug, Kreuzzug Konrad) | nicht geprüft | mitziehen | — |

**Zahlen:** 27 Questreihen. 26 davon sind im Code von Anfang bis jedem Ende verfolgt, Nr. 27 nur gestreift. Im Browser durchgespielt: **0**, weil kein Tab frei war. Dazu 20 Kandidaten (QA-01…QA-20).

**Gleiche Kernaufgabe unter anderem Namen (Teil 2):**
- **„Töte N vom Typ X und komm zurück“** ist das Muster der großen Mehrheit der festen Aufträge (nicht genau gezählt): q_wolves, q_paladin1, q_graverobbers, q_hundred_song, q_rook, dk_1–3, 10 von 12 Klassenaufträgen, g_dod1–3 (Teile), q_salz1, q_klinge1, 36 der 40 Rangaufträge, dazu die Brett-Arten Kopfgeld, Monster, Jagd und Verteidigung.
- **„Bring N Stück“:** q_herbs, q_pelts, q_salz2, q_klinge2, 4 Rangaufträge, die Brett-Arten Vorräte und Kräuter, g_dod1/2 (Teile), q_grisk_build.
- **„Hol den einmaligen Gegenstand vom Ort X“:** q_paladin2, q_undead, q_frontier, q_pact, q_kingsiron.
- **„Prüfung, dann Klasse“** läuft viermal gleich ab, jeweils mit Knien und Ringen: Paladin, Pakt, Hain, Stille Hand.

**Schon heute eigen:**
- Blutkult (Spurensuche, Anklage)
- Lila (Wahrheit oder Lüge)
- Rotfall/Omega (Preis: ein Gefährte und Blut)
- Überfall und Heer der Toten (Befehl über die Kriegskarte)
- Anomalie (Zauber an einem Ort)
- Ahnenfeind (wer dich getötet hat)

---

## Quest-Blätter

### 1 · Eren-Anfang
- **Auftraggeber/Fraktion:**
  - Havel (Dorfvorsteher, Valen): q_wolves
  - Elena (Heilerin, Orden): q_herbs
  - Jorun (Bauer): q_lila
  - Mara (Händlerin, Händler): q_mine
- **Schritte und Enden** (data.js:1111–1122, game.js:12429ff):
  - q_wolves: 3 Wölfe töten, bei Havel abgeben.
  - q_herbs: 3 Heilkraut sammeln. Die Belohnung nimmt die Kräuter **nicht** ab (kein `take`).
  - q_lila: Lila im Banditenlager finden (`questCheck`, Abstand < 120), dann bei Jorun drei Enden (`lilaOutcome`, `finishLila` 12469):
    - Wahrheit: Lila wird anwerbbar.
    - Versprechen: Lila kehrt heim.
    - Lüge: 40 Gold, Valen −3.
  - q_mine: Gorak in der Grube töten.
- **Testergebnis (Code):**
  - Alle Enden von q_lila sind erreichbar.
  - q_mine bricht, wenn Gorak **vor** der Annahme stirbt (QA-06). Gorak entsteht nur einmal (`initialSpawns` 1832), und `startQuest` rechnet nur Hrodvar und Regionalbosse vorab an (12349ff).
  - Abbrechen und neu annehmen ist harmlos.
- **Sandbox-Fälle:**
  - **Geber tot:** nicht behandelt. Benannte NPC sterben endgültig (`die` 3562ff, Leiche/Grab). Der Auftrag bleibt für immer „offen“, `questPoint` liefert dann nichts mehr.
  - **Gegenstand verkauft:** Kraut lässt sich nachkaufen, kein Problem.
  - **Schritt vorher erledigt:** bei q_wolves egal (Wölfe kommen nach), bei q_mine bricht es (QA-06). Lila wird nur nach Annahme „gefunden“.
  - **Krieg mit Valen:** Havel ist feindlich, Auftrag ruht, nicht behandelt.
- **Was der Spieler tut:** Wölfe töten, Kraut pflücken, ein Mädchen suchen, ein Monster in der Grube töten.
- **Gleiche Kernaufgabe:** q_wolves ist dieselbe Aufgabe wie die Brett-Jagd, Rang Valen 2a, c_dru1 und q_grove. q_mine ist ein Boss-Kill wie Nr. 10.
- **Vorschlag Kernaufgabe — „Wem gehört die Grube“:**
  - Nach Gorak entscheidet der Spieler, wer die Grube betreibt: Mara (Händler, das Eisen geht in den Verkauf), Havel (Dorf, billiges Eisen im Stadtlager von Eren) oder die Kette (zahlt sofort Gold, schickt dafür Aufseher).
  - Folgen über `economy.js`: Eisenlager und Preise in Eren; bei der Kette entsteht ein Tributdorf.
  - **Sandbox:** Ist Gorak schon tot, fragt Mara sofort nach dem Besitz. Ist Mara tot, versteigert Havel die Grube. Ist Havel tot, nimmt sie die Kette ohne Frage.
  - **Heute:** 1 Ziel, 1 Abgabe. **Ändert:** Abgabe-Dialog mit 3 Wahlen plus Wirtschaftsfolge. **Aufwand:** M. **Abhängig von:** economy.js-Lager, Tributdörfer (§5d).
- **Heute sichtbar / nur Text:**
  - Sichtbar: Lila als Figur im Lager, Gorak als Boss.
  - Nur Text: Abgabe, Lilas Schicksal (Log und Chronik).
- **Visuelle Identität:**
  - **Emblem und Farbe:** Ähre über Spitzhacke, Erdbraun #8a6a3a.
  - **Erkennbarkeit:** Mara steht mit einer Erzkiste am Stand. Der Grubeneingang trägt ein Brett „GESPERRT“, das nach Gorak fällt.
  - **Signaturszene „Die Grube atmet wieder“:**
    1. Kamera auf dem Grubeneingang (`cinematic`, 2,5 s, `zoom` 1,3).
    2. Beat t0,2: `fx dust`, das Sperrbrett fällt (Prop entfernen).
    3. Beat t0,5: der gewählte Besitzer läuft ins Bild (`gesture salutieren` bzw. `zeigen`), Sprechblase mit seinem Satz.
    4. Beat t0,8: `nameCard` „DIE GRUBE VON EREN“, Untertitel = Besitzer.
  - **Spur in der Welt:** Je nach Besitzer Erzkarren vor der Grube, ein Kettenbanner oder Marktstände mit Eisen.
  - **Text durch Bild ersetzen:** Lilas Ende zeigen, also Lila sichtbar am Hof (Versprechen) oder bei der Bande (Wahrheit).
  - **Aufwand:** S–M.

### 2 · Paladinprüfungen (Kelan der Graue)
- **Auftraggeber/Fraktion:** Kelan, Orden. Voraussetzung: Beziehung ≥ 10 (`questAvailable` 12328).
- **Schritte:**
  - q_paladin1: 4 Skelette töten.
  - q_paladin2: Ordenssiegel holen (Truhe in der Grube, world.js:2364; auch in der Ordenskapelle und Tempelkammer).
  - q_paladin3: Schrein halten. `offerQuest` setzt `holdShrine` und erzeugt 4 Skelette. `questCheck` setzt den Fortschritt, sobald im Umkreis 12 keine Feinde mehr sind.
  - Belohnung: `unlock: 'paladin'`. Ohne q_paladin3 lehrt Kelan die Klasse nicht.
- **Testergebnis (Code):** **bricht (QA-01).**
  - Die Skelette erscheinen an der **Entwurfskoordinate** (76, 52) (game.js:12365), und `questCheck` misst an genau dieser Rohkoordinate (12441ff).
  - Der Waldschrein liegt aber nach `shiftCoords`/`worldPt` bei etwa (370, 78). Dorthin zeigt auch der Wegpunkt: `QUEST_WHERE.q_paladin3 = 'shrine'`, LOCATIONS werden verschoben (world.js:1734).
  - Prüfung 3 findet also rund 290 Kacheln weiter westlich statt, im Kettenland. Der Spieler steht am richtigen Schrein, und nichts passiert.
  - Je nachdem, ob am Rohpunkt andere Feinde stehen, schließt sie nie oder nur, wenn man zufällig dort hingeht. Damit ist die Paladin-Klasse praktisch gesperrt.
- **Sandbox-Fälle:**
  - **Kelan tot:** nicht behandelt. Prüfungen, Paladin-Klasse und Orden-Rangreihe (Geber kelan) sind für immer zu.
  - **Pakt gebunden:** Der Orden redet nicht mehr (talk 11787ff). Laufende Prüfungen hängen ohne Hinweis.
  - **Siegel ausgerüstet:** Das Ordenssiegel ist ein Umhang (data.js:370). Ausgerüstet zählt es nicht als „im Inventar“ (`questComplete` zählt nur `inv`), der Auftrag sieht unerfüllt aus. Kein Hinweis.
  - **Siegel verkauft:** Es gibt drei Truhen, also nachholbar.
- **Was der Spieler tut:** Untote töten, eine Truhe öffnen, an einem Schrein kämpfen.
- **Gleiche Kernaufgabe:** wie Orden 1b/2a, c_nec1 und q_monk (Untote töten). Das Halten eines Orts gleicht der Brett-Verteidigung.
- **Vorschlag Kernaufgabe — „Der Schwur des Schildes“:**
  - Kelan wählt ein echtes Dorf, das `raidDay` als nächstes Ziel der Toten führt.
  - Prüfung: Das Dorf übersteht den nächsten Überfall, mit Bewohnern ≥ X. Wie, entscheidet der Spieler: Palisade über das Siedlungssystem, Miliz anwerben, Bewohner evakuieren oder kämpfen.
  - **Sandbox:**
    - Kelan tot: Der Paladinmarschall übernimmt; die Prüfung wird zur Totenwache an Kelans Grab (`makeGrave`).
    - Dorf schon gefallen: Prüfung wird zu „Rückeroberung“.
    - Pakt gebunden: Kelan stellt die Prüfung als Urteil (Duell).
  - **Heute:** feste Koordinate, 4 Skelette. **Ändert:** Ziel ist ein Dorf aus der Simulation. **Aufwand:** M. **Abhängig von:** raidDay, Schutz-System, Bugfix QA-01.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Kelan (Elfenbein/Rot, Kite-Schild), Skelette.
  - Nur Text: Abgabe, Klassen-Freischaltung (Toast).
- **Visuelle Identität:**
  - **Emblem und Farbe:** Schild mit Flamme, Elfenbein #d9d2c0 mit Ordensrot #9b2e26.
  - **Erkennbarkeit:** Kelan trägt schon das Wappen (spawnNpcDef). Dazu ein Wachfeuer mit Ordenswimpel am Prüfungsdorf.
  - **Signaturszene „Die Nacht der Wache“:**
    1. Bei Sonnenuntergang Kamera vom Dorfrand auf den Spieler (`cinematic`, `stay`, 3 s).
    2. Beat t0,3: Glocke (`sfx`).
    3. Beat t0,6: Kelan `gesture salutieren`, Sprechblase „Bis zum Morgen.“
    4. Beat t0,9: `nameCard` „DIE WACHE VON …“.
    5. Am Morgen: Licht-`flash` in Gold, Kelan `knien`, Ringe (wie im Pakt-Ritual).
  - **Spur in der Welt:** Ordenswimpel und ein Gedenkstein im geretteten Dorf, oder ein verkohltes Dorf mit Grabreihe.
  - **Aufwand:** M.

### 3 · Pakt der Stillen Schar
- **Auftraggeber/Fraktion:**
  - Morvath (q_undead, Beziehung ≥ 5)
  - danach Ysra (Nekromant) oder Vhal (Hexenmeister), Fraktion Untote
- **Schritte** (`pactChoices`, `pactRitual`, `urnRite` 12290):
  1. Grabsiegel aus dem Moor holen.
  2. Morvath verweist nach Alt-Vharn.
  3. q_pact: Ahnenurne aus der Nekropole holen. Mit Untoten-Rang oder nach `wardenSlain` tritt der Wächter beiseite, sonst Kampf gegen ihn.
  4. Ritual bei Ysra oder Vhal führt zur Titelklasse. Unumkehrbar, die beiden schließen einander aus.
  - Ordensleute können den Pakt nicht schließen.
- **Testergebnis (Code):**
  - Beide Enden sind erreichbar.
  - Die Urne ist nachholbar: `urnRite` gibt sie erneut, wenn der Wächter tot ist oder man Rang hat. Verkauf ist also nicht tödlich.
  - Das Grabsiegel gibt es viermal (Moor, Alt-Vharn, Schwarze Feste, Grabräuberlager) und bei Ossara zu kaufen.
- **Sandbox-Fälle:**
  - Morvath, Ysra oder Vhal tot: nicht behandelt. Ysra tot heißt nur noch Vhal; beide tot heißt Pakt unmöglich, ohne Hinweis.
  - Orden beigetreten: behandelt, mit Hinweis.
  - Krieg mit den Untoten: Geber feindlich, nicht behandelt.
- **Was der Spieler tut:** zwei Gegenstände holen, dann eine Wahl in einem Dialog.
- **Gleiche Kernaufgabe:** „Hol den einmaligen Gegenstand“ wie q_paladin2, q_frontier, q_kingsiron.
- **Vorschlag Kernaufgabe — „Eine Hand für die Ahnen“:**
  - Der Pakt kostet eine Hand (`body.js damagePart`, Gliedverlust).
  - Ersatz:
    - Ysra bietet die **Totenhand**: Knochen, kein Wartungsbedarf, aber Orden und Valen erkennen sie.
    - Aurelion verkauft paktgebundenen Kunden nur zum dreifachen Preis oder gar nicht (`bionicLack`).
    - Der Schwarzmarkt bietet Schrott.
  - Die Wahl der Prothese zeigt, wohin man gehört.
  - **Sandbox:**
    - Ysra tot: Vhal nimmt stattdessen das Auge.
    - Spieler hat schon eine Prothese an der Hand: die Schar verlangt das Messing als Opfer, Aurelion-Ruf sinkt.
    - Orden: unverändert ausgeschlossen.
  - **Heute:** Attributkosten (`TITLE_CLASSES.cost`). **Ändert:** Kosten werden ein Körperteil. **Aufwand:** M. **Abhängig von:** body.js, Bionik-Händler (P5), T15 Messing.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Knien, Ringe, Totenlicht, glühende Augen (`pal.glow`), Wächterkampf.
  - Nur Text: Morvaths Hinweise.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Urne mit Auge, Grabgrün #4e8f7a (Nekromant) oder Violett #b07ae0 (Hexer).
  - **Erkennbarkeit:** Ysra am Ahnenaltar mit Urnenreihe; Vhal im Schattenkreis mit schwebenden Splittern.
  - **Signaturszene „Der Name bleibt“:**
    1. Totale auf den Altar (2 s, `duck`).
    2. Beat t0,4: die Hand des Spielers leuchtet (`fx necro` an der Hand), `camShake` 3.
    3. Beat t0,7: `flash` grün, die Hand fällt ab (`float` „Hand“).
    4. Beat t1: `nameCard` „PAKT DER STILLEN SCHAR“.
  - **Spur in der Welt:** Der Name des Spielers steht im Totenbuch von Vharnholm (Prop „Namensstein“). Bewohner zeigen auf die Totenhand (`gesture zeigen`).
  - **Aufwand:** M.

### 4 · Ruf des Hains (Mira → Druide)
- **Auftraggeber/Fraktion:** Mira, keine Fraktion.
- **Schritte:** 4 Wölfe vertreiben und 3 Kraut bringen, dann Ritual (`groveRitual`).
- **Testergebnis (Code):** ok. Der Fortschritt wird direkt geprüft (`progress[0] ≥ 4` plus Kraut).
- **Sandbox-Fälle:**
  - Mira tot: Druide unmöglich, Klassenreihe c_dru ebenso. Nicht behandelt.
  - Volle Titelklassen: behandelt (Hinweis).
- **Was der Spieler tut:** Wölfe töten, Kraut bringen.
- **Gleiche Kernaufgabe:** wie q_wolves + q_herbs, c_dru1, Valen 2a.
- **Vorschlag Kernaufgabe — „Holz oder Hain“:**
  - Ein Holzfällerbetrieb aus `S.eco` (Betriebe) schlägt im Westwald.
  - Der Spieler bringt den Betrieb dazu, umzuziehen: ein neues Waldstück kaufen, mit dem Vorarbeiter verhandeln, oder sabotieren (dann sinkt das Holzlager der Stadt und die Preise steigen).
  - **Sandbox:**
    - Betrieb schon zerstört (Krieg): Mira verlangt stattdessen das Pflanzen von Setzlingen.
    - Mira tot: ihre Schülerin bleibt mit Groll, der Ruf ist schwerer zu gewinnen.
  - **Heute:** Wölfe. **Ändert:** NPC mit eigenem Ziel umstimmen, Wirtschaftsfolge. **Aufwand:** M. **Abhängig von:** economy.js Betriebe, Holzlager.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Knien, Heil-fx.
  - Nur Text: Miras Bitte.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Hirschgeweih im Kreis, Moosgrün #5d7a3a.
  - **Erkennbarkeit:** Mira an der Quelle; Baumstümpfe mit roten Markierungen zeigen den Betrieb.
  - **Signaturszene „Die Quelle wird klar“:** Kamera auf das Quellwasser, `fx heal` steigt auf, Wölfe setzen sich (Wolfs-Figuren mit `facing` zum Spieler), `nameCard` „DER HAIN NIMMT DICH“.
  - **Spur in der Welt:** Junge Bäume an den Stümpfen, oder ein kahler Hang.
  - **Aufwand:** S–M.

### 5 · Probe der Stillen Hand (Ilva → Mönch)
- **Auftraggeber/Fraktion:** Ilva, Orden. Ausgeschlossen bei Pakt.
- **Schritte:** 10-mal knapp ausweichen (`evaded` 13858) und 4 Tote töten, dann `monkVow` (das Kloster nimmt Gold).
- **Testergebnis (Code):** ok. Ausweichen zählt nur für q_monk; zu den Folgen siehe QA-02.
- **Sandbox-Fälle:** Ilva tot ist nicht behandelt.
- **Was der Spieler tut:** ausweichen und töten.
- **Gleiche Kernaufgabe:** Untote töten wie Nr. 2.
- **Vorschlag Kernaufgabe — „Ohne Klinge“:**
  - Ein Gesuchter (Steckbrief, T08) soll **lebend** und unverletzt (`body`, keine Glieder ab) vor das Gericht in Sonnwacht gebracht werden.
  - Mittel: Ergeben (`surrender`), Fesseln mit Strick, Begleiten. Kein Mord im Umkreis.
  - **Sandbox:**
    - Der Gesuchte stirbt durch Dritte: Ilva prüft stattdessen, ob du seine Leiche würdig bestattest.
    - Ilva tot: ein älterer Mönch nimmt die Probe ab, verlangt aber das doppelte Gold.
  - **Aufwand:** M. **Abhängig von:** T08 Gefangennahme, Kopfgeldsystem.
- **Heute sichtbar / nur Text:**
  - Sichtbar: „Ausgewichen“-Text, Ringe.
  - Nur Text: der Goldverlust.
- **Visuelle Identität:**
  - **Emblem und Farbe:** offene Hand, Sandgrau #c8bfa8.
  - **Signaturszene:** Der Gefangene kniet vor Ilva (`gesture knien`), Ilva legt die Hand auf (`gesture zeigen`), `float` „Stille“, langsamer Zoom 1,0 → 1,4.
  - **Spur in der Welt:** Der Gefangene arbeitet danach im Kloster (Figur mit Strick am Gürtel).
  - **Aufwand:** S.

### 6 · Klassen-Questreihen (Ysra, Vhal, Mira, Ilva; je 3 Aufträge)
- **Auftraggeber/Fraktion:** der Meister der Titelklasse (`TITLE_CLASSES.mentor`). Voraussetzung: Grad II, der dritte Auftrag Grad III (`questAvailable` classQ).
- **Belohnung:** ein gebundenes Rüstungsteil. Ein Titelwechsel nach Questbeginn heißt: Titel für immer verloren (`setTitleClass`, `forsakeTitle`).
- **Testergebnis (Code):**
  - **c_mon1–3 brechen (QA-02):** Ihre Ausweich-Ziele zählt nichts. `evaded` erhöht nur `q_monk`, ein anderer Zähler für `type:'dodge'` existiert nicht.
  - **c_nec2:** Der Wegpunkt zeigt auf die Nekropole (`QUEST_WHERE`). Dort steht nach q_pact aber kein Wächter mehr: `urnRite` erzeugt ihn nur bei aktivem q_pact. Lösbar ist der Auftrag nur über den Boss des Gewölbes „Tempelgruft“ (game.js:10235), Stufe 3, Ebene 3. Kein Hinweis darauf (QA-14).
  - Übrige Aufträge: Ziele vorhanden (Spawngebiete und Gewölbe), nicht live geprüft.
- **Sandbox-Fälle:**
  - Meister tot: Reihe, Grade und Rüstung sind zu. Nicht behandelt.
  - Titelwechsel: behandelt (Warnung, Fehlschlag).
- **Was der Spieler tut:** Gegnertyp töten und Material bringen.
- **Gleiche Kernaufgabe:** alles „Töte N“.
- **Vorschlag Kernaufgabe, je eine Tat pro Titel:**
  - **Nekromant:** Einen bestimmten Toten aus einem echten Grab (`makeGrave`) erwecken und 3 Tage als Diener halten, ohne dass er zerfällt. Die Familie des Toten reagiert.
  - **Hexenmeister:** Vhal verlangt einen Fluch auf eine Person mit Rang (Hausherr, Vorsteher). Die Folgen laufen über Ruf und Kopfgeld.
  - **Druide:** Ein Wolfsrudel zähmen (`TAME`) und es Bären aus einem Dorf treiben lassen, ohne selbst zu töten.
  - **Mönch:** Pilger durch Banditenland begleiten, ohne Waffe in der Hand.
  - **Sandbox:** Meister tot = der Titel selbst zeigt den nächsten Schritt (Stimme im Kopf beim Hexer, Geist beim Nekromanten).
  - **Aufwand:** L (vier Mechaniken). **Abhängig von:** Gräber, TAME, Geleit.
- **Heute sichtbar / nur Text:** Nur die Rüstung am Körper (`classSet`). Sonst Log und Toast.
- **Visuelle Identität:**
  - **Farbe:** je Titel die Glow-Farbe.
  - **Signaturszene:** Beim dritten Teil legt der Meister dem Spieler das Teil an: Close-up 1,6×, `fx` in der Titelfarbe, `nameCard` mit dem Gradnamen.
  - **Spur in der Welt:** Der Meister trägt danach ein Gegenstück (gleiche Farbe am Saum).
  - **Aufwand:** S.

### 7 · Todesritter-Schwüre (Sael, dk_1–3)
- **Auftraggeber/Fraktion:** Sael, Untote. Voraussetzung: Klasse Todesritter (`deathRite` ab Untoten-Rang 3).
- **Schritte:**
  - dk_1: 3 Kopfgeldjäger + 3 Knochen.
  - dk_2: 2 Automaten + 2 Seelenphiolen.
  - dk_3: einen Todesritter töten.
  - Belohnung: drei Rüstungsteile.
- **Testergebnis (Code):** Kette und Annahme ok. Ob es Kopfgeldjäger und Todesritter gibt, hängt von Kopfgeld bzw. Totenheeren ab (nicht live geprüft).
- **Sandbox-Fälle:**
  - Sael tot: nicht behandelt.
  - Kein Kopfgeld auf dem Spieler: Kopfgeldjäger kommen dann vermutlich nicht. dk_1 hat keinen Weg und keinen Hinweis (nicht geprüft).
- **Was der Spieler tut:** drei Arten töten.
- **Gleiche Kernaufgabe:** Rang Untote 2b, Bande 2a, Orden 4b.
- **Vorschlag Kernaufgabe — „Der gebrochene Eid“:**
  - Der Eidbrecher ist **der eigene Ahn**: Sael erweckt den Helden einer früheren Generation aus seinem Grab (`S.legacy`, Gräber, `makeGrave`), mit dessen Waffe.
  - Der Spieler richtet ihn, oder lässt ihn als Gefährten weiterziehen (Ruf bei den Untoten −).
  - **Sandbox:**
    - Erste Generation: Es ist der Ahnenfeind (Nr. 25), falls es einen gibt, sonst der alte Todesritter.
    - Sael tot: Ysra übernimmt.
  - **Aufwand:** M. **Abhängig von:** Dynastie, Gräber, Ahnenfeind.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Totenross (`dkSteed`), Aura (Frost).
  - Nur Text: die Schwüre.
- **Visuelle Identität:**
  - **Emblem und Farbe:** gebrochenes Schwert über Krone, Frostblau #7fa6c4.
  - **Signaturszene „Wiedersehen“:**
    1. Das Grab bricht auf (`fx dust`, `camShake` 5).
    2. Der Ahn steigt mit alter Waffe heraus.
    3. `nameCard`: Name des Ahnen und „Held der n-ten Generation“.
    4. Sprechblase mit seinem letzten Chronikeintrag.
  - **Spur in der Welt:** Ein leeres Grab mit Frost, oder der Ahn als Wache in Vharnholm.
  - **Aufwand:** M.

### 8 · Totenland: Grabräuber, Überfall der Toten, Heer der Toten
- **Auftraggeber/Fraktion:** Sael (q_graverobbers: 5 Banditen töten). q_undraid und q_undarmy laufen über Sael bzw. Befehle (`startMyRaid`, `orderArmy` 6205–6290).
- **Testergebnis (Code):**
  - Überfall: scheitert, wenn das Dorf vernichtet oder besetzt ist (6212) oder der Spieler mehr als 90 Felder weg geht.
  - Heer: Erfolg, wenn die Stadt fällt; Fehlschlag, wenn kein Befehlsheer mehr existiert (6289).
  - Abbrechen räumt beides auf (`cancelQuest`).
- **Sandbox-Fälle:**
  - Zielstadt fällt an eine Drittmacht: nur `heldBy` wird geprüft (Helfer).
  - Eigene laufende Aufträge im Zielort: nicht behandelt.
- **Was der Spieler tut:** Banditen töten · ein Dorf mit der Horde einnehmen und über die Bewohner urteilen.
- **Gleiche Kernaufgabe:** q_graverobbers ist wie q_rook und Rang Untote 1a. Überfall und Heer sind eigen.
- **Vorschlag Kernaufgabe für q_graverobbers — „Grabgut auf dem Markt“:**
  - Geraubtes Grabgut taucht im Lager einer Menschenstadt auf (`S.towns[*].stock`).
  - Der Spieler findet den Hehler über Preise und Händler und hat drei Wege: zurückkaufen, einschüchtern, oder die Stadtwache bestechen, damit sie das Lager räumt.
  - **Sandbox:** Ist der Hehler tot, geht das Gut an seine Witwe, die verkauft weiter.
  - **Aufwand:** M. **Abhängig von:** economy.js.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Horde, Kriegskarte.
  - Nur Text: Urteil über Bewohner.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Schädel mit Siegelband, Knochenweiß #d7d0ba auf Grabgrün.
  - **Signaturszene „Die Horde wartet“:** Totale der Horde vor dem Dorf, alle `facing` zum Dorf, `float` grüne Augen; Spieler tritt vor, Sael-Stimme als `text`, dann `shake`.
  - **Spur in der Welt:** Knochenbanner im eingenommenen Dorf (gibt es teils schon als Besatzung).
  - **Aufwand:** S.

### 9 · Einzelaufträge der Nebenfiguren (Oda, Lioba, Quirin, Rook)
- **Schritte:**
  - q_frontier: Späherbericht (einmaliger Sack, world.js:2001) + 5 Skelette.
  - q_hundred_song: 3 Wiedergänger.
  - q_pelts: 3 Felle.
  - q_rook: 2 „Rivalen“ — jeder Bandit zählt (`onKill`: `bandit_rival` = `bandit`).
- **Testergebnis (Code):** ok. **Lücke:** Der Späherbericht ist einmalig und verkaufbar (`sell` prüft nur `bound`). Verkauft heißt: q_frontier ist für immer offen (QA-16).
- **Sandbox-Fälle:**
  - Oda, Lioba, Quirin oder Rook tot: nicht behandelt.
  - Rook ist von Haus aus feindlich (`hostile:true`) und leicht zu töten. Damit sind q_rook, die Banden-Rangreihe und die Klassen Schurke und Assassine ohne Hinweis zu.
- **Was der Spieler tut:** holen, töten, bringen.
- **Gleiche Kernaufgabe:** alles „Töte N“ oder „Bring N“.
- **Vorschlag Kernaufgabe:**
  - **Oda:** Der Bericht wird **Wissen auf der Kriegskarte**. Abgegeben zeigt er Stärken der Totenheere auf `drawWarmap`. Verkauft man ihn den Toten (Sael), sieht Valen nichts, und `capThreat` steigt.
  - **Lioba:** Das Lied macht eine Tat des Spielers zur Legende (`addFame`). Der Spieler wählt: Wahrheit (kleinerer Ruhm, Zeugen nicken) oder Heldenlied (großer Ruhm, Zeugen widersprechen, Ruf beim Betroffenen sinkt).
  - Quirin und Rook: bleiben klein.
  - **Aufwand:** S je Auftrag.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Oda Feldzeichen #33415c; Lioba Laute #c99a4a.
  - **Signaturszene Lioba:** In der Schenke singt sie (`musician`), Gäste stehen auf (`gesture jubeln`), über dem Spieler `float` mit dem Liedtitel.
  - **Spur in der Welt:** Spielleute in anderen Schenken spielen das Lied (`MUSIC` erweitert).

### 10 · Regionalbosse (Tomas/Graumähne, Gerold/Karrak, Brann/Hrodvar)
- **Schritte:** Boss töten. Bei q_kingsiron zusätzlich das Königseisen aus dem Hort (einmalig, world.js:2321). Vorher erschlagene Bosse zählen (`startQuest` 12354f).
- **Testergebnis (Code):** ok, mit zwei Lücken.
  - QA-15: Stirbt ein Regionalboss fern vom Spieler (> 500 px) oder durch Verbündete, endet `die()` im frühen Zweig (3617–3625). Dann laufen weder `regionBossSlain` noch `onKill`. Flag und Regionalfolge bleiben aus. Beim nächsten Laden setzt `ensureRegionBosses` (1778) den Boss neu; bis dahin ist der Auftrag nicht erfüllbar.
  - QA-16: Königseisen verkauft heißt: q_kingsiron für immer offen.
- **Sandbox-Fälle:**
  - Ziel stirbt ohne Spieler: QA-15.
  - Brann, Tomas oder Gerold tot: nicht behandelt.
- **Was der Spieler tut:** einen starken Gegner töten.
- **Gleiche Kernaufgabe:** wie q_mine, dk_3, c_war3, q_wb_nebel, Königsauftrag 1.
- **Vorschlag Kernaufgabe — „Machtvakuum“:**
  - Das Spiel kennt schon `from`/`to` je Boss (1761ff).
  - Neu: Der Spieler entscheidet, wer nachrückt.
    - Graumähne: töten (Hunde ziehen ein) oder als Druide/mit Köder-Pfeife das Rudel umsiedeln.
    - Karrak: töten (Goblins ziehen ein) oder als Zollherr einsetzen, der Gerold Wegzoll zahlt. Das geht in economy.js als Zoll auf die Route Aschfurt und senkt das Überfallrisiko.
    - Hrodvar: Königseisen für Brann, oder Hrodvars Krone zurück auf den Thron. Dann schmieden die Toten von Tiefhall für dich, und Brann ist gekränkt.
  - **Sandbox:** Boss tot ohne Spieler: Der Geber verlangt die Wahl trotzdem („wer übernimmt jetzt?“).
  - **Aufwand:** M. **Abhängig von:** Regionalboss-Tabelle, Zoll (T09).
- **Heute sichtbar / nur Text:**
  - Sichtbar: `bossIntro` (Filmszene beim Auftritt), legendäre Beute.
  - Nur Text: Tod und Folge.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Krallenspur in Rost #9a4a2a.
  - **Signaturszene „Wer folgt“:** Nach dem Tod zoomt die Kamera aus (1,0 → 0,7). Die neuen Herren treten aus dem Nebel (Hunde, Goblins oder Zöllner). `nameCard` „DIE WOLFSSCHLUCHT GEHÖRT JETZT …“.
  - **Spur in der Welt:** Schädel am Pfahl, Zollschranke oder Hundeknochen am Bau.

### 11 · Rangreihen (Valen/Oda, Orden/Kelan, Untote/Morvath, Kette/Kettenwache, Händler/Gerold, Bande/Rook)
- **Schritte:** Je Rang zwei Aufträge (a, b), alle „Töte N“ oder „Bring N“ (`RANK_LINES` 12790). Beförderung beim zweiten Teil (`turnIn` → `promote`). Freigabe über `rankReady` (Ruf ≥ Rang × 25).
- **Testergebnis (Code):** ok, mit Lücken (QA-13):
  - **Valen 4b, Untote 4b und g_dod2 brauchen Rotgardisten.** Nach Vargs Fall werden Rotgardisten im Eisenland zu Banditen (`spawnType` 1795). Danach gibt es sie nur noch im Stufe-5-Gewölbe Uhrwerkhalle in Tickmar (10239). Erfüllbar, aber nur weit im Süden und ohne Hinweis.
  - **Kette:** Der Geber ist eine „Kettenwache“ in der Festung. Nach `chainsBroken` gibt es vermutlich keinen Geber mehr (nicht geprüft). Kette 1a verlangt 4 Goblins; nach der Befreiung entstehen keine wilden Goblins mehr (`spawnType`).
- **Sandbox-Fälle:**
  - Geber tot (Oda, Kelan, Morvath, Gerold, Rook): Aufstieg für immer zu, nicht behandelt. Bei Rook ist das besonders leicht (feindlich).
  - Krieg mit der Fraktion: Geber feindlich, Aufträge ruhen.
- **Was der Spieler tut:** 40-mal töten oder bringen (36 Tötungen, 4 Lieferungen).
- **Gleiche Kernaufgabe:** alles.
- **Vorschlag Kernaufgabe:** Eine Fraktionstat je Rang, aus der Simulation.
  - Valen: einen Kriegsknoten einen Tag halten.
  - Orden: einen Ketzer richten oder begnadigen (Wahl).
  - Händler: eine eigene Karawane ans Ziel bringen.
  - Bande: einen Wagen ausrauben und die Ware über einen Hehler losschlagen.
  - Untote: eine Seele eines benannten Lebenden bringen.
  - Kette: einen Tributzug sicher heimbringen.
  - **Sandbox:** Geber tot heißt, der Stellvertreter übernimmt (Rang geht an „wer die Lücke füllt“). Das wird selbst zur Rangprüfung: Wer den Mörder stellt, steigt auf.
  - **Aufwand:** L. **Abhängig von:** sim.js, economy.js, Tributzug.
- **Heute sichtbar / nur Text:** Toast mit dem Rangnamen.
- **Visuelle Identität:**
  - **Emblem und Farbe:** das Fraktionszeichen (gibt es schon am Gegner, Scout R4) in der Fraktionsfarbe.
  - **Signaturszene „Beförderung“:**
    1. Der Geber übergibt ein Rangzeichen: `gesture salutieren` bzw. `knien` beim Orden.
    2. Die Wachen in der Nähe grüßen: `gesture salutieren` an allen Wachen im Umkreis 300.
    3. `nameCard` mit dem Rangnamen.
  - **Spur in der Welt:** Rangabzeichen am Spieler-Sprite (Schulterfarbe).
  - **Aufwand:** S.

### 12 · Aufträge am Brett, beim Verteidigungsmeister und von Bewohnern (CON, 15 Arten)
- **Schritte:** `makeContract` (6799ff):
  - Arten: Kopfgeld (mit Elite), Monster, Jagd, Verteidigung, Patrouille, Eskorte, Lieferung, Vermisst, Vorräte, Kräuter, Spurensuche, Lager.
  - Dazu Schmuggel, Spuk und Königlich.
  - Wendungen: Ergeben, Gefangen, Leitwolf, Verräter.
  - Frist (`CON_DAYS`), höchstens 5 zugleich. Geber tot heißt hinfällig, ohne Rufverlust (`conTick` 7195).
- **Testergebnis (Code):** ok. Abgabe ist nur einmal möglich (`claimContract`). Frist und Geber-Tod sind behandelt.
- **Sandbox-Fälle:**
  - Geber tot: behandelt.
  - Eskortierter tot: behandelt (Ruf, Vertrauen).
  - Stadt gesetzlos: keine Aushänge (behandelt).
  - Paket verkauft: Frist läuft ab, der Auftrag scheitert (behandelt).
  - Geber-Schlüssel nach dem Laden: nicht geprüft, ob flüchtige Bewohner einen stabilen `key` behalten (Risiko: „Auftraggeber tot“ nach dem Laden).
- **Was der Spieler tut:** töten, liefern, begleiten, abgehen.
- **Gleiche Kernaufgabe:** Das ist der Grundbaukasten, den alle festen Reihen kopieren.
- **Vorschlag Kernaufgabe:**
  - Aufträge entstehen aus **echtem Mangel**: Lager unter Bedarf (`ECO.target`) ergibt eine Lieferung genau dieser Ware. Ein Kriegsknoten nebenan wird besetzt, also eine Eskorte für Flüchtlinge.
  - **Sandbox:** Geber tot heißt, Witwe oder Erbe übernimmt den Auftrag mit halbem Lohn und Groll, statt „hinfällig“.
  - **Aufwand:** M.
- **Heute sichtbar / nur Text:** Ziele als Figuren, Elite-Porträt, Raute oder Pfeil (render.js `drawTrack`, für alle Aufträge gleich Gold #e0b75a).
- **Visuelle Identität:**
  - **Emblem und Farbe:** Pergament mit Nagel; Farbe nach Art: Kopfgeld Blutrot, Lieferung Wachsgelb, Verteidigung Stahlblau.
  - **Erkennbarkeit:** Zettel am Brett, die man abreißt (Prop wird kleiner).
  - **Spur in der Welt:** Erledigte Steckbriefe hängen durchgestrichen am Brett, bis neue kommen.
  - **Aufwand:** S.

### 13 · Gefährten-Auftrag und Gerüchte
- **Schritte** (Helfer, Stichprobe gelesen):
  - Nach 3 Gesprächen am Feuer: Elite töten → Loyalität (`compOffer` ~11686).
  - Gerüchte: Deserteur überreden oder Bestie erlegen (`rumorOffer` ~12081).
- **Testergebnis (Code):** ok. **Lücken (Helfer, ungeprüft):**
  - Im Dungeon wird der Zielpunkt aus Dungeon-Koordinaten auf die Weltkarte gesetzt.
  - `compQuest` wird nie zurückgesetzt: nur ein Auftrag je Gefährte.
  - „Valen zahlt“ prüft keinen Krieg mit Valen.
- **Was der Spieler tut:** einen Gegner töten.
- **Vorschlag Kernaufgabe — „Die Wunde“:**
  - Der Gefährte hat ein Glied verloren (`body.js`). Der Auftrag ist die Frage, wer die Prothese stellt und zahlt:
    - Aurelion: gut, teuer, Wartung.
    - Schwarzmarkt: Risiko.
    - Totenhand: Ruf.
    - oder er lernt ohne Hand zu kämpfen.
  - Der Gefährte hat eine eigene Meinung (Charakterzug).
  - **Aufwand:** M. **Abhängig von:** body.js, Bionik, T15.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Lagerfeuer, Glutorange #d07a3a.
  - **Signaturszene:** am Feuer, Gefährte mit der neuen Hand (`gesture zeigen`), Funken-`fx`.
  - **Spur in der Welt:** Die Prothese ist am Gefährten-Sprite sichtbar.

### 14 · König Varon
- **Auftraggeber/Fraktion:** König Varon, Valen. Audienz über Aldhelm (100 Gold) oder ab Valen-Rang 1 (`varonChoices` 8871ff).
- **Schritte:**
  - Q1: Hauptmann der Toten vor Nordfurt töten (royal-Auftrag, `royalStart` 8912).
  - Q2: Verräter unter drei Adligen finden. Hinweise über „Siegelwachs“ bei Ysmay und den Adligen. Benennen; richtig oder falsch.
  - Q3: Ritterschlag (Titel, Kronhelm) oder Weigerung.
  - Nebenher: Kerkermeister.
- **Testergebnis (Code):**
  - **Bricht (QA-05):** Wer den Königsauftrag im Tagebuch abbricht, landet so: `cancelQuest` → `failContract`, `varonQ` bleibt 1, `varonQ1done` wird nie gesetzt, und „Ich will der Krone dienen“ gibt es nur bei Q 0. Die Reihe ist tot.
  - Weigerung beim Ritterschlag: −10 Valen, die Wahl kommt sofort wieder, beliebig oft (Text „komm nicht wieder“).
  - Q2 listet schon gerichtete Adlige erneut.
- **Sandbox-Fälle:**
  - **Varon tot:** Q2 und Q3 sind nicht abschließbar. Kein Regent übernimmt die Reihe (nicht behandelt). Ist der Hauptmann noch offen, sagt das Log trotzdem „Zurück zu König Varon“.
  - **Exil:** Die Reihe läuft dort weiter (behandelt). Fall bei Q2 ohne Evakuierung setzt Q auf 3 ohne Lohn (behandelt).
  - **Aurelion-Ruf ≥ 25:** König gesperrt (gewollt).
  - **Kult bindet Varon:** Audienz läuft weiter.
- **Was der Spieler tut:** töten, reden, einen Namen aus einer Liste wählen.
- **Gleiche Kernaufgabe:** Q1 ist ein Kopfgeld-Auftrag. Q2 ist ein Ratespiel wie die Kult-Anklage, nur kürzer.
- **Vorschlag Kernaufgabe — „Siegelwachs“:**
  - Statt einen Namen zu nennen, **beschafft** der Spieler den Beweis: einen Brief mit Aurelions Siegelwachs aus dem Pult des Verräters, über Diebstahl oder Diener-Schmuggel (`servantSmuggle`).
  - Dann drei Wege:
    - Varon vorlegen: Hinrichtung, Valen +.
    - An Aurelion zurückverkaufen: Bionik-Zugang, Valen − bei Entdeckung.
    - Den Verräter erpressen: Gold; er wird später dein Spion bei Hof.
  - **Sandbox:**
    - Varon tot: Brandt nimmt den Brief, als Grund für Krieg gegen Aurelion (Kriegsgraph).
    - Verräter vorher tot: Der Brief führt zu seinem Nachfolger.
  - **Aufwand:** M. **Abhängig von:** Burg in der Welt, Diebstahl, Aurelion-Fahndung.
- **Heute sichtbar / nur Text:**
  - Sichtbar: der Hof als Figuren, Varons Tod als Filmszene (`kingDeath` 8430).
  - Nur Text: Q1–Q3, die Hinrichtung.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Krone über gekreuzten Speeren, Valenblau #33415c mit Gold.
  - **Erkennbarkeit:** Varon auf dem Thron mit Kronhelm; Aldhelm immer einen Schritt hinter ihm.
  - **Signaturszene „Der Ritterschlag“:**
    1. Kamera hinter dem Thron, Blick über Varons Schulter auf den knienden Spieler (2 s).
    2. Beat t0,3: Varon `gesture zeigen` mit Schwert, `sfx` Metall.
    3. Beat t0,6: Hof `gesture salutieren`, Aldhelm als Einziger nicht (Vorausdeutung auf den Kult).
    4. Beat t0,9: `nameCard` „RITTER KÖNIG VARONS“.
  - **Spur in der Welt:** Wappenschild des Spielers in der Halle. Der Galgen auf dem Platz nach der Hinrichtung, mit dem Namen des Gerichteten.
  - **Aufwand:** M.

### 15 · Varonheim: Fall, Exil, Rückeroberung
- **Schritte:**
  - Heerzug nach `capThreat` (sim.js), Fall über `capitalFall`.
  - Exil nach Salzhafen, Nordfurt oder Eren.
  - Exilkönig bzw. Brandt bittet um Rückeroberung (`retakeAsked`).
  - Vor den Toren 4 Wellen brechen (sim.js:579–605).
  - Lohn 400 Gold, Valen +20.
- **Testergebnis (Code):** ok. Es **fehlt** aber die beschlossene Möglichkeit, den König vor dem Fall fortzubringen (DECISIONS 01.10.: „König vor dem Fall fortbringen: ja, im Gespräch mit Gero/Brandt“). `varonEvac` setzen nur das Debug-Menü und `varonFlee` (Helfer, PROPOSALS/varonheim_belagerung_s3.md nennt S3c offen). Ein Bug ist das nicht: der Teil ist noch nicht gebaut.
- **Sandbox-Fälle:**
  - Exilstadt fällt: behandelt (RB-052).
  - Varon tot: Brandt übernimmt (behandelt).
  - Spieler ist Königsmörder: Brandt bietet trotzdem an (Helfer, nicht geprüft).
  - KI-Heer erobert zurück, während der Spieler in 40 Feldern steht: voller Lohn ohne Kampf (Helfer).
- **Was der Spieler tut:** Wellen abwehren.
- **Gleiche Kernaufgabe:** Brett-Verteidigung in groß.
- **Vorschlag Kernaufgabe — „Luftbrücke“** (vom Nutzer gewählt: Scout R2):
  - Während der Belagerung fliegt der Spieler mit Luftschiff Vorräte in die Burg oder fliegt den König aus (das ist dann S3c).
  - Jede Fahrt kostet Ladung, und die Toten schießen auf Schiffe.
  - Der Spieler entscheidet: König retten (Hof bleibt ganz, Stadt fällt schneller) oder Stadt versorgen (Besatzung hält länger, König bleibt).
  - **Sandbox:** Kein Schiff: Kellerweg (S3, Frage offen). Varon tot: Ysmay und die Akten werden ausgeflogen.
  - **Aufwand:** L. **Abhängig von:** V7/V8 Luftschiffe, Belagerung S3.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Heerzug, Fall (Glocken, Feuer, Karte, Brandt), Trümmer, Knochenwachen.
  - Nur Text: Wellen, Befreiung, Lohn.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Turm mit Riss, Rauchgrau #6a6560 mit Valenblau.
  - **Signaturszene „Die letzte Welle“:**
    1. Bei Befreiung Totale über die Mauer.
    2. Beat t0,3: das Knochenbanner fällt (Prop tauschen).
    3. Beat t0,5: das Valenbanner steigt.
    4. Beat t0,7: Bürger kommen aus Kellern (`gesture jubeln`), Glocken.
    5. `nameCard` „VARONHEIM IST FREI“.
  - **Spur in der Welt:** Trümmer bleiben als Mahnmal, Grabfeld vor dem Tor, Neubaugerüste.

### 16 · Blutkult (§5g.2)
- **Schritte** (Helfer, Kernstellen geprüft):
  1. Ab Tag 3 in Varonheim (oder Audienz, spätestens Tag 12) verschwinden Bewohner.
  2. 3 Spuren sammeln (Blutzeichen, Wachs, Zeuge, Maske).
  3. Anklage beim Gardisten (Albin richtig, sonst Valen −3).
  4. Katakomben: Gefangene befreien, Hedda (trinken = beitreten, oder Kampf), Rotes Siegel.
  5. Enthüllung (König mit oder ohne Siegel, Ysmay, von innen).
- **Enden:**
  - zerschlagen
  - erpressen (hart, RB-031)
  - Rechte Hand
  - Herausforderung → Blutfürst
  - ignorieren → Rote Krönung
  - Heilung (Aldis, Sankt Serin)
- **Testergebnis (Code):** Enden erreichbar, aber:
  - **QA-03:** Vampir-Spieler friert nach dem Laden ein. `p.vamp.frenzyT` ist ein `performance.now()`-Wert, wird gespeichert und beim Laden nicht zurückgesetzt. `update` sperrt die Steuerung, solange `frenzyT > performance.now()` (2918). Die Reset-Liste beim Laden (~2075) enthält `vamp` nicht.
  - **QA-11:** Ist der Spieler Blutfürst und stirbt, setzt `cultHeroDied` (13632) `end='hidden'`. `buildCatacombs` setzt Aldhelm wieder ein, weil es nur `end !== destroyed/player` prüft, nicht `aldhelmDead` (13452+33). Der tote Aldhelm steht wieder auf.
  - **Helfer, ungeprüft:** `C.joined` gilt auch für den Erben (kein Vampir), Käfige bleiben zu. Katakomben erzeugen bei jedem Betreten 9 Gegner neu (Farm).
- **Sandbox-Fälle:**
  - Hof-Aldhelm vor der Enthüllung getötet: flüchtig, kommt wieder (nicht behandelt).
  - Hedda tot nach Beitritt: kein Grad II.
  - Rotes Siegel verkauft: nur noch die Enthüllung von innen.
  - Hauptstadt fällt vor der ersten Entführung: Stufe 1 ruht.
  - König tot: Anklage-Szene fällt weg.
- **Was der Spieler tut:** Spuren sammeln, den Schuldigen nennen, in eine Gruft steigen, sich entscheiden.
- **Gleiche Kernaufgabe:** keine. Der Verräter in Varon Q2 ist eine Kurzform davon. Vorschlag: Varon Q2 umbauen (siehe Nr. 14), damit beide sich nicht doppeln.
- **Vorschlag Kernaufgabe:**
  - **Bleibt.** Schärfen: Die Spuren sollen **in der Welt** liegen statt im Log. Nachts Blutflecken auf dem Pflaster, die zur Gruft führen, sichtbar mit Fackel oder Wahrnehmung. Wachs am Kanzleifenster. Maskierte, die man verfolgen kann.
  - **Sandbox:** Zeuge tot heißt, sein Tagebuch liegt im Haus.
  - **Aufwand:** M.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Hof-Kamerafahrt, Aldhelms Auftritt (Kerzen, Namenskarte, Herzschlag), Blutzeichen, Käfige, Altar, Hedda, Maskierte, Vampir-Effekte.
  - Nur Text: Entführungen, Anklage und Hinrichtung, Krönung, Befreiung, Tribut.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Kelch mit Tropfen, Blutrot #8a1a22 auf Schwarz.
  - **Erkennbarkeit:** Vermisstenliste am Brett (gibt es schon), dazu ein Kreidekreuz an jeder Tür eines Verschwundenen.
  - **Signaturszene „Die Rote Krönung“** (heute nur Text):
    1. Nacht, Totale auf den Thronsaal (3 s, `pause`).
    2. Beat t0,2: Kerzen gehen einzeln aus (`fx` Rauch).
    3. Beat t0,5: Aldhelm setzt sich die Krone auf (`gesture`); Sprechblase „Das Reich hat Durst.“
    4. Beat t0,8: `flash` #8a1a22, `nameCard` „DIE ROTE KRÖNUNG“.
  - **Spur in der Welt:** Rote Banner an der Burg, Fenster nachts rot. Nach dem Zerschlagen: offene Käfige, heimgekehrte Bewohner, Kreidekreuze abgewaschen.

### 17 · Eisenmark: Geraubter Tribut, Pferche, Entlaufene
- **Schritte:**
  - **q_tribut:** Zug überfallen; Tributgut behalten oder ins Dorf zurück (`tribTick` 5815ff).
  - **q_pferch:** Schlüssel von Vesk stehlen oder bei Edda kaufen, nachts öffnen (`openPen` 5577).
  - **q_runaway:** Entlaufenen zurückbringen, laufen lassen oder töten; wiederholbar.
- **Testergebnis (Code):**
  - **QA-07:** `byPlayer = lastKiller === Spieler || (Abstand < 220 && !brawl)` (5825). Töten die Hinterhalt-Räuber, die das Spiel selbst erzeugt (5801), den Zug, während der Spieler ihn **schützt**, dann bekommt der Spieler Tributgut, Kette −15 und eine Strafaktion. Ausgerechnet der Geleitschutz wird so zum Raub.
  - **QA-08:** Nach `chainsBroken` (oder wenn alle Gefangenen frei- bzw. verkauft sind) meldet `openPen` „leer“ und kehrt zurück (5579). q_pferch bleibt für immer offen.
  - Ein zweiter Überfall bei aktiver Quest überschreibt `tributQuest.village` (Helfer).
- **Sandbox-Fälle:**
  - Vesk und Edda tot: kein Schlüssel mehr (Helfer).
  - Spieler in der Kette: kein Sonderfall.
  - Abbruch von q_runaway: Abgabe zahlt trotzdem (Helfer).
- **Was der Spieler tut:** einen Zug ausrauben oder schützen, einen Schlüssel beschaffen, einen Flüchtling jagen.
- **Gleiche Kernaufgabe:** q_runaway entspricht der Brett-Art „Vermisst“ (umgekehrt). q_pferch ist „Hol den einmaligen Gegenstand“.
- **Vorschlag Kernaufgabe — „Freikauf“:**
  - Sklaven sind eine Ware auf dem Sklavenmarkt der Eisenfeste (gibt es, `fortChoices`).
  - Der Spieler kauft Gefangene frei, und der Preis steigt mit jedem Kauf.
  - Oder er treibt den Preis mit Gerüchten bzw. gefälschten Seuchenpapieren nach unten.
  - Oder er öffnet nachts den Pferch: die Kette wird misstrauisch, der Tribut steigt.
  - **Sandbox:** Varg tot: Die Pferche gehören dem Nachfolger (`heirMenu`), und der verhandelt anders.
  - **Aufwand:** M. **Abhängig von:** economy.js, Eisenfeste-Leben.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Tributzug mit Trägern, Pferch und Fallgitter, Knien beim Öffnen.
  - Nur Text: Rückgabe, Strafaktion.
- **Visuelle Identität:**
  - **Emblem und Farbe:** zerbrochenes Kettenglied, Rost #8a3a1a auf Eisengrau.
  - **Signaturszene „Die Pferche sind offen“:**
    1. Nacht, Kamera am Gitter.
    2. Beat t0,3: Gitter hoch (`sfx` Metall).
    3. Beat t0,5: Gefangene treten heraus, einer `gesture knien` vor dem Spieler.
    4. Beat t0,8: in der Ferne Glocke der Festung, `shake` 2.
  - **Spur in der Welt:** Leerer Pferch mit offenem Gitter; befreite Goblins in Morrgrund mit Kettenresten am Fuß.

### 18 · Grisk / Freie vom Grubenhort
- **Auftraggeber/Fraktion:** Grisk, Goblins. Nur nach `goblinsFreed`.
- **Schritte:**
  - q_grisk_lost: 3 Verschleppte finden.
  - q_grisk_rache: 4 Kettenreste töten.
  - q_grisk_build: 30 Holz + 15 Stein → Dorf entsteht (`ensureGoblinVillage`).
- **Testergebnis (Code):** ok. **QA-12:** Abbrechen und neu annehmen von q_grisk_rache ruft `spawnChainRest` (6331) erneut auf: 5 neue, **nicht flüchtige** Gegner je Neustart. Die alten bleiben, also Häufung im Spielstand und Erfahrung zum Abgreifen.
- **Sandbox-Fälle:** Grisk tot: nicht geprüft, ob er neu entsteht. Krieg mit Goblins: kein Sonderfall.
- **Was der Spieler tut:** suchen, töten, Material bringen.
- **Gleiche Kernaufgabe:** Brett-Arten Vermisst, Lager und Vorräte.
- **Vorschlag Kernaufgabe — „Erster Markt“:**
  - Die Freien wollen handeln. Der Spieler bringt eine Menschenstadt dazu, Goblin-Händler einzulassen: Vorsteher überzeugen, Wachen bestechen, oder die erste Karawane (`SIM` Karawanen) selbst begleiten.
  - Gelingt es, bekommt Grubenhort ein Stadtlager in economy.js.
  - **Sandbox:** Grisk tot: seine Tochter führt. Stadt besetzt: eine andere Stadt.
  - **Aufwand:** M–L. **Abhängig von:** economy.js-Städte, Karawanen.
- **Heute sichtbar / nur Text:** Hütten entstehen; sonst Text.
- **Visuelle Identität:**
  - **Emblem und Farbe:** offene Kette mit Ähre, Ocker #b08a3a.
  - **Signaturszene:** Die erste Goblin-Karawane fährt durchs Stadttor. Menschen bleiben stehen (`gesture achsel` / `abwehren`), ein Kind winkt (`jubeln`). `nameCard` „DER ERSTE MARKT“.
  - **Spur in der Welt:** Goblin-Stand auf dem Markt der Stadt.

### 19 · Dodon / Sturm von Morrgrund
- **Schritte:**
  - g_dod1: 6 Brot + 3 Kettenknechte.
  - g_dod2: 8 Eisen + 2 Rotgardisten.
  - g_dod3: 4 Kettenschützen.
  - Danach `turnInStorm` → Sturm auf die Eisenfeste (`stormScene` Filmszene).
- **Testergebnis (Code):** ok. **QA-10:** Bricht der Sturm ab (Flucht, Laden), setzt `stormCheck` (7760) zwar `goblinStorm=false`, aber nicht `parley`. `goblinStorm` hatte `parley=false` gesetzt. Dodon steht dann stumm in Vargs Halle, bis Varg stirbt. Danach führt `goblinStormWon` die Legende trotzdem aus (Helfer).
- **Sandbox-Fälle:**
  - Varg vor g_dod3 tot: g_dod3 gesperrt (behandelt). g_dod1/2 brauchen Kettenknechte und Rotgardisten, die es dann kaum gibt (QA-13).
  - Dodon tot: Aufträge hängen.
- **Was der Spieler tut:** Brot und Eisen bringen, Kettenleute töten.
- **Gleiche Kernaufgabe:** Bring und töte.
- **Vorschlag Kernaufgabe — „Der Rat sagt Nein“:**
  - Der Goblinrat (3–4 Älteste mit Zielen und Ängsten) muss mehrheitlich zustimmen, sonst kein Sturm.
  - Je Ältester ein Hebel: Hunger (Brot), Angst (Beweis, dass die Kette blutet), Gier (Beute zusagen), Rache (ein bestimmter Aufseher muss sterben).
  - **Sandbox:** Ein Ältester stirbt: Sein Nachfolger erbt die Haltung umgekehrt.
  - **Aufwand:** M. **Abhängig von:** NPC-Ziele (npc_eigene_ziele).
- **Heute sichtbar:** Filmszene „DER STURM VON MORRGRUND“, Horn, Sprechblasen. Gut.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Faust mit Kettenrest, Moorgrün #5a6a3a.
  - **Signaturszene:** gibt es schon (`stormScene`). Ergänzen: vor dem Sturm die Ratsversammlung am Feuer, Älteste `gesture` nacheinander (`jubeln`/`abwehren` je Stimme).
  - **Spur in der Welt:** Goblin-Banner auf der Eisenfeste.

### 20 · Rotfall und Omega
- **Schritte:**
  - Bruchstücke über `omegaFrag` (9200ff, 12 Stück, 9 nötig).
  - Omega-Quest über Vargs Tagebuch oder Varg.
  - Ritual am Altar: Krone, Kette, Splitter, 10 Seelen, ein Gefährte, ein Fünftel des Blutes.
- **Testergebnis (Code):**
  - **QA-09:** `q_rotfall` wird **nie** auf `done` gesetzt. Fortschritt bleibt 9/9 (bei 12 möglichen), die 400 EP aus data.js werden nie gezahlt.
  - Abbrechen von q_omega und neu fragen bei Varg gibt erneut `vargs_kette` (Helfer).
- **Sandbox-Fälle:**
  - Gefährte stirbt im Ritual (gewollt).
  - Varg tot: Tagebuch-Weg (behandelt).
- **Was der Spieler tut:** Wissen sammeln, dann ein teures Ritual.
- **Gleiche Kernaufgabe:** keine.
- **Vorschlag:** **Bleibt.** Q_rotfall bei 9 abschließen und an q_omega übergeben. Bruchstücke über die Gesprächsthemen (`LORE`, `teach`) statt über eine stille Liste.
- **Visuelle Identität:**
  - **Emblem und Farbe:** rotes Band über Krater, Omega-Rot #b02a2a.
  - **Signaturszene:** gibt es teils (Blutregen, Riss).
  - **Spur in der Welt:** Der Himmel bleibt nach dem Ritual dauerhaft rot getönt (Lichtsystem).

### 21 · Seevolk (Salzbund, Sturmklinge, Weißbart)
- **Schritte:**
  - Salzbund: q_salz1 (4 Schwarzsegel), q_salz2 (4 Salz → Seite Händler), q_salz3 (Weißbart töten oder Frieden ab See-Ruf 40).
  - Sturmklinge: q_klinge1 (3 Grubenkämpfer), q_klinge2 (3 Tuch → Seite Freibeuter), q_wb_nebel (Morra töten).
- **Testergebnis (Code):**
  - **QA-04:** „Ich fordere dich heraus“ setzt `w.parley = false` (7813), und nichts setzt es zurück. Wer den Kampf abbricht oder flieht, kann Weißbart nie wieder ansprechen. q_wb_nebel ist dann nie abgebbar, der Salzfrieden nie unterschreibbar.
  - **QA-12:** Abbrechen und neu annehmen ruft `seaQuestStart` erneut (7790). `seaTagSpawn` erzeugt Gegner **ohne** `transient`, die sich im Stand häufen (mehrere Morras).
  - Nach Weißbarts Tod baut `ensureSeafolk` (7284) beim Laden Hella und die Plünderer wieder auf, ohne `whitebeardSlain` zu prüfen. `whitebeardSlain` hatte sie entfernt (7831f).
- **Sandbox-Fälle:**
  - Ysolde oder Hella tot: nach dem Laden zurück (flüchtig). Kein Bruch, aber kein Tod hat Folgen.
  - Freibeuter tötet Weißbart bei aktivem q_wb_nebel: kein Geber (Helfer).
- **Was der Spieler tut:** töten, Waren bringen, Seite wählen.
- **Gleiche Kernaufgabe:** Töte N, Bring N.
- **Vorschlag Kernaufgabe — „Salz oder Beute“:**
  - Mit eigenem Schiff (V8): Für den Bund fährt man Salz von Salzhafen nach Tangkron (Ware, Zeit, Sturm). Für die Klinge kapert man genau diese Salzschiffe.
  - Der Frieden ist eine Zolltabelle, die der Spieler aushandelt (Anteil 10–40 %). Sie wirkt in economy.js auf den Salzpreis.
  - **Sandbox:** Weißbart tot: Hella übernimmt die Verhandlung, härter. Ysolde tot: ihr Schreiber, käuflich.
  - **Aufwand:** L. **Abhängig von:** eigenes Schiff, Seefahrt, Zoll.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Zelte, Grube, Weißbart-Bosskampf.
  - Nur Text: Frieden.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Anker über Salzkristall, Bund Salzweiß #e6e2d6, Klinge Teer #2a2622.
  - **Signaturszene „Der Salzfrieden“:**
    1. An Deck der Salzwitwe, Weißbart und Ysolde gegenüber.
    2. Beat t0,4: beide `gesture zeigen` auf das Pergament.
    3. Beat t0,7: Weißbart wirft den Anker ins Meer (`fx` Wasser).
    4. `nameCard` „DER SALZFRIEDE“.
  - **Spur in der Welt:** Gemischte Mannschaften in Tangkron, Zollboje vor dem Hafen.

### 22 · Aurelion: Intrige, Ratssitz, Heiliges Gericht
- **Schritte:**
  - **q_intrige:** Ein Haus gibt einen Brief oder Mord gegen ein anderes Haus. Danach berichten (+20/−25 Gunst, 120 Gold).
  - **q_ratssitz:** Gunst ≥ 60, Aurelion-Rang ≥ 6, drei Häuser mit Gunst ≥ 30, 500 Gold bei Corvan.
- **Testergebnis (Code):**
  - **QA-17:** Corvan setzt q_ratssitz von Hand auf `done` (9929). Die 600 EP aus data.js werden nie gezahlt.
  - **QA-18:** Am Heiligen Gericht ist die Klage deterministisch (10016). Mit erfüllter Bedingung bringt sie 350 Gold für 100 Gebühr, beliebig oft. Jeder Sieg senkt die Gunst des Ziels und macht den nächsten Sieg leichter. „Verhandlung beiwohnen“ gibt +3 Gunst ohne Grenze (10027).
  - Abbruch von q_intrige lässt `S.intrigue` stehen (Helfer).
- **Sandbox-Fälle:**
  - Corvan tot: Ratssitz nie (nicht behandelt).
  - Ruf fällt nach Start: Corvan-Dialog weg (Helfer).
  - Hausherr tot: kommt beim Laden zurück, ohne Folgen (flüchtig).
- **Was der Spieler tut:** Briefe tragen, morden, Gunst sammeln, zahlen.
- **Gleiche Kernaufgabe:** Bote entspricht der Brett-Lieferung, Mord dem Kopfgeld.
- **Vorschlag Kernaufgabe — „Messing im Fleisch“:**
  - Ein Haus bezahlt nicht mit Gold, sondern mit **Bionik**: eine Prothese oder ein Auge der Hauswerkstatt.
  - Wartung, Energiezellen (T15) und Ersatzteile gibt es nur bei diesem Haus. Fällt das Haus in Ungnade oder stirbt der Hausherr, versagt die Wartung.
  - Der Ratssitz wird so zur Frage, **wessen Messing du trägst**.
  - **Sandbox:** Hausherr tot: Erbe verlangt Gegenleistung. Häuserkrieg: die Werkstatt der Gegenseite sabotiert die Prothese.
  - **Aufwand:** L. **Abhängig von:** T15, Bionik P5, Häuserkrieg.
- **Heute sichtbar / nur Text:**
  - Sichtbar: Himmelsreise-Filmszene, Ratsabstimmung (JA/NEIN-Floats).
  - Nur Text: Intrige, Gericht.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Zahnrad in Lorbeer, Messing #c8a050 mit Hausfarbe.
  - **Erkennbarkeit:** Hausherren mit Hausfarbe (gibt es: `cloth`); dazu ein Wappen über der Werkstatt.
  - **Signaturszene „Die Einsetzung“:**
    1. Auf der Himmelsfeste: Licht von oben (`flash` Gold).
    2. Die Prothese klickt ein (`sfx` Uhrwerk, `fx` Funken).
    3. Hausherr `gesture zeigen`.
    4. `nameCard` mit Hausname und „DEIN KÖRPER, UNSER WERK“.
  - **Spur in der Welt:** Hauswappen auf der Prothese (Sprite-Farbe).

### 23 · Kerker Salzhafen (Mo, Rask)
- **Schritte:** Nur wer in Salzhafen sitzt:
  - q_gilde: Mann mit rotem Tuch am Hafen → Dietrich.
  - q_rask: Kiste an der Küste → 150 Gold.
- **Testergebnis (Code):** ok. `openRask` (8255) prüft keinen Queststatus: Abbruch plus erneute Haft ergibt eine zweite Kiste (Helfer, gering).
- **Was der Spieler tut:** eine Person finden, eine Kiste öffnen.
- **Vorschlag Kernaufgabe:** Die Gilde verlangt einen Bruch im Salzkontor. Der Diebstahl senkt das Salzlager und hebt den Preis. Wer erwischt wird, landet wieder im Kerker. **Aufwand:** M.
- **Visuelle Identität:**
  - **Emblem und Farbe:** rotes Tuch, Signalrot #b03a2a.
  - **Erkennbarkeit:** Das rote Tuch hängt danach an jeder Gildentür.

### 24 · Anomalie
- **Schritte:** Ereignis → im Zentrum einen Schutzzauber wirken; nach 4 Tagen schließt sie sich von selbst (gescheitert).
- **Testergebnis (Code):** ok. Abbruch sagt fälschlich „bietet ihn wieder an“ (Helfer, gering).
- **Vorschlag Kernaufgabe — „Kristall oder Siegel“:** Aurelion zahlt für den Kristall im Riss (Magitech-Index T23 steigt). Der Orden will versiegeln (Ruf, Segen). Die Wahl bewegt T23. **Aufwand:** S–M.
- **Visuelle Identität:**
  - **Emblem und Farbe:** gesprungener Kreis, Arkanblau #6a8ad0.
  - **Spur in der Welt:** Kristallstumpf oder Siegelstein bleibt am Ort.

### 25 · Ahnenfeind (+ Entführung)
- **Schritte:** Der Mörder des Vorgängers bekommt einen Steckbrief. Er zieht umher, greift ab Tag 10 die Familienstadt an, und mit 30 % wird ein Kind entführt (`nemesisTick` 13678).
- **Testergebnis (Code):** **QA-19:**
  - Bei der Entführung wird `kid.taken = true` gesetzt (13711). Der Auftrag trägt `kidId`, das **nirgends** gelesen wird, und `taken` wird nie zurückgesetzt.
  - Die Rettung bringt einen Fremden namens wie das Kind heim (Art „Vermisst“, Stufe 1). Das Kind bleibt für die Familie „genommen“.
  - Weitere Punkte (Helfer, ungeprüft): Der Aushang wird bei der 3-Tage-Auffrischung des Bretts gelöscht. Im Dungeon getötete Helden geben Dungeon-Koordinaten. Der Steckbrief hängt an einem `setTimeout(…,1500)` und geht verloren, wenn in dieser Zeit neu geladen wird.
- **Vorschlag Kernaufgabe — „Blutgeld“:** Der Ahnenfeind verlangt Lösegeld oder ein Duell. Der Spieler kann zahlen (Kind frei, Feind stärker), kämpfen (Kind in Gefahr) oder einen Dritten anheuern (Söldner, Bande). **Aufwand:** M.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Totenkopf mit Familienwappen, Asche #5a5048.
  - **Signaturszene:** Das brennende Haus der Familie (Feuer-`fx`), Kind wird fortgetragen, `nameCard` mit dem Namen des Feinds.
  - **Spur in der Welt:** Abgebranntes Haus bleibt, bis es neu gebaut wird.

### 26 · Gewölbe
- **Schritte:** 5 offene und 3 geheime Gewölbe sowie der Schlund. Ebenen säubern, Hebel, Hort, Karte zum nächsten Geheimgewölbe.
- **Testergebnis (Code):** **QA-20:** Die „Verborgene Truhe“ (10295) wird bei jedem Neubau der Ebene neu gesetzt, ohne Sperre über `prog`. Hinausgehen und wieder hinein, oder Neuladen, ergibt erneut Beute der Stufe +1. Der Hort ist auch ohne Wächterkampf zu öffnen (Helfer).
- **Vorschlag Kernaufgabe — „Bergung“:** Aurelion kauft Uhrwerkteile (Ersatzteile für Prothesen). Was man hochbringt, bestimmt, welche Bionik billiger wird. **Aufwand:** M.
- **Visuelle Identität:**
  - **Emblem und Farbe:** Treppe ins Dunkel, Fackelgelb.
  - **Spur in der Welt:** Geöffnete Gewölbe tragen eine Kreidemarke des Spielers am Eingang.

### 27 · Feldzüge (Kette-Feldzug, Kreuzzug Konrad)
Nur gestreift (game.js ~5958–6010, ~9498). Mitziehen bringt Beute und Ruf. **Nicht geprüft.**

---

## Kandidaten

Format: Titel · Ort · Was passiert · Was passieren sollte · Auslöser · Beleg · Sicherheit · Reproduktion. Schwere in Klammern (1–4).

**QA-01 · Paladinprüfung „Der Schrein“ läuft an der falschen Stelle (2)**
- **Ort:** game.js:12365 (`offerQuest`), :12441 (`questCheck`).
- **Was passiert:** 4 Skelette erscheinen bei Kachel (76 ± 5, 52 ± 5), und der Abschluss misst Feinde im Umkreis 12 um (76, 52). Der Waldschrein und der Wegpunkt liegen nach `shiftCoords`/`worldPt` bei etwa (370, 78) (world.js:493–496, 1734; `QUEST_WHERE.q_paladin3 = 'shrine'`).
- **Was passieren sollte:** Die Toten greifen am angezeigten Schrein an, Halten schließt ab. So beschreiben es data.js:1129 und das Spawnziel „Die Toten wenden sich zum Schrein“.
- **Auslöser:** q_paladin3 annehmen.
- **Folge:** Am Schrein passiert nichts. Der Abschluss hängt von einem Ort 290 Kacheln entfernt ab. Paladin-Klasse praktisch gesperrt (`teach` verlangt q_paladin3 done).
- **Beleg:** Code gelesen. `NPC_SPOTS.shrine:[76,52]` wird für Kelan über `worldPt` umgerechnet (`spawnNpcDef`), die Questzeilen nicht.
- **Sicherheit:** hoch.
- **Reproduktion:** `?dev`, `RF.S.quests.q_paladin2={state:'done',progress:[1]}`, `RF.S.relations.kelan=20`; q_paladin3 bei Kelan annehmen; Positionen der neuen Skelette ausgeben und mit `LOCATIONS.find(l=>l.key==='shrine')` vergleichen.

**QA-02 · Mönch-Klassenaufträge c_mon1–3 sind unerfüllbar (2)**
- **Ort:** game.js:13858 (`evaded`); data.js:1174–1179.
- **Was passiert:** Knappes Ausweichen zählt nur für `q_monk`. Kein Code erhöht den Fortschritt anderer Ziele vom Typ `dodge` (gesucht: `'dodge'` in game.js, nur Klangaufrufe).
- **Was passieren sollte:** c_mon1 verlangt 20, c_mon2 15, c_mon3 30 Ausweicher. Die Rüstung der Stillen Hand ist nur darüber erreichbar.
- **Auslöser:** Als Mönch Grad II c_mon1 annehmen und ausweichen.
- **Beleg:** Code gelesen.
- **Sicherheit:** hoch.
- **Reproduktion:** Mönch Grad II, c_mon1 starten, Ausweicher erzeugen, `RF.S.quests.c_mon1.progress` bleibt [0].

**QA-03 · Vampir friert nach dem Laden ein (2)**
- **Ort:** game.js:2918 (Steuerungssperre), :13266 (`vampFrenzy` setzt `frenzyT = performance.now()+dur`); Lade-Reset ~2075–2111 enthält `vamp` nicht.
- **Was passiert:** `frenzyT` ist ein Zeitstempel der alten Sitzung und wird gespeichert. Nach dem Laden in einem frischen Tab ist `performance.now()` klein, die Steuerung bleibt so lange gesperrt, wie die alte Sitzung lief (bis zu Stunden). Raserei kann solange nicht neu auslösen (13217).
- **Was passieren sollte:** Zeitstempel werden beim Laden genullt (so steht es selbst im Kommentar 2074: „Zeitstempel … sind nach dem Laden wertlos“).
- **Auslöser:** Als Vampir einmal Raserei nach längerer Sitzung, speichern, neu laden.
- **Beleg:** Code gelesen.
- **Sicherheit:** hoch (Ablauf). Die Dauer hängt von der Sitzungslänge ab.
- **Reproduktion:** Wegwerf-Slot, `RF.S.player.vamp={frenzyT: performance.now()+3.6e6}`, speichern, neu laden: Spieler bewegt sich nicht.

**QA-04 · Herausforderung an Weißbart sperrt ihn für immer (2)**
- **Ort:** game.js:7813; `parley` wird nur beim Erzeugen gesetzt (7740 bzw. `spawnEnemy` mit parley).
- **Was passiert:** `w.parley = false` bleibt. Flieht der Spieler oder bricht den Kampf ab, ist Weißbart nicht mehr ansprechbar. q_wb_nebel ist nie abgebbar, der Salzfrieden nie möglich (q_salz3 nur noch durch Töten).
- **Was passieren sollte:** Nach Ende des Kampfs ohne Tod hält Weißbart wieder Hof.
- **Auslöser:** „Ich fordere dich heraus“, dann fliehen.
- **Beleg:** Code gelesen (kein `parley = true` für Weißbart außer beim Erzeugen).
- **Sicherheit:** hoch.

**QA-05 · Königsauftrag abbrechen beendet die Varon-Reihe für immer (2)**
- **Ort:** game.js:6911 (`cancelQuest` → `failContract`), :8887 (Angebot nur bei Q 0), :8912ff (`royalStart`/`royalTick`).
- **Was passiert:** `varonQ` bleibt 1, `varonQ1done` wird nie gesetzt, und kein neues Angebot. Verräter-Suche und Ritterschlag sind unerreichbar.
- **Was passieren sollte:** Wie bei anderen Abbrüchen „Der Auftraggeber bietet ihn wieder an“ (Meldung in `cancelQuest`).
- **Auslöser:** Im Auftragsbuch „König Varon: …“ abbrechen.
- **Beleg:** Code gelesen.
- **Sicherheit:** hoch.

**QA-06 · q_mine unerfüllbar, wenn Gorak vor der Annahme stirbt (3)**
- **Ort:** game.js:1832 (Gorak einmalig), `startQuest` 12349ff (Vorab-Anrechnung nur für Hrodvar und Regionalbosse).
- **Was passiert:** Der Auftrag startet mit 0/1, und es gibt keinen Gorak mehr.
- **Was passieren sollte:** Wie bei Hrodvar und den Regionalbossen zählt der frühere Tod (Kommentar in `startQuest`: „was schon erledigt ist, zählt“).
- **Auslöser:** Grube vor dem Gespräch mit Mara säubern.
- **Sicherheit:** hoch.

**QA-07 · Geleitschutz für den Tributzug wird als Raub gewertet (3)**
- **Ort:** game.js:5825 (`byPlayer`), :5801 (Hinterhalt).
- **Was passiert:** Stirbt der Zugführer durch die vom Spiel erzeugten Räuber, während der Spieler näher als 220 px steht, dann bekommt er Tributgut, Kette −15, `harsh = 3` und q_tribut.
- **Was passieren sollte:** Nur ein eigener Schlag zählt als Raub. `tribDefend` (Geleitschutz) wird belohnt (`arriveTribute`).
- **Auslöser:** Zug begleiten, Hinterhalt nicht schnell genug stoppen.
- **Sicherheit:** hoch.

**QA-08 · „Die Pferche öffnen“ hängt nach Vargs Fall (3)**
- **Ort:** game.js:5579 (`openPen` kehrt bei `chainsBroken` oder leerem Pferch zurück); kein anderer Code schließt q_pferch.
- **Was passiert:** Der Auftrag bleibt offen. Auch wenn alle Gefangenen freigekauft wurden.
- **Was passieren sollte:** Erfüllt (die Gefangenen sind frei) oder hinfällig.
- **Sicherheit:** hoch.

**QA-09 · „Die Spur des Rotfalls“ wird nie abgeschlossen (3)**
- **Ort:** game.js:9200–9204 (`omegaFrag`); data.js `q_rotfall.reward.xp 400`.
- **Was passiert:** Kein Code setzt `state='done'`. Der Auftrag steht ewig auf 9/9, die Belohnung kommt nie.
- **Sicherheit:** hoch.

**QA-10 · Dodon bleibt nach abgebrochenem Sturm stumm (3)**
- **Ort:** game.js:7760 (`stormCheck` setzt `parley` und `anchor` nicht zurück; `goblinStorm` hatte `parley=false` gesetzt).
- **Neu zu RB-048:** zweiter Auslöser, Folge des Fixes.
- **Was passiert:** Dodon steht in Vargs Halle und ist nicht ansprechbar, bis Varg stirbt.
- **Sicherheit:** hoch (`parley`), mittel (Ort).

**QA-11 · Aldhelm steht nach dem Tod des Spieler-Blutfürsten wieder auf (3)**
- **Ort:** game.js:13632 (`cultHeroDied` → `end='hidden'`); `buildCatacombs` 13452 (+33): prüft `end`, nicht `aldhelmDead`.
- **Neu zu RB-044:** `aldhelmDead` wird dort nicht beachtet.
- **Sicherheit:** hoch.

**QA-12 · Abbrechen und neu annehmen häuft dauerhafte Gegner an (3)**
- **Ort:** game.js:7790 (`seaQuestStart`), 7785 (`seaTagSpawn` ohne `transient`), 6331 (`spawnChainRest` ohne `transient`); `cancelQuest` 6911 erlaubt das Neuangebot.
- **Was passiert:** Jeder Neustart von q_salz1, q_klinge1, q_wb_nebel oder q_grisk_rache erzeugt neue gespeicherte Gegner (mehrere Morras, je 5 Kettenreste). Folge: Erfahrung und Beute zum Abgreifen, wachsender Spielstand.
- **Sicherheit:** hoch.

**QA-13 · Rangaufträge zielen auf Gegner, die es nach Vargs Fall kaum noch gibt (4)**
- **Ort:** game.js:1795 (`spawnType`), 12790ff (Valen 4b, Untote 4b), g_dod2.
- **Was passiert:** Rotgardisten gibt es nur noch im Stufe-5-Gewölbe Uhrwerkhalle (10239). Kein Hinweis darauf. Kette 1a (4 Goblins) ist nach der Befreiung kaum lösbar.
- **Sicherheit:** mittel (Spawnquellen nur per grep, kein Live-Zählen).

**QA-14 · c_nec2: Wegpunkt zeigt auf die Nekropole, der Wächter steht dort nie wieder (4)**
- **Ort:** `QUEST_WHERE.c_nec2`; `urnRite` 12290 (Wächter nur bei aktivem q_pact); einzige weitere Quelle ist der Boss der Tempelgruft (10235).
- **Sicherheit:** hoch (Code), Lösbarkeit über das Gewölbe nicht live geprüft.

**QA-15 · Fern oder von Verbündeten getötete Regionalbosse zählen nicht (3)**
- **Ort:** game.js:3617–3625 (früher Ausstieg ohne `onKill`/`regionBossSlain`); 1778 (`ensureRegionBosses` beim Laden).
- **Was passiert:** Kein Flag, keine Regionsfolge, keine legendäre Beute. q_greymane und q_sandlord bekommen keinen Fortschritt. Nach dem Laden steht der Boss wieder da.
- **Was passieren sollte:** Wie bei Kult und Seevolk-Zielen (die vor dem Ausstieg gezählt werden) auch Regionalbosse vor dem Ausstieg werten.
- **Sicherheit:** hoch (Code).
- **Reproduktion:** Graumähne von Begleitern töten lassen, während der Spieler weiter als 500 px weg ist.

**QA-16 · Einmalige Quest-Gegenstände sind verkaufbar, der Auftrag hängt dann ewig (3)**
- **Ort:** `sell` 13001 (sperrt nur `bound`); scout_report (world.js:2001), kings_iron (world.js:2321).
- **Was passiert:** Verkauft heißt: q_frontier bzw. q_kingsiron nie abschließbar. Die Ware geht nicht ins Lager zurück, weil es keine Handelsware ist.
- **Sicherheit:** hoch.

**QA-17 · Ratssitz zahlt die 600 EP nicht aus (4)**
- **Ort:** game.js:9929 (`corvanTalk` setzt `done` ohne `turnIn`/`gainXp`); data.js `q_ratssitz.reward.xp 600`.
- **Sicherheit:** hoch.

**QA-18 · Heiliges Gericht: Gold und Gunst ohne Grenze (3)**
- **Ort:** game.js:10016 (Klage deterministisch, +350 für 100), 10027 (Verhandlung +3 Gunst je Klick, keine Tagessperre).
- **Folge:** Bürgerrecht, Ratssitz und q_intrige-Voraussetzungen sind trivial.
- **Sicherheit:** hoch.

**QA-19 · Entführtes Kind wird nie zurückgegeben (3)**
- **Ort:** game.js:13711 (`kid.taken = true`, `kidId` gesetzt); `kidId` wird nirgends gelesen, `taken` nie zurückgesetzt.
- **Was passiert:** Die Rettung beendet einen „Vermisst“-Auftrag mit einer Fremdfigur. Das Kind bleibt „genommen“.
- **Was passieren sollte:** DECISIONS 01.10.: „30 % Kind entführt → Befreiungsauftrag“. Die Befreiung soll das Kind zurückbringen.
- **Sicherheit:** hoch (fehlender Leser), mittel (Folgen für die Erbenwahl, Helfer).

**QA-20 · „Verborgene Truhe“ im Gewölbe beliebig oft plünderbar (3)**
- **Ort:** game.js:10295 (Truhe bei jedem Neubau, ohne Eintrag in `prog`).
- **Sicherheit:** hoch (Code).

**Weitere Funde, klein (Schwere 4):**
- Ritterschlag-Weigerung beliebig oft −10 Valen (8900).
- Verräterliste nennt Gerichtete erneut.
- q_herbs nimmt die Kräuter nicht ab (kein `take`, data.js:1114).
- Ausgerüstetes Ordenssiegel zählt nicht als im Inventar.
- `openRask` ohne Statusprüfung (8255).
- Seevolk nach Weißbarts Tod beim Laden wieder vollständig (`ensureSeafolk` 7284 ohne `whitebeardSlain`).

**Für alle festen Questreihen gilt:** Stirbt der benannte Geber, bleibt die Quest für immer offen. Kein Hinweis, keine Wendung.
- Betroffen: Kelan (Paladin, Orden-Rang), Mira, Ilva, Ysra, Vhal, Sael, Oda, Morvath, Gerold, Rook, Brann, Tomas, Grisk, Dodon, Corvan.
- Benannte NPC sterben endgültig (`die` 3562ff). `questGiverInfo` liefert dann nichts mehr. Aufträge vom Brett behandeln den Fall (`conTick`), feste Quests nicht.
- **Rook** ist von Haus aus feindlich. Damit verschwinden q_rook, die Banden-Rangreihe und die Klassen Schurke und Assassine besonders leicht.

---

## Nicht geprüft
- **Kein Browser.** Kein Auftrag ist live gespielt (Tab-Limit, siehe oben). Alle Reproduktionen sind Vorschläge.
- **Laufen Ziele wirklich?** Nicht live gezählt: Kopfgeldjäger ohne Kopfgeld, Todesritter, Aschdämonen, Knochenhunde, Leichenkoloss, Nekromanten (Orden 3b). Ich habe nur `spawnEnemy`- und `SPAWN_AREAS`-Treffer gezählt.
- **Stabile Schlüssel?** Ob flüchtige Bewohner, die Aufträge geben (Adlige, Ratsherren, Wirtinnen), nach dem Laden denselben `key` behalten. Sonst scheitern ihre Aufträge sofort als „Auftraggeber tot“.
- **Helfer-Aussagen ohne eigene Prüfung:**
  - Kult: `C.joined` gilt für den Erben; Katakomben erzeugen Gegner neu.
  - Gefährten-Auftrag im Dungeon.
  - Belagerung: Königsmörder bekommt den Brandt-Auftrag; Lohn ohne Kampf.
  - Grisk-Tod.
  - Ahnenfeind: Aushang verschwindet, `setTimeout` für den Steckbrief.
  - Hort ohne Wächter.
  - Seevolk Rang 2.
- **Ohne Prüfung:** Feldzüge der Kette und Kreuzzug (Nr. 27). Koop-Sonderfälle bei Quests (Gäste speichern nicht).

## Beobachtungen
- **Marker und Tagebuch:** Alle Aufträge teilen dieselbe goldene Raute oder denselben Pfeil (render.js:136 `drawTrack`, #e0b75a) und dieselbe Tagebuchkarte (ui.js:1114). Je Reihe Emblem und Farbe (Teil 3) braucht nur ein Feld `look:{icon,color}` in QUESTS bzw. CON. **Aufwand:** S.
- **Vier Klassenprüfungen mit derselben Inszenierung:** Paladin, Pakt, Hain und Stille Hand enden alle mit `act(p,'kneel')` plus Ringen.
- **Der Kompass** wählt ohne Verfolgung den ersten aktiven Schlüssel mit `c_`. Darunter fallen Klassenaufträge (`c_nec1`) **und** Brett-Aufträge (`c_<id>`), was die Wahl zufällig macht (game.js ~2460).
- **`cancelQuest`** erlaubt bei festen Quests das Neuangebot. Dabei laufen alle Start-Nebenwirkungen erneut (QA-12). Ein gemeinsamer Schutz (Startwirkung nur einmal) würde mehrere Funde zugleich lösen.
- **Code wurde während des Laufs geändert,** obwohl er eingefroren sein soll (data.js 09:52, game.js 10:03). Der Lead sollte die Zeilenangaben vor dem Weiterreichen einmal gegen den Stand von Commit 1983784 abgleichen.
