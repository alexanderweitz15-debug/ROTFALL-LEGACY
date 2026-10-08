# Weltereignisse — Bestand, Ideen, Quest-Lücken (Auftrag S13b, Schlussteil)

Stand: 2026-09-28. Nutzerauftrag (MASTER_PROMPT §9): Das bestehende Welt-Event-System untersuchen und neue Event-Ideen sammeln (Was, Wo, Wer, Reaktion, Folgen). Markieren, was direkt umsetzbar ist und wofür Systeme fehlen. Nicht blind implementieren. Dazu der Nutzerauftrag zu Quests: „guck dir die aktuellen Quests an … und sag, was dir fehlt“.

## 1. Was es heute gibt

| System | Takt | Ort | Was passiert | Sichtbar? | Folgen |
|---|---|---|---|---|---|
| `worldEvent` / `EVENTS` | 10 % je Stunde | fest (Eren, Alte Straße) | 7 kurze Meldungen: Karawane überfallen, Untote gesichtet, Flüchtlinge, Truppen, Erzader, Wegzoll, Ruf-Gerücht | meist nur Log (2 spawnen Gegner außerhalb des Bildes) | Preise ±, Ruf ± |
| `factionAgenda` (neu S13b) | täglich, eine Macht | Städte der Macht | Aushebung, Kopfgeld, Streife, Paladine, Speicher, Geleitschutz, Zölle | Streifen, Aushänge, Preise | Chronik → Gerüchte |
| Krieg (`sim.js` `warTick`/`warDay`) | alle 6 Std / täglich | Kriegsgraph | Heere ziehen, Schlachten, Eroberung, Vorwarnung durch Späher | Heere marschieren sichtbar, Schlacht vor Ort | Städte besetzt, Preise, Flüchtlinge |
| `raidDay` / Untotenraids | täglich | Dörfer | Überfälle mit Rollenmischung | ja | Schaden, Tote, Wohlstand − |
| `tributeDay` / `campaignDay` | alle 5 bzw. 10–15 Tage | Tributdörfer, Totenland | Tribut, Karawane, Aufstand, Feldzug | ja | Hunger, Ruf, Strafaktion |
| `refugeeWave` / `refugeeLaw` | nach Vargs Fall | West → Aurelion | Flüchtlinge ziehen, Ratsgesetz entscheidet | ja | Zeltlager, Neubürger |
| `undeadFallDay` | nach Garmadons Fall | Totenland | eine Stadt je Tag frei, Heimkehrer | ja | Weltkarte ändert sich |
| `growthDay` | täglich | Städte | Wohlstand, neue Häuser, Verfall | ja | Bewohner |
| `migrationDay`, Reisende | täglich / stündlich | Straßen | Wegzug, Zuzug, Reisende, Boten, Pilger | ja | Einwohnerzahl |
| `faithDay`, `pilgrimTick` | täglich / stündlich | West, Altar | Glaubensereignisse, Pilger | teils | Ruf, Omega-Spur |
| `aurelParade`, Rat | Stunde / 7 Tage | Aurelheim, Himmelsinsel | Parade, Ratssitzung mit Beschluss | ja (Kamerafahrt) | Gesetze |
| Feste (`festNow`) | Kalender | Dörfer | Feuer, Tanz, Festgespräche | ja | Stimmung |
| Ambient-Szenen (neu S13b) | 45–90 s in der Stadt | Stadt des Helden | Streit, Übung, Predigt, Betrunkener, Bote | ja | keine (Stimmung) |
| Begegnungen (neu S13b) | unterwegs | Wildnis | Verwundeter, Wegzoll, Hungernde, Deserteur, Falle, Rächer | ja | Ruf, Moral, Chronik |
| Große Kamerafahrten | einmalig | Weltereignisse | Vargs Fall, Fall der Untoten, Omega, Ende der Brüder, Eiserne Legion | ja | dauerhaft |

