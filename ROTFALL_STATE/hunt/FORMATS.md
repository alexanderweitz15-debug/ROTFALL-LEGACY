# Hunt 1 — gemeinsame Regeln und Formate (vom Entwickler, Auszug wörtlich übertragen)

## Was ist ein Bug
Ein Bug widerspricht dem, was Code, Entwurfsdokumente (docs/, ROTFALL_STATE/PROPOSALS, DECISIONS.md) oder der Entwickler klar wollen: Absturz, kaputter Spielstand, festhängender Zustand, falsche Rechnung, etwas passiert nicht, was passieren soll.
KEIN Bug (gehört nicht in die Bugliste):
- Funktioniert wie programmiert, verbindet sich aber nicht mit anderen Systemen, passt nicht zur Welt oder gibt keine Entscheidung → Fit-Befund.
- Balance → Fit-Befund, nur mit konkretem Grund (z. B. eine Option ist immer besser).
- Stil, Namen, Refactoring, neue Ideen → höchstens eine Zeile unter „Beobachtungen“.
Entscheidungen in DECISIONS.md sind gesetzt — kein Bug/Fit-Befund, außer der Code tut etwas anderes als entschieden.

## Weltregeln (Maßstab für Fit)
- Dark Fantasy. Technik existiert im Ton und macht das Spiel nicht zu generischer Sci-Fi.
- Systeme füttern sich: NPC-Entscheidung → Fraktionsfolge → Wirtschaftsfolge → Weltereignis → Begegnung → Kampf und Verletzung → Ausrüstungs-/Prothesenentscheidung → Ruffolge → neue Chance oder neues Problem.
- NPCs haben Ziele, Mittel, Beziehungen, Ängste und handeln ohne den Spieler. Die Welt entwickelt sich weiter, wenn der Spieler woanders ist.
- Fraktionen unterscheiden sich in Zielen, Wirtschaft, Technik, Kultur und Schwächen.
- Die große Südnation steht für Adel und Roboter. Aurelion und seine Händler sind die Quelle von Prothesen, Bionik und Mechanik.
- Kybernetik ist ein Tausch, nie einfach besser: Wartung, Heilungsbedarf, Verträglichkeit, soziale Folgen.
- Verletzungen zählen, Luftschiffe zählen, Kampf besteht aus Entscheidungen.
- Ein Feature, das nur Inhalt ohne neue Entscheidungen oder Wechselwirkungen bringt, lohnt sich meist nicht.

## Formate
### Kandidat (was Sucher liefern)
- Titel · Ort (Datei:Zeile) · Was passiert · Was passieren sollte und woher die Erwartung kommt · Auslöser (Zustand/Eingabe) · Beleg (gelesener Code oder beobachtete Ausgabe) · Sicherheit hoch/mittel/niedrig mit Grund · Vorschlag zur Reproduktion

### Fit-Befund
- Titel · Feature/Systeme mit Dateiorten · Typ: Insel, Einbahn-Verbindung, Widerspruch, gerissene Kette, Überschneidung, für den Spieler unsichtbar, kein Feedback, keine echte Entscheidung, passt nicht zur Welt, überflüssig · Was der Code heute tut · Warum ein Problem (Weltregel oder konkrete Spielersituation) · Optionen für den Entwickler (inkl. so lassen) · Gewicht hoch/mittel/niedrig

### Quest-Blatt (eins je Questreihe)
- Name, Auftraggeber, Fraktion · Schritte, Verzweigungen, Enden heute · Testergebnis (welche Pfade durchgespielt, welche brachen, welche nicht testbar) · Sandbox-Fälle: Verhalten je Fall oder „nicht behandelt“ · Was der Spieler tatsächlich tut (ein Satz) · Andere Questreihen mit derselben Kernaufgabe · Vorgeschlagene eigene Kernaufgabe · Heute sichtbar / heute nur Text · Vorgeschlagene visuelle Identität: Emblem und Farbe, erkennbarer Auftraggeber und Orte, Signaturszene (Shotlist: Kamera, Bewegung, Timing, Effekte), Spur in der Welt · Aufwand und Abhängigkeiten

### Schwere
1 Kritisch: Absturz, kaputter/verlorener Spielstand, Datenverlust · 2 Hoch: Spieler steckt fest, Fortschritt blockiert, System fällt für den Rest der Sitzung aus · 3 Mittel: falsche Spiellogik, bemerkbar oder ausnutzbar · 4 Niedrig: optische Fehler ohne Spielwirkung

## Regeln für alle
- Lesen vor Behaupten: jede Aussage über Code stammt aus Code, der in diesem Lauf geöffnet wurde.
- Sagen, was nicht geprüft wurde. Nichts als abgedeckt melden, was nur überflogen wurde.
- Keine Fixes, kein Aufräumen: Spielcode bleibt unberührt (src/, index.html).
- Bekannte Bugs (ROTFALL_STATE/BUGS.md) nicht erneut melden, außer mit neuer Information (Ursache, zweiter Auslöser).
- Bugs und Fit-Befunde getrennt halten. Fit-Befund nennt immer die Regel oder Spielersituation.
- Im Auftrag bleiben; führt eine Spur hinaus, nur so weit folgen, wie nötig, um den Kandidaten zu beschreiben, und sagen, wohin sie führte.
- Quest-Inhalte gehören dem Quest-Agenten; Hunter geben Quest-Funde nur als Hinweis weiter.
