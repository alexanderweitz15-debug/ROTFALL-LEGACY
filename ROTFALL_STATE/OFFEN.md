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