**Befund:**
- Das Rückgrat ist gut: Krieg, Tribut, Flüchtlinge, Wachstum und die Mächte wirken wirklich auf die Welt.
- Schwach ist nur noch `EVENTS`. Die Meldungen sind fest verdrahtet, meist unsichtbar, und ihr Ort passt oft nicht zur Lage (Karawane „auf der Alten Straße“, auch wenn gar keine fährt). Mehrere davon werden jetzt von `factionAgenda` und den echten Karawanen besser erledigt.

## 2. Neue Ideen

Spalte „Umsetzbar“: **direkt** heißt, die nötigen Systeme gibt es schon. **fehlt: …** nennt das fehlende System.

| # | Was | Wo | Wer | Reaktion der Welt | Folgen | Umsetzbar |
|---|---|---|---|---|---|---|
| 1 | Seuche bricht aus | Stadt mit Hunger oder nach Untotenraid | Bewohner, Heilerin | Kranke husten (Sprechblasen), Heilerin überlastet, Wachen sperren das Tor | Einwohner −, Kräuterpreise +, Auftrag „Kräuter“ gehäuft | direkt (Hunger, Aufträge, Bewohner vorhanden); Zustand „krank“ für Bewohner fehlt als Anzeige |
| 2 | Hochzeit zweier Bewohner | Dorf, Freundespaar (`rel.friend`) | zwei Bewohner, Dorf | Fest am Platz (Fest-Logik), Gäste reden darüber | Beziehung, Moral des Dorfs, ein Haus wird bezogen | direkt |
| 3 | Brand in der Stadt | Stadt, Schmiede oder Bäckerei | Bewohner, Wachen | Löschkette zum Brunnen, Rauch, Hilferufe | Haus beschädigt (`wear`), Wohlstand − | fehlt: Feuer-Effekt am Haus und eine Löschkette als Laufweg |
| 4 | Duell zweier Rivalen | Platz | Rivalen (`rel.rival`) | Zuschauer bilden Kreis | ein Verletzter, Gerücht | direkt (`duel` vorhanden) |
| 5 | Steuereintreiber kommt | Valen-Dörfer | Beamter plus 2 Wachen | Klagen, vielleicht Aufstand (Brawl-Logik) | Preise, Ruf Valen | direkt (wie Tributzug der Kette) |
| 6 | Wanderzirkus / Spielleute | größere Städte | Spielleute, Händler | Menschenmenge am Platz, Musik | Moral +, fahrender Händler | direkt |
| 7 | Deserteure bilden eine Bande | nach verlorener Schlacht | Valen-Soldaten | neues Banditenlager auf der Karte | Kopfgeld-Aushang | direkt (Krieg und Aufträge vorhanden) |
| 8 | Missernte | Bauerndörfer, Herbst | Bauern | Klagen, Wegzug | Getreidepreis +, Hunger | direkt (`economy.js`) |
| 9 | Geist im Brunnen / Spuk | Dorf nahe Totenland | Bewohner | Angst, niemand holt nachts Wasser | Auftrag „Spuk bannen“ | fehlt: Auftragsart „Ort säubern“ mit Ereignisziel |
| 10 | Magitech-Unfall | Tickmar, Fabrik | Arbeiter, Automaten | Explosion, Automaten laufen Amok | Fabrik steht still, Magitech teurer | fehlt: „Amok“-Zustand für Automaten |
| 11 | Pilgerzug wird überfallen | Straße zum Altar | Pilger, Räuber | Hilferufe, Begegnung mit Entscheidung | Ruf Orden/Omega | direkt (Pilger und Begegnungen vorhanden) |
| 12 | Erbfolgestreit im Adel | Aurelheim | Adelshäuser | Intrigen-Aufträge, Rat stimmt ab | Ratsmehrheit ändert sich | teils: Häuser und Rat vorhanden; Hausmacht als Zahl fehlt |
| 13 | Wolfswinter | Norden, Winter | Wölfe, Jäger | Rudel an den Weiden | Jagdaufträge gehäuft | fehlt: Jahreszeiten mit Wirkung (nur Name) |
| 14 | Flüchtige Sklaven aus der Eisenfeste | West | Entlaufene | Begegnung: verstecken oder ausliefern | Ruf Kette/Goblins | direkt (`startRunaway` vorhanden) |
| 15 | Meteorsplitter (Omega-Spur) | zufälliger Ort | niemand | Leuchten am Himmel, Glaube redet | Bruchstück der Spur | direkt |

