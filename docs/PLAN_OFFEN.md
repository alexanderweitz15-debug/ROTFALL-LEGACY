# Arbeitsplan (vorläufig)

Diese Datei hält die Entscheidungen des Nutzers vom 2026-09-26 fest. Sie wird gelöscht, sobald alles programmiert ist. Erledigtes wird hier abgehakt. Was bleibt, gehört danach in GDD und PHASE_STATUS.

Reihenfolge laut Nutzer: zuerst die Eisenfeste (A1–A4), danach B bis H.

## A · Eisenfeste (Eiserne Kette)

### A1 Tribut, Karawanen, Aufstand
- [x] **Tribut**
  - Jedes Tributdorf (Grauwasser, Hohlstein, Eisenried) gibt alle 5 Tage einen spürbaren Teil seiner Vorräte ab.
  - Die Dörfler klagen im Gespräch, die Preise im Dorf steigen.
  - Ein Dorf ohne Vorräte hungert.
  - Der Spieler kann den Tribut für ein Dorf aus eigener Tasche zahlen. Dafür steigt sein Ruf im Dorf.
- [x] **Tributkarawane Dorf → Eisenfeste**
  - Kettenwachen, 1 Offizier, Träger und Wagen.
  - Banditen und Untote können sie überfallen.
- [x] **Überfall durch den Spieler**
  - Ruf bei der Kette −15.
  - Danach erscheint eine Quest: Die Beute behalten oder dem Dorf zurückgeben. Der Spieler entscheidet selbst.
  - Bringt er sie zurück, steigt sein Ruf im Dorf und das Dorf bekommt die Vorräte zurück.
  - Behält er sie, verliert er nur Ruf bei der Kette, das Dorf dankt nichts.
- [x] **Strafaktion nach einem Überfall:** Die Kette schickt einen Trupp ins Dorf und nimmt doppelten Tribut oder Geiseln.
- [x] **Schützen der Karawane**
  - Bringt Ruf bei der Kette.
  - Verschlechtert den Ruf im Dorf, wenn das Dorf gerade einen Aufstand gegen die Karawane macht.
- [x] **Aufstand**
  - Ein Dorf wehrt sich gegen die Karawane.
  - Es ist eine Prügelei ohne Tote: Wer unterliegt, geht zu Boden.
  - Dörfler kämpfen nicht selbstmörderisch, sondern „verdreschen sich gut“.
  - Der Spieler wählt eine Seite.
- [x] **Niederlage der Kette:** Sie zieht sich zurück und kommt mit stärkeren Karawanen wieder, begleitet von **Dunklen Paladinen der Kette** (neue Elite in schwarzer Platte mit Kettenflegel).
- [x] **Banditen gegen Tributdörfer:** Greifen Banditen ein Dorf an, das der Kette Tribut zahlt, stationiert die Kette 1–2 Krieger dort, bis die Raids aufhören. Danach ziehen sie wieder ab.

### A2 Tagesablauf und Feldzüge
- [x] **Tagesablauf der Feste**
  - Morgens zieht der Arbeitszug raus, abends kommt er zurück.
  - Nachts sind die Tore zu, mehr Wachen stehen auf den Mauern.
- [x] **Feldzüge ins Totenland in drei Arten, gemischt**
  - Alle 10–15 Tage ein regulärer Zug: 20–30 Mann.
  - Alle 20–30 Tage ein großer Zug: 40+ Mann.
  - Alle 4–6 Tage ein Stoßtrupp: 8–12 Mann.
- [x] **Ablauf eines Feldzugs**
  - Der Kriegsrat verbreitet Gerüchte.
  - 1–2 Tage Musterung vor dem Tor.
  - Eine sichtbare Armee marschiert auf der Karte.
  - Sie kommt mit Verwundeten und Beute zurück oder fällt.
- [x] **Spieler beim Feldzug:** mitziehen, sabotieren oder die Untoten warnen.

