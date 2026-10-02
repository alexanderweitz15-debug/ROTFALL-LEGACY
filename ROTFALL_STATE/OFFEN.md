# OFFEN — alles, was Agenten geliefert und der Lead noch nicht erledigt hat (Stand 02.10.2026, 16:40)

Vom Lead gepflegt. Ein Punkt verschwindet erst, wenn er gebaut, geprüft und committet ist oder der Entwickler ihn streicht.
Legende: **[E]** = Entscheidung des Entwicklers nötig · **[B]** = bauen (entschieden) · **[P]** = prüfen/messen.

## Kampf-Feedback (Agent fertig)
- [B] Koop: Gäste sehen keine Bodenmarke und kein Warnzeichen schwerer Angriffe (Feld `special` wird nicht übertragen).
- [B] Koop: Schadenszahlen ohne „eigener Schaden“-Merkmal; bei „Reduziert“ sehen Gäste nur Krits.
- [E] Haltung und Humpeln verwundeter Gegner, Status als Haltung, Eisrand im Koop. Das braucht neue Posen bzw. eine neue Tempo-Regel.
- [E] Lebensbalken des zuletzt getroffenen Gegners: 5 s (Zahl vom Lead gesetzt, nicht bestätigt).

## Items, Inventar, Läden (Agent fertig)
- [B] Aufnahme-Stapel und große Fund-Karte für Legendär/Mythisch; liegt beim UI-Agenten (Meldungsfluss).
- [B] Auslage seltener Ware, Schwarzmarkt als Raster.
- [E] Händlergesicht nach Ruf/Angst.
- [B] Koop-Gast handelt noch per Dialog, nicht im Dock.
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
- [E] Artist R11: 15 neue Umhänge und Kapuzen sind noch nicht in Läden oder Beute (Vorschlagsliste des Artists: Teermantel bei Hafenhändlern, Doppelmantel bei Hagen, Burnus/Wüstenhaube im Karak-Basar, …).
- [B] RB-059 Bedrohungs-Tuning: Bedrohung fällt zu früh. Neu messen mit voller Tageskette; der Designer-Lauf scheiterte am Limit.
- [B] Geheime Orte Rest: Uhrmacher, Leuchtfeuer, Walknocheninsel.
- [E] Belagerung S3b–d: zwei Fragen offen.
- [E] Aurelion-Bionik im Krieg: braucht Design.
- [P] Verifier über alles seit 01.10. (Dialoge, Feedback, Items, Kampfanimation, Gegner, Menüs) → erst dann [VERIFIED].

## Erledigt heute (nur Merkliste)
- Dialoge (Story-Fenster, Emotes …), Rückfrage beim Verkauf ab Selten, Stil bleibt R, Cache v24, main live (d7199bb), Gegenstrom gegen schwere Angriffe, Ersatz-Lebensbalken.
- Parade: gibt es seit S14. Deckung (Umschalt) in den ersten 180 ms vor dem Treffer heben → „Parade!“, der Angreifer taumelt, kein Schaden. Buckler +60 % Fenster, Turmschild kaum Parade.
