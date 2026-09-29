# Offene Pläne und Entscheidungen des Nutzers

Neueste Entscheidungen gehen dem Master-Prompt vor. Erledigte Blöcke (Eisenfeste A1–A4, Aurelion E, Omega, Rat,
Wirtschaft, NPC-Leben, Audit-Wünsche): `archive/PLAN_OFFEN_bis_S13.md`.

## S15 · Neuer Hauptplan (Nutzer, 29.09.)
Figuren nach Referenz 6, Beute, Kampfgefühl, Magie als Weltsystem, Magierturm, Aurelion: **`PLAN_S15.md`** (Pakete P0–P13).
Die offenen Punkte unten sind dort als P9 (Kleinkram) und P12 (Schwierigkeitsgrade) eingeplant.

## S14 · Reihenfolge (Nutzer)
1. [x] Tiere: eigener Hof (Siedlungsgebäude „Weide mit Stall“, Tiere beim Tierhändler, Hofvorrat per E); Herden je Stadt in der
   Wirtschaft (`economy.js` herdDay: Fleisch/Tuch/Fell, Nachwuchs, Wölfe/Räuber reißen sichtbar, Notschlachtung).
2. [x] Seevolk (S14: Gischtinseln/Tangkron, Salzbund vs. Sturmklinge, Weißbart, Überfahrt mit Sturm/Entern; Küstenstädte am Festland = Kapitäne in Salzhafen/Kupferhafen — eigene Seevolk-Dörfer am Festland offen): Küstenstädte und eine Hauptstadt auf einer Insel; mehrere zerstrittene Clans (Plünderer und Händler);
   Piratenkönig „Weißbart“ als eigene Figur; Überfahrt mit Sturm und Piraten.
3. [x] Ereignisse mit neuem System: Brand in der Stadt (Löschkette), Spuk am Brunnen (Ort säubern),
   Magitech-Unfall (Automaten laufen Amok), Jahreszeiten mit Wirkung (z. B. Wolfswinter).
4. [ ] Kleinkram: ~~Test fürs Laden eines Spielstands~~ (✅ `RF.loadProbe`); ~~Gebäude-Infos im Infofeld~~ (✅); Kuh-Form nachbessern;
   flüchtige Sklaven aus der Eisenfeste (Idee 14); Erbfolgestreit im Adel (Idee 12, teils); Meteorsplitter (Idee 15).
5. [ ] Schwierigkeitsgrade (Block B unten) — erst nach allem anderen.
- Aus älteren Plänen, noch nicht angefasst: Figuren Runde 2 (eigene Silhouetten je Klasse, feinere Animationen),
  Stil Referenz 4 (Wasser, Ruinen, Wetter, Banner).

## S14 · Warteschlange (Nutzer, in dieser Reihenfolge nach den Sprites)
- [x] Missionsbeitrag messen: Schaden des Helden (+ Gefährten) an Auftragszielen zählen; töten Wachen die Gegner,
  sinkt Lohn/Ruf entsprechend („Die Wache hat die Arbeit gemacht“). Gilt auch für Verteidigung. Aufhänger: `hurt()` und `conKill()`.
- [x] Varg: Die Wahl „Garmadon soll fallen“ erst, nachdem man Garmadon einmal begegnet ist.
- [ ] Cutscenes: Boss-Intros (Varg, Hrodvar, Garmadon, Gorak) beim ersten Sichtkontakt, Kerkerausbruch, Ankunft Aurelheim.
- [x] Eisenfeste: Man bekommt dort immer noch keine Aufträge (Brett/Auftraggeber prüfen).
- [x] Gliedmaßen: 100 LP je Arm/Bein; bei 0 fallen sie aus (funktionslos bis Heilung), abgetrennt erst ab −200.
  Heute: max = Basis × Anteil, Untergrenze −max, Abtrennen per Zufall (`body.js` `damagePart`).