### A3 Dienst bei der Kette
- [x] **Beitritt bei gutem Ruf**
  - Aufträge: Karawanen begleiten, entlaufene Sklaven jagen, beim Feldzug mitziehen.
  - Ränge bis zum Aufseher.
  - Die Gruppe reagiert darauf.
- [x] **Klasse „Dunkler Hochpaladin“ nach dem Aufseher-Rang**
  - Furcht-Aura: Feinde verlieren Mut, Zivilisten fliehen.
  - Kettenschlag: heranziehen und fesseln.
  - Befehl an Kettenwachen: Sie folgen in den Kampf.
  - Blutpreis: Heilung an gefesselten oder fliehenden Feinden.
- [x] **Folgen:** In normalen Dörfern wird man gefürchtet. Die Bewohner handeln schlecht oder gar nicht und reagieren anders.
- [x] **Neue Ränge der Kette:** Grenzreiter (schnelle Patrouille) und Kriegsmeister (Feldherr).

### A4 Fall der Eisenfeste
- [x] **Mehr Untotenraids** mit höherer Chance, Dörfer ganz zu zerstören.
  - Auf Schwer und Sehr schwer ist die Zerstörung endgültig.
  - Auf Angsthase ist Wiederaufbau möglich.
- [x] **Verteidigung**
  - Der Spieler kann selbst verteidigen.
  - Er kann Soldaten anheuern:
    - Söldnerhalle Kreuzweg: Gold pro Tag.
    - Dorfmiliz: Gold und Waffen.
    - Aurelion-Automaten mieten: teuer.
    - Goblin-Krieger von Grisk.
- [x] **Grisk, wenn der Spieler die Feste befreit**
  - Aufträge: Verschleppte finden, Rache an Resten der Kette, Dorf aufbauen.
  - Goblins werden Verbündete.
  - **Später, erst noch planen:** Nach mehreren Ereignissen zerstören die Untoten die Eisenfeste endgültig, und die Goblins schließen sich den Untoten an. Danach läuft alles weiter, nur feindlich zum Spieler und zu anderen Fraktionen.

## B · Schwierigkeitsgrade (Sehr schwer / Schwer = Standard / Angsthase)
- [ ] Wahl beim Start, danach fest für den Spielstand.
- [ ] Leben und Schaden der Gegner (Hebel `BAL`).
- [ ] **Gliedverlust**
  - Angsthase: keiner.
  - Schwer: wie jetzt.
  - Sehr schwer: leichter.
- [ ] **Raids und Zerstörung**
  - Angsthase: Wiederaufbau möglich.
  - Schwer und Sehr schwer: endgültig.
  - Sehr schwer: mehr Raids.
- [ ] **Tod und Erbe**
  - Angsthase: Aufwachen beim Heiler, Goldverlust.
  - Schwer und Sehr schwer: Tod ist Tod, der Erbe übernimmt.
- [ ] Wirtschaft und Kopfgeld skalieren mit der Stufe: Preise, Tribut, Kopfgeldjäger, Beute.

## C · Banditen (mehrere Banden)
- [ ] **Banden, jede mit Anführer, Lager und Gebiet**
  - Rooks Bande (Valen).
  - Wüstenräuber der Sandfürsten (Karak-Atar).
  - Kettenreste nach Vargs Fall.
  - Grenzplünderer bei den Untoten.
- [ ] Überfälle auf Karawanen und Dörfer: Vorräte stehlen, Leute entführen (Lösegeld-Quests).
- [ ] Beitritt möglich: Raub, Schmuggel, Erpressung. Der Ruf bei Wachen sinkt.
- [ ] Schutzgeld von Dörfern. Bei Tributdörfern der Kette greift die Kette ein (siehe A1).
- [ ] **Verhalten**
  - Wegzoll statt Kampf: zahlen, kämpfen oder einschüchtern.
  - Angriff nur in Überzahl, sonst verstecken.
  - Verwundete ausrauben statt töten.
  - Anführer mit Steckbrief: Ist er tot, zerfällt die Bande oder ein Nachfolger übernimmt.

