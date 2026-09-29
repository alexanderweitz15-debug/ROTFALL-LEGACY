# Mechanik-Check (Session 14)

Geprüft: jedes Paar, das sich berührt, auf **W** Widerspruch · **L** Lücke · **E** Exploit (dazu **F** echter Code-Fehler).
Methode: Regeln aus GDD/WELTREGELN gegen den Code gelesen, kritische Paare als Selbsttest ausgeführt
(`Mechanik-Check S14: …`, 4 neue Tests). ✓ = geprüft, passt.

## Matrizen

**1 Kampf** — Ausdauer · Deckung/Parade · Rolle · Anti-Kiting · Balancing · Reiten

| | Deckung | Rolle | Anti-Kiting | Balancing | Reiten |
|---|---|---|---|---|---|
| Ausdauer | ✓ Deckung braucht > 1, bricht leer (Test) | ✓ 20 × (1,2 − Ausd. · 0,02) | ✓ nur Angriffe kosten Gegner Ausdauer | ✓ Gegner 1,2 × Spielermax. | ✓ |
| Deckung | — | ✓ Rolle beendet Deckung | ✓ 45 % Tempo, kein Hieb | **E1**, **W2** | ✓ |
| Rolle | | — | ✓ ≈ 1 Rolle je 4 s im Dauerkampf | ✓ i-Frames 240 ms < Ansagen 700–1100 ms | ✓ |
| Anti-Kiting | | | — | ✓ §82-Messung | **E3** |

**2 Titel** — Titelklassen (max. 2) · Skill-Baum · Makel · Fraktionsreaktion · Umkehrbarkeit

| | Skill-Baum | Makel | Fraktion | Umkehrbar |
|---|---|---|---|---|
| Titel | ✓ Zweige beider offen, Legion-Abzug nur getragen | ✓ Makel des getragenen Titels | ✓ Folgen hängen am Pakt, nicht am getragenen Titel (Test) | **W4** (Doku) |
| Skill-Baum | — | ✓ | ✓ | **W5** (Doku) |
| Fraktion | | ✓ | — | **L6** |

**3 Welt** — Raids · Karawanen · Gerüchte · Wirtschaft · Gebäudeverfall · Feste

| | Karawanen | Gerüchte | Wirtschaft | Verfall | Feste |
|---|---|---|---|---|---|
| Raids | ✓ Risiko steigt am Ziel | ✓ Chronik ≤ 5 Tage | ✓ besetzt/zerstört: keine Ware, Wohlstand − | ✓ 3 Häuser, 1 je Tag zurück | **L8** |
| Verfall | ✓ | ✓ | ✓ Wachstum pausiert | **F7** | ✓ |

**4 Gefahr** — Gefahrenstufen · Skalierung · Loot · Spawnregeln · Bosse mit Weltfolgen

| | Skalierung | Loot | Spawn | Bosse |
|---|---|---|---|---|
| Gefahr | **W9** (Doku) | ✓ Veteran +1 Beute | ✓ Nachschub > 620 px | ✓ |
| Spawn | ✓ | ✓ | — | **F10** |
| Bosse | ✓ | ✓ eigene Beute | ✓ Deckel −30 % | — |

**5 Übergänge** — Szenenwechsel · Verfolgung · Gewölbe · Diener/Begleiter/Tiere: ✓ Folgen nach Laufzeit (max. 4), Tiere
lauern, Diener und Tierbegleiter gehen mit, Reittier bleibt draußen (abstrakt). Verfolgung × Regionalbosse: **L11**.

**6 Alltag** — Tagesablauf · Dichte · Pathfinding · Beziehungen · Sprechblasen: ✓ reservierte Plätze, Versetzen > 900 px,
Rivalen weichen < 70 px aus (nie Hausgenossen), Lästern nicht beim Fest, Besatzung = alle im Haus. Sprechblasen: **W12**.

**7 Aufträge** — Quests · Questtafel · Ruf · Befreiungsorte: ✓ Abbruch −3, Scheitern −6, toter Geber = hinfällig,
Schmuggel in besetzte Städte, Paket nimmt jeder Bewohner. Tafel × Besatzung/Ruf: **L13**.

**8 Leistung** — Budget · NPC-Zahl · Sprite-Cache · Feste: gemessen in Teil B (Figuren neu, Cache, BUG-093).

## Funde und Lösung