**Stand:** Umgesetzt sind 2, 4, 5, 6, 7, 8 und 11 (`evTaxman`, `evDeserters`, `evFailedHarvest`, `evPilgrimRaid`, `ambWedding`, `ambDuel`, `ambMinstrels`).

**Empfehlung (Reihenfolge):**
1. `EVENTS` durch echte Ereignisse ersetzen: 5, 7, 8, 11, 14 — alles mit vorhandenen Systemen.
2. Danach 2, 4 und 6, die die Städte beleben.
3. Zuletzt 3, 9, 10 und 13; dafür braucht es jeweils ein kleines neues System.

## 3. Quests: Bestand und was fehlt

**Bestand:**
- 30 Story-Quests (`QUESTS`).
- Aufträge in 10 Arten (Kopfgeld, Monster, Jagd, Verteidigung, Patrouille, Eskorte, Lieferung, Vermisst, Vorräte, Kräuter).
- Seit S13b geheime Wendungen und eine Rache-Kette.
- Geber nach Beruf, Anschlagbrett, Verteidigungsmeister, Tributoffizier.

**Umgesetzt aus dem Nutzerauftrag:**
- Obergrenze, Fristen, Abbruch, Tod von Geber oder Eskortiertem, Vertrauen des Ortes.
- Kompass zum Ziel.
- Lösung per Kampf oder Gnade (Kapitulation).
- Retten aus Gefahr (gefangener Vermisster).
- Folgequest (Rache des Bruders).
- Konsequenz später (der verschonte Bandit raubt wieder oder wird Bauer).

**Was fehlt:**
- ~~**Spuren statt Ziel**~~ — umgesetzt (Auftragsart `trail`). („Ziel schon tot → Spuren“): Eine Auftragsart, bei der man Hinweise an zwei, drei Orten findet, bevor das Ziel erscheint. Dafür fehlt ein Such-Ziel (Spur-Objekt mit Text) im Auftragssystem.
- ~~**Karawane überfallen → Überlebende**~~ — umgesetzt (`caravanSurvivors`). Ein echter Überfall (`sim.js`) sollte einen Auftrag „Überlebende finden“ erzeugen. Beide Teile gibt es, die Verbindung fehlt.
- ~~**Mehrere Ziele in einem Auftrag**~~ — umgesetzt (Auftragsart `camps`). (z. B. drei Lager): Heute hat jeder Auftrag genau einen Ort.
- ~~**Ignorierte Aufträge mit Folgen**~~ — umgesetzt (`ignoredContract`). Früher geschah nichts, wenn ein Angebot ungenutzt ablief. Vorschlag: Ein verfallener Kopfgeldauftrag erhöht die Gefahr der Gegend, ein verfallener Vorratsauftrag senkt den Wohlstand.
- **Aufträge nach Fraktion und Weltlage:** Aushänge richten sich schon nach Beruf, Macht (`factionAgenda`) und Gegend. Der Krieg selbst (besetzte Nachbarstadt) erzeugt aber noch keine eigenen Aufträge („Vorräte in die belagerte Stadt schmuggeln“).
- **Questketten mit Handelskontakt am Ende** (vermisster Händler → Spuren → Lager → Befreiung → Handelskontakt): Die Bausteine gibt es, aber keine Kette, die alle verbindet. Das braucht das Spur-Ziel von oben.
- ~~**Geber-Rollen ohne eigene Aufträge**~~ — umgesetzt (Adel, Richterin, Legion, Werkmeister). Adlige, Gelehrte in Aurelion und Kommandanten der Sonnenlegion geben noch keine eigenen Aufträge.