## D · Welt
- [ ] **12–20 kleine Weiler je Weltgeneration**
  - Je näher an den Untoten, desto weniger Dörfer und Städte.
  - Die Größen von Städten und Dörfern sollen sich unterscheiden.
- [ ] **Zwerge**
  - Bergfestungen im Westgebirge und am Frostkamm. Die Tiefhall war ihre alte Halle.
  - Handeln mit Erz, schwerer Rüstung und Runenwaffen, teuer und misstrauisch.
  - Hassen die Kette, möglicher Verbündeter.
  - Eigene Figur: klein, breit, Bärte, schwere Kleidung. Eigene Sprache.

## E · Aurelion
- [x] **Grenze ausarbeiten (wichtigster Punkt)**
  - Aufenthaltsschein für viel Gold, auf Tage begrenzt. Automaten kontrollieren ihn.
  - Reinschleichen über unbewachte Mauer- und Küstenstellen, mit Sichtkegeln der Automaten.
  - Sich von einem Adelshaus als Arbeiter oder Söldner anheuern lassen.
  - Bürgerrecht langfristig über Ruf, Gold und einen Fürsprecher.
- [x] **Versklavung des Spielers**
  - Wer in Aurelion ohne Schein und Geld erwischt wird, kommt in Schuldknechtschaft.
  - Wer bei der Kette am Boden liegt, wacht im Steinbruch auf.
  - Flucht als Spiel: Fesseln lockern, Schlüssel stehlen, Mitgefangene befreien, Nachtschicht nutzen.
  - Freikaufen oder freiarbeiten; auch Dritte können einen freikaufen.
- [x] 3–4 Adelshäuser mit Intrigen: Aufträge gegeneinander, Mord, Heirat.
- [x] **Automaten**
  - Arbeiter mit Tagesablauf.
  - Fabrik in Tickmar.
  - Als Begleiter kaufbar.
  - Echte Kampfroboter, groß (etwa 1,5-mal Mensch), sichtbares Uhrwerk.
- [x] Prothesen ausbauen: Werkbank, Reparatur, beschädigte Prothesen, Upgrades für Stärke, Tempo und Sicht.
- [x] **Stadtbild** imposanter: viele Fabriken, Zahnräder als Leitmotiv, hohe Hallen, Schornsteine.
- [x] **Letzte Bastion:** Fällt die Eisenfeste, verteidigt Aurelion nur sich selbst und macht nie Raids. Flüchtlinge stauen sich vor den Toren, die Einreise wird härter.

Hinweis zu E: Der neue Master-Prompt (Original: docs/archive/MASTER_PROMPT_2_original.md, Phase 5) verlangt ein viel größeres Aurelion mit Bezirken, schwebender Insel usw. Das ist hier noch nicht umgesetzt.

## F · Figuren, Runde 2 (alles zusammen)
- [ ] Eigene Silhouetten je Klasse: Fellkragen, Schulterpanzer, Kapuzen, Gesichter, Helme.
- [ ] Laufen mit Armpendeln und schwingenden Umhängen; Rennen sieht anders aus als Gehen.
- [ ] Treffer: Zurücktaumeln. Tod: Sturz nach hinten, Blut am Boden.
- [ ] Untote, Wolf, Warg und Riese neu.

## G · Offen, nicht jetzt
- [ ] Doppelte Bodenauflösung (Kosten: Speicher, Ruckler beim Nachladen). Nutzer fragen.

## Entscheidungen zum Master-Prompt 2 (2026-09-26)

Der volle Auftrag stand in `docs/archive/MASTER_PROMPT_2_original.md` (gestraffte Fassung: `docs/MASTER_PROMPT.md`). Die Antworten des Nutzers auf die Fragerunden:

- **Sprites:** keine Tools wie SpriteCook, alles selbst im Code zeichnen. Stil und Grafik sollen verbessert werden. Der Nutzer will später einige neue Designs sehen.
- **Omega** ist ein Gott, an den Vargs Nation (die Eiserne Kette) glaubt. Mit genug Fortschritt in Story und Rang kann der Spieler ihn beschwören. Die Beschwörung ist ein **Weltevent** mit **Preis und Risiko** und führt später zum **Endkampf** (eigenes Event).
- **Herrscher Aurelions:** eine Kombination aus allen vier Machtpolen.
  - Die Ewige Kaiserin ist das Oberhaupt.
  - Der Rat der Adelshäuser berät.
  - Dazu kommen das Uhrwerk-Orakel und der Magierkönig.
  - Jeder Mord an einem von ihnen hat Konsequenzen.
- **Garmadon** ist Omegas Gegenstück und ein gefallener Menschenkönig. Später erfährt man, dass er Vargs Bruder ist und Varg ihn getötet hat.
- **Schusswaffen:** ja, aber magisch und nicht übermächtig. Die Sonnenlegion Aurelions trägt sie, der Spieler kann welche kaufen (teuer, Energiekerne als Munition).
- **Reittiere:** Pferde, mechanische Reittiere aus Aurelion, untote Rosse. Keine zähmbaren Wildtiere als Reittiere.
- **Gefängnis:** Zeit absitzen, 10–20 Minuten je nach Tat. Kaution ist möglich. Gefangenen-Quests gibt es nur in **Salzhafen** (Hafenkerker).
- **Magie:** beides. Magie fließt aus Weltadern (Aurelion zapft sie technisch an, die Untoten verderben sie), und die Götter geben Gaben. Zwei Schulen, die sich hassen.
- **Varg:** alles möglich, je nach Entscheidungen des Spielers: Tyrann, Prophet oder erlöst.
- **„Rotfall“:** Alles hängt zusammen. Omega fiel, sein Blut regnete, Garmadon nahm die Macht, Varg tötete ihn. Das wird Stück für Stück enthüllt.
- **Weitere Nationen:** das Nordreich im Eis, ein Seevolk und ein ausgebautes Reich der Sandfürsten.

## Omega — Entscheidungen des Nutzers (Session 13)
- **Preis der Beschwörung:** alles — Blut (dauerhaft −20 % Leben), zehn Seelen, ein Gefährte als Opfer, drei Artefakte (Garmadons Krone, Vargs Kette, Splitter vom Himmel).
- **Varg:** muss leben, nur er kennt das Ritual. Ist er tot, liegt sein Tagebuch in der Kernburg.
- **Misslingen:** Weltkatastrophe — Blutregen überall, die Toten stehen auf, bis Omega besiegt ist.
- **Ende:** drei Enden — kämpfen, dienen (Avatar), schlafen legen.
- **Dauer:** Die Erkenntnis, was getan werden muss, soll mindestens 50 Stunden dauern und über viele Handlungsstränge laufen. Umgesetzt als „Spur des Rotfalls“ (12 Bruchstücke, 9 nötig) plus 50 Stunden Spielzeit.

## Phase 8 — Entscheidungen des Nutzers (Session 13)
- **Stadtwachstum:** beides — Städte wachsen von selbst (Wohlstand, Sicherheit), Spieler-Investition beschleunigt und lenkt.
- **Nationen:** eine große zuerst, ganz ausgebaut (Hauptstadt, Dörfer, Fraktion, Quests, eigene Gegner): **das Seevolk** (Inseln, Schiffe, Seehandel — braucht Seefahrt). Nordreich und Sandfürsten danach.
- **Fraktionskriege:** echte Schlachten — Heere ziehen sichtbar, Grenzen verschieben sich, Städte wechseln den Besitzer; der Spieler kann mitkämpfen oder vermitteln.

## Omega und Glaube — Nachtrag des Nutzers (Session 13)
- Omega ist ein **gigantisches Auge**, das im Kampf verschiedene Engel beschwört.
- Die Religion ist fester Bestandteil in Teilen des **Westens**: fanatisch und fremdenfeindlich. Viele reden darüber; im **Süden und Osten** glaubt man nicht daran.
- Viele Paladine in und um die Eisenfeste, **drei Arten**; **fünf wichtige Figuren**, die Ereignisse auslösen.
- Danach: **Aurelion ausbauen** — Prothesen kaufen, Heiliges Gericht, Reise zur Himmelsfeste, verschiedene Adelige, der König; die Stadt dynamischer machen.