- [x] Rang-Questlines je Fraktion (S14: Valen/Oda, Orden/Kelan, Tote/Morvath, Kette/Kettenwache; je Rang 2 Aufträge; Händler, Bande, Aurelion, Goblins offen) (eigene, einzigartige Ketten): Ruf-Schwelle erreicht → neue Questline frei → abgeschlossen =
  nächster Rang (plus Ruf) → nächste Schwelle → nächste Questline usw. Rang nur noch über die Questline, nicht allein über Ruf.

## S14 · Brainstorm „Ende der Brüder“ (Nutzer: Ideen sammeln, dann besprechen)
Heute: Kamerafahrt, Legende, Chronik, Preise +5 %, Kettenrest (5 Räuber), Ruf +10 bei Valen/Orden/Aurelion. Ideen:
1. **Machtvakuum:** West- und Ostland werden herrenlos — Valen, Orden, Aurelion und die Grubenstämme schicken Siedler/Truppen,
   ein Wettlauf um Eisenfeste und Knochentor (Kriegsrunden wählen diese Ziele zuerst).
2. **Erbfolge der Kette:** Statt nur Räuber ringen drei Unterführer (Brute, Schütze, Tributoffizier) um Vargs Erbe; wer gewinnt,
   bestimmt, ob die Kette als Söldnerbund, Räuberbande oder gar nicht zurückkehrt. Der Held kann einen stützen.
3. **Die Toten ohne König:** Untote ohne Befehl zerstreuen sich, werden wild und schwächer, aber unberechenbar
   (Wanderhorden statt geplanter Raids); Vharnholm-Bürger fragen den Helden, was aus ihnen wird.
4. **Das Blut der Brüder:** Beide trugen das Blut des Sterns — an beiden Leichen ein Blutsplitter; zusammen öffnen sie eine
   versiegelte Kammer (Omega-Spur, Endgame-Waffe oder Wahl: vernichten / behalten / Omega geben).
5. **Grabmal der Brüder:** Man kann sie gemeinsam bestatten (Ort wählbar) — Pilgerort, kleiner Segen, oder Schändung für die Omega-Kirche.
6. **Heimkehr und Wiederaufbau:** Goblins und Heimkehrer besiedeln die Eisenfeste neu; der Held darf sie als Sitz beanspruchen.
7. **Legendenlied:** Barden singen in Schenken vom Ende der Brüder (Ruf steigt über Zeit, Figuren erkennen den Helden).
8. **Omegas Antwort:** Mit dem Tod der Brüder fehlt Omega sein letzter Anker — Rotfall-Uhr läuft schneller oder Omega spricht zum Helden.

## B · Schwierigkeitsgrade (Sehr schwer / Schwer = Standard / Angsthase) — nach den übrigen Phasen
- [ ] Wahl beim Start, danach fest für den Spielstand. Leben und Schaden der Gegner über `BAL`.
- [x] Gliedverlust: Angsthase nie, Schwer ab −200, Sehr schwer ab −100 (`body.js` `cutOf`; Wahl beim Start fehlt noch, Debug schaltet).
- [ ] Raids: Angsthase Wiederaufbau möglich (vorbereitet: `S.difficulty`, `finalRuin`), Schwer/Sehr schwer endgültig,
  Sehr schwer mehr Raids.
- [ ] Tod: Angsthase Aufwachen beim Heiler mit Goldverlust; sonst Tod ist Tod, der Erbe übernimmt.
- [ ] Wirtschaft und Kopfgeld skalieren mit der Stufe: Preise, Tribut, Kopfgeldjäger, Beute.

