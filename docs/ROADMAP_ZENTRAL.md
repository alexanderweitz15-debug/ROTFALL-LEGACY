# ROTFALL: LEGACY — Zentrale Roadmap (detaillierte Fassung)

Basis: Roadmap v24 (Stand 08.10.2026) + Spec „World, Tutorial, NPC & Content Overhaul" (Spec Welt, §1–55) + Spec „Progression, Skills & Grind Overhaul" (Spec Skills, §1–61).

**Zweck dieser Fassung:** Die Roadmap v24 ist als Liste knapp. Hier steht pro Punkt wieder: Ziel (aus der Spec), heutiger Stand (aus v24), konkret Offenes, Abnahmekriterien/Tests und Abhängigkeiten. Nichts davon ersetzt `docs/REGELN_UND_SPECS.md`, sondern macht die Pakete baubar, ohne dass man in die Spec zurückspringen muss.

**Wichtiger Hinweis zum Stand:** Alle Statusangaben stammen aus der Roadmap v24. Ich hatte beim Erstellen keinen Zugriff auf das Repository. Vor dem Bau eines Pakets muss der Ist-Stand im Code gegengeprüft werden (Spec Welt §2: „Keine zweite parallele Implementierung eines vorhandenen Systems").

Legende: ☐ offen · ◐ teilweise · ✔ erledigt · 🔶 braucht Entscheidung · ⛓ Abhängigkeit

---

## 0. Leitprinzipien (gelten für jedes Paket)

1. **Qualität und Glaubwürdigkeit vor Quantität.** Welt nicht mit mehr NPCs/Gebäuden/Systemen überladen.
2. **Welt → Situation → Interesse → Quest**, nicht Quest → Welt. Eine Stadt muss auch ohne Questmarker beobachtbar interessant sein.
3. **Erst Ist-Zustand, dann Bau.** Bestehende Systeme, Events, Komponenten und Datenstrukturen erweitern. Keine Doppel-Implementierung.
4. **Kleine Pakete, nach jedem Paket testen, am Ende voller Regressionstest.** Nicht alles gleichzeitig.
5. **Art Direction bleibt.** Keine Neuentwicklung, keine unnötige Entfernung funktionierender Systeme.
6. **Nicht oberflächlich abhaken (Spec §53):**
   - Schmiede ≠ ein Amboss-Sprite. Sie braucht Ofen, Schmied mit Animation, Waffen, Rüstungen, Rohstoffe, Kunden, Mitarbeiter, Verkaufsbereich, Interaktion.
   - Familie ≠ gleicher Nachname. Sie braucht Beziehungen, gemeinsames Haus, passende Kapazität, Tagesabläufe, sichtbare Interaktion, Save-State.
   - „Mehr Gegner" ≠ Werte hochdrehen. Neue Gegner brauchen eigene visuelle Identität, Ausrüstung, Rolle, teils Animation und Verhalten.
   - Tutorial ≠ Fenster mit zehn Texten. Der Spieler erlebt die Mechanik.
7. **Definition of Done (Spec §52), pro Punkt:**
   - Ist-Stand analysiert, vorhandene Systeme wiederverwendet, keine Dopplung
   - UI vorhanden, falls relevant
   - Save/Load geprüft (neue `performance.now()`-Felder in `PERF_KEYS`, neue Look-Felder in `HS_ENT`/`HS_PAL`)
   - Edge Cases und Performance geprüft
   - Regressionstests gelaufen, mindestens ein unabhängiger Testlauf
   - Debug-Möglichkeit, wo sinnvoll
   - keine `undefined`/`NaN`/kaputten State-Referenzen

---

## 1. Reihenfolge und Abhängigkeiten

```
Tutorial
  ↓
Quest/UI-Grundlagen
  ↓
NPC-/Gebäude-Logik
  ↓
Stadt-/Familienstruktur
  ↓
Betriebe
  ↓
Gegner-/Quest-Content
  ↓
Skills/Progression (eigene Spec, Phasen 1–7)
  ↓
Scaling/Performance
  ↓
Gesamt-QA
```

Zentrale Abhängigkeiten:

| Paket | hängt ab von | Grund |
|---|---|---|
| Tutorial-Schmiede-Moment (P0.1) | P2.14 Schmiede sichtbar | Schmied muss arbeiten und beobachtbar sein |
| Kunden betreten Läden (P2.16) | P0.6 Eingangslogik | NPCs müssen die echte Tür nutzen |
| Familien (P1.10) | P1.9 Haus↔NPC, P1.11 Wohnraum | Haushalt braucht Kapazität im Haus |
| Familien-Tagesabläufe | P1.13 Bewegungsströme | Haus→Arbeit→Markt→Taverne |
| Marktplätze skalieren (P1.12) | P1.8 Rollenverteilung, P4.28 Simulation nach Nähe | Dichte nur messbar mit Rollen |
| Prinzip auf alle Betriebe (P2.18) | P2.14 | Schmiede ist das Muster |
| Spieler arbeitet im Betrieb (P2.19) | P2.14–17, Skills-Phase 4 | Handwerk/Qualität skillbasiert |
| Rollen-Gegner (P3.20–23) | Look-Seeds/ENEMY_VARIANTS vorhanden | Rollen mit eigenem Verhalten fehlen |
| Gegner-Pools nach Rolle | P3.20–23 | Aufträge mischen nach Rolle (§12) |
| Quest-Variation (P3.25–26) | P0.4 Quest-GUI | GUI muss neue Zieltypen darstellen |
| Skills-Phase 2 Katana | E38 | Katana existiert nicht als Waffenart |
| Skills-Phase 5–6 | E39 | Verhältnis Sternbild-Talente ↔ Skill-Spezialisierung |
| Scaling-Audit (P4.27) | Gegnerrollen, Skills | Rollenmix statt LP-Zahlen |
| Alte APPROVED-Pakete (T11/12/15/17/20/23, Belagerung S3b–d) | E37 | Entscheidet, welche vor den Spec-Punkten laufen |

---

## 2. SPEC WELT — Pakete im Detail

### P0 — Spielerlebnis

#### P0.1 Spielbares Tutorial (◐ — Prolog ✔)

**Ziel (§6–9):** Der Spieler wird an die Hand genommen, ohne Popup-Wand. Er versteht: was ROTFALL ist, wie die Welt funktioniert, Bewegung, Interaktion, Kampf, Loot, NPCs, Händler, Quests, Gebäude, und warum er überhaupt unterwegs ist. Informationen kommen kontextbezogen, nur das, was in diesem Moment relevant ist.

**Stand:** Wegweiser (08.10.) mit 7 erlebbaren Schritten: Bewegen, Ansprechen, Händler, Brett/Auftrag, Kampf, Beute, „Wohin?". Eine Karte, Schritt wechselt erst nach dem Erleben. Ratgeber-Tipps (GUIDE) laufen weiter.

**Offen:**
- Schmiede-Moment: Spieler betritt Schmiede → Schmied arbeitet → beobachten → ansprechen → Händler-Fenster → Waffen/Rüstungen sehen → Tutorial erklärt nur die Funktion dieses Moments. ⛓ P2.14
- Gleiches Prinzip für Gebäude- und Reise-Hinweise (Kampf, Loot, Quest, Markt, Reisen, Gebäude, NPCs, Betriebe)
- Testfälle §51 als Probe: Softlock, Laden, nicht mehrfach auslösen

**Abnahme (§51 Tutorial):**
- Neues Spiel startet, Intro läuft korrekt, Einflug funktioniert, Welt wird sichtbar
- Spieler erhält erste Orientierung, Tutorial ist abschließbar
- **Kein Softlock** (in jedem Schritt, auch bei übersprungenen Handlungen)
- Speichern/Laden mitten im Tutorial funktioniert
- Tutorial löst nicht mehrfach ungewollt aus (auch nicht in alten Ständen oder Folgecharakteren)


**Stand 08.10. (Claude):** ✔ Prolog „Die Aschenfurt“ (eigenes Startgebiet, Kamerafahrten, 8 erlebte Schritte inkl. Menüs I/C/M und Kampf, Spielziel von Oswin, Wahl Krone/Stille/ohne Herrn über die Fraktions-Starts, kein Tod, Laden mitten im Prolog, im Erstellungsfenster abwählbar). ✔ Hinweise beim ersten Betreten eines Hauses und bei Kutscher/Fährmann. **Fehlt:** Schmiede-Moment (⛓ P2.14); Probe „Speichern/Laden mitten im Prolog“ als echter Rundlauf (heute: Neubau der Karte geprüft); einmal komplett von dir spielen (🔍).
#### P0.2 Einflug nach ROTFALL (✔ mit Rest)

**Ziel (§7):** Kurzer Anflug, kein langer Cinematic. Spieler blickt auf Region, Landschaft, Straßen, Stadt/Landmarken, Reisende, evtl. Karawanen, größere Siedlung. Gefühl: „Ich betrete eine bereits existierende Welt", nicht „kleine Map für meine Quest".

**Stand:** Kamerafahrt beim ersten Start (Region, Straße zur Stadt, Markt, Schmiede, Brett, Gefahr, Ruine, zurück). Esc überspringt. Alte Stände nie.

**Offen:** Sichtbare Reisende/Karawane im Bild **erzwingen** (heute nur, wenn zufällig vorhanden).

**Abnahme:** Im Einflug sind immer mindestens Reisende oder Karawane sichtbar; Skip per Esc ohne Folgefehler; kein erneutes Abspielen nach Load.


**Stand 08.10. (Claude):** Einflug zeigt einen echten Reisenden/eine Karawane, wenn im Umkreis von 220 Feldern unterwegs; Prolog hat eigene Kamerafahrten. ✔ (später am 08.10.) Ist keiner unterwegs, geht ein flüchtiger Wanderer zwischen Startpunkt und Stadt los und wird gezeigt — Abnahme „immer sichtbar“ erfüllt; alle Einstellungen schwenken, „Weiter“ von Hand. **Fehlt:** nichts (🔍 ansehen).
#### P0.3 Erste Wege/Ziele als Denkansätze (◐)

**Ziel (§8):** Keine „Gehe zu Punkt A"-Anweisung. Mögliche Richtungen als Denkansätze: große Stadt in der Ferne, Schmiede, Straße mit Reisenden, gefährliches Gebiet, Markt, Taverne, Ruine, Fraktion, Händler, sichtbares Ereignis. Spieler fragt sich: „Was davon interessiert mich?" Botschaft: ROTFALL gibt Möglichkeiten, nicht nur eine Questliste.

**Stand:** Einflug-Texte und Wegweiser-Schritt 7 („Wohin?").

**Offen:**
- Kompass ohne festes Ziel (IDEAS R8.7)
- Erster Kontakt = Brett (R8.6)
- Herkunft mit Handlung (R8.4)


**Stand 08.10. (Claude):** ✔ Kompass zeigt im Wegweiser-Schritt „Arbeit“ zum nächsten Brett (R8.7); ✔ jede Herkunft hat eine eigene Startzeile (R8.4); ✔ der Prolog stellt die drei Wege als Wahl. **Fehlt:** „erster Kontakt ein Gesicht statt Brett“ (R8.6) — teilweise durch Oswin im Prolog abgedeckt.
#### P0.4 Quest-GUI (◐)

**Ziel (§38–39):** Richtige GUI, nicht nur Text. Anzeige: Questname, Questgeber, Beschreibung, aktuelles Ziel, Fortschritt, Belohnung, Ort, Status, optionale Ziele, abgeschlossene Ziele. Bestehende UI-Architektur wiederverwenden. Das UI zeigt nur, was der Charakter wissen kann (Geheimnis-/Entdeckungsquests bleiben entdeckbar).

**Stand:** Auftragsbuch (J) mit Brief, Geber-Porträt, Ziele mit Häkchen ☑/▸/☐, Lohn, Ort, Verfolgen. Anschlagbrett als Zettel-Fenster (08.10.).

**Offen:**
- Kartenausschnitt im Brief (🔶 E11)
- „Nur zeigen, was die Figur weiß" bei Geheimnis-Quests prüfen
- Verträge der Wache (`conList`) als Fenster

**Abnahme (§51 Quests):** GUI funktioniert, Fortschritt aktualisiert sich, Belohnung wird korrekt vergeben, verschiedene Questtypen werden dargestellt.


**Stand 08.10. (Claude):** ✔ Verträge von Wache, Kette, den Freien und dem Arbeiterrat im Zettel-Fenster; Stichprobe Geheimnis-Quests ok (find-Ziele ohne Kartenpunkt). **Fehlt:** Kartenausschnitt im Brief (🔶 E11); Abgabe bei der Wache im Spiel prüfen (🔍).
#### P0.5 Kein Treffer durch Wände (✔)

**Ziel (§36–37):** Niemand ist durch Wände treffbar: Nahkampf, Projektile, Fähigkeiten, Magie, Fernkampf, AOE, NPC-Angriffe. Eine zentrale Lösung statt Wandprüfung pro Waffe: Angreifer → Richtung → Hindernisprüfung → Ziel erreichbar? → Hit/kein Hit.

**Stand:** Zentral in `hit()`/`clearLine` (Kacheln + feste Objekte). Pfeile/Zauber prallten schon ab. Dampframme bricht durch. Probe vorhanden.

**Restprüfung (Abnahme §51 Kampf):** Nahkampf, Projektile, Magie, AOE (soweit mechanisch vorgesehen) und NPC-Angriffe in einem Probelauf durchgehen; Ausnahme „Dampframme" bewusst dokumentiert.

**Stand 08.10. (Claude):** Durchsicht aller Schadensstellen: Nahkampf, Fähigkeiten und Gegnerschläge laufen über `hit()` (Wandprüfung ✔), Pfeile/Zauber prallen ab (✔), Explosionen (`blastEnd`) über `hit()` (✔). 🐞→✔ Neun Flächenfähigkeiten gingen direkt über `hurt()` und trafen durch Wände: Seelenernte, Leichenbersten, Rote Ernte, Schrottbombe, Dodons Echo, Stille Hand, Entfesseln, Bannkreis gegen Untote und die Glutaura des Aschdämons — jetzt mit `clearLine`. Gift/Blutung (Zeitschaden) bewusst ohne Wandprüfung. **Fehlt:** eigene Probe für Flächen hinter Wänden (🔍).

#### P0.6 Gebäude-Eingänge und -Transparenz (◐)

**Ziel (§33–35):** Tür muss zur tatsächlichen Zugangsrichtung passen. Jedes betretbare Gebäude hat definierten Eingang, Eingangsrichtung, Innen-/Außenposition, Zugangspunkt, Exit-Punkt. NPCs betreten über die echte Tür. Gebäude werden positionsabhängig transparent (hinter/seitlich ≈ 40–60 %, davor normal), damit man jederzeit sieht, wo man steht, wo NPCs sind, wo der Eingang ist.

**Stand:** Alle 504 Haus-Eingänge frei (Prüfung 08.10.). `doorSide` N/S/W/E konsistent in Bau, Bild, NPC-Weg. Transparenz hinter/seitlich ✔ (aktuell 50 %).

**Offen:**
- Der vom Entwickler gesehene Fall (Tür seitlich, NPC läuft frontal) ist nicht reproduziert → **Ort nennen**
- NPC-Anlaufpunkt direkt vor der Tür statt Diagonale
- Siedlungsgebäude prüfen

**Abnahme (§51 Gebäude):** Eingang stimmt mit Sprite überein, NPC nutzt die tatsächliche Tür, Spieler kann betreten, Transparenz greift bei Bedarf, keine Bewegung durch Wände.


**Stand 08.10. (Claude):** ✔ Ursache gefunden: benannte NPCs standen immer 2 Felder unter dem Haus, auch bei W/O/N-Türen — jetzt `doorFront` in Türrichtung (auch Feldlager). ✔ Siedlungsgebäude geprüft: Bauten der eigenen Siedlung (`BUILDINGS`, kind 'building') sind Bild + Kollision ohne Innenraum — keine Tür, also kein Türfehler möglich; begehbare Siedlungshäuser wären ein neues Paket (→ P1.x „Siedlung als Stadt“). **Fehlt:** an einem Haus mit Seitentür ansehen (🔍).
---

### P1 — Weltqualität

Leitidee (§40–47): Nicht jeder NPC braucht eine Quest. Stadt = wenige relevante Questgeber + viele normale NPCs + Gerüchte + Betriebe + Händler + Familien + Stadtaktivitäten.

Beispielverteilung aus der Spec (20 NPCs): 3 Questgeber · 5 Händler/Mitarbeiter · 4 Familienmitglieder · 3 Wachen · 2 Reisende · 2 normale Bürger · 1 Story-NPC. Dynamisch, abhängig von der Stadt.

#### P1.7 NPCs ohne Quest (✔/◐)

**Stand:** Nur noch 3/4/6 Vertragsgeber je Dorf/Stadt/Hauptstadt (vorher 40 % aller Bewohner), feste Auswahl.

**Offen:** Questhinweise über Gerücht/NPC-Gespräch statt Siegel (§43: z. B. zwei NPCs: „Die Karawane ist immer noch nicht zurück."); Zahlen bestätigen (🔶).

**Normale Bürger (§42) sollen:** arbeiten, einkaufen, essen, schlafen, reisen, reden, Kinder betreuen, zur Taverne gehen, Wache halten, Handwerk betreiben, durch die Stadt laufen.

**Abnahme (§51 NPCs):** NPC ohne Quest existiert korrekt; arbeitet, schläft, besucht Betrieb, kauft ein, findet Wohnhaus und Arbeitsplatz.


**Stand 08.10. (Claude):** ✔ Gerücht-Szene „Hast du gehört? X sucht …“, danach Siegel auch aus der Ferne. **Fehlt:** Zahlen 3/4/6 bestätigen (⚖).
#### P1.8 Rollenverteilung je Stadt (◐)

Rollen: Geber / Händler / Familie / Wachen / Reisende / Bürger / Story. Rollen existieren implizit über Berufe. **Fehlt:** explizite Verteilung pro Stadt und Messung (Soll/Ist-Tabelle je Stadt).

**Stand 08.10. (Agent):** `roleOf`/`townRoles` (game.js, neben `conGiverOk`): jede Figur genau eine Rolle (Vorrang Story > Wache > Geber > Händler/Mitarbeiter = fester Arbeitsplatz > Reisende > Familie > Bürger), Soll ⚖ 15/25/20/15/10/10/5 %. Infofeld zeigt „Rolle“, „Bietet: Auftrag“ nur bei echten Gebern. Debug „Stadt: Rollen Soll/Ist“ + „Alle Orte … (Konsole)“, Probe „Planlauf P1.8“. Messung Ist/Soll: Varonheim Geber 4/32, Händler/Mitarb. 113/54, Familie 56/43, Wache 11/32, Reise 1/21, Bürger 6/21, Story 23/11; Aurelheim Geber 6/44, Händler 153/73, Familie 94/58, Wache 22/44, Reise 3/29, Bürger 10/29.
**Fehlt:** Umverteilung zum Soll (bewusst nicht: Geber-Deckel 3/4/6 bleibt, Entwickler 08.10.); Reisende in Städten (TRAVEL_MAX 14 weltweit reicht nicht für 10 %) — nur gemessen; Wachen in 4 Dörfern 0–1.

#### P1.9 Haus ↔ NPC-Zuordnung (✔ mit Rest)

Wer wohnt wo, und warum dort? Heute: `spawnResidents`/`residentPlan` verteilt nach Beruf. **Fehlt:** Kapazität je Haus. Gebäudegröße und Ausstattung müssen erklären, warum die Bewohner dort wohnen (Problem: drei NPCs in winzigem Haus mit einem Bett).


**Stand 08.10. (Claude):** ✔ Jeder Bewohner hat einen Schlafplatz (eigenes Wohnhaus → Untermiete im nächsten Wohnhaus → Strohsack in der Werkstatt → Kammer in der Schenke); 753 von 803 versorgt, 30 ohne (kleine volle Orte). **Fehlt:** die letzten ~30; Kapazität beim Ansiedeln neuer Bewohner (Wachstum/Flüchtlinge) berücksichtigen.
#### P1.10 Familien (◐)

**Ziel (§23–25):** Echte Struktur (z. B. Vater, Mutter, zwei Kinder), nicht nur gleicher Nachname. Sichtbar: gemeinsam im Haus, gemeinsames Essen, Kinder folgen Eltern, Familienmitglieder arbeiten und besuchen den Markt, Kinder schlafen im Haus, Eltern reagieren auf Gefahr, Mitglieder sprechen miteinander. Nicht alles sofort perfekt, aber die Beziehungen müssen sichtbar sein.

**Stand:** Nur die Helden-Dynastie hat Familie.

**Impact-Report muss klären:** Haushalt als Datenstruktur, Nachnamen, Kinder als NPC-Typ, Tagesablauf, Save-State. Kette: **NPC-Daten → Familie → Wohnraum → Gebäude → Tagesablauf.**

**Abnahme (§51 Familien):**
- Familie wird korrekt gespeichert und geladen
- Mitglieder wohnen zusammen, Haus bietet genug Schlafplätze
- Kinder/Eltern werden korrekt dargestellt
- **Tod eines Mitglieds erzeugt keine kaputten Referenzen**


**Stand 08.10. (Claude):** ✔ Haushalt = wer im selben Wohnhaus schläft (abgeleitet bei jedem Laden, nichts im Spielstand): Familienname, Rollen, Paare, 0–2 Kinder je Paar unter 45 (Kinder als eigener NPC-Typ, unangreifbar, schlafen im Haus, spielen vor der Tür, gehen mit der Mutter zum Markt), Familie isst abends am Tisch, „Wer wohnt bei dir?“. ✔ Absturz bei neuem Spiel behoben (Kind ohne Mutter). ✔ (später 08.10.) Familienmitglieder reden miteinander (Eltern–Kind, Paar, Geschwister; Umgebungsszene); bei Gefahr im Ort sind alle samt Kindern im Haus (bestehende Gefahr-Regel im Tagesplan gilt auch für Kinder). **Fehlt:** Großeltern, Trauer beim Tod eines Mitglieds, Kinder laufen der Mutter sichtbar hinterher (heute: gleiche Ziele).
#### P1.11 Wohnraum (◐)

Kapazitätsstufen laut Spec:
- Klein: 1–2 Bewohner, 1 Schlafzimmer, kleiner Wohnbereich
- Mittel: 2–4, mehrere Schlafplätze, Küche, Wohnbereich
- Groß: 4–8, mehrere Zimmer/Schlafplätze, evtl. Arbeitsbereich
- Familienhaus: Eltern, Kinder, evtl. Großeltern, mehrere Schlafplätze, Familienbereich

Ausstattung als Familienhinweis: mehrere Betten, Kinderbett, größerer Tisch, mehrere Räume, Küche, persönliche Gegenstände, Kleidung, Spielzeug, Werkzeuge. **Stand:** Möbel mit Funktion vorhanden, Kapazität fehlt.


**Stand 08.10. (Claude):** ✔ Betten nach Hausgröße (Haus 2–3, Kate 2, Herrenhaus bis 5, Fischerhaus 2), Kinderlager/Strohsack als eigenes Möbel. **Fehlt:** Spielzeug, größerer Familientisch, Familienhaus-Typ mit mehreren Räumen.
#### P1.12 Marktplätze skalieren (◐)

**Entwickler 08.10. (dringend):** „Varonheim ist immer noch viel zu überfüllt, da sind locker wieder 200 NPCs am Marktplatz — guck, dass die sich mehr verteilen.“ und „Es gibt keine Marktplätze in Varon.“ → Agent Städte arbeitet daran (Messung: Fest = ganze Stadt am Feuer, mittags/17 Uhr alle ohne Arbeit auf den einen Platz).

Problem: bis ~100 NPCs auf einem kleinen Platz. **Nicht durch Tricks kaschieren**, sondern räumlich lösen. Drei Hebel (§18):
- A: größerer Platz
- B: mehrere Plätze (Hauptmarkt, Handwerksmarkt, Lebensmittelmarkt, Händlerplatz, Hafenmarkt, Nachbarschaftsmarkt)
- C: zeitliche Verteilung (morgens Arbeiter/Händler/Bauern; mittags Kunden/Reisende/Handwerker; abends weniger Markt, mehr Tavernen/Treffpunkte)

**Stand:** Varonheim hat Viertel; Dichte-Messung fehlt (docs/BUGS A-02 „Ballung").

**Abnahme (§51 Städte):** 100 NPCs entstehen nicht unkontrolliert auf einem Punkt; Marktplatz bleibt begehbar; NPCs verteilen sich auf mehrere soziale Räume; Performance akzeptabel.

**Stand 08.10. (Agent):** Hebel B + C gebaut. Varonheim: drei Märkte mit Ständen und Schild (Hauptmarkt 8 Stände, Lebensmittelmarkt W 5 Stände + Brunnen, Handwerksmarkt SO 4 Stände + Waffenstand/Amboss; world.js `buildCapital`, nur freie Wiese gepflastert, kein rnd()); `planSocial` (game.js) gibt jedem Bewohner den Markt seines Viertels; `dayTargetRaw`: mittags Schenke/Treffpunkt/daheim/Markt, 16:30–18 jeder Zweite am Treffpunkt; Fest: jeder Zweite ans Hauptfeuer (⚖ höchstens 24), die anderen auf dem Viertelmarkt/in der Schenke/am Treffpunkt, nie auf dem Hauptplatz. **Messung Varonheim Hauptmarkt, Bewohnerziele im Umkreis 8 (Umkreis 15), Friedenstag:** vorher 8 Uhr 5 (17) · 10 Uhr 5 (26) · 12 Uhr **36 (126)** · 15 Uhr 7 (35) · 17 Uhr 15 (58) · 19 Uhr 0 (5) · Fest **173**; nachher 6 (22) · 7 (30) · **9 (23)** · 5 (23) · 6 (24) · 0 (5) · Fest **26** (alle Figuren inkl. Garde/Hof an echten Plätzen: mittags 14, Fest 29). Nebenmärkte höchstens 14. Salzhafen mittags 42 → 18, Fest 57 → 28; Aurelheim Fest 254 → 25. Probe „Planlauf P1.12“, Debug „Stadt: Marktdichte 8–19 Uhr“.
**Fehlt:** Hebel A (größere Plätze) nicht nötig; Hafen-/Nachbarschaftsmärkte in Salzhafen/Nordfurt (dort nur zeitliche Verteilung); ⚖ FEST_CAP 24, Mittags-Drittelung.

#### P1.13 NPC-Dichte und Bewegungsströme (◐)

Ströme laut Spec: Haus→Arbeit, Arbeit→Markt, Markt→Zuhause, Arbeit→Taverne, Haus→Tempel, Händler→Markt, Reisende→Gasthaus, Wachen→Straßen/Plätze. Nutzen: Atmosphäre, Navigation, Simulation, Performance, Glaubwürdigkeit.

**Stand:** Tagesabläufe je Beruf vorhanden. **Fehlt:** Treffpunkte Brunnen/Tempel/Tor/Trainingsplatz. Weitere soziale Räume (§46): Taverne, Schmiede, Hafen, Handwerksviertel, Wohnviertel, Handelsstraße, Nachbarschaftsplatz.

**Stand 08.10. (Agent):** Treffpunkte gebaut (`meetSpots`/`planSocial`, game.js): Brunnen/Fontäne, Tempel (Kapellentür, Schrein, Altar), Tor (Wachposten, Torbanner/-räder), Übungsplatz (Waffenständer, Kaserne), Schenkentür — je Ort 2 (Dorf) bis 23 (Varonheim). Jeder Bewohner hat den nächsten Treffpunkt nach Beruf/Alter (höchstens 40 Kacheln), geht mittags, nachmittags (Block `am`) und 16:30–18 hin; dort eigene Gesprächszeilen; Infofeld „trifft sich am …“. Probe „Planlauf P1.13“, Debug „Stadt: Treffpunkte zeigen“.
**Fehlt:** Ströme Reisende→Gasthaus und Wachen→Straßen unverändert; Hafen und Handelsstraße als eigene Räume; Kinder nutzen noch den Markt der Mutter, keinen eigenen Treffpunkt.

**Stadtplanungs-Check (§47):** Verhältnis Gebäudegröße/NPC-Zahl, Straßenbreite, Platzgröße, Türpositionen, Laufwege, Märkte, Wohn-/Arbeits-/Handelsviertel, Treffpunkte, Dichte. Städte funktional beurteilen, nicht nur optisch.

#### P1.x Weitere offene Weltpunkte (☐)

| Punkt | Detail | Quelle |
|---|---|---|
| **Berufe erkennbar, besondere NPCs stechen heraus (Entwickler 08.10., neu)** | „Man soll besser die verschiedenen Berufe erkennen können. Besondere NPCs sollen herausstechen.“ Je Beruf ein klares Merkmal in der Silhouette (Schürze+Hammer Schmied, Mehlschürze Bäcker, Kutte Priester, Kiepe Händler, Bogen/Fell Jäger …), Händler mit Ware in der Hand; benannte Figuren/Questgeber/Story-NPCs mit stärkerer Kleidung, Farbe, Haltung, ggf. dezenter Aura/Namenszug — ohne Questmarker-Flut. → Agent Figuren, nach der Kampfanimation | Spec Welt §40–44, STYLE_GUIDE |
| NPC-Visuals Rest | Sprechblasen vereinheitlichen (N1), Stimmungs-Idle (N4), Symbolsatz (🔶 E13) | visual/npcs.md |
| Begehbare Zelte | Lager, Banden, Pilger, Garnison | §5g.4 / T21 |
| NPCs mit eigenen Zielen | Händler wechselt Route, Hauptmann desertiert, Abwanderung, Kriegsmüdigkeit (APPROVED, 4 Fragen 🔶 E21) | PROPOSALS/npc_eigene_ziele |
| Orte beleben | Szenen an Schrein/Hain/Ruine, besetzte Städte mit anderen Bannern/Wachen, Fraktionsarchitektur | §5g.35 / T33 |
| Akademie-Innenleben Rest | Bücher, Anklage wegen verbotener Magie | §5g.9 |
| Weitere Orte/Figuren | Lehrer Moorhexe, Himmelsinsel-Ratshändler, Prachtbauten nutzbar, Gefährten-Szenen untereinander, Kinder/Tiere als Stadtbevölkerung, Hausgeräusche | §5g.11/15/30/36, T29/T32/T38 |
| Siedlung als Stadt | Stufen Lager→Stadt, Zuzug, Fraktionsreaktion, Lehen; Siedlung als Marktknoten/Landrecht (IDEAS 2/3, nicht freigegeben) | §5g.19/33, T34 |
| Weiler und Städte | Weiler je Welt (12–20), organische Stadtanordnung (🔶 E26), prozedurale Städte (später) | PLAN_OFFEN D |
| Welt ohne Quest beobachtbar | Beispiele §45: Schmied arbeitet, Kind läuft zur Mutter, Händler öffnet Laden, Wachenwechsel, Karawane kommt an, Kunde kauft, Familie isst, Betrunkener streitet, Bandit wird von Wachen kontrolliert | Spec §45 |

---

### P2 — Betriebe

**Leitbild (§26–32):** Gebäude zeigen, was darin passiert. Betrieb ist sozialer Raum, nicht nur ein Menü. Sichtbarer Eindruck zählt mehr als vollständige Wirtschaftssimulation.

#### P2.14–15 Schmiede sichtbar (◐)

Soll: Ofen, Feuer, Amboss, Werkbank, Werkzeuge, Waffen, Rüstungen, Rohmaterial, Metall, evtl. Lager, Schmied arbeitet. Animationen: Hammer auf Amboss, Feuer, Funken, Rauch, Schmied bewegt sich, Werkzeuge benutzt.

**Stand:** Props forge/hearth/chimney/anvil animiert; Arbeitsplätze mit Werkzeug (`act:'work'`).
**Offen:** Innenausstattung je Betrieb, Hammer-Funken nicht vollständig.

Der Spieler soll in der Schmiede: Waffen und Rüstung kaufen, eventuell Reparatur nutzen, Schmied beobachten, Kunden kommen und einkaufen sehen, Mitarbeiter arbeiten sehen.

#### P2.16 Kunden betreten Läden (◐)

Ablauf (§30): 1. Kunde betritt Gebäude → 2. geht zum Verkaufsbereich → 3. Mitarbeiter reagiert → 4. Kunde kauft → 5. Ware verschwindet bzw. wird als verkauft markiert → 6. Kunde verlässt Gebäude → 7. Mitarbeiter arbeitet weiter. Vereinfachung erlaubt.

**Stand:** `marketBuy` nur am Marktstand. **Fehlt:** Kundenlauf ins Gebäude, Ware-weg-Effekt, Mitarbeiter-Reaktion. ⛓ P0.6

#### P2.17 Mitarbeiter arbeiten sichtbar (◐)

Arbeiter-Phasen fetch/work vorhanden; in Spielerbetrieben nicht sichtbar. Beispiel Spielerschmiede: einer holt Metall, einer arbeitet am Ofen, Kunde betritt, schaut Waffen an, kauft.

#### P2.18 Prinzip auf alle Betriebe übertragen (☐, nach P2.14)

| Betrieb | Sichtbar sein soll |
|---|---|
| Bäckerei | Ofen, Teig, Brot, Bäcker, Kunden, Verkaufsbereich |
| Taverne | Tische, Küche, Barkeeper, Gäste, Essen, Getränke, Bedienung |
| Schneiderei | Stoff, Nähplatz, Schneider, Kleidung, Kunden |
| Apotheke | Regale, Kräuter, Tränke, Alchemist, Kunden |
| Werkstatt | Werkbank, Werkzeuge, Rohstoffe, Handwerker |
| Stall | Tiere, Futter, Stallarbeiter, Kunden |
| Händler | Waren, Lager, Verkäufer, Kunden |
| Bionik-Werkstatt | Prothesen, Werkzeuge, Ersatzteile, Techniker, Kunden |

#### P2.19 Spieler arbeitet im eigenen Betrieb (◐)

Spieler kann Betrieb betreten und arbeiten, produzieren, Waren herstellen, Kunden bedienen, Aufträge erledigen, Mitarbeiter beobachten, Produktion kontrollieren. Betriebe: Schmiede, Werkstatt, Taverne, Händler, Farm, Bäckerei, Alchemielabor, Bionik-Werkstatt.

**Stand:** Handwerk mit Qualität an Esse/Werkbank/Kessel; Betriebe-Reiter mit Kasse. **Fehlt:** Kunden bedienen, Aufträge. ⛓ Skills-Phase 4

#### P2.x Weitere Betriebspunkte (☐)

- Kasse am Haus abholen (Betrieb → Haus) 🔶 E9; Verlusttage „erst Kasse, dann Gold" bestätigen 🔶 E8
- Betriebe in besetzten Städten ohne Meldung (SHF-06)
- Zollgesetz ohne Wirkung auf Überfälle (RB-010)
- Startlager unter Zielwert nachmessen (RB-055/058)
- Produktionsketten: Holz→Bretter, Erz→Metall→Waffe, Getreide→Mehl→Brot, Tier→Leder; Werkstücke mit Namen (`o.maker` wird nie gelesen) (MASTER_ROADMAP C.13, IDEAS 4)

**Abnahme (§51 Betriebe):** Mitarbeiter erscheinen und arbeiten; Kunden betreten und kaufen; Waren korrekt verarbeitet; Spieler kann betreten und arbeiten; Save/Load.

---

### P3 — Content (Gegner, Quests)

#### P3.20–23 Banditen- und Goblin-Rollen (☐)

**Regel (§15):** Eine Variante ist nur dann „neu", wenn mindestens eines davon sichtbar anders ist: Sprite, Kleidung, Rüstung, Waffe, Silhouette, Animation, Verhalten. Nur „HP +20, Damage +5" zählt nicht. Elite/Boss dürfen zusätzlich stärkere VFX und besondere Animationen bekommen.

**Banditen-Rollen:** Späher, Bogenschütze, Plünderer, Schläger, Söldner, Anführer, Fallensteller, Reiter, schwerer Bandit, Messer-/Dolchkämpfer (Spec nennt zusätzlich: Straßenräuber, Heiler/Spezialisten).

**Goblin-Rollen:** Krieger, Speerträger, Bogenschütze, Schamane, Plünderer, Berserker, Späher, Anführer, Techniker, Fallensteller, Sklave, Arbeiter. Je Rolle: anderes Outfit, andere Waffen, Körperhaltung, Farben/Details, Animationen, Verhalten.

**Pro Rolle definieren:** Sprite · Körperform · Helm · Kleidung · Waffe · Kampfverhalten · Animation · Kampfrolle.

**Stand:** bandit 4 Typen, goblin 2 + Bosse; Werte-Varianten (`ENEMY_VARIANTS`), Look-Seeds. Rollen mit eigenem Verhalten fehlen.

**Questbezug (§12):** Gegner-Pools der Aufträge nach Rolle mischen. Nicht dreimal „5 Banditen" in derselben Region.

#### P3.24 Animationen (☐)

Neue Animationen für Rollen. Kampfanimation §17-Rest: Kampf-Idle, Kampfbewegung, Block/Parade-Haltung je Waffe, Ausweichen je Pack, Trefferreaktionen je Waffe, längerer Nachschwung, Ausholen mit Gewicht nach hinten. Schon gebaut (seit 04.10.): Profile aller Klassen, Gewicht, Oberkörperdrehung, Swoosh.

#### P3.25–26 Quest-Zieltypen (◐)

Spec §11 — Katalog, an dem die Reihen zu messen sind:

| Gruppe | Beispiele |
|---|---|
| Kampf | töten, vertreiben, Ziel verfolgen, Anführer ausschalten, Lager zerstören, Gefangene befreien |
| Erkundung | Ort finden, Ruine untersuchen, Geheimnis entdecken, Gegenstand finden, NPC suchen |
| Transport | Waren liefern, Nachricht überbringen, Verletzte eskortieren, Karawane begleiten |
| Soziales | überzeugen, Streit lösen, Informationen sammeln, Handel vermitteln, Schuld eintreiben, jemanden finden |
| Wirtschaft | Material beschaffen, Betrieb unterstützen, Lieferung sichern, Produktionsproblem lösen, Händler schützen |
| Weltgeschehen | Angriff abwehren, Flüchtlinge begleiten, Stadt bei Ereignis unterstützen, Überfall verhindern, Fraktionsereignis beeinflussen |
| Geheimnisse | Gerücht untersuchen, versteckten Eingang finden, alte Maschine untersuchen, geheimen Händler finden, verlorenen Ort entdecken |

**Stand:** Auftragsarten trail/camps/caravanSurvivors/E1–E4 gebaut; feste Reihen überwiegend gleich (`quest_agent.md` mit 27 Blättern als Vorlage). Je Questreihe: Kernaufgabe, Signaturszene, Emblem.

**Abnahme (§51 Quests):** Unterschiedliche Questtypen funktionieren; Wiederholungsmuster nachweislich reduziert (Zählung der Zieltypen je Region vorher/nachher).

#### P3.x Weitere Content-Punkte (☐)

- **Quests ↔ Welt:** Krieg erzeugt Aufträge (Schmuggel in belagerte Stadt), Kette mit Handelskontakt; toter benannter Geber lässt Quest offen
- **Gegner:** 14 nicht gewählte Gegnerideen (🔶 E5); Mutanten als Reise-Hinterhalt, Blutschöpfer-Regel, Werte neuer Gegner (🔶 E6)
- **Bosse:** Intros Graumähne/Karrak/Blutfürst; Kerkerausbruch und Ankunft Aurelheim als Szene; eigener Beutepool Graumähne/Karrak (7 Karten gebaut)
- **Rüstungsvielfalt R1–R7:** Zustand sichtbar, improvisiert, Fraktionsregel, Rarität-Kante, Set-Hände/Beine, 7 Teile ohne Look (visual/ruestungen.md)
- **Ressourcen-Sprites** mit Abbauzustand; 38 Knoten auf Fels (A-04) (§5g.3 / T14)
- **Geheime Orte Rest:** Uhrmacher, Leuchtfeuer, Walknocheninsel; zweite Gischtinsel/Seevolk-Orte; Wasservolk (🔶 E25)
- **Dungeons:** Rätsel/Fallen vertiefen, Gewölbe-Events; Aurelion sichtbar (Laternen, Automaten-Streifen, Kräne, Fabrik); Expeditionen, Krankheiten-Modell, Weltgeheimnisse ohne Marker
- **Story:** „Ende der Brüder"-Ideen (🔶 E29); Eisenfeste zerstört → Goblins zu den Untoten; Totenland bei der Schwarzen Feste leer (BUG-143)
- **Bossgespräche** (Weißbart, Garmadon) als Story-Fenster; Bewohner rufen den Helden; Szene bei Story-Abschluss; Hinweis auf seltene Beute (🔶 E10)
- **Welt-Ereignisse** mit Namenskarte + Ton (`bigAnnounce` nur Log/Toast) — Details E22, entschieden 02.10.
- **T17 Szenen 3/4:** Hrodvar-Frost, Garmadon-Herzschlag, Hinrichtung am Galgen, Goblinsturm Sieg/Niederlage; T20-Rest (Heimweg, Gräber, Aufstand als Kolonne); Goblin-Befreiung dynamisch; Luftschiff-Absturz mehrstufig

---

### P4 — Technik, Performance, Tests

#### P4.27 Gegner-Scaling-Audit (☐, T24)

**Ziel (§16):** Gesamtproblem, nicht nur Einzelwerte. Gefährlich ohne bloß größere Zahlen.

Zu untersuchen: frühe/mittlere/späte Gebiete, Dungeons, Bosse, zufällige Begegnungen, Questgegner, Elite, Banditen, Goblins, Tiere, Fraktionssoldaten.
Zu prüfen: HP, Schaden, Rüstung, Geschwindigkeit, Angriffshäufigkeit, Fähigkeiten, Anzahl gleichzeitiger Gegner, Level-Scaling, Loot, XP, Questbelohnungen. Entscheidungen 3.8/3.9: 🔶 E38/E39 (Nummerierung der Audit-Punkte, nicht zu verwechseln mit den Spec-Entscheidungen weiter unten — vor Bau klären).

#### P4.28 NPC-Simulation nach Nähe (◐)

Drei Stufen laut Spec §20:
- **Nah:** volle Simulation (Bewegung, Animation, Interaktion, Arbeit, Gespräche, Käufe, Türen, Kämpfe)
- **Mittel:** vereinfacht (Position, Arbeit, Ziel, wichtige Zustände)
- **Fern:** abstrakt (Arbeitsplatz, Zuhause, Reise, Konsum, Tagesablauf, Stadtwerte) — bei Annäherung wird die konkrete Darstellung rekonstruiert

**Stand:** `tierOf` stuft, Ferne ~1×/s. **Fehlt:** abstrakter Fernbereich mit Rekonstruktion.

#### P4.29 Marktplatz-Performance (☐)

Nicht einfach NPCs entfernen. Reihenfolge der Hebel (§49): Culling → LOD → vereinfachte Simulation → Tick-Raten → Pathfinding → Event-System → Animationen → Partikel → Rendering → Kollisionsprüfung.
Konkret (perf/PLAN.md): 3-ms-Marke belegen; Hebel paintR-Schwall, nearEnts, tierOf; Bild-Cache-Größe; Lauf-Bilder vorbacken.

Gesamt-Skalierung (§48) betrachten: Welt (NPCs, Gegner, Gebäude, Animationen, Partikel), Stadt (NPCs pro Viertel/Platz, aktive NPCs, Wegfindung, Interaktionen), Kampf (Gegner, Projektile, AOE, Partikel, Hit Detection), UI (Questlisten, NPC-Daten, Inventare, Shops).

#### P4.31 Save/Load (☐)

Tests für Tutorial, Familien, Betriebe, Städte; Spielstand-Versionierung / zentrale Felddefinition; alte Savegames laden ohne Fehler.

#### P4.32 Regression und QA (☐)

- Verifier über alles seit 01.10. → `[VERIFIED]`-Push (letzter main-Push 2a351d9 vom 04.10. ohne `[VERIFIED]`)
- Selbsttest-Dauer (2,5–3 min) und Aufräumen
- Stresstest Fest/Belagerung
- Cutscene-/End-to-End-Tests

---

## 3. SPEC SKILLS — Progression und Grind im Detail

**Ziel:** Der Spieler soll freiwillig etwas Sinnvolles tun können, auch ohne Quest. Inspiration: Stardew Valley (Fischen, Sammeln, Handwerk, Tagesaktivitäten), Kenshi (Skills steigen durch Nutzung, Spezialisierung), RPG/MMO (Skill Trees, Meisterschaften, Perks), ROTFALL selbst (Permadeath, Weltsimulation, Fraktionen, Verletzungen, Wirtschaft, Betriebe). **Kein Stardew-Klon**, ROTFALL bleibt dunkles Fantasy-RPG.

**Design-Leitsätze (§61):**
- „Der Spieler soll nicht leveln, um spielen zu dürfen. Er soll spielen und dadurch besser werden."
- „Grind soll kein Warten auf die nächste Zahl sein. Er soll neue Möglichkeiten, Orte, Fähigkeiten und Geschichten erzeugen."

**Grundkette (§1):** Benutzung → Erfahrung → Skill steigt → neue Möglichkeiten → bessere Ergebnisse → Spezialisierung → Meisterschaft.

### 3.1 Kernprinzipien

| Prinzip | Inhalt |
|---|---|
| Nutzung statt abstrakter XP (§2) | Katana benutzen → Katana-Skill; Bogen schießen → Bogen; Waffen herstellen → Schmieden; ebenso Fischen, Holzfällen, Bergbau, Kochen, Farming, Alchemie |
| Keine stumpfen Level (§3) | Jedes größere Level schaltet etwas frei, nicht nur Zahlen. Beispiel Holzfällen: L1 normal · L5 schneller · L10 härtere Hölzer · L15 Äste/Materialien · L20 seltene Bäume · L30 magische/alte Bäume · L40 Spezialholz für Hochwertiges · L50 Meister |
| Kenshi-Prinzip (§9–10) | Gut in dem, was man tut. 20 h Speer ≠ Katana-Meister (Speer 42 / Katana 8). Wechsel jederzeit erlaubt, Skills steigen parallel, Meisterschaft braucht Zeit |
| Keine Power-Creep-Orgie (§30) | Level 50 ≠ +500 % Schaden. Neue Möglichkeiten, Effizienz, Techniken, Spezialisierung statt reiner Zahlen |
| Mehrere Ziel-Ebenen (§12) | kurz (nächstes Level), mittel (Freischaltung bei L20), lang (Meister werden), Endgame (einzigartige Meistertechnik) |
| Grind = Exploration (§37) | „Wo gibt es seltene Fische / Kristalle / schwarzes Holz im Norden?" statt dreimal derselbe See |
| Ein System füttert das nächste (§35) | Mine → Erz → Höhle → Goblin-Stamm → Gerücht → seltenes Erz → Schmied → Waffe → Kampf |
| Keine Energy-Bars überall (§43) | Ausdauer nur, wo sie gameplaytechnisch sinnvoll ist |

### 3.2 Skill-Kategorien (§5)

- **Kampf:** Schwerter, Katanas, Äxte, Hämmer, Speere, Stangenwaffen, Dolche, Bögen, Armbrüste, Magie, Schilde, evtl. Feuerwaffen/Magitech (nicht jede Einzelwaffe, sondern Waffengruppe — §6)
- **Handwerk:** Schmieden, Rüstungsschmieden, Holzverarbeitung, Schneiderei, Alchemie, Kochen, Bionik, Magitech
- **Überleben:** Fischen, Jagen, Sammeln, Holzfällen, Bergbau, Kochen, Kräuterkunde
- **Soziales/Wirtschaft:** Handel, Verhandeln, Führung, Reputation, Betriebe, evtl. Glücksspiel

### 3.3 Kampf-Skills (§7–11)

- XP hängt von Gegnerstärke, Treffern, tatsächlichem Kampfeinsatz, Schwierigkeit, Risiko, evtl. Gegnerlevel ab. **Kein effizientes Farmen an harmlosen Gegnern.**
- Freischaltungen verändern den Kampfstil, nicht nur +%. Beispiele: neue Angriffe, bessere Combos, kürzere Recovery, Konter, Spezialangriffe, Reichweite, Ausdauerverwaltung, neue Animationen/Haltungen, Skill-Tree-Punkte.
- Beispiel-Leiter Katana: L5 schneller Ausweichangriff · L10 Gegenangriff · L15 Dash Slash · L20 verbessertes Parierfenster · L25 Spezialcombo · L30 Konterangriff · L40 Meistertechnik · L50 Meisterschaft. Tatsächliche Fähigkeiten müssen zur bestehenden Kampfmechanik passen.
- **Meisterschaft (§11):** selten und wertvoll. Anforderung z. B. Katana 50 + Herausforderungen; Belohnung: Meisterhaltung, Spezialanimation, neue Combo, Spezialfähigkeit, kleiner passiver Bonus.
- Freischaltungs-Raster laut Roadmap: je 5/10/15/20/25/30/40/50.

### 3.4 Gathering (§13–21, §36)

**Fischen** — eigenes Minisystem: Angel auswerfen → warten → Biss erkennen → Timing/Reaktion → Fisch zieht → Schnurspannung → Spieler reagiert → Fang. Skill schaltet frei: bessere Ruten/Köder, größere und seltenere Fische, Fangrate, neue Gewässer, Spezialfische, seltene Materialien.
- Leiter: L1 einfache Fische · L5 bessere Köder · L10 neue Gewässer · L15 seltene Fische · L20 Spezialausrüstung · L30 legendäre Fänge · L50 Meisterfischer
- Gewässer: Fluss (Forelle, Lachs, Hecht) · See (Karpfen, Barsch, seltene) · Sumpf (Sumpffisch, giftige, Monsterfische) · Küste (Meeresfische) · Besondere (magische, Tiefen-, Kristall-, Legendary-/Questfische)
- Verwendung: Kochen, Alchemie, Medizin, Buff-Food, Questgegenstände, Tierfutter, Materialien, Handel (Kette Fisch → Kochen → Buff → Kampf)

**Holzfällen:** normal, hart, alt, selten, magisch, ggf. Aurelion-/technisches Material. Höhere Skills: bessere Äxte, schnelleres Fällen, größere Bäume, seltene Ressourcen, Spezialhölzer.

**Bergbau:** Stein, Kohle, Eisen, Kupfer, Silber, Gold, seltene Erze, Kristalle, magische Materialien. Tiefer/gefährlicher = besser, dafür Fallen, Höhlen, Monster, seltene Funde, Ruinen, versteckte Bereiche → Mining wird Exploration.

**Sammeln:** Kräuter, Pilze, Beeren, Blumen, seltene Pflanzen, Tiermaterialien, Kristallsplitter — unterwegs, ohne dass dafür jedes Mal eine Quest nötig ist.

**Kräuterkunde:** seltene/versteckte/giftige Pflanzen erkennen, bessere Ausbeute. Kette Kräuter → Alchemie → Tränke → Medizin.

**Jagen (aktiv):** Spuren, Lebensraum, Verhalten, Flucht, Angriff, Tageszeit; Tiere verfolgen, Fallen, Bogen; Beute Fleisch, Leder, Knochen, Fell, seltene Materialien.

**Zufallsereignisse beim Sammeln (§36):**
- Mining: seltene Ressource, Höhleneingang, Monster, Einsturz, alter Gegenstand
- Holzfällen: Tier, versteckter Gegenstand, Banditen, seltenes Holz, altes Lager
- Fischen: seltener Fisch, verlorener Gegenstand, Schatz, Monster, NPC-Ereignis
- Jagen: seltenes Tier, Raubtier, Spur, verletztes Tier, Wilderer

### 3.5 Crafting (§22–23, §26–27)

- **Schmieden-Leiter:** L1 einfach · L10 bessere Qualität · L20 neue Waffenarten · L30 hochwertige Ausrüstung · L40 Spezialmaterialien · L50 Meisterschmied
- **Qualitätsstufen:** schlecht, normal, gut, sehr gut, hervorragend, Meisterwerk — **nicht zufällig**, sondern von Skill, Material und Werkzeug beeinflusst
- **Kochen:** Rezepte werden entdeckt, nicht alle sofort sichtbar. Quellen: Händler, NPCs, Bücher, Tavernen, Reisen, Experimentieren, Familien, Fraktionen. Effekte: HP-Regeneration, Ausdauer, Kampfgeschwindigkeit, Bewegung, Wärme, Resistenz, XP-Bonus, Heilung, Kurzzeit-Buffs. Besseres Kochen: Qualität, stärkere/längere Buffs, höhere Preise, seltene Gerichte
- **Farming (§24–25):** kleine Farm, Pflanzen, Ernte, Tiere, Ressourcen; Getreide, Gemüse, Kräuter, Heilpflanzen, seltene und magische Pflanzen. Bedingungen: Zeit, Wasser, evtl. Dünger, Boden, Saison/Wetter (falls Wetter-System existiert). Ertrag: Skill, Werkzeug, Samenqualität, Boden, Wetter. Später an Siedlungs-/Betriebssystem koppeln. **Kein riesiges Farmspiel.**

### 3.6 Werkzeuge (§32–33)

Axt, Spitzhacke, Angel jeweils in Stufen (einfach → gut → Stahl → hochwertig → besonders). Werkzeugqualität wirkt auf Geschwindigkeit, Ausbeute, erreichbare Ressourcen, Haltbarkeit. **Werkzeug und Skill sind getrennte Faktoren** (Woodcutting 30 + Stahl-Axt = sehr gut; Woodcutting 30 + schlechte Axt = Skill da, Effizienz schlecht) → zweiter Progressionspfad.

### 3.7 Spezialisierung und Skill Trees (§28–29)

Keine 100 kleinen +1-%-Boni. Echte Entscheidungen.
- Beispiel Schmieden: Waffen / Rüstung / Spezial (Schwer, Platten, Magitech)
- Beispiel Fischen: Profiangler / Tiefenfischer / Händler
- Beispiel Katana: Duellant / Schneller Kämpfer / Konterkämpfer; bei L20 Abzweig Tempo (Combo) / Konter (Riposte) / Reichweite (Dash)

Leitfrage: „Welche Art von Kämpfer will ich sein?"

### 3.8 Weltintegration (§34–35, §45–49)

- **Ressourcenwirtschaft:** Holz→Bretter→Gebäude→Betriebe; Eisen→Metall→Waffe→Schmied→Kunde; Fisch→Kochen→Gericht→Buff→Kampf
- **Städte als Skill-Hubs:** Zwergenstadt (Bergbau, Schmieden, Metall) · Küstenstadt (Fischen, Handel, Schiffe) · Waldstadt (Holz, Kräuter, Jagen) · Aurelion (Bionik, Magitech, Engineering)
- **Trainer:** keine „10 Gold = +1 Level"-Ware. Stattdessen Trainingsmethoden, neue Techniken, Spezialwissen, Rezepte, Skill-Trees. Beispiel: alter Katana-Meister, Voraussetzung Katana 20 + Quest/Training
- **Bücher/Wissen:** Schmiedebücher, Fischführer, Monsterhandbücher, Kampfschriften, Kräuter-, Kochbücher, technische Dokumente. Kein +1000 XP, sondern Rezepte, neue Ressourcen erkennen, Trainingsmöglichkeiten, Geheimnisse
- **Meisterschafts-Herausforderungen (§48):** Katana — starken Duellanten ohne Schild besiegen; Fischen — legendären Fisch fangen; Schmieden — Meisterwaffe aus seltenem Material; Mining — gefährliche Tiefenmine; Jagen — seltenes Tier verfolgen
- **Skills erzeugen Geschichten (§49):** guter Schmied → NPCs hören davon → Händler kommen → Adel will Waffen → Fraktion bietet Auftrag → Banditen wollen die Schmiede ausrauben
- **Tagesablauf (§44):** Spieler entscheidet „Was mache ich heute?" (Schmiede, Auftrag, Fischen, Taverne, Erkundung)

### 3.9 Permadeath und Legacy (§38–39)

- **Charaktergebunden (stirbt mit):** Waffen-Skills, Kampfmeisterschaften, persönliche Talente
- **Weltgebunden (kann über Legacy bleiben):** freigeschaltete Rezepte, bekannte Materialien, Gebäudetechnik, Betriebswissen, Weltwissen
- Beispiel: Meisterschmied stirbt → Welt kennt Schmiede, Rezepte, Meisterwerke, evtl. Lehrlinge, Ruf. Der Nachfolger startet **nicht** mit Schmieden 50.
- **Kein zweites Progressionssystem daneben.** Exakt ans bestehende Legacy-System anpassen. Abnahmeprobe „Erbe" (Audit 04.10.).

### 3.10 Speicherung (§40)

Zentral, nicht verstreut:
```
character.skills
character.skillXP
character.specializations
character.masteries
character.toolProgression
```

### 3.11 Anti-Grind (§41–42)

- Kein Holz-respawnen-und-hacken-Loop, kein „schwachen Gegner einmal schlagen, weglaufen, wiederholen"
- XP-System erkennt sinnvolle Aktivität
- Diminishing Returns: gleiche Tätigkeit am selben Ort sehr oft = sinkende Effizienz/Ausbeute; neue Region = wieder frische Ressourcen (motiviert zum Reisen)

### 3.12 UI, Feedback, Debug (§4, §50–54)

- **Skill-Fenster:** Icons, Level, Fortschrittsbalken, nächste Freischaltung, aktive/passive Boni, Spezialisierungen, Meisterschaften, Perks, Beschreibungen, nächste Ziele. Bestehende UI-Art-Direction.
- **Meilenstein-Meldung:** nur bei relevanten Stufen (z. B. „KATANA LEVEL 20 — Neue Technik: Gegenhieb"), nicht bei jedem XP-Gewinn.
- **Animationen (§52):** höhere Skills ändern Angriffs-, Werkzeug-, Angel- und Schmiedeanimationen, nutzen das Animation-Overhaul.
- **Audio (§53):** hochwertige Werkzeuge klingen anders, seltene Ressourcen/Fänge haben eigene Sounds, Meisterangriffe eigene Effekte.
- **Debug (§54):** Set Skill Level, Add Skill XP, Unlock Perk, Unlock Mastery, Spawn Resource, Spawn Fish, Spawn Rare Ore, Give Tool, Reset Skill.

### 3.13 Phasen (§56, §58) mit Stand

| Phase | Inhalt | Stand |
|---|---|---|
| 1 Skill Core | Generisches System: SkillDefinition, Level, XP, Meilensteine, Perks, Meisterschaften — zunächst nur 2–3 Skills testen | ☐ — Vorhanden: `p.skills` (Waffenübung, Schleichen, Jagd, Schmieden, Handel, Führung …, 0–100, wachsen durch Nutzung), Handwerksqualität, Sternbild-Talente. **Erweitern, nicht neu bauen (Spec §57)** |
| 2 Kampf-Skills | Katana, Schwert, Speer/Stangenwaffe, Bogen; danach Architektur prüfen, dann ausrollen | ☐ — Katana existiert als Waffenart nicht → 🔶 E38 |
| 3 Gathering | Fischen, Holzfällen, Bergbau, Sammeln (+ Kräuterkunde, aktive Jagd) | ☐ — Jagd und Kräuter vorhanden, Fischen/Bergbau-Tiefe fehlen |
| 4 Crafting | Schmieden, Kochen, Alchemie | ◐ — Qualität nach Skill vorhanden; Kochen/Werkzeugstufen fehlen |
| 5 Spezialisierungen | Skill Trees Combat/Gathering/Crafting | ☐ — Verhältnis Sternbild-Talente ↔ Spezialisierung klären (🔶 E39) |
| 6 Meisterschaften | High-Level-Ziele und Herausforderungen | ☐ |
| 7 Weltintegration | Einfluss auf NPCs, Händler, Betriebe, Quests, Fraktionen, Wirtschaft, Städte, Ressourcen, Legacy; Skill-Hubs, Trainer/Bücher, Anti-Grind, Fenster, Meilenstein-Meldung, Debug | ☐ |

**Bau-Reihenfolge (§58):** Skill Core → Katana → Fishing → Smithing → Test → Architektur prüfen → skalieren. Nicht sofort 20 Skills.

### 3.14 Tests (§55)

- **Kampf:** Katana-/Speer-XP steigt korrekt; Waffen leveln unabhängig; Waffenwechsel funktioniert; Meisterschaft schaltet korrekt frei
- **Gathering:** Woodcutting, Mining, Fishing, Kräuterkunde steigen; Jagen funktioniert
- **Crafting:** Schmieden steigt; Qualität verändert sich; Rezepte schalten frei; Materialanforderungen stimmen
- **Save/Load:** Skills, Skill-XP, Freischaltungen, Spezialisierungen, Meisterschaften; alte Savegames laden ohne Fehler
- **Permadeath:** Charakter stirbt; Skills korrekt behandelt; Legacy funktioniert; nichts wird dupliziert

### 3.15 Definition of Done Skills (§59)

Skills steigen durch Nutzung · XP skaliert sinnvoll · keine einfachen Exploits · Freischaltungen echt · Skill Trees, Spezialisierungen, Meisterschaften funktionieren · UI funktioniert · Save/Load · Permadeath/Legacy berücksichtigt · bestehende Systeme heil · Performance geprüft · Debug vorhanden · mindestens ein vollständiger End-to-End-Test.

### 3.16 „Alt"-Punkte rund um Progression (☐)

Aurelion-Ränge 3–6 mit Prüfungen · Gefährten-Ausrüstung/Befehle/Tier als 4. Mitglied · Magie-Kombos, Runen/Sockel · Barde ausbauen · Taschendiebstahl · Zerlegen an der Werkbank (+ 7 Teile ohne Quelle) · Rüstungsklassen/Schlagarten, Gegner verteidigen sich · Wundbrand/Waffenkunst/Blessuren. Referenzen: §5g.7/10/23/26/28/31/34, T16/18/19/22/25/26/36/37, Welle 2.

---

## 4. Wirtschaft, Fraktionen, Koop, Technik (aus v24)

### Wirtschaft (☐)
T23 Fraktionsressourcen (DESIGN_LOCKED) · T12 Straßen haben Herren (APPROVED) · eigene Karawane ausbauen · Luftschiffe (V7/V8, Piraten) · Stadtwerte (Sicherheit/Kriminalität) · Alchemie-Handel/Fallen · Aurelion-Industrie · Wiederaufbau mit Material · POIs. Quellen: PROPOSALS/t23, t12.

### Fraktionen (☐)
Fall Aurelions als Weltereignis (T40/§5g.8) · Kriegsgraph mit Aurelion/Diplomatie · Belagerung S3b–d (🔶 E18) · T15 Messing (Stigma Bionik, Energiezellen) · Bionik im Krieg (🔶 E19) · Luftbrücke (🔶 E20) · A-10-Rest (Innenkarten/heimatlose Reisende → Valen) · gleichwertige Rangvorteile aller Fraktionen · Morrgrund-Fragen (🔶 E24) · Karraks Wüste (🔶 E27) · Fit-Befunde (🔶 E33) · Hunt-Reste ohne Code-Marker (HB-24/25/27–31/34/35/43–47) · Dynastien als Politik · Stigma für weitere Fraktionen.

### Koop (☐)
Gast-Handel per Dock (Adapter tradeUI ↔ shopData; **BLOCKIERT**) · HB-30 · Ersatz-Lebensbalken beim Gast · Live-Test Kampfanimation/Klänge/Fenster · Aufladen des schweren Hiebs für Gäste · Gäste immer Mensch (🔶 E17).

### Technik (☐)
- ✔ 08.10. (Claude) SC-01 `buildVaronburgOld` entfernt (36 Zeilen); ✔ SC-03 Debug „Varon: Diener-Schmuggel“; ✔ RB-028 `deleteSlot` verwirft ein ausstehendes Speichern des gelöschten aktiven Platzes (landete sonst im Legacy-Platz)
- ✔ 08.10. (Claude) SW-01: 7 Stellen `AUREL_HOUSES/COUNCIL.find(...).name` mit `?.` und Ersatznamen; SW-02: Probe räumt `ITEMS.__wall` jetzt per try/finally
- RB-012 Kutschen-Probe, RB-033 (🔶 E31), RB-059 Nachmessung
- Musik je Region (sfx.js ohne music)
- Touch auf Gerät; Tastenbelegung
- Doppelte Bodenauflösung (🔶 E28)
- game.js modularisieren (23k Zeilen)

### Audit 04.10. Rest (☐)
- 3.16 `addRep()` zentral (32 direkte Schreibstellen)
- Phase-4-Abnahmeprobe „Erbe" (alle Felder gegen die Tabelle)
- Phase 5: Gold-Senken (Betriebssteuer, Unterhalt, Bank); Garmadon als Hauptauftrag mit `q_omega`; `factionAgenda` für alle; zweite Lehrer Frost/Blitz/Schatten/Glaube/Paladin; Zerlegen; Boss-Intro/Beute Graumähne/Karrak; Rohstoff-Dubletten
- Phase 6: IST neu generieren (Zählungen per Skript)

---

## 5. Pflege-Docs nachziehen (keine Features)

CHANGELOG (seit 02.10. abends) · DATA_SCHEMAS (ELITES, STIGMA, BOSS_CARDS, FAC_STARTS, RACES, RANK_LINES) · GDD (Varonheim, Blutkult, Klassenprüfung, Starts) · GUIDE / GUIDE_EREIGNISSE / KLASSEN_GUIDE (seit 30.09.) · WELTREGELN (Status-Zeichen) · README (Modultabelle) · MECHANIKEN SC-02-Absatz · IDEAS (Gebautes streichen).

⚖ (Claude, 08.10.): CHANGELOG, DATA_SCHEMAS, GDD, GUIDE*, WELTREGELN und IDEAS gibt es seit der Doku-Bereinigung (E36, „max. 5 md“) nicht mehr — was davon noch gilt, wandert in IST_ZUSTAND/MECHANIKEN; offen bleiben README-Modultabelle, MECHANIKEN SC-02-Absatz, IST-Zählungen per Skript.

---

## 5b. Arbeitsprotokoll (Planlauf ab 08.10.2026)

Legende: **✔** fertig gebaut (Selbsttest grün) · **🔍** muss geprüft werden (im Spiel/von dir) · **🐞** Bug gefunden, nicht behoben (kommt in die Fehlerrunde danach) · **⚖** vorläufige Entscheidung von mir (bitte bestätigen).

| Datum | Punkt | Status | Was / wo |
|
| 08.10. | Bugfix Kerker | ✔ | Am Zellengitter galt man als ausgebrochen (Türfeld y 9,24 > Grenze 9). `inJailCell` zählt Türfeld mit; Probe + Live-Test |
| 08.10. | P0.1 Haus-/Reise-Hinweise | ✔ 🔍 | Erstes Betreten eines Hauses → Erklärung; GUIDE „travel“ bei Kutscher/Fährmann. 🔍 Texte im Spiel lesen |
| 08.10. | P0.2 Reisende im Einflug | ✔ 🔍 | Kamera folgt einem echten Reisenden/einer Karawane (wenn im Umkreis 220 Felder). 🔍 neues Spiel starten und ansehen |
| 08.10. | P0.3 Kompass + Herkunft | ✔ ⚖ | Kompass zeigt im Wegweiser-Schritt „Arbeit“ zum Brett; 5 Herkunfts-Startzeilen (Texte von mir). „Erster Kontakt ein Gesicht statt Brett“ nicht gebaut (Wegweiser 2 „Ansprechen“ deckt es teilweise) |
| 08.10. | P0.4 Verträge als Fenster | ✔ 🔍 | Wache/Kette/Freie/Arbeiterrat nutzen das Zettel-Fenster. 🔍 Abgeben bei der Wache im Spiel prüfen. Offen: Kartenausschnitt (E11), Geheimnis-Quests „nur was die Figur weiß“ — Stichprobe ok (find-Ziele ohne Kartenpunkt) |
| 08.10. | P0.6 Türen | ✔ 🔍 | **Ursache gefunden:** benannte NPCs standen immer 2 Felder unter der Tür, auch bei W/O/N-Türen (`doorFront`). Feldmarschall-Familien ebenso. 🔍 an einem Haus mit Seitentür ansehen |
| 08.10. | P1.7 Gerüchte statt Siegel | ✔ ⚖ | Szene „Hast du gehört? X sucht …“; danach Siegel aus der Ferne, sonst nur nah |
| 08.10. | P1.9–P1.11 Wohnraum/Familien | ✔ 🔍 ⚖ | Messung vorher: 548 von 803 ohne Bett. Jetzt: 753 mit Schlafplatz (331 davon Strohsack in Werkstatt/Schenke), 30 ohne (kleine Orte, alles voll), 191 Haushalte, 21 Kinder (flüchtig, jedes Laden gleich), Familie isst abends am Tisch, Kinder gehen mit der Mutter zum Markt. Nichts davon im Spielstand. 🔍 eine Stadt bei Nacht/Abend ansehen. ⚖ Bettenzahl, Kinder 0–2 nur für Paare unter 45, Untermiete bis 60 Felder. Offen: Eltern reagieren auf Gefahr, Tod eines Mitglieds (Referenzen werden beim nächsten Laden neu gebaut; `famOf` filtert Tote) |
| 08.10. | Selbsttest | 🐞 | „Duell im Kreis (04.10.)“ schlägt gelegentlich fehl (zufallsabhängig, schon vorher beobachtet) — Fehlerrunde |
| 08.10. | P0.1/P0.3 Prolog „Die Aschenfurt“ (Entwicklerwunsch: eigenes Startgebiet) | ✔ 🔍 ⚖ | Eigene Karte (60×44, flüchtig) mit Kamerafahrten (Intro, Gräber, Gesandte, Abschied), 8 erlebte Schritte (Bewegen, Ansprechen, Durchsuchen, Menüs I/C/M, Kampf gegen 2 Untote, Aufheben, Spielziel von Oswin, Wahl). Wahl nutzt die bestehenden Fraktions-Starts: Krone → Valen/Varonheim, Stille → Untote/Vharnholm als Lebender, ohne Herrn → Menü-Start + Titel. Kein Tod im Prolog. Laden mitten im Prolog baut die Karte neu. Live geprüft bis „Tote“-Start. 🔍 einmal komplett selbst spielen (Texte, Tempo, Kamera). ⚖ alle Texte, Figuren (Oswin, Gerold, Ysolde, Mara), Ruf-Zahlen des Rebellen-Wegs. Offen: Schalter „Prolog überspringen“ im Erstellungsfenster (heute: „»“ im Prolog) |
| 08.10. | Prolog-Schalter + Absturz neues Spiel | ✔ | Erstellungsfenster: Häkchen „Prolog spielen“. 🐞→✔ Bei manchen Weltsamen brach ein neues Spiel in `planHomes` ab (Untermieter verschoben die Paar-Erkennung → Kind ohne Mutter); Paar wird jetzt vor dem Einzug der Untermieter festgelegt. Neues Spiel mit neuem Samen geprüft |
| 08.10. | Kamerafahrten + Cache v25 | ✔ 🔍 | „Weiter“ von Hand (Knopf/Leertaste/Enter/E, Esc = alles), Schwenks statt Standbilder, Nahaufnahmen (Oswin, jeder Gesandte mit Namenskarte und Satz), Kampf-Auftakt mit Totenlicht; Einflug schwenkt. Schwierigkeit erklärt (Oswin, Protokoll, Ratgeber). 🐞→✔ Nutzer landete trotz Prolog in Varonheim: Browser lud alte Module (Cache v24) — Schlüssel auf v25. 🔍 Kamerafahrten selbst ansehen. Offen: Schalter „Kamerafahrten automatisch“ im Optionen-Fenster (heute nur Debug) |
| 08.10. | P0.2 Reisender erzwingen + P0.5 Flächen durch Wände | ✔ 🐞→✔ | Einflug: ist kein Reisender in der Nähe, geht ein flüchtiger Wanderer zur Stadt und wird gezeigt. Neun Flächenfähigkeiten (Seelenernte, Leichenbersten, Rote Ernte, Schrottbombe, Dodons Echo, Stille Hand, Entfesseln, Bannkreis, Glutaura) trafen durch Wände — jetzt `clearLine`. Offen: Probe für Flächen hinter Wänden |
| 08.10. | P1.10 Familiengespräche + Technik | ✔ | Umgebungsszene „family“ in `ambientTick`; Debug „Stadt: Familiengespräch“. Technik: SC-01 toter Code weg, SC-03 Debug Diener-Schmuggel, SW-01 7× `?.name`, SW-02 try/finally, RB-028 deleteSlot verwirft ausstehendes Speichern. P0.6 Siedlungsgebäude geprüft (keine Türen, kein Fehler) |
| 08.10. | P1.8 Rollen je Ort (Agent) | ✔ ⚖ | `roleOf`/`townRoles`, Infofeld „Rolle“, „Auftrag“ im Infofeld nur bei echten Gebern (vorher bei jedem Beruf mit Vertragsart), Debug Soll/Ist, Probe grün (Selbsttest 490/490). ⚖ Soll-Anteile 15/25/20/15/10/10/5 %. Messbericht: Familie+Mitarbeiter 75–90 % der Städte, Geber 2–6 %, Reisende ≈ 0 |
| 08.10. | P1.12 Märkte Varonheim + Verteilung (Agent) | ✔ 🔍 ⚖ | Drei Märkte mit Ständen (Haupt-, Lebensmittel-, Handwerksmarkt), Bewohner auf den Markt ihres Viertels, mittags/früher Abend verteilt, Fest nur jeder Zweite (höchstens 24) am Hauptfeuer. Varonheim Hauptmarkt Umkreis 8: mittags 36 → 9, 17 Uhr 15 → 6, Fest 173 → 26 (alle Figuren an echten Plätzen: 14 bzw. 29). Salzhafen mittags 42 → 18. Selbsttest 492/492. 🔍 Varonheim mittags und am Festabend ansehen. ⚖ FEST_CAP 24, Mittags-Drittelung, Schwelle 30 |
| 08.10. | P1.13 Treffpunkte (Agent) | ✔ 🔍 ⚖ | Brunnen, Tempel, Tor, Übungsplatz, Schenkentür je Ort; Bewohner nach Beruf/Alter am nächsten Treffpunkt (≤ 40 Kacheln), eigene Gesprächszeilen, Infofeld „trifft sich am …“. 🔍 Brunnen/Tor einer Stadt am Nachmittag ansehen. ⚖ Zuordnung Beruf → Treffpunkt |

---

## 6. Offene Entscheidungen des Entwicklers

### Aus dem Audit 04.10. (Antwort steht aus)
| ID | Frage | Vorschlag |
|---|---|---|
| E-A1 | Kleriker nach Totenpakt: (a) so lassen, (b) ordensferner Lehrer, (c) Sühne beim Orden hebt Sperre | (c) |
| E-A2 | Endbosse schwächer als Zonen: (a) Boss-Stufe = max(fix, Spieler−3), (b) Zonenspanne 25–35 | (a) |
| E-A3 | EP-Kurve: (a) Faktor ab 20 auf 1,08, Max 60, (b) Max-Stufe 40 | (a) |
| E-A4 | Erbe: Rook-Feindschaft des Mönchs endet mit dem Tod? · „Zwanzig Jahre später": 20× dayTick oder entfernen? | ja · 20× dayTick |
| E-A5 | Schadensdeckel ×6 statt additiver Gruppen — reicht das? | — |

### Vorläufige Zahlen zum Bestätigen (laufen so, bis du etwas anderes sagst)
E2 Ersatz-Lebensbalken 5 s · E12 Klassenprüfungen (Platz halten 50 s, Grube ×2 LP/×1,6, EP 80/110) · E14 Schlacht +5 / Befreiung +10 Ruf, Schleich-Sicht 55 %/30 %, Jagd +60 %/40 % · E15 Wanderautomaten (Gewicht 1, 2 von 5 anwerbbar, kostenlos) · E16 Wüstenbund (Eskorten +25 %, kein Zoll ab Rang 0; eigene Kerkerkarte?) · E17 Fraktions-Starts (10 Punkte) · 08.10.: Geber je Ort 3/4/6, Wegweiser-Schritte und Texte, Haus-Transparenz 50 %, Lager 48 + 24.

### Design offen
E1 Haltung/Humpeln verwundeter Gegner · E3 Händlergesicht nach Ruf · E4 schwerer Hieb (Faktor, Ladezeit, Ausdauer, Touch, Koop) · E5 14 Gegnerideen · E6 Mutanten-Hinterhalt/Blutschöpfer · E7 Skilltree-Scheiben 3/4 streichen · E8/E9 Betriebskasse · E10 Bewohner rufen / Story-Szene / Beute-Hinweis · E11 Kartenausschnitt im Brief · E13 Symbolsatz Sprechblasen · E18 Belagerung S3 (Kellerweg, Varons Strenge) · E19 Bionik im Krieg · E20 Luftbrücke (4) · E21 NPC-Ziele (4) · E22 Welt-Ereignis-Karte (4) · E23 Städte-Visual (4) · E24 Morrgrund (3) · E25 Wasservolk · E26 organische Stadtanordnung (Vorschlag: nur neue Häuser) · E27 Karraks Wüste (Vorschlag: friedlich) · E28 Bodenauflösung · E29 Ende der Brüder (8 Ideen) · E30 70 stumme Figuren · E31 Gift/Feuer/Blutung 60 % · E32 Pferde-Sprites reichen? · E33 17 Fit-Urteile · E34 Ideenspeicher freigeben? · E35 Welle 2 Reihenfolge · **E37 Spec-Reihenfolge vs. alte APPROVED-Pakete** · **E38 Katana: Schwert-Unterart oder eigene Waffenklasse?** · **E39 Skill-System: Sternbild-Talente bleiben und Skills ergänzen (Vorschlag) oder zusammenlegen?**

---

## 7. Gesamt-Abnahme (Gesamt-QA)

Am Ende läuft, nach allen Paketen, ein vollständiger Regressionstest über die Testfälle aus Spec Welt §51 (Tutorial, NPCs, Familien, Gebäude, Kampf, Betriebe, Städte, Quests) und Spec Skills §55 (Kampf, Gathering, Crafting, Save/Load, Permadeath), dazu mindestens ein unabhängiger Testlauf und ein End-to-End-Durchlauf.

**Gesamtziel (Spec Welt §54):** Wer eine Stadt betritt, denkt nicht „Welche NPCs haben eine Quest für mich?", sondern „Was passiert hier eigentlich?" — und Quests entstehen daraus.

**Gesamtziel (Spec Skills §60):** Ein Charakter, der durch das geprägt ist, was er tatsächlich getan hat — vom miserablen Holzfäller über den Schmied zum Katana-Meister.