## Rat, Kamerafahrten, Fall der Untoten — Entscheidungen des Nutzers (Session 13)
- **Rat von Aurelion:** Aufnahme erst ab **hohem Rang und über eine Quest** (ein Adelshaus schlägt dich vor). Der Rat tagt alle 7 Tage auf der Himmelsfeste, mit einer kleinen Animation und **drei Entscheidungsmöglichkeiten**. Argumentiert man gut (Beziehung zu Adel und Ratsmitgliedern), stimmt der Rat zu, und die Welt oder ihre Regeln ändern sich. Themen: Flüchtlinge (aufnehmen? Zelte und kaum Essen, oder in der Stadt?), Sklavenarbeit usw.
- **Fall Vargs:** Fällt er samt den übrigen Paladinen, geht die Eisenfeste ganz unter. Die Dörfer werden viel schneller überrannt, viele fliehen Richtung Aurelion. Kamerafahrt: Goblins kämpfen gegen die restlichen Paladine und befreien sich; Untote überfallen Dörfer.
- **Fall der Untoten:** ausgelöst durch **Garmadons Tod**. Über die zivilisierten Untoten (Vharnholm) **entscheidet der Spieler**. Kamerafahrt: Städte werden frei, letzte Kämpfe, Vharnholm; das Land heilt nach und nach; einzelne Leute packen ihre Sachen und ziehen Richtung alte Heimat im Osten.
- **Fabrik** betretbar und benutzbar; **überall kleine Animationen**.
- **Guide:** später ein kurzer Guide für alle solchen Ereignisse (auch Eisenfeste usw.).

- Stand Session 13: Rat, Kamerafahrten, Fall der Untoten, Fabrik, Animationen und Aurelion-Funktionen sind gebaut; der Guide steht in `docs/GUIDE_EREIGNISSE.md`.

## Wirtschaft, Tiere, Seevolk — Entscheidungen des Nutzers (Session 13)
- **Reihenfolge:** 1 Wirtschaft (✅ gebaut, WELTREGELN §3), 2 Tiere, 3 Seevolk.
- **Wirtschaft: tief.** Einzelne Betriebe mit Arbeitern (ohne Arbeiter keine Produktion), Lagerhäuser, Produktionsketten, Preise je Stadt nach Angebot und Nachfrage, Karawanen mit echtem Zweck; Überfälle und Zerstörung wirken.
- **Der Spieler kann:** handeln (billig kaufen, teuer verkaufen), eine eigene Karawane betreiben, Betriebe kaufen, Lieferaufträge erfüllen.
- **Seevolk:** Küstenstädte am Festland und eine Hauptstadt auf einer Insel; mehrere zerstrittene Clans (Plünderer und Händler); Seereise erst einmal als Überfahrt mit Ereignissen (Sturm, Piraten) oder einfache Fähre; politisch neutral am Start, Seiten wählbar.
- **Piratenkönig (Nutzer):** „Weißbart“ — ein alter, riesiger Kapitän mit weißem Bart, Anführer der Plünderer-Clans. Eigene Figur, keine Kopie des One-Piece-Charakters (Urheberrecht): eigene Geschichte, eigenes Aussehen, eigene Waffe.

## Tiere — Entscheidungen des Nutzers (Session 13)
- **Zähmen:** füttern und Geduld (passendes Futter, ruhig nähern, mehrere Versuche; Fehler reizen wilde Tiere) **und** Kauf beim Tierhändler.
- **Begleiter:** ein Tier zusätzlich zu den drei Gruppenplätzen.
- **Reittiere, alle vier:** Pferd, mechanisches Reittier aus Aurelion (Wartung mit Magitech-Teilen), untotes Ross, Kampf vom Pferd.
- **Nutztiere:** sichtbar auf den Höfen und Teil der Wirtschaft (Fleisch, Felle, Tuch; Räuber und Wölfe reißen sie), dazu ein eigener Hof des Spielers.
- Vorher (Nutzer): kompletter Guide; danach Prompts und Memory straffen, Überholtes aus dem Master-Prompt entfernen.

