# OFFEN — alles, was Agenten geliefert und der Lead noch nicht erledigt hat (Stand 02.10.2026, 16:40)

Vom Lead gepflegt. Ein Punkt verschwindet erst, wenn er gebaut, geprüft und committet ist oder der Entwickler ihn streicht.
Legende: **[E]** = Entscheidung des Entwicklers nötig · **[B]** = bauen (entschieden) · **[P]** = prüfen/messen.

## Kampf-Feedback (Agent fertig)
- [erledigt, Lead 02.10. abends] Koop: Gäste sehen keine Bodenmarke und kein Warnzeichen schwerer Angriffe (Feld `special` wurde nicht übertragen). Jetzt in `coop.js` `hostTick` ein eigener Vergleich (JSON-Diff) statt der DYN-Schleife, die Objekte sonst auf nur den Namen reduziert; geprüft mit `RF.coop.fakeGuest` (per Hand `special`-Objekt gesetzt, im `upd` beim Gast vollständig angekommen: kind/t/T/R/heavy).
- [erledigt, Lead 02.10. abends] Koop: Schadenszahlen ohne „eigener Schaden“-Merkmal. `dmgFloat` trägt jetzt `srcId`; der Host berechnet `mine` beim Versenden je Gast neu (`srcId === m.id`), Gast übernimmt `num`/`mine`. Geprüft mit `RF.coop.fakeGuest`: eigener Treffer kommt mit `mine:true` an.
- [E] Haltung und Humpeln verwundeter Gegner, Status als Haltung, Eisrand im Koop. Das braucht neue Posen bzw. eine neue Tempo-Regel.
- [E] Lebensbalken des zuletzt getroffenen Gegners: 5 s (Zahl vom Lead gesetzt, nicht bestätigt).

## Items, Inventar, Läden (Agent fertig)
- [B] Aufnahme-Stapel und große Fund-Karte für Legendär/Mythisch; liegt beim UI-Agenten (Meldungsfluss).
- [B] Auslage seltener Ware, Schwarzmarkt als Raster.
- [E] Händlergesicht nach Ruf/Angst.
- [B, BLOCKIERT/TEILWEISE — Lead 02.10. abends] Koop-Gast handelt noch per Dialog, nicht im Dock. Analyse: Host-Seite (`guestShopDeal`, `sendShop`) ist fertig und bleibt maßgeblich. `guestShop()` in `coop.js` baut aber nur eine Textliste über `A.dialogue`; das echte Handels-Dock (`UI.openModal('trade', npc)`, `tradeUI` in `ui.js`) hängt eng an einem lebenden `npc`/`S.player` (ruft `shopStock`, `price`, `buyQuote` usw. direkt am Objekt auf), das der Gast lokal nicht hat — nur die Momentaufnahme `shopData` (`buy`/`sell`-Listen vom Host). Eine echte Dock-Optik für den Gast braucht einen eigenen Adapter, der `tradeUI` mit `shopData` statt mit einem lebenden Händler füttert (oder eine zweite, schlankere Dock-Variante). Das ist mehr als eine Randnotiz und hätte halbfertig weitere Regressionsgefahr für das bestehende Host-Handelsfenster bedeutet; nicht angefasst. Bestehender Dialog-Weg bleibt bis dahin die funktionierende Lösung.
- [P] Ziehen auf die Schnellleiste geht nicht (Fenster verdeckt sie); Knopf „Auf Leiste legen“ bleibt.
- [P] Bei 1280 px bleibt links vom Handels-Dock nur ein schmaler Streifen Welt.

## Leistung PERF-U3 (Agent fertig)
- [P] 3-ms-Marke nicht belegt, weil die Maschine bei der Messung ausgelastet war. Bench (`ROTFALL_STATE/perf/bench.js`) bei ruhiger Maschine wiederholen.
- [P] Vorbacken in Browser-Pausen im echten Spiel (mit Animation-Frames) nicht gemessen.
- Regel: Wer in `humanSpec` ein neues Figurenfeld liest, trägt es in `HS_ENT`/`HS_PAL` ein (sonst veraltetes Aussehen).
- Neue Lichter ohne Listenänderung erscheinen jetzt nach ≤ 4–8 s statt ≤ 4 s.
- [B] Offene Hebel: `paintR` in fig5.js (Schwall neuer Figuren bei Stadtankunft); Spitzen bei `nearEnts`, `tierOf` und den Sekunden-Haken.