## C · Banditen (mehrere Banden)
- [ ] Banden mit Anführer, Lager, Gebiet: Rooks Bande (Valen), Wüstenräuber (Karak-Atar), Kettenreste, Grenzplünderer.
- [ ] Überfälle auf Karawanen und Dörfer: Vorräte stehlen, Leute entführen (Lösegeld-Aufträge).
- [ ] Beitritt: Raub, Schmuggel, Erpressung; Ruf bei Wachen sinkt. Schutzgeld von Dörfern (bei Tributdörfern greift die Kette ein).
- [ ] Verhalten: Wegzoll statt Kampf (zahlen, kämpfen, einschüchtern), Angriff nur in Überzahl, Verwundete ausrauben,
  Anführer mit Steckbrief (Tod: Bande zerfällt oder Nachfolger).

## D · Welt
- [ ] 12–20 kleine Weiler je Weltgeneration; nahe den Untoten weniger Orte; Städte unterschiedlich groß.
- [ ] Zwerge: Bergfestungen im Westgebirge und am Frostkamm (Tiefhall war ihre Halle), handeln Erz, schwere Rüstung,
  Runenwaffen; teuer, misstrauisch, hassen die Kette. Eigene Figur: klein, breit, Bärte, schwere Kleidung, eigene Sprache.

## F · Figuren (S14 Teil B arbeitet daran)
- [ ] Eigene Silhouetten je Klasse: Fellkragen, Schulterpanzer, Kapuzen, Gesichter, Helme.
- [ ] Laufen mit Armpendeln und schwingenden Umhängen; Rennen anders als Gehen.
- [ ] Treffer: Zurücktaumeln. Tod: Sturz nach hinten, Blut am Boden.
- [ ] Untote, Wolf, Warg und Riese neu. Wichtige Figuren sehen anders aus (Statur, Haare, Bart, Narben, Kleidung).

## G · Später
- [ ] Doppelte Bodenauflösung (Speicher, Ruckler beim Nachladen) — Nutzer fragen.
- [ ] Eisenfeste endgültig zerstört, Goblins schließen sich den Untoten an (erst planen).

## Seevolk (nächste große Nation)
- Küstenstädte am Festland, Hauptstadt auf einer Insel; zerstrittene Clans (Plünderer und Händler); am Start neutral.
- Seereise zuerst als Überfahrt mit Ereignissen (Sturm, Piraten) oder einfache Fähre.
- Piratenkönig „Weißbart“: alter, riesiger Kapitän mit weißem Bart, Anführer der Plünderer; eigene Geschichte, eigenes
  Aussehen, eigene Waffe (keine Kopie).
- Danach Nordreich (Eis) und Sandfürsten. Fraktionskriege sind echte Schlachten mit wandernden Grenzen.

## Tiere und Wirtschaft (Rest)
- [ ] Eigener Hof des Spielers. Nutztiere als Teil der Wirtschaft (Fleisch, Felle, Tuch; Räuber und Wölfe reißen sie).

## Lore-Entscheidungen (gelten weiter)
- Omega: Gott der Kette, ein gigantisches Auge mit Engeln; Beschwörung als Weltevent mit vollem Preis; drei Enden.
- Garmadon: Omegas Gegenstück, gefallener Menschenkönig, Vargs Bruder — Varg hat ihn getötet. „Rotfall“: Omega fiel,
  sein Blut regnete, Garmadon nahm die Macht, Varg tötete ihn; Stück für Stück enthüllt.
- Varg: Tyrann, Prophet oder erlöst, je nach Spieler. Omega-Glaube nur im Westen (fanatisch, fremdenfeindlich).
- Aurelion: Ewige Kaiserin, Rat der Adelshäuser, Uhrwerk-Orakel, Magierkönig; jeder Mord hat Folgen.
- Magie: aus Weltadern (Aurelion zapft, Untote verderben) und Göttergaben — zwei Schulen, die sich hassen.
- Schusswaffen: magisch, nicht übermächtig, Sonnenlegion; käuflich, teuer, Energiekerne als Munition.
- Reisen: keine freie Schnellreise; Kutschen und Fähren gegen Gold mit Reisezeit.
- Sprites: nie SpriteCook o. ä.; alles im Code gezeichnet.