## Neue Wünsche des Nutzers (Session 13, nach dem NPC-Leben)
- Statusbericht, dann **jedes System gründlich prüfen**, damit alles klappt.
- Mehr Waffen, mehr Animation, mehr Charaktere. **Wichtige Figuren sehen anders aus** (Aussehen, Haare, Statur).
- Die Reisenden-Funktion für die **Reise nach Aurelion** nutzen: bleiben Leute mit Zelten vor dem Tor oder kommen sie hinein.
- **Hinweise anzeigen:** in welchem Clan oder welcher Fraktion man ist und welche Effekte das hat.
- **Arbeiter:** „Die arbeiten nicht, die stehen nur herum und hämmern.“ Echte Arbeitsabläufe nötig.
- **Antworten des Nutzers:**
  - Prüfen: erst ein kompletter Durchlauf aller Systeme mit Bugliste, dann nach Schwere abarbeiten.
  - Arbeiter: beides — Arbeitskreislauf (Material holen, bearbeiten, Ware sichtbar abliefern) und eigene Animationen je Beruf.
  - Aurelion-Reise: beides — mit Pass, Geld oder Stand hinein; der Rest je nach Ratsgesetz ins Zeltlager vor dem Tor oder abgewiesen.
  - Hinweise: beides — Symbolleiste unter der Lebensleiste mit Tooltip und ein ausführliches Effekte-Fenster.
  - Waffen: alles — Fraktionssets, neue Waffenarten (Sense, Kriegssichel, Wurfwaffen, Schleuder, Doppelklinge, Faustwaffen), mehr Unikate, Magitech-Feuerwaffen.
  - Animation: alles — Kampf, Laufen und Leben, Arbeit.
  - Wichtige Charaktere: eigenes Aussehen je Figur (Statur, Haare, Bart, Narben, Kleidung) im Stil der Referenz 5, im Code gebaut.
  - Mehr Charaktere: mehr benannte NPCs mit Geschichte (2–3 je Stadt) und mehr Vielfalt bei Bewohnern (Berufe, Alter, Statur, Kleidung je Region).
- **Reihenfolge:** 1 Durchlauf und Bugliste, 2 Bugs fixen, 3 Hinweise, 4 Arbeiter, 5 Aurelion-Reise, 6 Charaktere, 7 Waffen, 8 Animation, 9 restliche Grundmechaniken (Ränge, Kampf-KI, Fraktionsmechaniken), 10 Tiere.

## Nach dem Audit — Entscheidungen des Nutzers (Session 13)
- Begleiter: erst kämpfen, dann heilen; Heilen dauert (umgesetzt: Knien 4 s, Heilzauber 1,5 s Wirkzeit, Verbände nach dem Kampf).
- Alle Audit-Bugs fixen. Vorrang: **Bewohner, die nichts tun** — Schmiede sitzen in ihrer Schmiede, arbeiten dort und sind zum Kaufen ansprechbar; Händler stehen hinter ihrem Marktstand.
- **Hinterhalte** dürfen nicht sichtbar erscheinen.
- **Level:** alles — Stufenaufstieg des Helden, Gegnerstufen je Gebiet, Gebiete und Level-Design.
- **Gegner:** Varianten je Art (Aussehen, Stärke, Verhalten), neue Arten je Region, mehr Verhalten (flankieren, Rückzug, Fallen, Hilfe rufen, Kapitulation).
- **Dungeons:** mehr, darunter sehr schwere im Land der Untoten und in Aurelion; mehrere Ebenen, die nächste erst nach der vorigen; zufällig erzeugt, besserer Loot je Schwere.
- **Dialog:** mehr bei Bewohnern, Begleitern, wichtigen Figuren und Gegnern.
- **Reisen:** keine freie Schnellreise; zu Fuß wie Kenshi, dazu Kutschen und Fähren gegen Gold mit Reisezeit und möglichen Überfällen.