## Kampfanimation (Agent läuft — Priorität 16:45: Ganzkörper-Posen, Entwickler „noch nicht ausgearbeitet genug“)
- [B] Lead-Befund: Körper starr, Einschlag-Pose bei allen Hieben gleich, Packs nur VFX, Zweihand wie Einhand → Ganzkörper-Posen je Phase und Angriff, Zweihandgriff, Umfang je Pack, Smear, Zielreaktion; neue Raster kampf_s3_*.
- [B] Danach: schwerer Hieb per Halten, Seitschritt aufs Ausholen, §17-Rest.
- [E] Ist der schwere Hieb des SPIELERS nicht blockbar wie der der Gegner? Der Agent meldet das, entscheidet es aber nicht.
- [P] §82 knapp grün (Ø 12,7 % gegen Grenze 12).
- [P] Koop nicht live getestet; Klänge nur aus dem bestehenden System.
- [E] Nach §17: Entwickler vergleicht Pack A/B/C im Test Room (Debug „Kampfanimation: …“) und legt den Stil fest. Danach Ausrollen auf alle Waffen (Axt, Streitkolben, Stangenwaffe, Doppelklingen, Sense, Bogen, Armbrust, Stab, Magie, Bosswaffen).

## Kampfanimation — Stand nach Ganzkörperposen (Agent fertig 17:25)
- Gebaut: Ganzkörperposen je Angriff, Zweihandgriff, Pack-Umfang B ×1,5 und C ×2, Absprung im Finisher, Schleier, Trefferzucken. Schwerer Hieb per Halten (180 ms Klickgrenze, voll nach 800 ms, Werte des Wuchtschlags). Seitschritt reagiert aufs Ausholen.
- [E] Ist der schwere Hieb blockbar (jetzt ja)? Eigener Schadensfaktor, Ladezeit je Waffe, Ausdauerkosten, Leertaste/Touch, Aufladen für Koop-Gäste?
- [E] Dolch +17 % Schaden/s gegen Banditen, weil sein Ausholen nur 60 ms dauert: Mindest-Reaktionsfenster oder längeres Ausholen?
- [B] §17-Rest: Kampf-Idle, Kampfbewegung, Block/Parade-Haltung je Waffe, Ausweichen je Pack, eigene Großaxt-Bewegung, Trefferreaktionen je Waffe.
- [P] Die Posen kennen keine Rumpfdrehung (Grenze des R-Systems); von vorn tragen nur Knie und Beine das Gewicht.
- [P] 5 Waffen × 3 Packs füllen den Bild-Cache bis ≈ 4000 (ein Held braucht 270–530).

## Gegner (Agent läuft)
- Läuft: Varianten aller Gegner, Bomben-Skelett, Großes Skelett, Mutanten (Totenland-Rand), danach Top 5 (Wächterspinne, Dampframme, Blutschöpfer, Netzwerferin, Hofspion).
- [E] Die übrigen 14 Ideen in `visual/gegner_ideen.md` sind nicht gewählt.

## Menüs, Quests, Skilltree, Karte (Agenten laufen seit 16:35)
- UI-Agent: Meldungsfluss (UI-Scheibe 4), Quests Q-1..Q-4, Pergament-Fenster (Scheibe 5), Docks für Siedlung/Gruppe/Handwerk.
- Skilltree/Karte-Agent: Linien, Icons, Vorschaukarte; Ortskarte, Ereignis-Pins, Fraktionsgrenzen.
- [B] Danach nach VISUAL.md-Priorität: NPC-Visuals (visual/npcs.md, P3), Städte, Welt-Events, allgemeine UI.

## Lead 02.10. abends
- Behoben: HB-01 (gespeicherter Tod führt nach dem Laden zur Erbenwahl), HB-02 (alle performance.now-Felder, auch verschachtelte, verfallen beim Laden; Liste PERF_KEYS), HB-05 (Abbruch trifft nur das beorderte Heer), Ansehen der Eisenfeste zählt für die Kette statt für Valen.
- [B] HB-03 (Zeitsprünge überspringen Stunden-Haken) und HB-04 (applySave leert S nicht) macht der Lead als Nächstes.
- [E] Aufträge an Fraktionsorten ohne Eintrag in TOWN_PLAN/GUARD_POSTS (Grubenhort ohne Aufstand, Karak-Atar, Dünenwacht …) zählen weiter für Valen. Für wen sollen sie zählen?
- [P] PR #8: claude-arbeit enthält main als Vorfahr. Stand c86c3d3 wurde isoliert getestet: 404/404. Vorher war a49d302 kaputt (Syntaxfehler aus einem Agenten-Zwischenstand), deshalb vor jedem Merge den Kopf des PR so prüfen.