| # | Paar | Art | Befund | Lösung (Code + Test) |
|---|---|---|---|---|
| E1 | Deckung × Balancing | E | Deckung im Takt (180 ms halten, kurz los) hielt das Paradefenster ~90 % offen — Parade ohne Timing. | Neue Deckung innerhalb 0,4 s öffnet keine Parade (`GUARD.rearm`). |
| W2 | Deckung × Bosse | W | GDD: „Flächenangriffe blockbar“ — Hrodvars Eiskreis, Goraks Beben, Koloss, Omega mit Schild auf 15 % gedrückt; Bossdesign sagt „heraustreten oder rollen“. | Flächenangriffe (Ringe, Einschläge, Strahl) laufen über `areaHit`: keine Deckung, kein Schild, keine Nahkampfabwehr. Geschosse bleiben blockbar. |
| E3 | Reiten × Anti-Kiting | E | Rückwärtsreiten 2,9–3,3 px/Bild > Nachsetzen 2,0: mit Bogen endlos kitebar. | Beritten rückwärts im Kampf 40 % statt 70 % (`backMul`). |
| W4 | Titel × Umkehrbarkeit | W (Doku) | GDD S4 „höchstens eine Titelklasse“ vs. S5 „zwei, eine getragen“. | GDD vereinheitlicht: zwei erwerbbar, eine getragen, Pakte unumkehrbar. |
| W5 | Skill-Baum × Umkehrbarkeit | W (Doku) | GDD „kein Zurücksetzen“ vs. Umlernen beim Lehrer. | GDD: Umlernen gegen Gold beim Lehrer; Titel und Preise bleiben. |
| L6 | Fraktion × Ränge | L | Beitritt ohne Ausschluss: Rang bei Orden und Untoten, Kette und Goblins, Valen und Untoten zugleich; Mönch bei den Toten. | `JOIN_FOES`: Erzfeinde schließen den Beitritt aus; bestehende Ränge bleiben (kein Eingriff in den Stand). |
| F7 | Verfall × Wiederaufbau | F | Rückkehr in ein Dorf (Angsthase) hob die Endgültigkeit der Schäden **aller** Dörfer auf. | Nur Häuser des eigenen Dorfs. |
| L8 | Raid × Fest | L | Fest wurde aufgebaut und angesagt in besetzten und zerstörten Orten und trotz gemeldetem Überfall. | `festDay`/`festNow` prüfen Besatzung, Zerstörung, Überfall. |
| W9 | Gefahr × Skalierung | W (Doku) | GDD „alle Gegner statisch“ vs. `zoneLevel` (Spielerstufe ± 2 innerhalb der Gebietsspanne). | GDD auf Ist-Stand. |
| F10 | Spawn × Bosse | F | BUG-139: Karraks Machtvakuum (`from`/`to`) stand im Zeilenkommentar — wirkte nie. | Aus dem Kommentar geholt; `scan2.py` sucht solche Fälle jetzt auch in Objekt-Literalen. |
| L11 | Verfolgung × Regionalbosse | L | Nur Bosse der Monstertabelle hielten ihr Revier; Karrak folgte durch Türen, Graumähne lauerte am Eingang. | `m.boss || e.boss`. |
| W12 | Sprechblasen × Tagesablauf | W | GDD „1–2 sichtbar“, Code 4; Blasen unter Dächern belegten Plätze und verdrängten sichtbare. | Regel: höchstens 4, die nächsten sichtbaren; Filter vor der Auswahl. |
| L13 | Questtafel × Ruf/Befreiungsorte | L | Das Brett bot in besetzten/zerstörten Orten Aufträge an, dazu Verhassten und Paktgebundenen am Ordensbrett. | `boardShut`: Brett folgt Besatzung und Ruf wie die Geber. |
| W14 | Stil × Regeln | W (Doku) | WELTREGELN §0.6 „Hauptstil Referenz 5“ vs. Nutzerentscheid „klassisch“. | WELTREGELN korrigiert. |

Summe: 6 Widersprüche (davon 4 nur Doku), 4 Lücken, 2 Exploits, 2 Code-Fehler — alle behoben, Tests grün.

## Offene Designfragen (für den Nutzer)

1. **Schwarze Feste (BUG-100):** eigene Arena (Thronsaal wie Garmadons Gruft), Befreiung erst, wenn ihr Heer im Feld
   geschlagen ist? — *Empfehlung: ja.*
2. **Organische Stadtanordnung (§75):** bestehende Stadtpläne umbauen oder nur neue/gewachsene Häuser versetzt setzen?
   — *Empfehlung: nur neue; bestehende Pläne sind getestet und stecken in alten Spielständen.*
3. **Ränge bei Erzfeinden im Bestand:** Wer heute schon bei beiden Seiten einen Rang hat, behält ihn. Soll er beim
   nächsten Aufstieg einer Seite den anderen verlieren? — *Empfehlung: ja, mit Meldung.*
4. **Karraks Wüste nach Vargs Fall:** In die leeren Lager ziehen dann freie Goblins — friedlich (heute so) oder bleiben es
   Banditenlager? — *Empfehlung: friedliche Goblin-Lager, passt zur Befreiung.*
