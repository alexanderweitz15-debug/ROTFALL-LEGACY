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
- [ ] **Grenze ausarbeiten (wichtigster Punkt)**
  - Aufenthaltsschein für viel Gold, auf Tage begrenzt. Automaten kontrollieren ihn.
  - Reinschleichen über unbewachte Mauer- und Küstenstellen, mit Sichtkegeln der Automaten.
  - Sich von einem Adelshaus als Arbeiter oder Söldner anheuern lassen.
  - Bürgerrecht langfristig über Ruf, Gold und einen Fürsprecher.
- [ ] **Versklavung des Spielers**
  - Wer in Aurelion ohne Schein und Geld erwischt wird, kommt in Schuldknechtschaft.
  - Wer bei der Kette am Boden liegt, wacht im Steinbruch auf.
  - Flucht als Spiel: Fesseln lockern, Schlüssel stehlen, Mitgefangene befreien, Nachtschicht nutzen.
  - Freikaufen oder freiarbeiten; auch Dritte können einen freikaufen.
- [ ] 3–4 Adelshäuser mit Intrigen: Aufträge gegeneinander, Mord, Heirat.
- [ ] **Automaten**
  - Arbeiter mit Tagesablauf.
  - Fabrik in Tickmar.
  - Als Begleiter kaufbar.
  - Echte Kampfroboter, groß (etwa 1,5-mal Mensch), sichtbares Uhrwerk.
- [ ] Prothesen ausbauen: Werkbank, Reparatur, beschädigte Prothesen, Upgrades für Stärke, Tempo und Sicht.
- [ ] **Stadtbild** imposanter: viele Fabriken, Zahnräder als Leitmotiv, hohe Hallen, Schornsteine.
- [ ] **Letzte Bastion:** Fällt die Eisenfeste, verteidigt Aurelion nur sich selbst und macht nie Raids. Flüchtlinge stauen sich vor den Toren, die Einreise wird härter.

## F · Figuren, Runde 2 (alles zusammen)
- [ ] Eigene Silhouetten je Klasse: Fellkragen, Schulterpanzer, Kapuzen, Gesichter, Helme.
- [ ] Laufen mit Armpendeln und schwingenden Umhängen; Rennen sieht anders aus als Gehen.
- [ ] Treffer: Zurücktaumeln. Tod: Sturz nach hinten, Blut am Boden.
- [ ] Untote, Wolf, Warg und Riese neu.

## G · Offen, nicht jetzt
- [ ] Doppelte Bodenauflösung (Kosten: Speicher, Ruckler beim Nachladen). Nutzer fragen.