## Abends (02.10.)
- Erledigt: HB-03, HB-04, Talentbäume versteckt, Tierhändler-„Zurück“, Umhänge in Läden und Beute, Koop special/eigene Zahlen, Skilltree-Linien/Icons, Karte (Ortsbild, Ereignis-Pins, Grenzen), Kampfanimation §17 für 5 Waffen.
- [B] Koop-Gast-Handel im Dock: Agent hat es als BLOCKIERT gemeldet (das Dock braucht einen lebenden NPC, der Gast hat nur shopData). Ein eigener Adapter ist nötig.
- [E] Skilltree Scheibe 3 (Freischalt-Animation) und 4 (Titelzweig-Siegel): durch den Sternbild-Umbau vermutlich überholt.
- [E] Kampfanimation: Packs A/B/C im Test Room vergleichen → Stil festlegen → auf alle Waffen ausrollen.
- [P] Kampf-Lauf-Bilder nicht vorgebacken (einmalig ~4 ms je neuer Blickrichtung).
- Läuft: Klassen-Prüfung + Sternbild-Talentbäume (Analyse), Pferde-Sprites, Gegner, Menüs/Quests, Hunt-Fixes HB-06..23.

## Nacht (02.10., 22:00)
- Erledigt (Agenten): neue Gegner (Bomben-/Groß-Skelett, Mutanten, Wächterspinne, Dampframme, Blutschöpfer, Netzwerferin, Hofspion, 6 Varianten für 8 bisher eintönige Arten); HB-06..HB-23 außer HB-10/HB-20; Pferde-Fellfarben (Stall-Bild = echtes Pferd); Klassen/Talente-Analyse (PROPOSALS/klassen_talente.md, Entwurf designs/talente_sternbild.html). Lead: Brot zählt zum Proviant, Ratgeber-Probe.
- [E] Gegner (gegner_neu.md):
  1. Explosion, wenn das Bomben-Skelett während der Zündung stirbt?
  2. Fraktion der Mutanten.
  3. Spinnen auch in Werkhallen der Städte? Feinde auch für Bürger mit Schein?
  4. Soll die Dampframme Städte verteidigen?
  5. Blutschöpfer ohne die Regel „zweites Trinken tötet“.
  6. Alle Werte.
  7. Mutanten als Reise-Hinterhalt?
- [E] HB-10: Welche Belohnung zahlt die Rotfall/Omega-Reihe aus? HB-20: Was übernimmt ein Erbe an Ehe und Bindungen?
- [E] Klassen/Talente: Entscheidungen 2–16 aus klassen_talente.md §5 sind offen. Punkte sind entschieden: jede 2. Stufe plus 1 je Prüfung.
- [B] Fehler aus der Klassen-Analyse:
  - Koop-Gäste bekommen beim Aufstieg keine Talentpunkte.
  - Der Erbe hat bis zum Neuladen 0 Punkte.
  - Vampir und Grubenhäuptling haben keinen Zweig.
  - BALANCE_GUIDE §7 (jede 2. Stufe) passt nicht zum Code (jede 3.).
- [P] Pferde: Gang und Grundform nicht neu gezeichnet (Agent: „bereits brauchbar“). Prüfen, ob dem Entwickler das reicht.
- Läuft: UI-Agent (Pergament, Docks, Spacing aller Menüs, Betriebe-Reiter mit Kasse, Schmiede-GUI, GUI-Prüfung aller Systeme), Despawn-Agent (Verfolger verschwinden).

## 03.10. nachts
- Erledigt:
  - UI-Agent: Meldungen, Q-1..Q-4, Pergament, Docks, Spacing, Betriebe-Kasse, Schmiede- und Reise-Dock.
  - Klassen Scheibe 0.
  - Verfolger: Spur verlieren statt verschwinden, aber nur, wenn sie den Helden, seine Gruppe oder einen Koop-Helden jagen.
  - Lead: NPC N2/N6/N7/N8/N9-7 (Gesten, Schreck, Wachenruf, Trauer mit Glocke und Kerzen, Grüßen und Rivalen, Warnkette).
- [E] UI:
  1. Bewohner-Siegel nur in Ansprech-Nähe oder auf Sichtweite?
  2. Was nimmt ein Überfall aus der Betriebskasse?
  3. Verlusttage: erst die Kasse, dann das Gold — bestätigen.
  4. Abholen direkt am Haus braucht eine Zuordnung Betrieb → Haus.
  5. „Schmieden lassen“ und „Verbessern“ beim Schmied: neue Regeln (Preis, Dauer, Wirkung).
  6. Bewohner rufen den Helden (Q-OE8), Szene bei Story-Abschlüssen (Q-OE3), Hinweis auf seltene Beute (I-6).
  7. Kartenausschnitt im Auftragsbrief.
- [B] GUI-Reihenfolge laut UI-Agent: Tierhändler → Prothesen-Werkbank → Kontor (Bewertung in visual/ui_menues.md).
- [P] Nach jedem Selbsttest stehen fremde Probe-Aufträge („Die Auftraggeberin: Probe“ …) im Tab-Zustand. Sie werden nicht gespeichert; eine Probe räumt nicht auf.
- [P] Die Q-4-Probe war im isolierten Commit 56e4f02 rot (beim UI-Agenten grün). Wird geprüft.
- [P] Der Selbsttest dauert jetzt ~2,5–3 min statt ~1 min. Prüfen, ob die Verfolger-Änderung (heiße Verfolger) oder neue Proben die Ursache sind.
- Läuft: Klassen-Agent, Scheiben 1–10 und Gefährtenbaum.

## 03.10. früh
- Erledigt:
  - Klassen-Prüfungen und Sternbild-Talente komplett (Scheiben 0–10, Gefährtenbaum).
  - Tierhändler-Fenster.
  - Schmied: Verbessern und Schmieden lassen.
  - Überfall nimmt die Hälfte der Betriebskasse.
  - NPC N2, N6, N7, N8, N9-7.
  - Commit a4bce09 isoliert getestet: 462/462.
- [E] Ritter: hat „Segen“, aber ohne gelernten Zauber kein Mana. Seine Segen-Sterne sind dann nutzlos.
- [E] Klassen, vorläufige Zahlen des Agenten:
  - Sternnamen, Werte und Szenenzitate.
  - Ritter „Platz halten“ 50 s.
  - Grube: Gegner mit doppeltem Leben und 1,6-fachem Schaden.
  - Erfahrung je Prüfungsschritt 80/110.
- [B] GUI: Prothesen-Werkbank, dann Kontor.
- [B] NPC-Rest: N4 Stimmungs-Idle, N1 Blasen vereinheitlichen. Offene Entscheidung: Symbolsatz.

## 03.10. nachmittags: Entscheidungen umgesetzt
- Alle 21 Entscheidungen aus dem Fragemenü sind gebaut: Tributdörfer und Arbeiterrat für die Freien, Asservatenkammer, Kopfgeld bei der Ortsmacht, Kriegsgraph, Schlacht- und Befreiungsruf, Ruf beim Geber, Seevolk-Ränge, 7 Bezugsquellen, legendäre Sets als Lohn für den höchsten Rang, Lieferungen bei der Zielstadt, Lager nur in der Siedlung, Wüstenbund und Zwerge, Varonheim als Hauptstadt, Siedlungsschmiede mit Esse, Schurke mit geliehenem Meuchelstich, Jagd, Schleichmodus, Boss-Beute; dazu das Titelbild. Selbsttest 472/472, Commit 4fe4abb.
- Die Einträge im folgenden Abschnitt sind damit überholt; sie bleiben nur zur Nachverfolgung stehen.
- [E] Neue Fraktionen:
  - Dünenwacht ist ein „Zelt der Wüstenräuber“ ohne Bewohner. Soll dort ein Posten mit Sandreitern stehen?
  - Ändert Karraks Tod den Ruf beim Wüstenbund?
  - Eigene Kerker für Karak-Atar und die Tiefhall?
  - Wie viele Aushänge sollen Dünenwacht und die Zwerge haben?
  - Rangvorteile der neuen Ränge?
- [E] Vorläufige Werte bestätigen:
  - Schlacht +5, Befreiung +10.
  - Asservaten-Buße.
  - Schleich-Sicht 55 % bzw. 30 %.
  - Jagd bis +60 % Beute, bis 40 % kürzere Tiersicht.

## Ist-Zustand 03.10. (docs/IST_ZUSTAND.md) — offen nach den Behebungen
- [E] A-01: Wem gehören die Tributdörfer (Grauwasser, Hohlstein, Eisenried) nach Vargs Fall? Valen oder frei?
- [E] A-03: Varonheim ist als Dorf markiert (keine Kutsche, Söldner, Schankpersonal). Eine Änderung in TOWN_PLAN kann die Welterzeugung verschieben; prüfen.
- [E] A-07: Ist die Waffe nach Kerkerausbruch bzw. Flucht aus der Schuldknechtschaft für immer weg (gewollt?).
- [E] A-09: Wem gehören Sonnwacht, Kreuzweg und Aschfurt nach Befreiung bzw. Eroberung im Kriegsgraph?
- [E] A-10: Verbrechen an Leuten ohne Fraktion geben überall Kopfgeld bei Valen.
- [E] A-11: Hilfe in Tributdörfern stärkt die Kette, nicht das Dorf.
- [E] A-26: Feldschlachten und Befreiungen geben keinen Ruf.
- [x] A-34: Karak-Atar, Dünenwacht und die Zwerge haben keine Fraktion und keine Aufträge. — behoben 03.10. (Wüstenbund, Zwerge der Tiefhall)
- [E] Aufträge ohne Fraktionsruf: Klassen-Reihen, Todesritter, Quirin, Lioba, Varons Auftrag 1.
- [E] Tickmar-Arbeiterrat gibt Ruf bei Aurelion (den Fabrikherren).
- [E] Seevolk-Ränge 2 und 4 sind unerreichbar.
- [E] Schurken-Prüfung: Regel „jeder Stich von hinten“ bestätigen.
- [E] D: 7 Gegenstände ohne Quelle: Sturmsense, Donnerwort, Lederstiefel, Talisman des Jägers, Splitter des Rotfalls, Blutstein, Arkaner Trank.
- [E] D: 4 legendäre Sets nur durch Mord an Konrad, Rook, Kelan und Oda.
- [E] D: Lieferaufträge geben Ruf immer bei der Händlergilde.
- [E] D: Das Lager ist von überall nutzbar (gewollt?).
- [B] D: Die Siedlungsschmiede verspricht „Waffen aus Eisen“, kann aber nur ausbessern.
- [B] D: Der Text beim Pferdetausch sagt „bleibt im Stall“, das alte Pferd ist aber weg.
- [B] C: Die Fertigkeit Jagd wirkt nicht; Schleichen wächst nie; es gibt keinen Schleichmodus.
- [B] C: Graumähne und Karrak haben keine Boss-Beute und kein Intro; Boss-Beute ist nicht garantiert.
- [B] Noch Gesprächslisten statt Fenster: Kontor, Schwarzmarkt, (Heiler + Zauber lernen: Fenster 03.10.) Seefahrt, Luftschiff, Investieren, Anschlagbrett, Rat, Passamt, Kerker.

## Vollständigkeits-Prüfung (03.10., visual/vollstaendigkeit.md)
- [x] Zauberlehrer fehlen: sp_regen, sp_shock und sp_staunch — geprüft 03.10.: Aldis lehrt staunch/regen, Corvinus shock; Kodex-Texte stimmen; Probe sichert es.
- [B] Fall Aurelions (ganzer Hoher Rat tot) löst kein Weltereignis aus (GATE §11).
- [B] Boss-Intros fehlen für Varg, Hrodvar, Garmadon, Gorak, Dodon und den Kerkerausbruch; das Regiebuch ist vorhanden.
- [B] Bossgespräche (Weißbart, Garmadon) sind reiner Text, ohne Story-Fenster und Gesten.
- [E] Seevolk-Ränge 2 und 4 sind dauerhaft „nicht erreichbar“.
- [B] Schleich-, Jagd- und Schmied-Fertigkeit zeigen im Charakterfenster Platzhalterwerte bzw. wirken nicht.
- [B] Noch reine Dialoglisten: Prothesen-Werkbank, Kontor, Schwarzmarkt, Zauber lernen, Hafen/Frachtschiff, Investieren, Schuldknechtschaft.
- [B] Koop-Handel im Dock (Adapter).
- (Punkt 1 der Prüfung, „Talentpunkte Koop/Erbe“, ist mit Klassen Scheibe 0 schon behoben; Agent war veraltet.)

## Ältere offene Punkte
- [E] Hunt-Bericht `hunt/BERICHT.md` HB-01…HB-47: der Entwickler wählt die Fixes. Am dringendsten:
  - HB-01: gespeicherter Tod bietet nach dem Laden keine Erbenwahl.
  - HB-02: performance.now-Zeitstempel überleben das Laden.
  - HB-03: Zeitsprünge überspringen Stunden-Haken.
  - HB-05: Abbrechen von q_undarmy löscht den Heer-Befehl.
- [erledigt, Lead 02.10. abends] Artist R11: alle 15 neuen Umhänge und Kapuzen jetzt erreichbar (Laden oder Beute) — siehe `docs/MECHANIKEN.md` „Wo es die neuen Umhänge gibt“. Teermantel/Kapitänsrock Sturmklinge (Kapitänsrock zusätzlich seltene Beute Weißbart), Wüstenburnus/Wüstenhaube Yusufs Basar, Doppelmantel Hagen (Kronschmiede), Kettenumhang seltene Beute Kettenknecht/Kettenmeister, Henkerskapuze seltene Beute Kettenknecht, Knochenumhang seltene Beute Untoter Krieger, Widderkapuze seltene Beute Kultist der Asche, Bärenfell/Rabenmantel seltene Beute Banditen (dort auch, sehr selten, Mantel des Rabenfürsten — legendär, bewusst kein Laden), Ordenskutte bei Sael (Vharnholm), Tiefe Kuttenkapuze im Standardbestand gewöhnlicher Händler, Pestkapuze in der Truhe von Moorbach (Geheimer Ort Glockenmoor). Selbsttest danach 404/404 grün (zwei andere, unabhängige Probes schwankten über zwei Läufe hinweg — Tagesrhythmus/Gegner-Ruf/Stil-F/Kutschen —, nicht reproduzierbar mit denselben Änderungen, vermutlich zeit- statt seedabhängig; nicht angefasst).
- [B] RB-059 Bedrohungs-Tuning: Bedrohung fällt zu früh. Neu messen mit voller Tageskette; der Designer-Lauf scheiterte am Limit.
- [B] Geheime Orte Rest: Uhrmacher, Leuchtfeuer, Walknocheninsel.
- [E] Belagerung S3b–d: zwei Fragen offen.
- [E] Aurelion-Bionik im Krieg: braucht Design.
- [P] Verifier über alles seit 01.10. (Dialoge, Feedback, Items, Kampfanimation, Gegner, Menüs) → erst dann [VERIFIED].

## Erledigt heute (nur Merkliste)
- Dialoge (Story-Fenster, Emotes …), Rückfrage beim Verkauf ab Selten, Stil bleibt R, Cache v24, main live (d7199bb), Gegenstrom gegen schwere Angriffe, Ersatz-Lebensbalken.
- Parade: gibt es seit S14. Deckung (Umschalt) in den ersten 180 ms vor dem Treffer heben → „Parade!“, der Angreifer taumelt, kein Schaden. Buckler +60 % Fenster, Turmschild kaum Parade.

## 03.10. Wanderautomaten + Wüstenbund/Zwerge (51ed0d7) — vorläufig, bestätigen
- Wanderautomaten: Häufigkeit (Gewicht 1 unter den Reisenden), 2 von 5 anwerbbar, kostenlos.
- Wüstenbund: Eskorten +25 % ab Karawanenwächter; kein Wegzoll schon ab Rang 0.
- Kerker Karak-Atar/Tiefhall nutzen die gemeinsame Kerkerkarte (eigener Wärter/Name/Entlassort) — eigene Karte gewünscht?

## 03.10. Fraktions-Starts + Rassen (Agent, PROPOSALS/fraktions_starts.md) — 14 vorläufige Entscheidungen, bestätigen
- Rang ab Start = unterster Rang + Ruf 20; Aurelion Bürgerrecht. Zwerge starten an der Tiefhall (Weg durch Hrodvars Halle, Skelette Stufe 8).
- Rasse je Start fest; Mensch ohne Boni; Rassenwerte vorläufig. Haus = Siedlung mit fertiger Hütte (Alternative: Zelt).
- Anwerben ab Ruf 40 ohne Rangrabatt. Skelett: Wache verhaftet statt angreifen; Kapuze verbirgt; heilt wie Lebende. Goblin/Zwerg ohne Stadt-Reaktion.
- Offen: Kinder eines Skeletts; Koop-Gäste immer Mensch; Roboter-Gefährten essen weiter.
- [x] Zwerge klein und breit (03.10., Entwickler).
