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
| Rollen-Gegner (P3.20–23) | Look-Seeds/ENEMY_VARIANTS vorhanden; seit 08.10. 12 Rollen mit eigenem Aussehen und Verhalten | weitere Rollen (Söldner, Fallensteller, Reiter, Goblin-Anführer …), eigene Animationen |
| Gegner-Pools nach Rolle | P3.20–23 | Aufträge mischen nach Rolle (§12) |
| Quest-Variation (P3.25–26) | P0.4 Quest-GUI | GUI muss neue Zieltypen darstellen |
| Skills-Phase 2 Katana | E38 | Katana existiert nicht als Waffenart |
| Skills-Phase 5–6 | E39 | Verhältnis Sternbild-Talente ↔ Skill-Spezialisierung |
| Scaling-Audit (P4.27) | Gegnerrollen, Skills | Rollenmix statt LP-Zahlen |
| Alte APPROVED-Pakete (T11/12/15/17/20/23, Belagerung S3b–d) | E37 | Entscheidet, welche vor den Spec-Punkten laufen |

---

## 1b. Aufgaben aus den Entscheidungen vom 09.10.2026 (Fragerunde, Protokoll in ENTSCHEIDUNGEN §5h)

| # | Entscheidung | Aufgabe | Wer | Stand |
|---|---|---|---|---|
| E40 | Totenland **groß (C)**, Lebende dürfen mit Regeln in die Totenstadt, vorhandene Fläche füllen, Osten vorerst Hinterland, Seelen/Knochen/Grabgut **echte Marktgüter**, nach Garmadon **Thronfolgekampf oder Zerfall** | Variante B → C in Scheiben: Totenstadt Vharnholm mit Vierteln/Markt/Gesetzen + Besuchsregeln (Totensiegel/Maske/Schweigen), zweite Stadt (eigener Seed-Zweig, keine Kartenerweiterung), Rangprüfungen der Stillen, Teilregionen (Aschenebene, Knochenwald, Gräberschluchten, Totensee), Gruftnetz, Diplomatie, Story-Bogen + Bossreihe bis Garmadon, Nachfolge-Fäden (Thronfolgekampf / Fürstentümer). **Scheiben:** S1 Totenstadt Vharnholm (Totensiegel, Gesetze, Nachtleben, Viertel) ✔ · S2 Orte der Stillen in der Fläche (Beinhausen, Grenzposten Knochentor, Aufträge der Toten) ✔ · S3 Nachfolge nach Garmadon (Thronstreit Veyl/Morvath oder Fürstentümer) ✔ · S4 Rangprüfungen der Stillen ✔ · S5 Teilregionen (Aschenebene, Gräberschluchten, Totensee; Aschenregen, Klang — braucht render.js/sfx.js, mit Figuren-Agent abstimmen) ☐ · S6 Gruftnetz (vier Grüfte, Kette über die Horte) ✔ · S7 Bossreihe bis Garmadon + Elite der Stillen (mit Figuren-Agent) ☐ · S8 Story-Bogen „Leben oder Stille“ + Diplomatie Tote ↔ Orden/Valen ☐ · S9 Osten im Kriegsgraphen — erst nach Messung (Entscheidung: vorerst Hinterland) ☐ | Agent Quests | ◐ S1–S4, S6 ✔ 09.10. ⚖ (Zahlen siehe P5) |
| E40.5 | Seelen, Knochen, Grabgut als Marktgüter | economy.js: neue Güter mit Preisen, Lager, Karawanen; Totenstädte erzeugen/brauchen sie | Agent Städte | ✔ ⚖ 09.10.: `GOODS` + `bone`/`soul_vial`/neues `grabgut` (Symbol); `ECO.DEAD_GOODS`, `DEAD_OUT` (Totenorte: Knochen 0,12, Seelen 0,03 je Kopf/Tag), `GRAVE_DIG` (Kreuzweg 0,6, Aschfurt 0,4 Grabgut/Tag), Bedarf: Totenorte Grabgut 0,04/Kopf, Lebende nur über Totenkundige (`census().lore`); ohne Abnehmer Mindestpreis; Züge Tote↔Lebende nur mit Totenware, Überfall +8 %; Altstände per `deadStock`. Messung vorher/nachher im IST_ZUSTAND-Anhang (5 Totenzüge/30 Tage). Kontor-Zeile, Erst-Hinweis, Debug, Probe „E40.5“. **Fehlt:** Lager der Stillen (Gräberfeld, Grabwacht) als Marktorte (sind keine Städte im Wirtschaftsmodell), zweite Totenstadt (Agent Quests), Seelen-Spanne beobachten ⚖ |
| E41 | Bäume wachsen nach 10 Tagen nach | Stumpf → Schösslinge → Baum (Tageshaken), Probe | Claude | ✔ |
| E42 | Sternbilder: doppelte Allerwelts-Sterne streichen **und** ähnliche Klassen zusammenlegen | Punkte-Erstattung, Klassen-Migration (Barde+Kettenbarde u. a.), Klassenprüfungen/Fähigkeiten erhalten | Agent Figuren | ✔ ⚖ 🔍 09.10.: **Fällt weg ⚖:** alle reinen Wertesterne der Klassen- und Titel-Sternbilder (Leben/Rüstung/Ausdauer/Mana/Krit, doppelt zum Wanderer): kr_grip/drill/core, rt_mail/shield, pa_faith/halo, bs_scar/hide, hp_iron/core, sc_eye/wind/core, wl_hide/bark, kj_boots/hide, su_soft/lung/core, as_poise/skin, fk_apron/night, kl_lamp/robe/core, dp_ink/core, mg_ink/robe/core, ba_lungs/coat, kb_coat/lungs, al_glove/core, va_cold/blood, gb_hide/lungs, dk_plate; dazu doppelte Fähigkeitssterne kb_song (= ba_voice) und kj_core (= wl_arrow). 46 Sterne, 221 → 175; Wanderer und Gefährten unverändert. **Zusammengelegt ⚖:** die vier Kettenklassen werden Weg (`CLASSES[k].way`) ihrer Schwesterklasse — Kettenbarde → Barde, Kettenjäger → Waldläufer, Folterknecht → Assassine, Dunkler Priester → Kleriker; Sternbild als Kettenarm in der Schwesterklasse (26 → 22 Sternbilder). Hochpaladin, Paladin, Todesritter bleiben eigene Klassen. Gebaut: data.js `CUT_STARS`/`CLASS_WAYS` (Nachfolger hängen an den Voraussetzungen), game.js `skyCut` (Punkte zurück + Klassen-Migration beim Laden, auch Erbe/Koop), `clsAbilities` (beide Fähigkeitssätze), `clsLine` (Weg wirkt mit), `fearLvl`; Klassenfenster und Sternkarte zeigen den Weg; Log-Hinweis; Debug „E42: …“ (2); Probe „E42“. **Offen ⚖:** Talentpunkte-Ziel REGELN §7 (50–70 %) — die typische Figur erreicht jetzt 33/44 = 75 %; Probe vorläufig bis 76 %. 🔍 Kettenarm-Lage am Himmel ansehen |
| E43a | Ruf überall ±100 | die 36 `+=`-Stellen auf `addRep` umstellen (Goblin-Sonderfall bleibt) | Agent Städte | ✔ 09.10.: 34 Stellen game.js + 2 sim.js (`SIM.H.addRep`) + die zwei `-100…300`-Schleifen (Auspeitschen, Befreiung) auf `addRep`; Goblin-Deckel 300 in `addRep` selbst; Altstände beim Laden auf ±100 (Goblins 300) geklemmt; Tooltip im Fraktionsfenster, Debug „Ruf: Deckel prüfen“, Probe „E43“. Offen: die ~20 `clamp(…, -100, 100)`-Stellen laufen nicht durch REP_HOOKS (Verhalten gleich) |
| E43b/c | Steuer/Gebühr **je Gebiet und Stadt** | Tabelle je Fraktion/Ort (z. B. Aurelion teuer, freie Orte billig), im Kontor angezeigt | Agent Städte | ✔ ⚖ 09.10.: `ECO.TAX_FAC`/`TAX_TOWN`/`taxOf(town)` nach `townFac` (Besetzung zählt): Aurelion 15/5 %, Aurelheim 18/6, Valen 10/3, Varonheim 12/3, Orden/Zwerge 8/3, Kette/Tote 12/4, Händler/See 6/2, Wüste/Frei/Goblin 5/2, Kreuzweg 4/2. Kontor-Text „Abgaben hier“, Hinterlegung nennt Satz, Tagesmeldung nennt Sätze je Ort; Debug „Gold: Abgaben je Ort zeigen“, Probe „E43“. Sätze ⚖ zur Freigabe |
| E38 | Katana **eigene Waffenklasse** | Waffenklasse + Skill + Meilensteine/Meisterschaft (Spec Skills §10–11), Bild und Kampfanimation, Händler/Herkunft | Agent Figuren (Bild/Animation) + Agent Städte (Skill) | ◐ 09.10. (Agent Städte, ⚖): Skill `katana` (SKILL_DEF/SKILL_NAMES), Leiter 5 Ausweichhieb (`dodgeatk`, `p.dodgeAt`) · 10/30 Gegenhieb/Konterhieb (`counter`, nach Parade über `riposteUntil`) · 15 Ausfallschnitt (`reach`) · 20 Parierfenster · 25 Erholung; Meisterprüfung Stufe 40 ohne Schild und ohne Treffer (`e.hitPlayer`); Klingen `katana`/`gischtklinge`/`nebelkatana` (wtype **`katana`**) bei Ysolde Kielmark (Salzbund); `FEEL.katana`; Hinweis beim ersten Anlegen, Debug, Probe „E38“. **Fehlt (Agent Figuren):** Bild je Klinge und eigene Kampfanimation für wtype `katana` (bis dahin Rückfall: Langschwert-Bild, Takt aus `legacyTiming`); Trainer „alter Katana-Meister“ (§47) offen · **Agent Figuren 09.10. ✔ ⚖ 🔍 Bild + Animation:** figure.js `katanaW` (Tsuka, runde Tsuba, Habaki, gebogene Klinge mit Hamon; Gischtklinge Haifischhaut/Messing, Nebelklinge länger/blass), `WBY.katana`; anim.js Profil `katana` (Iai-Zug aus der Hüfte schräg hoch, Kesa-Schnitt, Ausfallschnitt als Wucht), Körperposen, Kampfhaltung tief an der Hüfte, Gewicht 0,2; ⚖ Takt A 16/27 % · 20/33 % · 24/37 % (B/C kürzer); Test Room „Katana“, Debug „Katana: Iai-Zug im Test Room“, Probe „E38 Katana Bild und Animation“. 🔍 Bewegung im Test Room ansehen |
| E37 | Alte Pakete **als Nächstes** | T12 „Straßen haben Herren“ → T23 Fraktionsressourcen → Belagerung S3 → T15 Messing; danach T21 Zelte, N1/N3/N4 NPC-Ziele | Agent Quests (nach Totenland-Scheibe) / Claude | ◐ T12 ✔ (B1–B3, 09.10. Claude) · T23 ✔ S1–S5 (09.10. Agent Städte; ⚖ Tribut leert die Dörfer, Seelen/Eifer laufen an den Deckel — s. §5b, IST_ZUSTAND Anhang) · **Fehlt T23:** Passamt-Zoll, Ysolde-Geleit ×1,5, Sprecher Ysolde/Grisk/Gesandter, Messing-Hook (T15) |
| E13 | Sprechblasen: **Mischung** Sätze + Symbole | N1: eine Blasen-Art, Tonfall-Formen, Symbole für einfache Bewohner fern/mittel, Sätze nah und bei gesprächigen Rollen, Kodex-Erklärung | Agent Figuren | ✔ ⚖ 🔍 09.10.: render.js `sayBubble` — eine Blase für Talk-Pairs (`e.talk`) und Rufe/Regiebuch (`bubble()`, jetzt gleiche Höhe); Tonfall `sayTone`: glatt = sagen, Zacken = rufen („!“/wütend), gestrichelt+kursiv = flüstern/fliehen („…“); `sayGlyph`: Zeichen rede/frage/ausruf/zorn/angst/freude/trauer (neues Zeichen „rede“); `chatty`: benannte Figuren, Händler, Lehrer, Wachen, Bosse, Wirt/Barde/Priester/Herold … immer Satz, Regiebuch immer Satz. ⚖ NEAR_SAY 220 px (~7 Schritte), höchstens 4 Sätze + 8 Zeichen, Rollenliste. Textgröße der Optionen gilt mit. Kodex-Reiter „Zeichen“, Tipp beim ersten Zeichen, Debug „E13: …“ (2), Probe „E13“. 🔍 im Spiel lesen (Markt bei Tag) |
| E21 | Deserteure zählen zum Bandendeckel; Fahnenflucht ab 60 (−2/Tag), ruht bei Belagerung Varonheims; **keine** Umleitung von Abwanderern in die eigene Siedlung | N3 gebaut (✔ 09.10. Claude: `wearyDay`, Pool, Deserteurbanden zählen zum Deckel, Belagerung pausiert Valens Fahnenflucht); Siedlungs-Option entfernt | Claude | ✔ |
| — | **Lesbarkeit (Entwickler 09.10.):** Textgröße in den Optionen wirkt nicht; Zwischensequenz-Text allgemein größer | Einstellung reparieren, Kamerafahrt-Text vergrößern und mitskalieren | Claude | ✔ 🔍 |

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


**Stand 08.10. (Claude):** ✔ Prolog „Die Aschenfurt“ (eigenes Startgebiet, Kamerafahrten, 8 erlebte Schritte inkl. Menüs I/C/M und Kampf, Spielziel von Oswin, Wahl Krone/Stille/ohne Herrn über die Fraktions-Starts, kein Tod, Laden mitten im Prolog, im Erstellungsfenster abwählbar). ✔ Hinweise beim ersten Betreten eines Hauses und bei Kutscher/Fährmann. ✔ (später 08.10.) Schmiede-Moment: Wegweiser-Schritt „Händler“ führt per Kompass zur nächsten Schmiede; in der Nähe erklärt eine Zeile, was der Schmied tut (Funken, Geselle im Hof — gebaut vom Agenten Städte, P2.14), dann ansprechen → Fenster. **Fehlt:** Probe „Speichern/Laden mitten im Prolog“ als echter Rundlauf (heute: Neubau der Karte geprüft); einmal komplett von dir spielen (🔍).
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
| **◐ Berufe erkennbar, besondere NPCs stechen heraus (Entwickler 08.10.; gebaut 08.10., Agent — siehe Protokoll 5b; offen: Namenszug beim Hinsehen, Händlerware in der Hand)** | „Man soll besser die verschiedenen Berufe erkennen können. Besondere NPCs sollen herausstechen.“ Je Beruf ein klares Merkmal in der Silhouette (Schürze+Hammer Schmied, Mehlschürze Bäcker, Kutte Priester, Kiepe Händler, Bogen/Fell Jäger …), Händler mit Ware in der Hand; benannte Figuren/Questgeber/Story-NPCs mit stärkerer Kleidung, Farbe, Haltung, ggf. dezenter Aura/Namenszug — ohne Questmarker-Flut. → Agent Figuren, nach der Kampfanimation | Spec Welt §40–44, STYLE_GUIDE |
| NPC-Visuals Rest | Sprechblasen vereinheitlichen (N1), Stimmungs-Idle (N4), Symbolsatz (🔶 E13). **Stand 08.10. (Claude):** ✔ N4 Scheibe 1 Stimmungs-Haltung (Trauer/Fest/Angst als Gesten). ~~**Fehlt:** N1 (Blasen vereinheitlichen, Tonfall-Formen, Symbolblasen — braucht E13)~~ ✔ 09.10. Agent Figuren (E13, siehe §1b), ~~N4 S2 und S4 (Berufs-Stöße, Wetter-Posen)~~ ✔ 09.10. Agent (`jobIdleTick`, 6 neue Gesten); **S3 Wunden-Pose ✔ 08.10.**, Hinken im Gehen ✔ 09.10. (auch Held) | visual/npcs.md (Git c21fd64) |
| Begehbare Zelte | Lager, Banden, Pilger, Garnison | §5g.4 / T21 |
| NPCs mit eigenen Zielen | Händler wechselt Route, Hauptmann desertiert, Abwanderung, Kriegsmüdigkeit (APPROVED, 4 Fragen 🔶 E21). **Stand 08.10. (Claude):** ✔ Scheibe N2 „Abwanderung der Arbeit wegen“ + Leerstand-Fix (Ankündigung, Bündel, Umstimmen mit Gold/Siedlung; ⚖ Frage 4 = ja). **Stand 09.10. (Claude):** ✔ N3 Kriegsmüdigkeit/Deserteurbanden (E21; Fehlt-Rest im Protokoll). ✔ N1 Händlergedächtnis (09.10. Claude). **Fehlt:** N1-Rest (Geleit für die erste Fahrt, Kutscher retten löscht einen Überfall), N4 Hauptmann desertiert | PROPOSALS/npc_eigene_ziele (Git c21fd64) |
| Orte beleben | Szenen an Schrein/Hain/Ruine, besetzte Städte mit anderen Bannern/Wachen, Fraktionsarchitektur. **Stand 08.10. (Claude):** ✔ Besitzer-Banner am Platz jedes Orts in Fraktionsfarben, wechselt mit dem Besitzer. **Fehlt:** neue Szenen (shrine, grove, Grenzwacht …; Risiko Welt-RNG → nur in game.js flüchtig bauen), Wachen besetzter Städte im Fraktionsrock prüfen, Architektur je Fraktion (T33 Rest) | §5g.35 / T33 |
| Akademie-Innenleben Rest | Bücher, Anklage wegen verbotener Magie | §5g.9 |
| Weitere Orte/Figuren | Lehrer Moorhexe, Himmelsinsel-Ratshändler, Prachtbauten nutzbar, Gefährten-Szenen untereinander, Kinder/Tiere als Stadtbevölkerung, Hausgeräusche. **Stand 08./09.10. (Claude):** ✔ Kinder (Familien), ✔ Stadttiere, ✔ Gefährten-Szenen, ✔ Hausgeräusche. ✔ (09.10.) Lehrer Moorhexe (Mutter Brakke, zwei eigene Zauber, nur nachts). ✔ (09.10.) Prachtbauten nutzbar (Bibliothek, Badehaus, Hospital, Observatorium). ✔ (09.10.) Himmelsinsel-Ratshändler (Corvan). **Fehlt:** Druidin als Lehrerin; Mord auf der Insel → Adelsheere per Luftschiff (N12-Rest) | §5g.11/15/30/36, T29/T32/T38 |
| Siedlung als Stadt | Stufen Lager→Stadt, Zuzug, Fraktionsreaktion, Lehen; Siedlung als Marktknoten/Landrecht (IDEAS 2/3, nicht freigegeben). **Stand 09.10. (Agent):** ✔ ⚖ Stufen Lager → Weiler (5 Bauten/4 Siedler) → Dorf (10/8), erreichte Stufe bleibt (`CAMP_TIERS`, `campTierCheck`); Banner mit Name + Stufe; Abgaben Weiler 3, Dorf 8 Gold/Tag (`campTribute`); Zuzug × (0,5 + Anziehung/100), Anziehung = Stimmung/2 + Schutz + Arbeit (`campAttract`, im Baufenster); Bote der nächsten Macht mit rufabhängigem Gruß (`campEnvoy`, flüchtig, `keepRng`); Chronik/Ortsgedächtnis; zwei Debug-Einträge, Probe. Baufenster zeigt jetzt die neue Stufe statt der alten Anzeige (`settleTier` nur noch Rückfall). ✔ (09.10., ⚖) Bote mit Angebot je Macht: Handelsrecht/Schutzbrief/Tribut (`envoyChoices`, `pactDay`). **Fehlt:** Stufe „Stadt“ (bewusst offen — braucht Lehen/T09/T23), Bote ist flüchtig (nach Laden weg, bis zum nächsten Aufstieg), im Spiel ansehen (🔍) | §5g.19/33, T34 |
| Weiler und Städte | Weiler je Welt (12–20), organische Stadtanordnung (🔶 E26), prozedurale Städte (später) | PLAN_OFFEN D |
| Welt ohne Quest beobachtbar | Beispiele §45: Schmied arbeitet, Kind läuft zur Mutter, Händler öffnet Laden, Wachenwechsel, Karawane kommt an, Kunde kauft, Familie isst, Betrunkener streitet, Bandit wird von Wachen kontrolliert | Spec §45 |

---

### P2 — Betriebe

**Leitbild (§26–32):** Gebäude zeigen, was darin passiert. Betrieb ist sozialer Raum, nicht nur ein Menü. Sichtbarer Eindruck zählt mehr als vollständige Wirtschaftssimulation.

#### P2.14–15 Schmiede sichtbar (◐)

Soll: Ofen, Feuer, Amboss, Werkbank, Werkzeuge, Waffen, Rüstungen, Rohmaterial, Metall, evtl. Lager, Schmied arbeitet. Animationen: Hammer auf Amboss, Feuer, Funken, Rauch, Schmied bewegt sich, Werkzeuge benutzt.

**Stand:** Props forge/hearth/chimney/anvil animiert; Arbeitsplätze mit Werkzeug (`act:'work'`).
**Offen:** Innenausstattung je Betrieb, Hammer-Funken nicht vollständig.

**Stand 08.10. (Agent):** Schmiedehof neben jeder Schmiede (`ensureSmithyYards`, flüchtig, nicht im Spielstand, nie vor Türen/auf Straßen; `yardOf` statt `house`, damit die Laufweg-Regel im Haus hält): Amboss, Waffenständer (Abgabeort des Schmieds), Löschtrog, Eisenbarren — 27 von 34 Schmieden (Rest: kein freier Boden). Meister an der Esse drinnen, Geselle am Hof-Amboss draußen (`JOB_AT.Schmied` forge → anvil → workbench). `hammerFx`: Funken und Metallklang bei jedem Schlag (vorher einmal je Arbeitsgang). Hof gehört der Schmiede (`houseOf`: Durchsuchen = Diebstahl). Debug „Schmiede: zum nächsten Schmiedehof“.
**Fehlt:** Innenraum bleibt 3 × 2 (Esse + Werkbank) — größere Schmiede-Grundrisse nur über die Welterzeugung (Entwicklerfrage); Rauch aus der Esse; Rüstungsständer-Sprite.

Der Spieler soll in der Schmiede: Waffen und Rüstung kaufen, eventuell Reparatur nutzen, Schmied beobachten, Kunden kommen und einkaufen sehen, Mitarbeiter arbeiten sehen.

#### P2.16 Kunden betreten Läden (◐)

Ablauf (§30): 1. Kunde betritt Gebäude → 2. geht zum Verkaufsbereich → 3. Mitarbeiter reagiert → 4. Kunde kauft → 5. Ware verschwindet bzw. wird als verkauft markiert → 6. Kunde verlässt Gebäude → 7. Mitarbeiter arbeitet weiter. Vereinfachung erlaubt.

**Stand:** `marketBuy` nur am Marktstand. **Fehlt:** Kundenlauf ins Gebäude, Ware-weg-Effekt, Mitarbeiter-Reaktion. ⛓ P0.6

**Stand 08.10. (Agent):** Vereinfachter Ablauf gebaut (`shopSpot`/`shopVisit`, Block `kv` in `dayTargetRaw`): Bewohner ohne festen Arbeitsplatz gehen an Nachmittagen mit alt = 1 (zwei von drei) in einen Laden ihres Viertels (≤ 35 Kacheln; heute Schmieden und Schenken — dort steht der Verkäufer drinnen), stellen sich zwei Schritte hinter die Tür, Verkäufer zeigt auf die Ware, „kauft …“ steigt auf, Stadtvorrat −1 (wie `marketBuy`), 2,6 s warten, dann gehen sie. Einmal am Tag; außer Sicht nur der Einkauf. 330 Bewohner haben einen Laden. Debug „Laden: Kunden jetzt (14 Uhr)“.
**Fehlt:** Bäckerei/Lager als Laden (dort verkauft man heute am Marktstand); sichtbares Verschwinden einer Ware im Regal; Kunden in Spieler-Betrieben.

#### P2.17 Mitarbeiter arbeiten sichtbar (◐)

Arbeiter-Phasen fetch/work vorhanden; in Spielerbetrieben nicht sichtbar. Beispiel Spielerschmiede: einer holt Metall, einer arbeitet am Ofen, Kunde betritt, schaut Waffen an, kauft.

**Stand 08.10. (Agent):** `ensureBizHands`: je angeworbenem Arbeiter eines eigenen Betriebs (höchstens 3) ein Gehilfe/eine Gehilfin vor dem Betriebsgebäude (`bizHouse`), mit Arbeitskreislauf (`CYCLE.Gehilfe`: Holz aus dem Lager holen, sägen, Werkzeug zum Ständer/Stand/Lager tragen) und normalem Tagesplan; flüchtig, beim Laden und nach dem Anwerben neu (Logzeile beim Anwerben). Infofeld: „arbeitet in deinem Betrieb (…)“ bei Gehilfen und bei Bewohnern, deren Beruf zum eigenen Gewerbe der Stadt gehört. Debug „Betrieb: Gehilfen neu stellen“.
**Fehlt:** Gewerbe ohne Gebäude (Hof, Jagd, Fischerei, Holz) haben keinen Ort für Gehilfen; Kreislauf je Gewerbe (heute ein gemeinsamer); Spieler bedient Kunden (P2.19).

#### P2.18 Prinzip auf alle Betriebe übertragen (◐, nach P2.14)

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

**Stand 08.10. (Agent):** Höfe/Vorplätze (`YARD_SETS`, `ensureSmithyYards` erweitert, flüchtig, `yardOf`) an Bäckerei (Backofen, Brottisch, Mehl), Schenke (Schankgarten), Heilerin/Apotheke (Kräutertisch, Kräuter, Beet), Lager/Kontor (Ware, Handkarren, Fass), Stall (Heu, Tränke, Wagen), Magitech (Werkbank, Zahnräder, Automat), Werkstatt in Wohnhäusern mit Handwerker/Böttcher (Hobelbank, Bretter — sie arbeiten jetzt draußen), Weber (Tuch, Zuschneidetisch): 556 Hofmöbel, keine neuen Figuren. Schankmagd der Stadtschenke bedient (Theke → Tisch, `CYCLE.Schankmagd`, `cycProps` counter/tavtable). Kunden gehen auch in Bäckerei, Lager, zur Heilerin (`SELL_IN`). Möbelregel im Haus unverändert grün.
**Fehlt:** Bionik-Werkstatt (Kybernetiker) und Schneiderei als eigene Gebäude gibt es nicht — nur Hof am Magitech-Werk bzw. Tuch am Wohnhaus; Stall ohne Tiere; Rauch/Teig/Brot als eigene Sprites.

#### P2.19 Spieler arbeitet im eigenen Betrieb (◐)

Spieler kann Betrieb betreten und arbeiten, produzieren, Waren herstellen, Kunden bedienen, Aufträge erledigen, Mitarbeiter beobachten, Produktion kontrollieren. Betriebe: Schmiede, Werkstatt, Taverne, Händler, Farm, Bäckerei, Alchemielabor, Bionik-Werkstatt.

**Stand:** Handwerk mit Qualität an Esse/Werkbank/Kessel; Betriebe-Reiter mit Kasse. **Fehlt:** Kunden bedienen, Aufträge. ⛓ Skills-Phase 4

**Stand 08.10. (Agent):** „Im eigenen Betrieb arbeiten“ an jedem Möbel im Gebäude/Hof eines eigenen Betriebs (`ownBizAt`, `bizWorkMenu`): Kunden bedienen (1 Stunde, 1 Stück + 1 je Kunde im Laden, höchstens 3, ⚖ 60 % Marktpreis in die Kasse, danach eine Stunde Pause, `bizServe`), Bestellung des Betriebs (⚖ 2–4 Stück, 3 Tage, Lohn = `ECO.orderPay`, aus dem Gepäck, `bizOrder`/`bizDeliver`), dazu die normale Möbelnutzung (Schmieden usw.). Kein rnd().
**Fehlt:** Gewerbe ohne Gebäude (Hof, Jagd, Fischerei) haben kein Möbel zum Arbeiten; Bestellung im Betriebe-Reiter anzeigen; Fertigkeit „Handel“ beim Bedienen; Produktion selbst steuern.

#### P2.x Weitere Betriebspunkte (☐)

- Kasse am Haus abholen (Betrieb → Haus) 🔶 E9; Verlusttage „erst Kasse, dann Gold" bestätigen 🔶 E8
- Betriebe in besetzten Städten ohne Meldung (SHF-06)
- Zollgesetz ohne Wirkung auf Überfälle (RB-010)
- Startlager unter Zielwert nachmessen (RB-055/058)
- Produktionsketten: Holz→Bretter, Erz→Metall→Waffe, Getreide→Mehl→Brot, Tier→Leder; Werkstücke mit Namen (`o.maker` wird nie gelesen) (MASTER_ROADMAP C.13, IDEAS 4)

**Stand 08.10. (Agent):** Werkstücke mit Namen ✔ — die Gegenstandskarte zeigt „Gefertigt von …“ auch ohne Gütestufe (Auftragsarbeit des Schmieds), im Gepäck und im Händlerfenster. **Produktionsketten gemessen (economy.js `TRADES`):** vorhanden Erz (Mine) → Barren (Schmelze, + Holz) → Werkzeug/Waffen (Schmiede, Feinmechanik) → Magitech; Holz (Holzfällerei) → Holzware (Werkstatt). **Fehlt:** Getreide → Mehl → Brot (Hof liefert Getreide, das direkt gegessen wird; Bäcker ist kein Gewerbe), Tier → Leder (Jagd/Stall liefern Felle, kein Gerber), Faser → Tuch (Weberei ohne Vorprodukt), Holz → Bretter (Holzware ist ein Schritt). Nur notiert, nicht gebaut.

**Abnahme (§51 Betriebe):** Mitarbeiter erscheinen und arbeiten; Kunden betreten und kaufen; Waren korrekt verarbeitet; Spieler kann betreten und arbeiten; Save/Load.

---

### P3 — Content (Gegner, Quests)

#### P3.20–23 Banditen- und Goblin-Rollen (◐)

**Regel (§15):** Eine Variante ist nur dann „neu", wenn mindestens eines davon sichtbar anders ist: Sprite, Kleidung, Rüstung, Waffe, Silhouette, Animation, Verhalten. Nur „HP +20, Damage +5" zählt nicht. Elite/Boss dürfen zusätzlich stärkere VFX und besondere Animationen bekommen.

**Banditen-Rollen:** Späher, Bogenschütze, Plünderer, Schläger, Söldner, Anführer, Fallensteller, Reiter, schwerer Bandit, Messer-/Dolchkämpfer (Spec nennt zusätzlich: Straßenräuber, Heiler/Spezialisten).

**Goblin-Rollen:** Krieger, Speerträger, Bogenschütze, Schamane, Plünderer, Berserker, Späher, Anführer, Techniker, Fallensteller, Sklave, Arbeiter. Je Rolle: anderes Outfit, andere Waffen, Körperhaltung, Farben/Details, Animationen, Verhalten.

**Pro Rolle definieren:** Sprite · Körperform · Helm · Kleidung · Waffe · Kampfverhalten · Animation · Kampfrolle.

**Stand 08.10. (Agent):** 12 Rollen gebaut, alle als Abart (`abart: { of, p }`) — erscheinen über Spawngebiete, Tiefhall und Gewölbe statt der Grundart und zählen für deren Aufträge. Banditen: Späher (Abart des Schützen), Schläger, Plünderer, Messerstecher, Schwerer Bandit, Bandenführer. Goblins: Späher, Bogenschütze, Schamane, Techniker (Abarten des Goblins), Speerträger, Berserker (Abarten des Goblin-Kriegers). Aussehen fest je Rolle (`sprites.js ROLE_LOOK`), Körperbau (`build`), Waffe (`game.js ROLE_WEAPON`), Verhalten `game.js roleAI` (Feld `rolle`) über vorhandene Haken (spearAI, archerAI, startHeavy, Fliehen, Anführer-Ruf); Merkmal + Konter beim ersten Treffen im Kampfprotokoll (`lore`). Debug „Gegner: Rollen-Galerie / Rolle spawnen / Banditen- bzw. Goblintrupp“, Probe „P3.20–P3.23 Rollen“. Später am 08.10. dazu: Fallensteller, Goblin-Anführer, Goblin-Arbeiter (15 Rollen); am 09.10. Söldner (echter Schild), Straßenräuber (Wegzoll-Dialog), Bandenfeldscher, Goblin-Plünderer (klaut Gold), Goblin-Fallensteller (20 Rollen). **Fehlt:** ~~Bandit Reiter~~ (**Stand 09.10. (Agent):** gebaut als berittene Räuber — `mountRider`/`riderFall`, render.js zeichnet sie mit `drawHorse` im Reitsitz; ⚖ 12 % der Räuber/Schützen/Speerträger in der Welt, ×1,45 Tempo; offen: Beutepferd ja/nein, eigene Reiterangriffe/Lanzenstoß, Abwerfen durch Stangenwaffen); Goblin Sklave (Sklaven gibt es als NPCs der Eisenfeste; der Arbeiter erscheint überall, wo Goblins spawnen, nicht nur in Eisenmark-Lagern); eigene Animationen je Rolle (heute: Haltung über Waffenklasse und Körperbau); Auftrags-Pools nach Rolle (§12) — Aufträge (`conPool`, Lager-/Streifen-Aufträge) wählen die Grundart direkt ohne `abartOf`, dort mischen sich die Rollen also noch nicht.

**Stand:** bandit 4 Typen, goblin 2 + Bosse; Werte-Varianten (`ENEMY_VARIANTS`), Look-Seeds. Rollen mit eigenem Verhalten fehlen.

**Questbezug (§12):** Gegner-Pools der Aufträge nach Rolle mischen. Nicht dreimal „5 Banditen" in derselben Region.

#### P3.24 Animationen (☐)

Neue Animationen für Rollen. Kampfanimation §17-Rest: Kampf-Idle, Kampfbewegung, Block/Parade-Haltung je Waffe, Ausweichen je Pack, Trefferreaktionen je Waffe, längerer Nachschwung, Ausholen mit Gewicht nach hinten. Schon gebaut (seit 04.10.): Profile aller Klassen, Gewicht, Oberkörperdrehung, Swoosh.

**Stand 08.10. (Agent):** Beine im Kampf von vorn/hinten korrigiert (Entwickler: „wenn man nach oben guckt, spreizt der Charakter seine Beine so komisch auf“) — statt Grätsche mit seitlich ausgeknickten Knien ein Ausfallschritt in die Tiefe (Fuß der Waffenseite vor, anderer zurück, kaum Spreizung), für Hieb, Kampfhaltung und Deckung; `fig5.js` `bodyPose`. **Fehlt:** Abnahme im Spiel durch dich; Schrägblick (Diagonalen) nutzt dieselbe Front-/Rückenpose.

**Stand 09.10. (Agent), §17-Rest geprüft:** schon vorhanden waren Kampfhaltung bei nahem Feind (`combatT`, Modus `ready`), Deckung je Waffenklasse (`anim.js STANCE.guard`, Schild am Nebenarm), Ausweichen je Pack (A Rolle, B Ausfallsprung, C Dash mit Nachbildern), Gewicht/Ausholen/Nachschwung (`WEIGHT`, Overshoot, späte Erholung). Neu: Trefferreaktion je Waffe (`anim.js hitKind/HIT_RX`, `game.js hit()` setzt `rx.w`, render.js: stumpf taumelt 380 ms mit Wanken, Klinge zuckt 160 ms, Stich weicht 300 ms doppelt so weit zurück) und Wiegen in der Kampfhaltung statt Atmen (fig5 `bodyPose`, i0/i1). Front/Rücken ohne Grätsche auch in Haltung und Deckung (Probe). Debug „Kampfanimation: Prüfstand“ und „Trefferreaktion am Helden“. **Fehlt:** ~~Kampfhaltung mit nach vorn gerichteter Waffe in der Frontansicht~~ ✔ 09.10., ~~Wiegen auch für Gefährten/Gegner~~ ✔ 09.10. (Cache gemessen: 10 Gegner × 4 Richtungen × 2 Bilder = 80 Bilder, 161 ms einmalig, ~2 ms je Bild; im Spiel nur die gesehene Richtung), ~~eigene Parade-Bewegung~~ ✔ 09.10. (Parade/Block: Waffe/Schild hoch und Rückstoß 220 ms, `parryT`); noch offen: Treffer-Varianten je Gewicht des Ziels, Stoßwaffen (Speer, Dolch) in der Front-Kampfhaltung bleiben gesenkt.

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

**Stand 08.10. (Agent Quests):** Vorhanden waren 12 Brett-Arten (Kopfgeld, Monster, Jagd, Verteidigung, Patrouille, Eskorte, Lieferung, Vermisst, Vorräte, Kräuter, Spurensuche, Lager) plus Gerüchte (Schatz/Bestie/Deserteur/Bande/Groll/Erzfeind — deckt „Gerücht untersuchen“, „Gegenstand finden“), Schmuggel, Spuk, Karawanen-Überlebende. **Neu:** „Schuld eintreiben“ (Soziales: Schuldner im eigenen Ort; überzeugen = Willenskraft + W6 ≥ 14 wie im Hexenprozess, drohen = wie Wegelagerer einschüchtern, Beziehung −15, oder selbst zahlen, Beziehung +15; abgewiesen = erst morgen wieder) und „Nachricht mit Antwort“ (Transport mit Rückweg: Brief an eine echte Person im Nachbarort, Antwort nach 2 Std., Abgabe nur mit Antwortbrief). Ziel ist eine echte Figur, der Kartenpunkt folgt ihr; stirbt sie, ist der Auftrag hinfällig (ohne Rufverlust). Häkchen-Liste je Schritt im Auftragsbuch (J), auf dem Zettel am Brett und im Tracker (`CON[k].steps`, `conProg`). Geber ⚖: Wirtin + Händlerin → Schuld, Gräfin/Edelfrau/Gelehrter → Brief. Messung `conMix` (Debug „Aufträge → Zieltypen je Region zählen“, Hochrechnung 30 Tage Brett + Wache + Geber):

| Region | Aushänge | Arten vorher → nachher | §11-Gruppen vorher → nachher | häufigste Art vorher → nachher |
|---|---|---|---|---|
| Grünmark | 360 | 12 → 14 | 5 → 6 (Soziales 0 → 9) | Jagd 22 % → 17 % |
| Ebene | 580 | 12 → 14 | 5 → 6 (Soziales 0 → 14) | Jagd 27 % → 22 % |
| Aurelion | 490 | 12 → 14 | 5 → 6 (Soziales 0 → 11) | Lieferung 23 % → Kopfgeld 19 % |
| Sumpf / Ödland / Wald | 280 / 120 / 180 | 12 → 14 | 5 → 6 (Soziales 0 → 7 / 3 / 4) | Jagd 21 → 17 %, Vorräte 18 % → Jagd 20 %, Jagd 31 → 30 % |
| Wüste / Gebirge | 100 / 50 | 8 / 4 (unverändert) | 4 / 2 | Lager 19 %, Monster 26 % |

(Letzte Spalte: zweite Messung nach einem Neuladen; die Geber-Auswahl je Ort hängt am aktuellen Bewohnerstand und schwankt zwischen Ständen leicht. Kampf bleibt mit 40–55 % die größte Gruppe, Soziales ist mit 2–4 % noch klein.) **Stand 08.10. Runde 2 (Agent Quests):** ⚖ (Koordinator) Schulden/Briefe auch an Orten mit festen Artenlisten, wenn dort mindestens drei Leute leben (`conPeople`): Karak-Atar ja (12 flüchtige Basarleute, Ziel wird über Name|Beruf wiedergefunden — `conWho`), Dünenwacht nein (dort stehen nur 4 Sandreiter auf Posten), Tiefhall nein (die Halle ist leer, bis man sie betritt). Messung Wüste: 8 → 10 Arten, Soziales 0 → 5 %. „Verletzte eskortieren“ gibt es jetzt als Kriegsauftrag (siehe Quests ↔ Welt). **Fehlt:** „Streit lösen“, „Handel vermitteln“, Wirtschafts- und Geheimnis-Arten am Brett; Gegner-Pools nach Rolle (P3.20–23); feste Questreihen (27 Blätter) unverändert.

**Abnahme (§51 Quests):** Unterschiedliche Questtypen funktionieren; Wiederholungsmuster nachweislich reduziert (Zählung der Zieltypen je Region vorher/nachher).

#### P3.x Weitere Content-Punkte (☐)

- **Quests ↔ Welt:** Krieg erzeugt Aufträge (Schmuggel in belagerte Stadt), Kette mit Handelskontakt; toter benannter Geber lässt Quest offen. **Stand 08.10. (Agent Quests):** Schmuggel geht jetzt auch in eine belagerte Nachbarstadt (`smuggleContract`, vorher nur besetzte); neu `woundedContract` „Verwundete aus X geleiten“ (Eskorte mit umgekehrtem Weg ab der gefallenen Stadt, `C.from`, Tempo 0,75 ⚖). Geprüft, was beim Tod eines Gebers passierte: Verträge (Brett/Bewohner) wurden schon hinfällig ohne Rufverlust; **feste Aufträge benannter Figuren blieben für immer offen** (Abgabe nur beim Toten). Jetzt `questHeirTick`/`heirChoices`: liegt sein Grab und lebt er nirgends mehr, übernimmt ein Bewohner desselben Ortes (dem Grab am nächsten) und zahlt; sonst gescheitert (⚖). `S.questHeir` im Spielstand. **Stand 09.10.:** Nachfolger trägt das Abgabe-Siegel (`giverMark`), Kompass/Tracker/Karte zeigen auf ihn (`questPoint`), Probe erweitert. **Fehlt:** Kette mit Handelskontakt; Aufträge mit Schritten an den Toten selbst (z. B. Gespräch mit ihm als Ziel) prüft niemand. **Stand 09.10. (Agent Quests) — Kette mit Handelskontakt gebaut (⚖):** Die vorhandene Kette Karawane überfallen → Überlebende (Kutscher heimbringen) → „Die Ladung zurückholen“ (Lager der Bande) → geraubte Ladung endet jetzt mit einem **Handelskontakt**, wenn die Ladung ans Kontor zurückgeht (`b.coachman` → `bandLoot.who` → `tradeContact`): Namenskarte „HANDELSKONTAKT“, Chronik; der Kutscher schreibt alle 3 Tage ⚖ einen **Handelsbrief** (`tradeContactTick` im 0,9-s-Takt) mit den Preisen der zwei Städte, deren Preise der Held am längsten nicht kennt (`ECO.notePrices` → `S.priceSeen`: Pfeile/Vergleich im Handels-Dock), und nennt je Stadt die billigste Ware. Höchstens 3 Kontakte ⚖; kein Rabatt (Preisformel bleibt beim Städte-Agenten); gefallene Stadt → kein Brief. `S.tradeContacts` im Spielstand (fehlt in alten Ständen = keiner). Debug „Handelskontakt: Kette abschließen …“. **Fehlt:** Kontakt als Figur im Ort ansprechbar (Gesprächshaken liegt bei `talk`, Claude-Haupt); 🔍 ganze Kette einmal live durchspielen.
- **Gegner:** 14 nicht gewählte Gegnerideen (🔶 E5); Mutanten als Reise-Hinterhalt, Blutschöpfer-Regel, Werte neuer Gegner (🔶 E6)
- **Bosse:** Intros Graumähne/Karrak/Blutfürst; Kerkerausbruch und Ankunft Aurelheim als Szene; eigener Beutepool Graumähne/Karrak (7 Karten gebaut). **Stand 08.10. (Agent Quests):** Intros Graumähne und Karrak gebaut (BOSS_CARDS `alpha`/`sandlord`, Karte nach Boss-Kennung `rboss` statt Gegnertyp — `bossCardKey`; Wolf knurrt statt zu zeigen, Karrak spricht; Welt steht, einmal je Held). Blutfürst: Aldhelm hatte schon einen eigenen Krypta-Auftritt (`aldhelmAI`, Kerzen, Satz, Karte) — geprüft, nichts doppelt gebaut. Debug „Boss-Auftritt vorspielen“ kann jetzt auch Regionalbosse. ⚖ Untertitel und Karraks Satz. **Fehlt:** Kerkerausbruch/Ankunft Aurelheim als Szene, eigener Beutepool Graumähne/Karrak.
- ◐ **Sternenhimmel kürzen (Entwickler 08.10.: „Der Fähigkeitenbaum soll bisschen gekürzt werden, da sind locker 20–30 Trees“):** Gemessen: ein Held ohne Klasse sah 25 Sternbilder (Wanderer + 18 Klassen + 6 Titel, alle übrigen versiegelt). **Stand 08.10. (Agent):** sichtbar nur Wanderer + erlernte Klassen + Titel + Sternbilder mit gelernten Sternen (typisch 1–4); der Rest zugeklappt unter „Weitere Sternbilder“ mit Bedingung; Hinweis beim ersten Öffnen; Debug „alle zeigen“; Probe. Keine Knoten gelöscht, also keine Erstattung nötig. **Fehlt / offen ⚖:** Zusammenlegen ähnlicher Bäume (Barde+Kettenbarde, Kleriker+Dunkelpriester, Paladin+Dunkelpaladin, Schurke+Assassine, Schütze+Waldläufer+Kettenjäger, Krieger+Ritter+Berserker) — nicht gebaut, weil jede Klasse an ihr Sternbild gebunden ist (Klassenprüfung, `grants`, 8-Sterne-Proben je Klasse); braucht deine Entscheidung, ob Klassen selbst zusammengelegt werden sollen. Doppelte Allerwelts-Sterne (z. B. „Rüstung +2“ in 11 Bäumen, „Leben +5 %“ in 14) könnten dann gestrichen werden — mit Punkte-Erstattung in `continueGame`.
- ◐ **Rüstungsvielfalt R1–R7:** Zustand sichtbar, improvisiert, Fraktionsregel, Rarität-Kante, Set-Hände/Beine, 7 Teile ohne Look (visual/ruestungen.md). **Stand 08.10. (Agent):** R7 Set-Hände/-Beine und die 7 Teile ohne Look waren schon gebaut (sprites.js `HAND_LOOK`/`LEG_LOOK`, `ARMOR_LOOK` „R7-Lücken“). Neu: R1 Politur bei neu, Dellen/Kratzer ab Abnutzung 1, Risse bei 3, Rost je Metallart (fig5 `wear`); R5 Zierkante je Rarität (Spec-Feld `rr`, fig5 `rarityEdge`); R2 Miliz improvisiert (Steppwams, Kochtopf-Helm `pot`); R4 Schilde in `FACTIONS.colors`, Deserteur mit zerrissenem Valen-Rock. Prüfstand im Debug, Probe „Rüstungsvielfalt R1/R2/R4/R5 + N4 S3“. **Stand 09.10. (Agent):** R3 Schrittklang je Rüstung (sfx.js `step` mit Material: Platte klirrt, Kette rasselt, Leder knarzt, Stoff leise; game.js `stepMat`/`stepSound`/`stepNear` — Held und höchstens zwei laufende Figuren im Umkreis 150 px, leiser); R4 Helmform je Fraktion für Wachen (sprites.js `varyPeople`: Valen/Zwerge Nasal, Kette Kesselhut, Händler Beckenhaube, Wüste Tuch, Freie Kappe), Erkennungsband für Räuber und Seevolk (Schärpe in `FACTIONS.colors[1]`), Rangzeichen am Helden (`badgeOf`, Spec `bdg`, fig5 `endgame`: Brosche in der Fraktionsfarbe ab Rang 2, Goldrand ab Rang 4, höchster Rang zählt); R6 eigene Bossrüstungen (`BOSS_LOOK` für Varg, Garmadon, Todesritter, Hrodvar, Hauptmann der Toten — Spieler-Sets nur noch Rückfall). Probe „Rüstungsvielfalt Rest + Aurelion-Rest + Banditen-Reiter“, Prüfstand um 4 Zeilen erweitert. **Fehlt:** R3 Kontrastregel; R4 eigene Helmform für Orden und Aurelion-Menschen (heute Nasalhelm wie Valen) und für Soldaten, die nicht als Wache gelten; R5 Affix-Zeichen; R6 Phasenbruch (Rüstung bricht in Bossphasen); R2 Siedler/Freie und improvisierte Rüstung als Gegenstand (offene Entscheidung); Schrittklang für Reittiere (Hufe).
- **Ressourcen-Sprites** mit Abbauzustand; 38 Knoten auf Fels (A-04) (§5g.3 / T14)
- **Geheime Orte Rest:** Uhrmacher, Leuchtfeuer, Walknocheninsel; zweite Gischtinsel/Seevolk-Orte; Wasservolk (🔶 E25). **Stand 08.10. (Agent Quests):** Uhrmacher, Leuchtfeuer und Walknocheninsel nach Entwurf `geheime_orte.md` §2.4/2.7/2.8 gebaut (`SECRETS` jetzt 8; `clockDoor`, `lightTower`, `walknochenChoice`, `secretTick4`, `secretTalk`; Walknocheninsel = verstecktes Gewölbe `VAULTS.walknochen` mit Boot am Nebelsteg, `enterVault` zählt den Fund). Je Ort Umgebungs- und Wissensweg, kein Kartenmarker vor dem Fund. ⚖ vereinfacht: Leuchtfeuer nur 3 Holz (kein Lampenöl im Spiel), Boot sofort statt „in der nächsten Nebelnacht“, Walknochen-Wahl Seevolk ±10 statt Rang-Prüfungen (Seevolk hat keinen Ruf je Clan), Fernrohr +20 % Kartensicht. 🐞→✔ Geheimort-Props (Glockenpfähle, Kreidezeichen, Lanze, Türen) standen nicht in `interactables()` — mit E nicht benutzbar; jetzt alle `secret`-Props. **Stand 09.10.:** Bauplan im Uhrmacher-Hort → Meisterin Vell baut das Modul „Uhrmacherhand“ (300 Gold ⚖; `MECH_MOD.uhrmacherhand` in body.js: −10 % Nahkampf, Güte +1 wie Königseisen in `craftItem`); grünes Leuchtfeuer als Lichtquelle (render.js `lightOf` ein Eintrag `e.beacon` + grüner Lichtstich), vor dem Fund nur in Nebelnächten. **Fehlt:** Energiezelle alle 3 Tage für die Uhrmacherhand (kein Energiezellen-System, T15), Güte-Vorschau im Handwerksfenster (`craftChances`) rechnet die Hand noch nicht ein, vierter Schiffskurs; zweite Gischtinsel, Wasservolk.
- **Dungeons:** Rätsel/Fallen vertiefen, Gewölbe-Events (**Stand 08.10. (Agent Quests):** in `buildVault` mit eigenem Zufall `r3` — Runentür (drei Runensteine, Folge aus der Inschrift, `VAULT_RUNES`, `runeTouch`), Pfeilfalle (loser Bodenstein, Wahrnehmung erkennt, E entschärft; `dartFired`/`dartDisarm`, Schaden über den vorhandenen Fallen-Weg), Einsturz (Warnung, 3,5 s, Schaden an allen im Raum; `vaultTrapTick`). ⚖ Anteile 35/30/25 %, Schaden. **Fehlt:** weitere Ereignisse, Fallen für Gegner sichtbar machen); Aurelion sichtbar (Laternen, Automaten-Streifen, Kräne, Fabrik); Expeditionen, Krankheiten-Modell, Weltgeheimnisse ohne Marker
- **Story:** „Ende der Brüder"-Ideen (🔶 E29); Eisenfeste zerstört → Goblins zu den Untoten; Totenland bei der Schwarzen Feste leer (BUG-143)
- **Bossgespräche** (Weißbart, Garmadon) als Story-Fenster; Bewohner rufen den Helden; Szene bei Story-Abschluss; Hinweis auf seltene Beute (🔶 E10). **Stand 08.10. (Agent Quests):** Story-Fenster gab es schon (beide Bosse tragen `parley`, `dlgStory` macht daraus das breite Fenster — live und per Probe bestätigt; Weißbarts Namensschild hat keinen Untertitel, weil er keine Fraktion hat). E10 ⚖ gebaut: `heroHail`/`heroHailTick` — nach einer Tat aus `DEEDS` rufen beim nächsten Siedlungsbesuch (7–21 Uhr) bis zu drei Bewohner, jubeln, einer nennt das Unikat eines lebenden Story-Bosses (`BOSS_LOOT`); einmal je Tat, eine Szene am Tag, alte Taten nicht nachgefeiert. **Fehlt:** eigene Kamerafahrt bei Story-Abschluss (heute Blasen + Gesten), Untertitel für Weißbart im Namensschild, Entscheidung E10 bestätigen.
- **Welt-Ereignisse** mit Namenskarte + Ton (`bigAnnounce` nur Log/Toast) — Details E22, entschieden 02.10. **Stand 08.10. (Agent Quests):** gebaut — alle neun großen Ereignisse zeigen eine Namenskarte mit Glocke nebenbei (`worldCard`/`worldCardTick`, Warteschlange: wartet auf Kamerafahrt, Gespräch, Fenster, Heldentod, Prolog); Kriegsereignisse (Ort gefallen — außer Varonheim, das seine Szene hat —, Ort befreit, Schlacht) halten die Welt mit Karte + Horn/Glocke/Trommel kurz an (Kamerafahrt mit `pause`, ohne Text, läuft von selbst). Toast nur noch, wo keine Karte geht (Koop-Gast). Probe + Debug „Regie (T17)“. ⚖ Klänge, Kriegskarte 3,4 s. **Runde 2:** Ereignis-Pins in entdeckten Gebieten für alle laufenden Ereignisse (`eventPins`: großes Ereignis, Feuer, Spuk, Anomalie, Sternenfall, Schlacht), Fraktionsgrenzen waren schon dezent; Brand, Spuk, Anomalie, Meteor als Namenskarte. **Stand 09.10.:** Wallfahrt, Kreuzzug, Opferfest, Flüchtlingswelle, Magitech-Unfall, Erbstreit mit Namenskarte und Pin (`S.refugeeWave` 2 Tage, `S.magiAcc` bis die Fabrik läuft — beide nicht aus Proben gesetzt). **Fehlt:** Ratssitzung, Parade, Spuk-Ende u. ä. weiter nur Log. **Stand 09.10. (Agent Quests):** Ratsbeschluss („BESCHLUSS DES HOHEN RATES“ / „DER RAT LEHNT AB“, mit Thema und Stimmen, nach der Abstimmungsfahrt), Parade der Sonnenlegion (mittags in Aurelheim, Horn) und Spuk-Ende („DER SPUK IST VORBEI“, in `conProgress`, einmal je Spuk) zeigen eine Namenskarte; dazu „HANDELSKONTAKT“. Ereigniskarten erscheinen im Koop auch beim Gast. Probe „Ereignis-Reste 09.10.“ (Karten über `S._cardSink`, nur in Proben). **Fehlt:** nichts Bekanntes aus E22; weitere kleine Ereignisse nur bei Bedarf.
- **T17 Szenen 3/4:** Hrodvar-Frost, Garmadon-Herzschlag, Hinrichtung am Galgen, Goblinsturm Sieg/Niederlage (**Stand 08.10. (Agent Quests):** nach `t17_regiebuch.md` §3.2/3.3/3.6/3.8 gebaut — Hrodvar: Frostring im Boss-Auftritt (`BOSS_CARDS.hrodvar.ice`); Garmadon: `garmadonScene` beim Kampfbeginn (3 Herzschläge, Hof kniet, Welt steht, Legion danach); Sieg: `stormWonScene` (jubeln, Dodon „Morrgrund singt.“, erst danach heim — auch beim Überspringen); Niederlage: 3 Gräber + einmal „Morrgrund brennt“ nach dem Erben (`morrFallTick`); Galgen: `gallowsTick`/`gallowsScene` in Varonheim mittags (live, Ausrufer am Morgen). ⚖ Galgentag (Ablieferung gestern/heute oder Tag % 7 = 3), keine Ruf-Folgen. **Stand 09.10.:** Heimweg zu Fuß gebaut (`stormHome`, `stormHomeTick`: marschieren nach Morrgrund, verschwinden dort oder außer Sicht). **Fehlt:** Licht-Beats (`light amb`), Flüchtlinge nach Grubenhort); T20-Rest (Heimweg, Gräber, Aufstand als Kolonne); Goblin-Befreiung dynamisch; Luftschiff-Absturz mehrstufig

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

#### P4.29 Marktplatz-Performance (◐)

Nicht einfach NPCs entfernen. Reihenfolge der Hebel (§49): Culling → LOD → vereinfachte Simulation → Tick-Raten → Pathfinding → Event-System → Animationen → Partikel → Rendering → Kollisionsprüfung.
Konkret (perf/PLAN.md): 3-ms-Marke belegen; Hebel paintR-Schwall, nearEnts, tierOf; Bild-Cache-Größe; Lauf-Bilder vorbacken.

Gesamt-Skalierung (§48) betrachten: Welt (NPCs, Gegner, Gebäude, Animationen, Partikel), Stadt (NPCs pro Viertel/Platz, aktive NPCs, Wegfindung, Interaktionen), Kampf (Gegner, Projektile, AOE, Partikel, Hit Detection), UI (Questlisten, NPC-Daten, Inventare, Shops).


**Stand 08.10. (Claude):** ✔ Abschnitts-Zeitmesser für `update()` (Debug „Leistung: update-Abschnitte messen“, `RF.prof(true)`). Messung Varonheims Hauptmarkt mittags (2061 Akteure, 135 Bewohner im heißen Radius): vorher update Median 4,4 ms / 95 % 10 ms (think 2,8 ms); Ursache: ruhige Bewohner bis 1150 px dachten jedes Bild, sichtbar sind nur ~±600 px. ✔ Ruhige Bewohner/Kinder über 900 px denken jedes 3. Bild (mittlere Stufe) → update Median 1,7 ms / 95 % 5,1 ms (think 1,5 ms); Zeichnen ~3 ms. ✔ Spitzen-Ursache gefunden: `sealTick` → `giverMark` → `conGiverOk` baute die Geberliste alle 2 s je Ort über alle ~17 000 Karteneinträge (6–13 ms) → jetzt über die ~2 000 Akteure (`actorsOf`). Danach (Spiel, nicht Testmodus) Median 2,6 ms, 95 % 6,1 ms; `think` schwankt 1,5–2,2 ms. Stresstest Fest Varonheim (19 Uhr): update Median 2,2–4 ms, 95 % 5,7–12,8 ms; seltene Spitzen 15–36 ms im Abschnitt Akteure/Wagen bzw. Sekundenhaken — Neuaufbau der Akteursliste selbst nur 1–2 ms, Rest vermutlich Speicherbereinigung/Karawanen-Wegsuche (ohne Profiler nicht trennbar). **Fehlt:** Spitzen mit dem Browser-Profiler zuordnen (🔍 im echten Fenster: F12 → Leistung); restliche Spitzen in `think` prüfen; Messung im echten Fenster (Bereich war verborgen); Bild-Cache-Größe, Lauf-Bilder vorbacken.
#### P4.31 Save/Load (◐)

Tests für Tutorial, Familien, Betriebe, Städte; Spielstand-Versionierung / zentrale Felddefinition; alte Savegames laden ohne Fehler.

**Stand 09.10. (Claude):** ✔ Probe „Prolog Speichern“ (Stand mitten im Prolog, Neubau beim Laden), ✔ Probe „P4.31 Spielstand“ (flüchtige Welt der neuen Systeme — Kinder, Strohsäcke, Stadttiere, Banner, Moorhexe, Bündel, Einflug-Wanderer — nie im Stand; dauerhafte Felder lesbar); Betriebs-Bestellungen und Skills haben eigene Speicherproben der Agenten. Jeder Selbsttest lädt den alten Sicherungsstand (`rotfall.backup.s14c`) = Probe „alter Stand lädt“. **Fehlt:** echter Rundlauf Speichern → Laden → Vergleich im Selbsttest (heute nur über Debug „Größe messen und Rundlauf prüfen“); zentrale Felddefinition/Versionierung.

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
| 1 Skill Core | Generisches System: SkillDefinition, Level, XP, Meilensteine, Perks, Meisterschaften — zunächst nur 2–3 Skills testen | ◐ — Vorhanden: `p.skills` (Waffenübung, Schleichen, Jagd, Schmieden, Handel, Führung …, 0–100, wachsen durch Nutzung), Handwerksqualität, Sternbild-Talente. **Erweitern, nicht neu bauen (Spec §57)**. **Stand 08.10. (Agent):** `SKILL_DEF`/`SKILL_MS` (data.js: Gruppe, Meilensteine mit echten Freischaltungen für Einhändig, Stangenwaffen, Schmieden, Fischen), Stufe = Wert/2, `gainSkill` (Meldung nur an Meilensteinen), `perkVal`/`wperk` (Ausdauer, Erholung, Parierfenster, Wuchtstoß, Güte, sparsam), `combatXpMul` (Gegnerstärke, harmlos ¼, abnehmend am selben Ziel ab Treffer 9), Fenster Charakter → „Fertigkeiten“, Legacy: Fertigkeiten sterben mit, `S.legacy.recipes` (Hauswissen) bleibt; Debug §54, Probe „Skill-Core Phase 1“. ⚖ E39 Sterne bleiben, E38 Katana nicht gebaut. **Fehlt:** Meisterschaften/Herausforderungen (Phase 6), Spezialisierungen (Phase 5), Meilensteine für die übrigen Skills, Animationsänderung je Stufe (§52) |
| 2 Kampf-Skills | Katana, Schwert, Speer/Stangenwaffe, Bogen; danach Architektur prüfen, dann ausrollen | ☐ — Katana existiert als Waffenart nicht → 🔶 E38 |
| 3 Gathering | Fischen, Holzfällen, Bergbau, Sammeln (+ Kräuterkunde, aktive Jagd) | ◐ — Jagd und Kräuter vorhanden, Bergbau-Tiefe fehlt. **Stand 08.10. (Agent):** Fischen als Minisystem (`fishUse`/`fishCatch`, Angel am Marktstand): auswerfen → warten → „Biss!“ → Anschlagen im Zeitfenster → Fang; Gewässer Fluss/See/Küste/Sumpf (`waterKind`) mit je 2 + 1 seltenen Fischen, Fertigkeit Fischen mit Meilensteinen 5/10/15, Anti-Grind je Platz und Tag, Beutel am Haken (§36), Fisch → Fischsuppe (Kessel). Probe „Fischen“. Dazu (Agent, später am 08.10.): Holzfällen, Bergbau, Kräuterkunde als Fertigkeiten (`gatherTree`/`gatherNode`, Meilensteine 5 schneller · 10 Härteres · 15 Nebenfunde · 20 Seltenes; Kräuterkunde 10 erkennt seltene Pflanzen an festen Stellen), Werkzeugstufe getrennt (`toolTier`), Diminishing Returns je Ort/Tag (`gatherMul`), Ereignisse §36 je 3 (`gatherEvent`), Rutenstufen. **Fehlt:** Schnurspannung, Köder, besondere Gewässer, Höhleneingang als Bergbau-Ereignis (braucht Kartenlogik), tiefere Minen als Bergbau-Exploration, aktive Jagd-Spuren |
| 4 Crafting | Schmieden, Kochen, Alchemie | ◐ — Qualität nach Skill vorhanden. **Stand 08.10. (Agent):** Kochen als eigene Fertigkeit (`RECIPES.sk/cook/secret`, Meilensteine 5/10/20), 5 Gerichte mit kurzen Wirkungen (Zustand „meal“, `elx` summiert Elixier + Mahlzeit), Entdecken über Rezeptzettel/Kochbuch (Schenke), Experimentieren (Kessel-Fenster, `cookExperiment`), Hauswissen `S.legacy.cook`; Werkzeugstufen §32–33 (`ttier`, `toolTier`: Axt/Spitzhacke/Angel einfach → gut → Stahl, Rezepte an Esse/Werkbank), getrennt von der Fertigkeit. Probe „Sammeln und Kochen“. **Fehlt:** Alchemie als Skill, Güte je Gericht (heute: mehr Portionen), Händler mit Rezepten außerhalb der Schenke, Werkzeug-Haltbarkeit, Klang je Werkzeugstufe (§53) |
| 5 Spezialisierungen | Skill Trees Combat/Gathering/Crafting | ☐ — Verhältnis Sternbild-Talente ↔ Spezialisierung klären (🔶 E39) |
| 6 Meisterschaften | High-Level-Ziele und Herausforderungen | ◐ **Stand 09.10. (Agent):** `SKILL_DEF[k].master` (data.js) für Einhändig, Stangenwaffen, Schmieden, Fischen, Bergbau — ab ⚖ Stufe 40 offen (Meldung), Prüfung an `onKill`/`masteryKill`, `smithDeeds`, `fishCatch` (Alter vom Grund), `gatherNode` (Tiefe), bestanden: Titel, Meisterhaltung (Perk), Chronik; `p.masteries` stirbt mit der Figur; Fenster zeigt Prüfung/Titel; Debug „Meisterschaft: freischalten“. **Fehlt:** Meisterschaften für die übrigen Skills, Spezialanimation/-combo (§11, §52), Duell gegen einen benannten Meister-Duellanten |
| 7 Weltintegration | Einfluss auf NPCs, Händler, Betriebe, Quests, Fraktionen, Wirtschaft, Städte, Ressourcen, Legacy; Skill-Hubs, Trainer/Bücher, Anti-Grind, Fenster, Meilenstein-Meldung, Debug | ◐ **Stand 09.10. (Agent):** Lehrmeister in 4 Skill-Städten (`TECHS`, `ensureTrainers`, Lehrpult `trainerMenu`: Technik gegen Stufe + Aufgabe, kein Gold gegen Stufen) — Tiefhall (Schmieden, Bergbau), Salzhafen (Fischen), Haselbrück (Holz), Gelenkhall (Feinwerk/Bionik); Bücher (`use:'book'`, `p.books`: Erzkunde, Kräuterbuch); „Skills erzeugen Geschichten“: guter Schmied → einmalige Anfrage eines Waffenhändlers (Lieferauftrag, `smithDeeds`). Anti-Grind, Fenster, Meldungen, Debug aus Phase 1/3. **Fehlt:** weitere Geschichten (Adel, Fraktion, Banditen wollen die Schmiede ausrauben), Trainer-Aufgaben als echte Aufträge statt Material, Einfluss auf Fraktionen/Preise, Kräuterkunde-Lehrer, Aurelion-Bionik als eigene Fertigkeit |

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
T23 Fraktionsressourcen (✔ S1–S5 09.10., ⚖ s. E37) · T12 Straßen haben Herren (✔ B1–B3) · eigene Karawane ausbauen · Luftschiffe (V7/V8, Piraten) · Stadtwerte (Sicherheit/Kriminalität) · Alchemie-Handel/Fallen · Aurelion-Industrie · Wiederaufbau mit Material · POIs. Quellen: PROPOSALS/t23, t12.

### P5 — Expansion Totenland (☐, Entwickler 08.10.2026: „das Untotenland soll eine große Expansion bekommen“)

**Ziel:** Das Totenland im Osten wird ein vollwertiger, großer Spielraum statt Randgebiet — eine Zivilisation der Stillen („keine Monsterschar — sie haben Städte, Gesetze und Geduld“), die man bereisen, verstehen, bekämpfen oder der man dienen kann.

**GATE zuerst (REGELN_UND_SPECS §A):** Ist-Analyse (was gibt es: Vharnholm, Nekropole, Alt-Vharn, Schwarze Feste, Garmadons Gruft, Totenland-Region/Gegner, Fraktion `undead` mit Rängen, Fraktions-Start „Diener der Stillen“, Totenpakt, Seelenphiolen, Morvaths Heerzug, BUG-143 „Totenland bei der Schwarzen Feste leer“) → Impact-Report → Fragen an den Entwickler (Umfang, Kartenfläche/Weltgenerierung, Ton). Danach in Scheiben bauen.

**Mögliche Bausteine (Vorschlag, nicht entschieden):**
- **Städte der Stillen:** Vharnholm wächst zur Totenstadt mit Vierteln (Knochenhandwerk, Seelenschreiber, Grabgarten), weitere Orte (Grenzposten, Beinhaus-Dorf, Nekropolen-Hauptstadt); Bewohner mit Tagesablauf, Gesetzen, Märkten (Seelen/Knochen/Grabgut als Währung oder Ware).
- **Landschaft:** eigene Teilregionen (Aschenebene, Knochenwald, Gräberschluchten, Totensee), Wetter (Aschenregen), Musik/Ambiente, Geheimnisse ohne Marker.
- **Fraktion spielbar machen:** Rangweg der Toten mit Prüfungen, eigene Aufträge (Seelen bergen, Lebende „überzeugen“, Grenzposten halten), Konflikt mit Orden/Valen, Diplomatie.
- **Gegner/Figuren:** mehr untote Vielfalt mit Rollen (Spec §15), Elite der Stillen, Nekromanten-Hof, Bossreihe bis Garmadon.
- **Story:** Garmadon und sein Hof, die Wahl zwischen Leben und Stille als Folgefaden zum Prolog.
- **Dungeons:** Gruftnetz, Beinhäuser, Seelenbrunnen.
- **Technik:** Kartenfläche (Weltgenerierung: neue `rnd()`-Aufrufe verschieben die Welt → nur über eigenen Seed-Zweig wie Insel/Himmelsinsel), Leistung, Spielstand-Migration.

**Stand 08.10. (Agent Quests, GATE — kein Code):** Ist-Analyse, Impact-Report, drei Varianten und Fragen fertig (Bericht `agent_p5_totenland.md` im Scratchpad). Messung: Totenland (`deadland` + `blight`) = **311 040 Landfelder ≈ 24 % des Festlands** — schon groß, aber fast leer: 1 Stadt mit Stadtplan (Vharnholm, 22 Bewohner, 11 Häuser), **Schwarze Feste ohne Häuser** (nur 4 flüchtige Hof-Figuren — BUG-143 bestätigt), 42 NPCs, 312 Gegner (223 davon im Osten), 35 Orte (17 davon Streuorte), **0 Aufträge** (`conKinds('vharnholm') = []`), im Osten kein Kriegsknoten. Vorhanden: Ränge 0–4, Fraktions-Start, Totenpakt, Seelenphiolen, Morvaths Heerzug, Garmadons Gruft, 10 feste Aufträge (Morvath, Sael, Ysra, Vhal), 29 untote Gegnerarten. Der Osten wird schon **ohne `rnd()`** erzeugt (`extendEast`/`totenland`, Hash) — guter Ansatzpunkt. Varianten: **A klein** (BUG-143, Aufträge der Toten, Lager im Osten), **B mittel** (A + Totenstadt mit Vierteln/Markt/Gesetzen, zweite Stadt über eigenen Seed-Zweig, Rangprüfungen, Teilregionen, Gruftnetz), **C groß** (B + Kriegsgraph Osten, Diplomatie, Story-Bogen, Bossreihe). **Empfehlung: B in Scheiben, A zuerst.** **Fehlt:** Antworten auf E40 (Abschnitt 6) — gebaut wird erst danach.

**Stand 08.10. (Agent Quests) — Variante A gebaut (◐, ⚖ Koordinator, E40 noch offen; keine Kartenerweiterung, kein Kriegsgraph):** (1) **BUG-143 behoben:** `buildKeepHouses` setzt beim Laden vier Gebäude in den Mauerring der Schwarzen Feste (Kaserne, Seelenkapelle, Knochenschmiede, Beinhaus; Kacheln + `HOUSES` + Möbel aus `FURNISH`, Weg Tor → Thron frei), `ensureBlackKeep` stellt vier Wachen dazu (flüchtig, nur solange die Toten die Feste halten). Welt außerhalb der Feste nachweislich unverändert (Kachel-Prüfsumme vorher/nachher gleich); world.js unberührt. (2) **Knochentafel in Vharnholm** (`ensureDeadLife`, `boardOf: 'vharnholm'`): Arten `souls` (3 Irrlichter), `robbers` (Grabräuber), `message` (Brief zu den Lebenden), `stake` (Grenzpfahl); Ruf an die Toten (`C.fac`); `boardShut` nennt ohne Rang/Pakt den Grund und den Weg. (3) **Zwei Lager der Stillen** (Gräberfeld, Grabwacht): Knochenfeuer, Zelte, Grabgut-Händler, Wache, Streife (`deadLifeTick`). Hinweise beim ersten Blick, Debug „Welt: Totenland (P5 Variante A)“, Probe „P5 Variante A …“. ⚖ Fristen 3/4/3 Tage, Händler handelt mit jedem, Grenzpfahl flüchtig, Lager unabhängig vom Krieg. **Stand 09.10.:** `deadReactTick` — nach Garmadons Tod sind die Lager geräumt (auch beim Laden), bei Valens Belagerung stehen vier Mauerwachen mehr in der Feste ⚖. **Fehlt:** Bewohner mit Tagesablauf in den Festungsgebäuden, gespeicherte Grenzpfähle, alles aus Variante B/C (wartet auf E40).

**Stand 09.10. (Agent Quests) — E40 beantwortet (groß/C, ENTSCHEIDUNGEN §5h), Scheiben S1–S4 und S6 gebaut (◐, ⚖ Zahlen):** (S1) **Totenstadt Vharnholm:** Lebende brauchen ein **Totensiegel** — Siegelmeister Orm vor dem Südtor oder Grenzposten am Knochentor, gegen 1 Grabsiegel (5 Tage) / 1 Seelenphiole (3 Tage) / 2 Grabgut (2 Tage), kein Gold; Schar (Rang, Pakt, Gefolgschaft) und Ratsbeschluss „Bürger“ brauchen keins, „Verhasst“ bekommt keins. Ohne Siegel hält eine Wache an (Siegel abgeben / gehen = vor das Südtor / bleiben = Kampf, Tote −10). **Gesetze der Stillen:** Maske (Gesichtstuch, Masken-, Henkers-, Pestkapuze, Schädelhelm, Totenkrone; 1 Minute Schonfrist, dann eine Mahnung je Minute im Blick einer Wache), Schweigen 7–19 Uhr (ruhende Bewohner nicht ansprechen), kein Blut (neues Kopfgeld bei den Toten = Entzug sofort); 3 Mahnungen = Entzug, Ausweisung, 3 Tage Sperre. Handel/Aufträge bleiben Schar-Sache. **Nachtleben:** Bewohner um 12 Std. versetzt. **Viertel:** Seelenschreiberei, Knochenschnitzerei, Beinhaus (Stadtwachstums-Weg, ohne Zufall, flüchtig) + Grabgarten. (S2) **Beinhausen** zwischen Gräberfeld und Seelenhügel (Ort auf der Karte, 4 Häuser, 6 Figuren, Knochenfeuer, Knochentafel), neue Auftragsart **Gebeine heimholen** (6–10 Knochen, 20 + 4 Gold je Knochen), **Grenzposten am Knochentor**; Osten bleibt ohne Kriegsknoten. Seelen/Knochen/Grabgut als Marktgüter kommen aus E40.5 (economy.js `DEAD_GOODS`) — hier nur als Bezahlung/Auftragsgut genutzt. (S3) **Nachfolge nach Garmadon** (1 Tag danach): Feste gehalten → **Thronstreit** Veyl gegen Morvath, Rückhalt täglich Veyl +1 (Feste hält) / Morvath +1 (+1 ab 6 Kriegsknoten der Toten), Seelenphiole +3, nach 7 Tagen gewinnt der Stärkere (Gleichstand Veyl), fällt einer, gewinnt der andere; **Regent Veyl** = Waffenruhe (Ruf Tote ≥ −40), Lager zurück; **Totenkönig Morvath** = Heere wachsen wieder, Heerzug wieder möglich (sim.js). Feste verloren oder beide Anwärter tot → **Fürstentümer** (Nachtweide/Vharnholm, Asela Knochenkron/Beinhausen, Grauhand/Grabwacht), kein Heerzug, Fehde alle 3 Tage (Chronik), **Treueschwur** (1 Seelenphiole) = Schar (Ruf ≥ −20), auch für den Königsmörder. Alles flüchtig + idempotent (`keepRng`), gespeichert nur `S.deadPass` und Flags (`deadWarn`, `deadBan`, `deadSucc`) — fehlen in alten Ständen ohne Folgen. Proben „E40 S1/S2/S3/S4/S6“, Debug „Welt: Totenland groß (E40 S1–S4, S6)“, MECHANIKEN-Abschnitt. (S4) **Rangprüfungen der Stillen:** Knien allein hebt den Rang nicht mehr — Adept 3 Aufträge der Toten, Grabgebundener 6 Aufträge + 3 Seelenphiolen (Garmadon nimmt sie), Todesritter 1 gelungener Überfall mit Sael + 3 Seelenphiolen, Kommandant wie bisher Eisenfeste; gezählt in `S.flags.deadTrial` (`claimContract` bei Aufträgen der Toten, `takeVillage`), alte Ränge bleiben; Garmadon nennt das Fehlende, `rankGuide` die Prüfung. (S6) **Gruftnetz:** vier `VAULTS` mit `net: 'gruft'` — Schädelstollen (Schädelwald, offen, Stufe 3, 2 Ebenen), Gräberschlucht (Gräberfeld, 4/3), Seelengruft (Seelenhügel, 4/3), Gruft der Ersten Stillen (Totenruinen, 5/4); der Hort jeder Gruft deckt die nächste auf, die allgemeine Kartenfolge der geheimen Gewölbe lässt das Netz aus; Hinweis am Schädelstollen, Chronik beim letzten Hort. **Fehlt (Scheiben S5, S7–S9, siehe E40-Zeile):** Teilregionen mit Bild/Klang/Aschenregen (render.js/sfx.js), Bossreihe + Elite (Figuren-Agent), Story-Bogen + Diplomatie, Kriegsgraph Osten (erst nach Messung); außerdem: Fürsten-Fehden nur als Chronik (keine Kämpfe in der Welt), Gast im Koop unterliegt den Gesetzen nicht (nur der Held wird geprüft), Bewohner der Festungsgebäude ohne Tagesablauf.

### Fraktionen (☐)
Fall Aurelions als Weltereignis (T40/§5g.8) · Kriegsgraph mit Aurelion/Diplomatie · Belagerung S3b–d (🔶 E18) · T15 Messing (Stigma Bionik, Energiezellen) · Bionik im Krieg (🔶 E19) · Luftbrücke (🔶 E20) · A-10-Rest (Innenkarten/heimatlose Reisende → Valen) · gleichwertige Rangvorteile aller Fraktionen · Morrgrund-Fragen (🔶 E24) · Karraks Wüste (🔶 E27) · Fit-Befunde (🔶 E33) · Hunt-Reste ohne Code-Marker (HB-24/25/27–31/34/35/43–47) · Dynastien als Politik · Stigma für weitere Fraktionen.

### Koop (☐)
Gast-Handel per Dock (Adapter tradeUI ↔ shopData; **BLOCKIERT**) · HB-30 · Ersatz-Lebensbalken beim Gast · Live-Test Kampfanimation/Klänge/Fenster · Aufladen des schweren Hiebs für Gäste · Gäste immer Mensch (🔶 E17).

**Stand 09.10. (Agent Quests):** (1) **Ersatz-Lebensbalken (E2, 5 s):** `hurt()` merkt sich beim Host, wen eine Gastfigur zuletzt traf (`lastHitId/lastHitAt`); die „self“-Nachricht schickt das Ziel 5 s lang mit, der Gast setzt damit `R.focus.last` (`guestHitBar`) — derselbe Balken wie beim Helden. (2) **HB-30/F-07:** Gastkauf/-verkauf läuft jetzt über `buy`/`sell` des Hosts, nur mit Gastfigur und Gastbeutel an Stelle von Held und Heldengold → Stadtlager auch bei Ausrüstung, `onItemGained`, Handel-Fertigkeit der Gastfigur (live: 4 → 4,3), Auftragsgegenstände bleiben; gesperrte/gebundene Teile unverkäuflich (Zeile „gesperrt, unverkäuflich“), ab Selten zweiter Klick „Wirklich verkaufen“; Gepäck-Tausch beim Gast (14) und beim Host (16) blättert jetzt seitenweise. (3) **E17 ⚖ (Koordinator, vorläufig ja):** Gasthelden sind immer Mensch (`makeGuestHero` setzt `race`), Gefährten anderer Rassen sind im Warteraum nicht wählbar (`partyList`/`admit`); die Fraktions-Starts (Untote, Zwerge …) waren in der Gast-Erstellung schon ausgeblendet. (4) **Neu:** Ereigniskarten (E22) gehen an alle Gäste (`coopHooks.card` → Nachricht `card`, Namenskarte + Glocke/Horn, ohne Pause); Trefferklang beim Gast (vorher stumm — nur Bild und Partikel kamen an). (5) **Live-Test 09.10.** mit `?coopLocal` in zwei Tabs (Host + Gast, Speichersperre in beiden, echter Stand danach byte-gleich zum Backup): Gast erstellt Figur → Mensch, läuft (+640 px), kämpft (Bandit fällt, Ersatzbalken zeigt das Ziel, Blut/Treffer/Ring-Partikel, eigene Schwung-Animation), öffnet I/C/M (B bleibt dem Host), Karte „KOOP-PROBEKARTE“ erscheint beim Gast, Kauf (300 → 260 Gold, Lager 3 → 2), Verkauf Zweihänder mit Rückfrage (260 → 510), Brot gesperrt; Gast trennt → Figur geparkt. Prolog: ein Gast, der in ein laufendes Spiel kommt, landet direkt in der Welt (kein Prolog). Debug „Koop: Attrappen-Gast steuert den nächsten Gefährten“ / „… trennen“. **Gast-Handel per Dock bleibt BLOCKIERT — Grund geprüft:** `tradeUI`/`trPaint` (ui.js) lesen direkt am lebenden Händler und am eigenen Helden (`A.shopStock(npc)`, `A.price`, `buyQuote` an einer Kopie, `S.player.inv`, `S.gold`, `S.priceSeen`, Ziehen/Mehrfachverkauf rufen `trBuy`/`trSell` → `A.buy`/`A.sell` lokal). Der Gast hat davon nur die Momentaufnahme `shopData` (flache Listen mit Preis/Zahl) und rechnet nichts. Nötig wäre eine Datenquelle als Parameter für `tradeUI` (Ware, Gepäck, Gold, Kaufen/Verkaufen als Rückrufe) — ein Umbau des Host-Handelsfensters (UI-Bereich) mit Rückfallgefahr; so schon am 02.10. vom Lead als BLOCKIERT gemeldet. Bis dahin bleibt die Dialogliste (jetzt mit HB-30). **Fehlt:** Dock-Adapter (Entscheidung, wer `tradeUI` umbaut); Aufladen des schweren Hiebs für Gäste; Schwung-Klang (nur Trefferklang); Live-Test mit echtem WebRTC über zwei Rechner; E17 endgültig.

### Technik (☐)
- ✔ 08.10. (Claude) SC-01 `buildVaronburgOld` entfernt (36 Zeilen); ✔ SC-03 Debug „Varon: Diener-Schmuggel“; ✔ RB-028 `deleteSlot` verwirft ein ausstehendes Speichern des gelöschten aktiven Platzes (landete sonst im Legacy-Platz)
- ✔ 08.10. (Claude) SW-01: 7 Stellen `AUREL_HOUSES/COUNCIL.find(...).name` mit `?.` und Ersatznamen; SW-02: Probe räumt `ITEMS.__wall` jetzt per try/finally
- RB-012 Kutschen-Probe, RB-033 (🔶 E31), RB-059 Nachmessung
- ✔ 08.10. (Claude) Musik je Region: erzeugte Phrasen je Region (Tonleiter + Stimme, Laute in Orten, Hall), Optionen „Musik“ und „Kamerafahrten“. Offen: Kampfmusik/Spannung, Boss-Themen
- Touch auf Gerät; Tastenbelegung
- Doppelte Bodenauflösung (🔶 E28)
- game.js modularisieren (23k Zeilen)

### Audit 04.10. Rest (◐)
- 3.16 `addRep()` zentral (32 direkte Schreibstellen) — **Stand 09.10. (Agent):** gemessen sind es **239** Schreibstellen auf `S.factions` (87 mit der Formel `clamp((alt || 0) + n, -100, 100)`, 36 ohne Klammer `+=`/`-=`, 116 sonstige: feste Werte, `Math.max/min`, Goblins bis 300, Erbe-Faktoren). `addRep(f, n, lo, hi)` + `REP_HOOKS` gebaut (Verhalten gleich, Probe „Audit 3.16“); **81** Formel-Stellen umgestellt. **Fehlt:** 6 Formel-Stellen in Vharnholm/Garmadon/`die` (fremdes Arbeitsgebiet, bewusst nicht angefasst), die 36 `+=`-Stellen (Umstellung ändert Verhalten: dort gibt es heute keine Grenze ±100 → 🔶 Entscheidung: klammern ja/nein), sonstige Sonderfälle; Rang-Prüfung/Log-Haken erst nach Entscheidung in `REP_HOOKS`.
- Phase-4-Abnahmeprobe „Erbe" (alle Felder gegen die Tabelle) — **Stand 09.10. (Agent):** Erbe-Regeln aus `adoptSuccessor` in `heirRules(old, heir)` herausgelöst (Verhalten gleich), Abnahmeprobe „Erbe“ prüft jede Zeile (Gold, Ruf gut/Hass, Kopfgeld + Schuld, Bann, Rang, Schein, Hausgunst, Titel, Zauber, Betriebskassen, Ruhm, Pferd, Gefährten, Fertigkeiten/Meisterschaften/Techniken sterben mit, Hauswissen bleibt). 🐞→✔ Doku-Abweichung: MECHANIKEN §1 und IST §9 sagten „50 % Ruf“, der Code (Audit 3.13) halbiert nur guten Ruf, Hass bleibt zu 80 % — Doku angepasst. Code-Abweichungen: keine gefunden.
- Phase 5: Gold-Senken (Betriebssteuer, Unterhalt, Bank) — **Stand 09.10. (Agent):** gemessen (Stand s14c, Tag 4): Tagesgewinn je Betrieb (35 % des Warenwerts − Lohn) Median 5, Schnitt 12, beste 126 Gold (Magitech Aurelheim), Amortisation der besten 52–68 Tage; Aufträge 10–100, Lieferaufträge 69–276 Gold. Gebaut ⚖: Betriebssteuer 10 % vom Gewinn (`ECO.BIZ_TAX`, `bizTax`, Summe in der Tagesmeldung, `S.eco.taxPaid`), Hinterlegung im Kontor (`bankDeposit`/`bankWithdraw`/`bankMenu`, 3 % Gebühr, kein Zins; Erbe bekommt das Hinterlegte ganz — 🔶 Entscheidung: ist das gewollt?). Probe „Gold-Senken“. **Stand 09.10. (Agent, später):** ✔ Unterhalt ⚖: Betrieb 2 Gold × Stufe/Tag (`ECO.bizUpkeep`, vor der Steuer, `S.eco.upkeepPaid`, in der Tagesmeldung), Siedlung 1 Gold je 3 fertige Bauten (`campUpkeep`, sonst Moral −2, Hinweis beim ersten Mal). ✔ Goldfluss 30 Tage gemessen (IST_ZUSTAND-Anhang): zwei starke Betriebe 2902 → 2990 Kasse (Unterhalt 120, Steuer 299 — Unterhalt fällt kaum ins Gewicht), Median-Betrieb 44 nach 60 Unterhalt (halbiert). Probe „Unterhalt und Siedlung als Stadt“. **Fehlt:** Siedlungs-Goldfluss im Spiel messen (🔍, s14c hat keine Siedlung), Zins ja/nein; Garmadon als Hauptauftrag mit `q_omega`; `factionAgenda` für alle; zweite Lehrer Frost/Blitz/Schatten/Glaube/Paladin; Zerlegen; Boss-Intro/Beute Graumähne/Karrak; Rohstoff-Dubletten
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
| 08.10. | P1.x NPC-Ziele N2 (Abwanderung + Leerstand-Fix) | ✔ ⚖ 🐞→✔ | `announceLeave`, `leaveChoices`, `leaveToSettlement`, `S.vacant` (spawnResidents überspringt), `migrationDay` zählt `poorDays`. Bestätigter Altfehler: ausgewanderte Einzelbewohner standen nach dem Laden wieder im Haus. ⚖ Zahlen 5 Tage/25 %/7 Tage/2 je Tag/30 Gold/14 Tage, Frage 4 (Siedlung) = ja |
| 08.10. | P4.29 Marktplatz-Leistung | ✔ 🔍 | Zeitmesser je Abschnitt in `update()`; heißer Radius für ruhige Bewohner 1150 → 900 px (`tierPut`): Varonheim-Markt update 4,4 → 1,7 ms (Median). 🔍 im sichtbaren Fenster nachmessen |
| 08.10. | P1.x Stadttiere + Probe-Fix | ✔ ⚖ 🐞→✔ | `ensureTownAnimals` (Hühner am Feld, Katzen an Schenke/Haus, Hofhund am Platz; Sprites vom Agenten Figuren); `preyAI`: Stadttiere/Vieh fliehen nicht mehr vor Bewohnern, Suche nur noch in `combat` statt in allen Karteneinträgen. „Duell im Kreis“ wackelte (zufällige Trefferzone) → Probe trifft fest den Rumpf. 🐞→✔ Beutetiere zählten in `foesNear`/`inFight` als Feinde — ein Hofhund am Platz hätte Kutsche/Rast gesperrt; Hirsche ebenso (Altfehler) |
| 08.10. | T33 Teil: Besitzer-Banner | ✔ ⚖ | `ensureOwnerBanners`/`ownerBannerTick`, Banner-Zeichnung mit `e.col`/Krone/Schädel (render.js); Probe Besitzerwechsel |
| 08.10. | P0.1 Schmiede-Moment | ✔ 🔍 | Wegweiser „Händler“: Kompass zur Schmiede (`tutorSmith`), Beobachtungs-Zeile beim Näherkommen, Schmied hebt den Kopf (Emote). 🔍 im neuen Spiel nach dem Prolog prüfen |
| 08.10. | P4 Technik: Musik je Region + Optionen | ✔ 🔍 ⚖ | `musicStep`/`mnote`/`echoBus` in sfx.js, Optionen Musik (Aus/Leise/Normal) und Kamerafahrten (Weiter/automatisch). 🔍 anhören — Lautstärke, Pausen, Stimmen je Region |
| 08.10. | P1.x N4 Stimmungs-Haltung | ✔ 🔍 | `moodIdleTick` alle 3 s (Gesten trauern/jubeln/abwehren, höchstens 2, nur Darstellung) |
| 08.10. | P4.29 Spitzen: Geberliste | ✔ | Messer feiner aufgeteilt (Minikarte/Reaktionen/Umgebungsszenen/Siegel); `conGiverOk` sucht in `actorsOf` statt in allen Karteneinträgen |
| 08.10. | P1.x/T38 Gefährten-Szenen | ✔ ⚖ 🔍 | `partyBanter`: Streit/Freundschaft/Neid/Trauer/Nacht/Totenland nach Zügen und Erinnerungen, Stimmung ±2, alle 2,5–4 min. Fehlt: Lagerfeuer-Anlass, Beziehungswerte zwischen Gefährten, T38-Rest (Automaten/Kettenwachen reden, Flüchtlinge mit Heimat, Akademie-Alltag, Abgang nur über Loyalität) |
| 09.10. | P0.1 Prolog: nur Nomade + eigene Tafel (Entwickler) | ✔ 🔍 | Seitenwahl entfernt (Gesandte nennen Beitrittsorte), Titel „Nomade“, Tafel `prologPanel` mit Schritten/Tasten/Haken, ausgeblendet in Kamerafahrten. Live geprüft: Überspringen → Nomade → Welt. Selbsttest 512/512 vor dieser Änderung; main = 9a47f09 |
| 09.10. | P1.x Hausgeräusche | ✔ 🔍 | `ambienceTick(…, house)`: Schenke/Schmiede/Kapelle/Bäckerei/Wohnhaus klingen drinnen eigen. 🔍 anhören |
| 09.10. | P1.x Lehrer Moorhexe | ✔ ⚖ | `ensureMoorhexe` (Moorland, Hütte, Kessel), Zauber `sp_leech`/`sp_bogmire` (data.js), Lehr-Regel `hexe` = nur nachts, ohne Beziehungs-Hürde; Probe, Debug. ⚖ Werte und Name |
| 09.10. | P1.x Prachtbauten nutzbar | ✔ ⚖ | `HALL_USE`/`hallOf`/`hallUse`: Bibliothek → Karte, Badehaus → Ausdauer/Heilung, Hospital → voll geheilt (2 h), Observatorium → 3 Orte nachts; Probe, Debug. ⚖ Preise |
| 09.10. | P1.x Himmelsinsel-Ratshändler | ✔ ⚖ | Corvan `shop` mit `ratPool()` (8 seltene/epische Waren, fest aus den Daten); Probe |
| 08.10. | P1.8 Rollen je Ort (Agent) | ✔ ⚖ | `roleOf`/`townRoles`, Infofeld „Rolle“, „Auftrag“ im Infofeld nur bei echten Gebern (vorher bei jedem Beruf mit Vertragsart), Debug Soll/Ist, Probe grün (Selbsttest 490/490). ⚖ Soll-Anteile 15/25/20/15/10/10/5 %. Messbericht: Familie+Mitarbeiter 75–90 % der Städte, Geber 2–6 %, Reisende ≈ 0 |
| 08.10. | P1.12 Märkte Varonheim + Verteilung (Agent) | ✔ 🔍 ⚖ | Drei Märkte mit Ständen (Haupt-, Lebensmittel-, Handwerksmarkt), Bewohner auf den Markt ihres Viertels, mittags/früher Abend verteilt, Fest nur jeder Zweite (höchstens 24) am Hauptfeuer. Varonheim Hauptmarkt Umkreis 8: mittags 36 → 9, 17 Uhr 15 → 6, Fest 173 → 26 (alle Figuren an echten Plätzen: 14 bzw. 29). Salzhafen mittags 42 → 18. Selbsttest 492/492. 🔍 Varonheim mittags und am Festabend ansehen. ⚖ FEST_CAP 24, Mittags-Drittelung, Schwelle 30 |
| 08.10. | P1.13 Treffpunkte (Agent) | ✔ 🔍 ⚖ | Brunnen, Tempel, Tor, Übungsplatz, Schenkentür je Ort; Bewohner nach Beruf/Alter am nächsten Treffpunkt (≤ 40 Kacheln), eigene Gesprächszeilen, Infofeld „trifft sich am …“. 🔍 Brunnen/Tor einer Stadt am Nachmittag ansehen. ⚖ Zuordnung Beruf → Treffpunkt |
| 08.10. | P2.14–15 Schmiede sichtbar (Agent) | ✔ 🔍 | Schmiedehof (Amboss, Waffenständer, Löschtrog, Eisen) neben 27 von 34 Schmieden, Geselle hämmert draußen, Funken + Klang je Schlag. Erster Versuch zählte die Hofmöbel als Hausmöbel („Phase 1 Häuser“ rot) → jetzt `yardOf`, Regel hält. Selbsttest 496/496. 🔍 Schmiede in Nordfurt um 10 Uhr ansehen |
| 08.10. | P2.16 Kunden im Laden (Agent) | ✔ 🔍 ⚖ | Kunden gehen nachmittags in Schmiede/Schenke, Verkäufer zeigt, „kauft …“, Vorrat −1, gehen wieder (einmal am Tag). ⚖ zwei von drei Einkaufsnachmittagen, Laden ≤ 35 Kacheln |
| 08.10. | P2.17 Gehilfen sichtbar (Agent) | ✔ 🔍 | Angeworbene Arbeiter eigener Betriebe erscheinen als Gehilfen mit Arbeitskreislauf vor dem Betrieb; Infofeld „arbeitet in deinem Betrieb“. 🔍 Betrieb kaufen, Arbeiter anwerben, hinsehen |
| 08.10. | P2.18 Prinzip auf alle Betriebe (Agent) | ✔ 🔍 | Höfe an Bäckerei, Schenke, Heilerin, Lager/Kontor, Stall, Magitech, Werkstatt (Handwerker/Böttcher arbeiten draußen an der Hobelbank), Weber; Schankmagd bedient Theke → Tisch; Kunden auch in Bäckerei/Lager/Heilerin. 556 Hofmöbel, keine neuen Figuren (Leistung). 🔍 eine Stadt um 10 und 14 Uhr ansehen |
| 08.10. | P2.19 Arbeiten im eigenen Betrieb (Agent) | ✔ 🔍 ⚖ | „Im eigenen Betrieb arbeiten“: Kunden bedienen (Kasse), Tagesbestellung 2–4 Stück aus dem Gepäck. ⚖ 60 % Marktpreis, höchstens 3 je Stunde, 3 Tage Frist. 🔍 Debug „Gewerbe hier übernehmen“ und ausprobieren |
| 08.10. | P2.x Werkstücke mit Namen, Ketten (Agent) | ✔ | „Gefertigt von …“ auch ohne Gütestufe; Produktionsketten gemessen (fehlen: Getreide→Mehl→Brot, Fell→Leder, Faser→Tuch, Holz→Bretter). Selbsttest 496/497 — rot nur „S13 Kutschen und Fähren“ (Gegner zufällig bei Nordfurt, `foesNear` sperrt die 2. Fahrt; nicht von diesen Änderungen) |
| 08.10. | Skills Phase 1 Skill-Core (Agent) | ✔ 🔍 ⚖ | `SKILL_DEF`/`SKILL_MS` (data.js), Stufe = Wert/2, Meilensteine mit echten Freischaltungen (Einhändig 5/10/20, Stangenwaffen 5/10/20, Schmieden 10/20/30), Zuwachs nach Gegnerstärke + abnehmend am selben Ziel, Fenster „Fertigkeiten“, Hauswissen-Rezepte im Erbe, Debug §54. Dabei 🐞→✔: „Handwerk“-Probe (Sparsam-Meilenstein veränderte Eisen in Proben → Freischaltungen nur bei eigener Arbeit, nicht bei Auftrag/Probe) und „Varonheim-Umbau S5“ (Kachelmitte y+0,5 lag je nach Zufall außerhalb, 12 % rot → Probe vergleicht Kacheln). ⚖ Stufe = Wert/2, alle Meilenstein-Zahlen, E39 Sterne bleiben, E38 Katana später. 🔍 Fenster Charakter → Fertigkeiten ansehen |
| 08.10. | Skills Phase 3 Fischen (Agent) | ✔ 🔍 ⚖ | Angel (Marktstand), auswerfen → Biss → Anschlagen (0,9 s), Fluss/See/Küste/Sumpf mit je 3 Fischen (1 selten ab Stufe 15), Anti-Grind je Platz/Tag, Beutel am Haken, Fischsuppe im Kessel, eigene Symbole (iconsR.js). ⚖ Bisszeit 2,5–6,5 s, Fenster 0,9 s, Werte der Fische. 🔍 an einem Fluss und an der Südküste angeln |
| 08.10. | Skills Phase 3 Sammeln + Phase 4 Kochen/Werkzeuge (Agent) | ✔ 🔍 ⚖ | Holzfällen/Bergbau/Kräuterkunde mit Meilensteinen, Werkzeugstufen (ohne/einfach/gut/Stahl) getrennt von der Fertigkeit, Anti-Grind je Ort, Sammel-Ereignisse; Kochen mit Entdecken (Rezept, Kochbuch, Experimentieren), 5 Gerichte mit kurzer Wirkung, Hauswissen. Selbsttest 511/511. ⚖ alle Prozente, Hiebzahlen (6 ohne Axt, 2 mit Stahl), Rezepte der Stahlwerkzeuge. 🔍 im Wald mit und ohne Axt fällen, Kessel-Fenster „Experimentieren“ |
| 09.10. | Skills Phase 6 Meisterschaften + Phase 7 Lehrmeister/Bücher/Geschichten (Agent) | ✔ 🔍 ⚖ | Meisterprüfungen für Einhändig, Stangenwaffen, Schmieden, Fischen, Bergbau (ab Stufe 40, Titel + Meisterhaltung); Lehrmeister mit Lehrpult in Tiefhall, Salzhafen, Haselbrück, Gelenkhall (Technik gegen Stufe + Material); Bücher Erzkunde/Kräuter; Schmied-Anfrage (Lieferauftrag). Probe „Skills Phase 6/7“ grün. Selbsttest 512/514 — rot „Phase 6 Untotenreich“ und „Bomben-Skelett“ (Gegner-KI/Untote, Arbeitsgebiet der anderen Agenten; im Lauf davor war Untotenreich grün, „Phase 2 Aufträge“ wechselt zufällig). ⚖ Stufe 40 statt 50, Prüfungsbedingungen, Techniken und Mengen. 🔍 Lehrpult in Salzhafen benutzen |
| 09.10. | Audit-Rest 3.16 addRep, Abnahmeprobe Erbe, Gold-Senken (Agent) | ✔ 🔍 ⚖ | `addRep` + 81 Formel-Stellen umgestellt (Verhalten gleich, Probe), 6 in fremden Gebieten und 36 `+=`-Stellen offen (🔶 klammern?). `heirRules` herausgelöst, Abnahmeprobe „Erbe“ grün; 🐞→✔ Doku sagte „50 % Ruf“ (Code: gut ×0,5, Hass ×0,8). Gold-Senken: Betriebssteuer 10 %, Hinterlegung 3 % Gebühr (Erbe bekommt Hinterlegtes ganz 🔶). `keepRng` (state.js): Lehrmeister/Gehilfen verschieben den Zufall nicht mehr. Selbsttest zuletzt 528/528 grün; „Schwierigkeit (S15 P12)“ war zweimal rot und dann grün (zufallsabhängig, Diagnose-Ausgabe ergänzt) |
| 09.10. | Unterhalt + Goldfluss 30 Tage, P1.x Siedlung als Stadt (Agent) | ✔ 🔍 ⚖ | Unterhalt Betrieb 2 × Stufe/Tag, Siedlung 1 je 3 Bauten (sonst Moral −2). Goldfluss 30 Tage (IST_ZUSTAND-Anhang): starke Betriebe kaum berührt, Median-Betrieb halbiert. Siedlung: Lager → Weiler → Dorf nach Bauten + Siedlern, Banner, Abgaben 3/8 Gold, Anziehung (Stimmung/Schutz/Arbeit) steuert den Zuzug, Bote der nächsten Macht; kein Lehen. Probe „Betriebe: Gewinn sammelt sich …“ an den Unterhalt angepasst. |
| 09.10. | E43a Ruf ±100, E43b/c Abgaben je Ort (Agent) | ✔ ⚖ | Alle 36 `+=`-Ruf-Stellen (34 game.js, 2 sim.js) und die `-100…300`-Schleifen über `addRep`; Goblins bis 300 (Sonderfall in `addRep`), Altstände geklemmt. Steuer/Gebühr je Ort nach Herr (`ECO.taxOf`), im Kontor, in der Hinterlegung und in der Tagesmeldung. Selbsttest 532/533 (rot nur „Ereignis-Reste 09.10.“, fremd: Handelskontakt). |
| 09.10. | E40.5 Totenware als Marktgüter (Agent) | ✔ ⚖ | Knochen, Seelenphiolen, Grabgut in `GOODS`; Totenorte erzeugen Knochen/Seelen und kaufen Grabgut, Grabräuber in Kreuzweg/Aschfurt, Lebende kaufen nur über Totenkundige; Schmugglerzüge nur mit Totenware. 30 Tage: 181 → 159 Züge, davon 5 mit Totenware (492 Gold). Selbsttest 535/535. |
| 09.10. | E38 Katana-Skill + Klingen; Bote mit Angebot (Agent) | ◐ ⚖ | Skill `katana` mit Leiter 5/10/15/20/25/30 auf vorhandener Mechanik (Rolle, Parade, Reichweite, Erholung), Meisterprüfung 40; drei Klingen (wtype `katana`) beim Salzbund; Bild/Animation beim Agent Figuren. Bote: Handelsrecht/Schutzbrief/Tribut je Macht (`envoyChoices`, `pactDay`, `st.pact` in `raidChance`/`raidSources`), im Baufenster. Selbsttest 537/540 — eigene Proben grün; rot „Sterne Scheibe 10“, „Balance-Runde Talentpunkte“, „Dunkle Klassen“ (Bereich E42 Sternbilder/Klassen, laufende Arbeit Agent Figuren). |
| 08.10. | P3.24 Kampfanimation Front/Rücken | ✔ 🔍 | Ursache: `fig5.js` `bodyPose`, Zweig vorn/hinten — Füße bis ±4 px gegrätscht und Knie per IK seitlich ausgeknickt (bei tiefer Kniebeuge ~7 px je Seite = Froschhocke). Jetzt Ausfallschritt in die Tiefe: Fuß der Waffenseite vor (S unten, N oben), anderer zurück (abgedunkelt), höchstens 1 px Spreizung, Knie verkürzt. Gilt für Hieb, Kampfhaltung, Deckung. Seitenansicht unverändert. 🔍 Hieb nach oben/unten im Test Room (Pack C) ansehen |
| 08.10. | P1.x Berufe erkennbar, besondere NPCs (Agent) | ✔ 🔍 ⚖ | `sprites.js` `PROF_MARK`/`profMark` (nach den Zufallsschichten): helle Schürzen für Wirt/Bäcker/Koch/Schankmagd/Magd, Lederschürze + freie Unterarme Schmied, Ding in der Hand ohne Waffe (`prop`, neu in SPEC_KEYS; gemalt in `fig5.js` `propR`): Hammer, Beil, Säge, Krug, Korb, Heugabel, Angel, Buch, Geldbeutel; Kiepe für Händler/Lagerknechte. Besondere Figuren (Story-Schlüssel, Fraktionsführung): Messingborte, fester Stand, roter Umhang wenn keiner. Debug „Figuren: Berufsgalerie“. ⚖ Zuordnung Beruf → Merkmal/Ding, Farben. Offen: Namenszug beim Hinsehen, Ding auch bei Händlerware (Stoffballen, Gewürzsack) |
| 08.10. | P1.x Stadttiere: Daten + Bilder (Agent) | ✔ ⚖ | `data.js` MONSTERS `dog` (Hofhund), `cat` (Katze), `chicken` (Huhn): prey, threat 0, faction beast, neu `town:true`; LOOT Huhn Fleisch 0,6. Bilder Stil R in `fig5.js`: Hund/Katze seitlich über BEASTR (Halsband, Katzenohren, Fahnenschwanz), vorn/hinten `paintPetNSR`; Huhn `paintFowlR` (seitlich/vorn/hinten, pickt bei Bild 3); je 4 Lauf-Bilder. `sprites.js` beastFrame leitet um; `render.js` malt sie als Tiere (vorn/hinten bei Auf-/Ab-Lauf, Fellvarianten). Probe „Sprites: alle Gegnertypen“ prüft alle 4 Richtungen × 4 Bilder. ⚖ Werte (LP, Tempo). **Offen (Claude):** Spawnen in Orten, Verhalten (nicht fliehen vor Bewohnern), Bestiarium-Liste in ui.js `BEAST_KEYS` |
| 08.10. | P3.20–23 Banditen- und Goblin-Rollen (Agent) | ✔ 🔍 ⚖ 🐞→✔ | 12 Rollen als Abarten (data.js MONSTERS, LOOT), Aussehen `sprites.js ROLE_LOOK` (+ Stil-F-Zuordnung), Verhalten `game.js roleAI`, Waffen `ROLE_WEAPON`, Rollen haben Größe der Grundart (render.js), Goblin-Rollen nach Befreiung friedlich (`isGoblinFoe`). 🐞→✔ Treffer auf jeden Anführer (Variante „Anführer:“) warf `attacker is not defined` in `hurt()` → `source`. Messung `RF.simFight` (Langschwert + Lederwams, je 4 Samen, smart / stand): Stufe 5 — Bandit 4,5 Tr/38 % · 2,8/18 %; Schläger 7/10 % · 5/32 % (3/4 Siege stehend); Plünderer 4,5/48 % · 5/18 %; Messerstecher 3/23 % · 2,3/27 %; Späher (Bogen) 1,8 Tr 20 % smart; Goblin 2,8/6 %; Goblin-Späher 1,3/3 %; Bogenschütze 3/11 %; Schamane 4,3/17 %; Techniker 4,3/9 % · 3,3/17 %. Stufe 10 — Schwerer Bandit 12/22 % · 8/27 % (nach Senkung LP 120→90, Rüstung 5→4); Bandenführer 8,5/34 % · 5,3/36 % (LP 110→90); Goblin-Krieger 3,5/44 %; Speerträger 3,3/27 % · 4/9 %; Berserker 4/47 % · 5,3/42 % (3/4 Siege, Schaden 12→11). ⚖ alle Werte und Anteile (Banditen 49 %, Goblins 41 %, Krieger 40 % Rollen). 🔍 Trupps im Spiel ansehen (Debug). Offen: Auftrags-Pools mischen die Rollen noch nicht (siehe P3.20–23 „Fehlt“) |
| 08.10. | P3.x Rüstungsvielfalt R1/R2/R4/R5 + N4 S3 Wunden-Pose + 3 weitere Rollen (Agent) | ✔ 🔍 ⚖ | fig5.js `wear` (Politur/Dellen/Risse/Rost je Metall, zerrissener Wappenrock), `rarityEdge` (Spec `rr`), Helmform `pot`, Wunden-Haltung aus Rig-Mischung (Spec `wd`, sprites.js `woundOf`, render.js Gegner-Spec-Cache prüft `wd`); sprites.js `PROF_MARK` Miliz/Deserteur, Schildfarben aus `FACTIONS.colors`. Rollen: Fallensteller (Fußangel als sichtbares Gefahrenfeld `spikes`), Goblin-Anführer (`leader`), Goblin-Arbeiter (kämpft nicht, flieht, ruft). Prüfstand „Rüstung: Prüfstand“, Debug „Wunde: nächste Figur“. ⚖ Fußangel-Schaden 6 + 0,6 × Stufe, Anteile (Fallensteller 6 %, Goblin-Anführer 5 %, Arbeiter 10 %). 🔍 Prüfstand ansehen. Nicht gebaut: siehe „Rüstungsvielfalt“ und P3.20–23 „Fehlt“ |
| 08.10. | Sternenhimmel kürzen (Agent) | ◐ ✔ 🔍 ⚖ | `sky.js skyVisible/skyHidden`: am Himmel nur Wanderer + erlernte Klassen + Titel + Sternbilder mit gelernten Sternen (vorher 25 für jeden Helden, jetzt typisch 1–4); Rest unter „Weitere Sternbilder (N, später freischaltbar)“ mit Bedingung; Hinweis beim ersten Öffnen (`S.flags.skyTidy`); Debug „Sternenhimmel: alle zeigen an/aus“ (`S.flags.skyAll`); Probe „Sternenhimmel gekürzt“. Keine Knoten/Punkte verändert. ⚖ Zusammenlegen von Klassenbäumen nicht gebaut — Entscheidung nötig (siehe Eintrag „Sternenhimmel kürzen“) |
| 09.10. | P3.24 Kampfanimation §17-Rest (Agent) | ◐ ✔ 🔍 ⚖ | Bestand geprüft (Haltung, Deckung je Klasse, Ausweichen je Pack, Gewicht waren da). Neu: Trefferreaktion je Waffe (stumpf taumeln / Klinge zucken / Stich zurückweichen; `anim.js hitKind/HIT_RX`, `hit()` → `rx.w`, render.js), Wiegen in Kampfhaltung (fig5 `bodyPose`). Probe „P3.24 Kampfanimation §17-Rest“, Debug-Prüfstand. ⚖ Dauern 380/160/300 ms, Weg-Faktoren. Fehlt: siehe P3.24 „Stand 09.10.“ |
| 09.10. | P3.24-Rest, Rohstoff-Abbauzustand, Aurelion-Laternen (Agent) | ✔ 🔍 ⚖ | (1) fig5 `armPlan`/`weaponAngle`: Front-Kampfhaltung Waffe vor der Brust, Spitze hoch; render.js Kampfhaltung auch für Gefährten und jagende Gegner; Parade/Block `parryT` (game.js `guarded`/Schildblock) → kurze Abwehrbewegung. Cache: 80 Bilder/161 ms für 10 Gegner in allen Richtungen. (2) render.js: Kerbe je Hieb tiefer, gefällter Baum → Stumpf (game.js `gatherTree` legt `stump` an; frisch/grau/Schösslinge), Geröll/abgeerntete Stängel, „wächst nach“ am letzten Tag (`regrowing`). A-04 „Knoten auf Fels“: Probe Erreichbarkeit grün (bestätigt). (3) game.js `ensureAurelGlow` (aus `ensureAurelion`): 75 Messinglaternen in 5 Städten, Schlote + Kran an Werkhallen; flüchtig, nicht fest, ohne Zufall (Probe prüft rnd-Stand). Proben „P3.24-Rest + Abbauzustand“, „Aurelion sichtbar überlegen“. ⚖ Stumpf-Stufen 2/6 Tage, Laternenabstand 8 Felder. **Fehlt:** nachwachsende Bäume (Designfrage: Holz als endliche Ressource?), ~~Automaten-Streifen-Optik~~, ~~Laternen nachts sichtbar ein-/ausgeschaltet~~ (beides 09.10. nachgezogen, siehe Zeile „Rüstungsvielfalt Rest + Aurelion-Rest“); offen bleiben eigene Laufwege und ein Lichtschein der Automaten-Augen |
| 09.10. | Hinken, N4 S2/S4, Rollen Teil 3 (Agent) | ✔ 🔍 ⚖ | (1) fig5 Wunden-Abschnitt: Gehen mit verletztem Bein → kürzere, flache Schritte, Körper sackt beim Auftreten ein; `woundOf` gilt jetzt auch für den Helden (nur Beine). (2) anim.js 6 Gesten (Stirn wischen, stützen, Münzen zählen, Rücken strecken, geduckt, Arme reiben), Rig in fig5 `rigS`/`rigW`, Stil D über `POSES`; game.js `jobIdleTick` (Takt 3 s über `moodIdleTick`, Math.random: Beruf 5 %, Wetter 12 %, höchstens 2). (3) Rollen `bandit_merc` (Schild über `shieldKey` → echte Block-Chance), `bandit_toll` (`tollParley`/`tollBreak`: Kette, Zoll 15 + 3 × Stufe, Bande wartet neutral), `bandit_medic` (verbindet), `goblin_thief` (stiehlt 5 + 2 × Stufe Gold, Rückgabe in `dropLoot`), `goblin_trapper`; Anteile angepasst (Schläger 0,12, Plünderer 0,10). Probe „Rollen Teil 3 + Hinken + Berufs-/Wetter-Haltungen“. ⚖ Zoll, Diebstahl, Anteile, Takt. **Fehlt:** Banditen-Reiter, Goblin-Sklave, Feilschen beim Zoll |
| 08.10. | P3.x Welt-Ereignisse mit Namenskarte + Ton (Agent Quests) | ✔ 🔍 ⚖ | game.js `bigAnnounce` → `worldCard`, neu `EV_CARDS`/`worldCardTick` (aus `update`, 0,9-s-Takt), `SIM.H.card`; sim.js Ort gefallen/befreit/Schlacht als Kriegskarte (Welt hält an). Probe + Debug „Regie (T17)“, live geprüft (Karte nebenbei, Kriegskarte pausiert und endet von selbst). 🔍 im Spiel hören/sehen. ⚖ Klänge Glocke/Horn/Trommel, Dauer 3,2/3,4 s. Offen: Karten-Pins (E22 Teil 2) |
| 08.10. | P3.25–26 Quest-Zieltypen (Agent Quests) | ✔ 🔍 ⚖ | Messung `conMix` vorher/nachher (Tabelle bei P3.25–26). Neu: `debt` „Schuld eintreiben“ und `message` „Nachricht mit Antwort“ (`makeContract`, `taskChoices`/`debtTalk`/`msgHand`/`msgAnswer`, `conProg`, `CON[k].steps`); Items `auftragsbrief`/`antwortbrief`; Häkchen-Liste in Auftragsbuch, Brett (`ui.js boardUI`) und Tracker. Probe grün, live: Bewohner ohne Gesprächsrolle öffnet das Fenster mit „Ich komme wegen deiner Schulden“. ⚖ Schuldsumme 30 + 20/Stufe + 0–40, Frist 4/5 Tage, Antwort 2 Std., Geber-Berufe |
| 08.10. | P3.x Boss-Intros Graumähne/Karrak (Agent Quests) | ✔ 🔍 ⚖ | BOSS_CARDS `alpha`/`sandlord`, `bossCardKey` (Boss-Kennung vor Gegnertyp), Tier ohne Zeigegeste; Blutfürst hatte schon seinen Krypta-Auftritt. Probe + Debug. 🔍 Auftritt in der Wolfsschlucht/Roten Wüste ansehen |
| 08.10. | Selbsttest (Agent Quests) | ✔ 🐞 | Letzter Lauf 497 Proben, nur „Duell im Kreis“ rot (bekannt wackelig); echter Held/Gold/Märkte/Chronik unverändert. 🐞 Ein Lauf davor hatte „Beziehungen (§79)“ rot (Rivalen gingen sich in `villagerDay` nicht aus dem Weg; Daten 821/821 in Ordnung), im nächsten Lauf grün — wackelig, Fehlerrunde. Ein Lauf mitten im parallelen Umbau brach in der Krieg-Probe ab (`H.spawnEnemy` fehlte), nach Neuladen nicht wieder |
| 08.10. | P3.25–26 Runde 2: Schulden/Briefe in Wüste/Gebirge (Agent Quests) | ✔ ⚖ | `conPeople`, `conWho` (flüchtige Ziele über Name/Beruf), `conKinds`. Karak-Atar ja, Dünenwacht/Tiefhall nein (keine Bewohner). Wüste 8 → 10 Arten. Probe grün |
| 08.10. | E22 Teil 2: Ereignis-Pins + weitere Karten (Agent Quests) | ✔ 🔍 ⚖ | `eventPins` (nur entdeckte Gebiete) für großes Ereignis, Feuer, Spuk, Anomalie, Sternenfall ≤ 3 Tage ⚖, Schlacht; Namenskarten für Brand/Spuk/Anomalie/Meteor. Fraktionsgrenzen waren schon dezent gefärbt (atlas.js). 🔍 Weltkarte bei laufendem Ereignis ansehen |
| 08.10. | P3.x Quests ↔ Welt (Agent Quests) | ✔ 🔍 ⚖ | Schmuggel auch in belagerte Stadt; neu „Verwundete aus X geleiten“ (`woundedContract`). Befund: feste Aufträge toter Geber blieben ewig offen → Nachfolger aus dem Ort (`questHeirTick`/`heirChoices`, `S.questHeir`) oder gescheitert. ⚖ Nachfolger-Regel, Tempo 0,75. Probe grün |
| 08.10. | P3.x Bossgespräche + E10 (Agent Quests) | ✔ 🔍 ⚖ | Story-Fenster für Weißbart/Garmadon gab es schon (bestätigt). E10: `heroHail` — Bewohner rufen und jubeln nach einer Tat aus `DEEDS`, einer nennt ein Unikat eines lebenden Story-Bosses. ⚖ Uhrzeit 7–21, eine Szene am Tag. 🔍 nach einem Bosssieg in eine Stadt gehen |
| 08.10. | Selbsttest Runde 2 (Agent Quests) | ✔ 🐞 | 505 Proben, alle Quest-Proben grün; Held/Gold/Märkte/Chronik unverändert. 🐞 fremd rot: „P3.20–P3.23 Rollen“ (Figuren-Agent, in Arbeit), „Handwerk (§5d.8)“, „Skill-Core Phase 1“, „Varonheim-Umbau S5 (Start)“ (`near` = Startviertel außerhalb/auf festem Feld, nicht die Aufträge: three/kept grün). Kurz stand die Rollen-Probe vor `sandbox` und brach den ganzen Selbsttest ab (vom Agenten selbst behoben) |
| 08.10. | Geheime Orte Rest: Uhrmacher, Leuchtfeuer, Walknocheninsel (Agent Quests) | ✔ 🔍 ⚖ 🐞→✔ | Nach Entwurf c21fd64 `geheime_orte.md` (aus `../_rf_backup.git`). 8 Geheimnisse. 🐞→✔ Geheimort-Props waren mit E nicht benutzbar (fehlten in `interactables`). ⚖ Vereinfachungen siehe Punkt. 🔍 Mittags an der Uhrmacher-Tür, nachts am Leuchtturm prüfen |
| 08.10. | T17 Szenen 3/4 (Agent Quests) | ✔ 🔍 ⚖ | Hrodvar-Frost, Garmadon-Herzschlag, Goblinsturm Sieg/Niederlage, Hinrichtung am Galgen (`stormWonScene`, `morrFallScene`/`morrFallTick`, `garmadonScene`, `gallowsTick`/`gallowsScene`). Probe grün. 🔍 Szenen ansehen (Debug „Regie (T17) → T17: …“) |
| 08.10. | Gewölbe: Runentür, Pfeilfalle, Einsturz (Agent Quests) | ✔ 🔍 ⚖ | `buildVault` + `VAULT_RUNES`, `runeTouch`, `dartFired`/`dartDisarm`, `vaultTrapTick`; Fallen-Weg in `controlPlayer` kennt `hazName`. Lage/Wächter der Ebenen unverändert (eigener Zufall). Probe grün |
| 09.10. | Eigene Fehlt-Punkte (Agent Quests) | ✔ 🔍 ⚖ | (1) Nachfolger: Abgabe-Siegel + Kartenpunkt. (2) Karten/Pins für Wallfahrt, Kreuzzug, Opferfest, Flüchtlingswelle, Magitech-Unfall, Erbstreit. (3) Uhrmacherhand (Bauplan → Vell, 300 Gold ⚖, body.js `MECH_MOD`), grünes Leuchtfeuer (render.js `lightOf`, ein Eintrag), Heimweg der Sturmkrieger. (4) Totenland: Lager geräumt nach Garmadons Tod, Mauerwachen bei Belagerung. Proben „E22-Rest“, „S5-Rest“, „Totenland A Rest“, Nachfolger-Teil in „Quests ↔ Welt“ grün. Selbsttest 526: fremd rot „Stil F“, „P3.20–23 Rollen“ (Figuren-Agent), „Schwierigkeit (S15 P12)“ (Bandit-LP schwanken: schwer 81 > sehr schwer 78 — zufallsabhängig, nicht aus diesen Änderungen) |
| 09.10. | Lesbarkeit / Textgröße | ✔ 🔍 | **Ursache:** Die Einstellung änderte nur die Schriftgröße der Wurzel, das CSS rechnet aber überall in px, und beim Laden wurde sie nie angewendet. Jetzt: CSS-Variable `--ts` + `zoom` auf alle UI-Bereiche, Raster der Spalten/Zeilen wächst mit; `UI.applyTextScale()` in `boot()`/`startGame()`; 5 Stufen 0,9–1,6 in den Optionen. Kamerafahrt-Text 22 px × Stufe (bei 1,4 → 31 px), Balken/Weiter-Knopf skaliert. 🔍 bei „Sehr groß“ auf kleinem Bildschirm prüfen (Spielbild wird schmal) |
| 09.10. | E41 Bäume wachsen nach | ✔ | `treeRegrowDay()` im Tageshaken: Stumpf ab 10 Tagen → fester Baum (hp 3, Kollision), nie im Bild/unter Held oder Gruppe; Hinweis beim ersten Fällen; Debug „Stümpfe 10 Tage altern lassen“; Probe E41. Bild der Stufen gab es schon (render.js `stumpStage`) |
| 09.10. | E37 / T12 „Straßen haben Herren“ B1–B3 | ✔ 🔍 ⚖ | **B1** `ROAD`/`riskWhy`/`riskOf`/`routeLines` (economy.js): Gefahr je Strecke mit Namen (Bande ≤30 Felder +0,08×Mann/9, Totenknoten +0,05, Streife −0,03, Aurelion-Zoll −0,02 statt totem `S.laws.toll` = RB-010); Kontor: „Gefährlichste Straße“ + Menü „Straßen und Gefahren“; Wagen: Gefahr je Ziel, Umweg (+1 Tag, keine Banden), Schutzgeld deckt Wagen. **B2** Überfälle füllen `b.loot` (`raidBand`/`onBandRaid`), `bandDay`: +1/Tag, −0,4/Mann, 20 = +1 Mann, 3 Hungertage = −1, ≤2 zerstreut; Kopfgeld +2/Beute; neue Banden ins freie POI-Banditenlager (Spawn-Sperre `key`); Tribut-Überfall nur mit Bande ≤40 Felder. **B3** Klinge: halbes Schutzgeld + Rook-Ruf; Verrat am Netz −10 (nur Held/Gruppe tötet); Hauptmann melkt (+0,04, 25 % als Gold im Lager, Gilde −1); Streifen-Strecke ≤20 Felder → 35 %/Tag −1 Mann; „Wovon lebt ihr?“. Proben T12 B1/B2/B3, Debug „Straßen (T12)“. ⚖ Banden, die eine Stadt beherrschen (S2), wachsen/hungern nicht. **Fehlt:** Große Karawane liest Banden (sim.js), Valen-Agenda schickt Streifen gezielt, Gildenwachen (kommt mit T23 S4) |
| 09.10. | E37 Belagerung S3b + S3d, T15 V10 | ✔ 🔍 ⚖ | **S3b:** Sturm vor Ort in zwei Phasen (`capitalStorm` sim.js: Bresche am Südtor Stufe 9 mit Fleischgolem → verloren mit Spieler nah: Fallgitter zu, Phase 2 am Burgtor; gehalten → Mauern 15), Burgfrieden fällt bei Mauern 0 (Depot zurück, danach `keepGrant('siege')`), Mauerhauptmann Gero am Südtor (Lage, Versorgen 3×/Tag → Besatzung +5/fedTill bzw. Mauern +10, Ausfall 1×/6 h: −15 Heer + ein Zug ohne Mauerschaden / −5 Besatzung). **S3d:** Welle 4 ankert am Thron, Knochenwachen zählen dazu; Gnadentag nach Befreiung. **T15 V10:** Prototyp braucht alle 3 Tage Energiezelle (sonst halber Vorteil), Kurzschluss bei Schock (1 s, Verschleiß ×2), Regen draußen ×1,3. Proben S3b/S3d/T15, Debug. **Offen:** S3c Evakuierung + Aldhelms Falle (E18-Fragen Kellerweg/Varons Strenge unbeantwortet), Kronsiegel, T15 V9 Messing-Stigma (Tabelle je Fraktion ohne beschlossene Zahlen → Frage an Entwickler) |
| 09.10. | Fehlerrunde nach dem Nachtlauf | ✔ | (1) Selbsttest ließ Probe-Aufträge (E2-Ladung, „Auftraggeberin: Probe“) aktiv in `S.quests` stehen → `selftest()` sichert und setzt `S.quests` zurück. (2) Kodex-Reiter „Handbuch“ lud das gelöschte `docs/GUIDE.md` → lädt jetzt `docs/MECHANIKEN.md` (Kapitel 12 „Werkzeuge für Tests“ nur mit `?dev`); tote Links in MECHANIKEN entfernt. (3) CLAUDE.md: Zeilenenden je Datei und Cache-Key v=25 korrigiert |
| 09.10. | N3 Kriegsmüdigkeit/Deserteure (E21) | ✔ ⚖ | `WEARY` (Spec npc_eigene_ziele §5.2): Quellen in sim.js (`afterBattle`, `cleanupArmies`, `capture` über `H.weary`) und `campResolve`; `wearyDay()` vor `SIM.warDay()`; Stufen 40/60/85; Fahnenflucht −min(2, 3 %)/Tag am stärksten Valen-Heer, ruht in der Belagerung; Kette: Feldzug × (1 − (v−50)/100); Pool ab 5 → `wearyBand` (Deckel 3, eine je Seite, Name per Tageshash, `keepRng`); `evDeserters` wirkt nur noch ab 40 (Pool +2). Cache-Key auf **v=26** (Gesamtstand live). **Fehlt:** Wachen-Sätze in `newsTalk`, Deserteur an die Wache übergeben (Valen +2) / anwerben (−2), Aussehen in Valen-Blau/Kettenrot, „versorgter Verwundeter −1“ (Luftbrücke fehlt) |
| 09.10. | Debug-Menü (Entwickler: richtiges GUI, kompakter, bessere Einteilung) | ✔ 🔍 | Fenster kleiner (860×600), Knöpfe dichter, Karten einklappbar, Präfix-Zwischenzeilen, Favoriten per Rechtsklick, „Zuletzt“ 6. Neuer Reiter **Gegenstände**: Browser mit Kategorien/Unterkategorien (Waffenart, Rüstungsplatz, Verwendung), Seltenheit, Suche, Menge, Kacheln mit Bild + Karte, Ins Gepäck/Anlegen. **Fehler behoben:** alte Liste filterte auf `ring`/`amulet` — Talismane (14) und Werkzeug (6) waren nicht erreichbar. Probe „Phase 3 Debug“ prüft: jeder Gegenstand hat eine Kategorie. Außerdem: Leiste wird nach dem Selbsttest aufgefrischt (zeigte noch Probe-Held). PR #38 (claude-arbeit → main) geprüft: beide Zweige haben denselben Dateibaum, Merge konfliktfrei |
| 09.10. | N1 Händler meiden Strecken | ✔ | `ROUTE_MEM`, `noteRaid`/`routeOf`/`routesFreedBy`/`routeNotes` (economy.js): Gedächtnis je Strecke, 2/10 Tage → Umweg (+1 Tag, Banden zählen nicht), 3/14 → 8 Tage gemieden (Paar in `caravanDay` übersprungen), Name des Händlers, Chronik + Erst-Hinweis; Große Karawane verloren zählt (sim.js `caravanDied`); `bandGone` gibt Strecken frei; Kontor/„Straßen und Gefahren“ zeigen es. Probe N1, Debug. **Fehlt:** Geleit-Auftrag für gemiedene Strecke, Kutscher retten (Spec §5.1) |
| 09.10. | Gesamtleben + Blut (Kenshi), Prolog-Heilschritt | ✔ ⚖ 🔍 | `B.lifeOf` (body.js): alle Balken zeigen Summe aller Körperteile (Rumpf/Kopf 0 = leer), Spiellogik `barOf` unverändert. Blut `c.lifeBlood` (fehlt = 100) für Held/Gefährten/Menschen: Treffer −35 % Schaden, Blutung −1,2/s statt Leben, <35 % → `downed`, `koReady` erst ab 50 %, 0 = verblutet, Erholung 0,25/s (am Boden nur Held), `reviveTick` bringt Blut, `B.heal` +½, `fullHeal` voll; Blutbalken in der Leiste; Erst-Hinweis; Debug; Probe. Prolog: „Aufheben und heilen“ wartet auf Verband (`S.prolog.healed`). **🔍** Spielgefühl prüfen (KO zu früh/spät?). **Fehlt:** Blut für Gegner (Balance-Frage), Blutbalken über Gefährten |
| 09.10. | Koop: E2-Balken, HB-30, E17, Karten beim Gast (Agent Quests) | ✔ 🔍 ⚖ | coop.js `guestHitBar`/`self.lastHit`, `guestShopDeal` über `buy`/`sell`, Sperre/Rückfrage/Blättern, `partyList`/`admit` nur Menschen, `card`-Nachricht, Trefferklang; game.js `hurt` (lastHit), `makeGuestHero` (race), `worldCard` → `coopHooks.card`, `coopAPI` +buy/sell/raceOf/nameCard/sfx. Live mit `?coopLocal` (2 Tabs, Speichersperre). Dock-Handel weiter BLOCKIERT (Grund im Abschnitt Koop). Probe „Koop 09.10.“ |
| 09.10. | Rüstungsvielfalt Rest (R3/R4/R6) + Aurelion-Rest + Banditen-Reiter (Agent Figuren) | ✔ 🔍 ⚖ | (1) sfx.js `step` je Material, game.js `stepMat`/`stepSound`/`stepNear` (Held + max. 2 nahe Figuren). (2) sprites.js Fraktionshelm der Wachen, Erkennungsband Räuber/Seevolk, `badgeOf` → Spec `bdg` → fig5 Brosche (ab Rang 2, Gold ab 4). (3) `BOSS_LOOK` für 5 Story-Bosse statt Spieler-Sets. (4) Aurelion: `PATROL_LOOK` (Spec `bot`: Messingplatten mit Nieten, ein Leuchtauge bernstein/blau, kein Rock) für Automat-Wächter; render.js `lampOn`: Laternen nur 18:30–6:30 mit festem Versatz bis 30 min je Laterne, Licht in `lightOf` und Glas im Bild an/aus. (5) Banditen-Reiter mit vorhandenem Pferd (`drawHorse` aus `drawCreature`), stürzt bei Ohnmacht/Tod. ⚖ Reiter 12 %, ×1,45 Tempo, Schritt-Umkreis 150 px. Selbsttest grün. Bilder: Scratchpad `ruestung_rest_vorher_nachher.png`, `rang_zoom3.png`, `aurel_nacht_reiter.png` / `aurel_tag_reiter.png`, `banditen_reiter.png`. |
| 09.10. | Ereignis-Reste + Kette mit Handelskontakt (Agent Quests) | ✔ ⚖ | Karten für Ratsbeschluss/Ablehnung (`councilDecide`), Parade (`aurelParade`), Spuk-Ende (`conProgress`); `tradeContact`/`tradeContactTick` (Brief alle 3 Tage ⚖, max. 3 Kontakte ⚖) am Ende der Karawanen-Kette; Probe „Ereignis-Reste 09.10.“; 🔍 Kette live |
| 08.10. | P5 Totenland — Variante A (Agent Quests) | ✔ 🔍 ⚖ 🐞→✔ | Auf Wunsch des Koordinators vor der E40-Antwort, nur A. BUG-143 → `buildKeepHouses` (game.js, beim Laden; ein erster Versuch in world.js landete wegen der Kartenstreckung an falscher Stelle und wurde zurückgenommen). Knochentafel Vharnholm (4 Arten, nur mit Rang/Pakt), 2 Lager im Osten. Probe grün. Die flüchtigen Figuren laufen in `keepRng` (verschieben die Zufallsfolge nicht). 🐞→✔ Die Proben „Phase 6 Untotenreich (MP2 §61)“ und „Bomben-Skelett (02.10.)“ hingen vom Zufallsstand nach dem Laden ab und kippten abwechselnd — jetzt mit eigenem Zufall (`keepRng` + `seedRng`) und Ausgabe der Teilergebnisse bei Fehlschlag. Selbsttest 520 Proben, nur fremd rot: „Himmelsinsel-Ratshändler (09.10.)“. 🔍 Schwarze Feste und ein Lager ansehen |
| 08.10. | P5 Totenland — GATE (Agent Quests) | 🔍 | Kein Code. Ist-Analyse mit Messung (24 % des Festlands, 1 Stadt, 0 Aufträge, BUG-143 bestätigt), Impact-Report, Varianten A/B/C, Empfehlung B mit A zuerst; Fragen als E40 in Abschnitt 6. Wartet auf den Entwickler |
| 08.10. | Selbsttest Runde 3 (Agent Quests) | ✔ 🐞 | Letzter Lauf: **510/510 grün**; Held/Gold/Chronik unverändert. (Ein Lauf davor hatte drei fremde Rote vom laufenden Rollen-Umbau, inzwischen grün.) 🐞 klein: nach dem Selbsttest steht `S.vaults = {}`, wo vorher kein Feld war — kommt aus einer älteren Gewölbe-Probe, harmlos (leeres Fortschrittsobjekt) |
| 09.10. | E42 Sternbilder gekürzt + Kettenwege (Agent Figuren) | ✔ ⚖ 🔍 | data.js `CUT_STARS` (46 Wertesterne/doppelte Fähigkeitssterne, Nachfolger an die Voraussetzungen gehängt), `CLASS_WAYS` (Kettenbarde→Barde, Kettenjäger→Waldläufer, Folterknecht→Assassine, Dunkler Priester→Kleriker; Kettenarm im Sternbild der Schwesterklasse, 26→22 Sternbilder); game.js `skyCut` beim Laden (Punkte zurück, aktive Kettenklasse → Schwesterklasse, Log), `clsAbilities`, `clsLine`, `setClass`, `fearLvl`, Erbe; ui.js Klassenfenster; sky.js Sternkarte „Kettenweg …“. Proben angepasst (Sternzahlen, Dunkle Klassen: Weg bringt Kleriker mit, Höchststufe ⚖ bis 76 %), neue Probe „E42“, Debug 2 Einträge, MECHANIKEN-Absatz. ⚖ Talentziel 50–70 % jetzt 75 % |
| 09.10. | E13 Sprechblasen N1 (Agent Figuren) | ✔ ⚖ 🔍 | render.js: eine Blasen-Art `sayBubble` für `e.talk` und `bubble()`; Tonfall-Formen (glatt/Zacken/gestrichelt); Zeichen statt Satz für einfache Bewohner über ⚖ 220 px, Sätze nah und für gesprächige Rollen (⚖ Liste), Regiebuch immer Satz; Zeichen „rede“ neu; ui.js Kodex-Reiter „Zeichen“; Tipp „bubbles“; Debug 2; Probe „E13“; MECHANIKEN. 🐞 nebenbei: Kodex „Handbuch“ lädt `docs/GUIDE.md`, die Datei gibt es seit der Doku-Bereinigung 08.10. nicht mehr (Fenster zeigt „Handbuch liegt nicht bei“) |
| 09.10. | E38 Katana Bild + Kampfanimation (Agent Figuren) | ✔ ⚖ 🔍 | figure.js `katanaW` + 3 Varianten; anim.js Profil/Posen/Haltung/Gewicht `katana` (Iai-Zug, Kesa-Schnitt, Ausfallschnitt; ⚖ Takt); Test Room-Liste, Debug „Katana: Iai-Zug im Test Room“, Probe „E38 Katana Bild und Animation“, MECHANIKEN. Händler/Herkunft hatte Agent Städte schon (Salzbund) |
| 09.10. | E40 S1 Totenstadt Vharnholm (Agent Quests) | ✔ 🔍 ⚖ | game.js `DEAD_LAW`, `deadPass`, `deadSealOpts`/`deadSealTalk` (Siegelmeister Orm vor dem Südtor), `vharnWatch` (Wache hält Lebende ohne Siegel an — Muster `aurelWatch`/`robotStop`/`expel`), `deadWarn`/`deadRevoke`, `deadSilence` (aus `talk`), `faceHidden`; Nachtleben in `dayTargetRaw` (+12 Std. für Vharnholm); Viertel `ensureDeadCity` (3 Häuser über `findGrowSpot`/`placeGrown`, Haustypen ohne Bewohnerplan, je eine Figur, Grabgarten); `arrivalTick`: Vharnholm „Die Untoten“ statt „frei“. Debug „Welt: Totenland groß (E40 S1–S4, S6)“, Probe „E40 S1“. Live: Wache hält an, „Ich gehe“ → vor das Südtor, Grabsiegel → Siegel bis Tag 9, Mahnung Maske, Mahnung Schweigen (12 Uhr), Händler weist ab. 🔍 Vharnholm nachts/tags ansehen |
| 09.10. | E40 S2 Orte der Stillen in der Fläche (Agent Quests) | ✔ 🔍 ⚖ | `ensureDeadEast`: **Beinhausen** (LOCATIONS wie Geheimorte, Platz per `clearArea` ohne Zufall; 4 Häuser per `raiseDeadHouse`, 6 Figuren, Knochenfeuer, Knochentafel `DEAD_BOARD`), neue Auftragsart `bones` „Gebeine heimholen“ (Abgabe wie Kräuter), **Grenzposten am Knochentor** (Siegelmeisterin Kell, 2 Grenzwachen); `deadOnly`-Händler in `openShop`/`shopRefusal`/`talk`; buildings.js `TOWN_STYLE` beinhausen + blackkeep (schwarzer Basalt — auch die vier Gebäude der Feste aus P5 A sehen jetzt so aus). Probe „E40 S2“. 🔍 Beinhausen ansehen (Debug „E40 S2: nach Beinhausen“) |
| 09.10. | E40 S3 Nachfolge nach Garmadon (Agent Quests) | ✔ 🔍 ⚖ | `deadSuccDay` (Tageshaken nach `keepSiegeDay`), `succTick`, `succCrown`, `succPrincesStart`, `succFeud`, `ensurePrinces`, `succChoices` (in `keepChoices`); `deadWelcome` zählt Gefolgschaft; sim.js `capThreatDay`/`warDay`: unter Totenkönig Morvath Heerzug/Heereswachstum wieder an; `ensureDeadLife`/`deadReactTick`: unter Regent Veyl Lager zurück; `ensureBlackKeep`: gefallener Veyl kommt nicht wieder. Probe „E40 S3“. Selbsttest **550/550 grün**, Held/Gold/Chronik/Spielstand unverändert. 🔍 Debug „E40 S3: Nachfolge starten“ durchspielen |
| 09.10. | E40 S4 Rangprüfungen der Stillen (Agent Quests) | ✔ ⚖ | `DEAD_TRIAL`, `deadTrialMiss`, `deadTrialText`; `garmadonServe` prüft vor dem Aufstieg (Seelen werden verbraucht), Zähler in `claimContract` (Aufträge der Toten) und `takeVillage` (Überfälle), `rankGuide` nennt die Prüfung. Probe „E40 S4“, Debug „E40 S4: …“ |
| 09.10. | E40 S6 Gruftnetz (Agent Quests) | ✔ 🔍 ⚖ | 4 `VAULTS` mit `net`/`netI` (Schädelstollen offen, drei verborgen), `vaultHoardOpened` deckt die nächste Gruft auf, allgemeine Kartenfolge lässt das Netz aus; Hinweis in `deadEastTick`. Probe „E40 S6“ (alle Ebenen baubar, Pools echte Gegner), Debug „E40 S6: …“. Selbsttest **553/553 grün**, Spielstand unverändert. 🐞 fremd (nicht behoben): nach dem Selbsttest stehen zwei Auftrags-Quests aus Proben aktiv im Spielzustand (`c_…` „Die Ladung zurückholen: Die Schwarzen Stiefel“ aus T12 und „Die Auftraggeberin: Probe“ — `S.quests` wird von diesen Proben nicht zurückgesetzt; nur relevant, wenn nach `?test` gespeichert wird). 🔍 Schädelstollen betreten |
| 09.10. | E37 / T23 S1 Fraktionsressourcen: Gerüst und Kodex (Agent Städte) | ✔ ⚖ | data.js `FAC_RES` (alle Zahlen an einer Stelle), sim.js `S.facRes`, `facResDay` am Ende von `warDay` (kein rnd, Tageshash `resHash`), `facRes`/`resAdd`/`resStage` (Hysterese 10 %), Hooks `facSources`/`facSay`/`resDaily`; Stufenwechsel → Protokoll, Chronik, Hinweis, erster Kodex-Hinweis; Kodex-Reiter „Mächte“ (nur bekannte Mächte), Zeile „Ressource“ im Fraktionsfenster; Koop: `facRes` im Weltpaket. Debug „Fraktionsressourcen (T23)“, Probe T23 S1 |
| 09.10. | E37 / T23 S2 Kette und Tribut (Agent Städte) | ✔ ⚖ 🔍 | Köpfe = Gefangene + 2 je Tributdorf (gemessen 56, Spec nahm 12–20 an → `mul` 0,2/0,45/0,8 so geeicht, dass 56 die alte Mitte trifft ⚖); Heerzug ab 10, Takt +(10 − Köpfe), Treiber unter 8, **Sklavenjagd** unter 6 (F4: Grubenhort und Tributdörfer, vor Ort als Prügelei, Sieg: Hort −10 bzw. 4 Dörfler, +4 Köpfe im Pferch); Tribut aus dem Dorfmarkt in das Festungslager, `T.vorrat` einmalig ×0,5 (F3); Vesk kauft Gefangene (30 Gold ⚖, Kette +2, Grausamkeit −3 ⚖, 2/Tag); alte Tribut-Probe auf Dorfkorn umgestellt. 🔍 Messung: Tributdörfer verhungern (s. IST_ZUSTAND Anhang). Probe T23 S2 |
| 09.10. | E37 / T23 S3 Tote und Orden (Agent Städte) | ✔ ⚖ | Seelen: +1 je Totenort/Tag, Schlacht 30 % des Verlierer-Verlusts (abstrakt und vor Ort), Dorf gefallen +n, Erheben +n, Phiole am Totentempel +2/Tag; neues Heer 30 Seelen (Stärke 20 + Seelen/5 ≤ 50), Besatzung 1 Seele/Ort, Heerzug −40 (F2), Kammer −30, Kreuzzug-Sieg −10; satt (≥ 120) gemischte Heere vor Ort, Phiolen ×0,7; leer (≤ 20) kein Heer, keine Besatzung, Phiolen ×1,5, Überfälle ×0,5. Eifer: Land der Toten (≥ 4 Orte) +1/5 Tage, Kreuzzug ±1, Abklingen −0,5/10 Tage; Kreuzzug alle 12 − Eifer Tage, Sieg 0,45 + 0,05 × Eifer; ≤ 1 Andachten + Verband Lichtenrain −10 %; ≥ 3 doppelte Streifen, Aushang ×1,3, Sonnwacht +3, Ordensheiler +5 %/Eifer über 2; ≥ 4 Ordensüberfall 0,7. Konrad nennt den Takt. Probe T23 S3 |
| 09.10. | E37 / T23 S4 Händler und Aurelion (Agent Städte) | ✔ ⚖ | Handelswert (economy.js `merchV`/`merchAdd`, kein Rückimport): Ankunft +4, Große Karawane +8/−10, Lieferung +2 (≤ 4/Tag), Überfall −6, −1/Tag; neue Züge 2 + Wert/25, Wachen nach Wert (T12 `riskOf` unverändert); Gildenladen ±20 %, Speicher 6 × Wert/50, Sperre (3 Tage < 15), Messe (> 80, Verkauf +15 %), Geleitlohn ×(1,5 − Wert/100) unter 30; Kontor nennt den Wert. Aurelion (F1 Index Nahrung/Magitech): Gesandter kauft ≤ 12 Nordfurter Korn (< 6), Zoll +0,1 und Frachtauftrag Kupferhafen ×2 (< 4), Fest −10 % Himmelsinsel und doppelt schnelle Zollsenkung (> 12); „stärker nach Wohlstand“ ⚖: Städte fallen nach Kaiserinnentod ×1,5/×1/×0,5 so oft, Sonnenlegion kehrt mit 14/20/26 zurück. Probe T23 S4 |
| 09.10. | E37 / T23 S5 Seevolk und Goblins (Agent Städte) | ✔ ⚖ | Prise per Tageshash (0,10; Klinge-Seite +0,10; Salzfrieden 0; nach Weißbart 10 Tage 0,2, dann 0,05), Hafen −30 % Salz (≤ 12), eigene Prisen zählen; 3 Prisen/10 Tage → Hellas Mannschaft +2 (Gischtinseln); Salz < 20 → Kopfgeld des Salzbunds auf Schwarzsegel (eins zur Zeit; Figuren/Aushang in `factionAgenda`, nicht in `facResDay`); Salz > 80 → Salz nach Eren/Varonheim. Befreiter Goblin am Hort +1 (≤ 4/Tag). Probe T23 S5. **Fehlt:** Passamt-Zoll-Text, Ysolde-Geleit ×1,5, Sätze von Ysolde/Grisk/Gesandtem, Messing-Hook (T15), 60-Tage-Kopflos-Vergleich mit Feldzügen in Bewegung |

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
E2 Ersatz-Lebensbalken 5 s · E12 Klassenprüfungen (Platz halten 50 s, Grube ×2 LP/×1,6, EP 80/110) · E14 Schlacht +5 / Befreiung +10 Ruf, Schleich-Sicht 55 %/30 %, Jagd +60 %/40 % · E15 Wanderautomaten (Gewicht 1, 2 von 5 anwerbbar, kostenlos) · E16 Wüstenbund (Eskorten +25 %, kein Zoll ab Rang 0; eigene Kerkerkarte?) · E17 Fraktions-Starts (10 Punkte) · 08.10.: Geber je Ort 3/4/6, Wegweiser-Schritte und Texte, Haus-Transparenz 50 %, Lager 48 + 24. · E40 S1–S3 (09.10.): Totensiegel 5/3/2 Tage (Grabsiegel/Seele/2 Grabgut), 3 Mahnungen → 3 Tage Sperre, Masken-Mahnung 1×/Minute, Ruhezeit 7–19 Uhr, Nachtleben +12 Std., „bleiben“ Tote −10; Gebeine 6–10 Knochen (20 + 4 Gold je Knochen); Thronstreit nach 1 Tag, 7 Tage, Start 5:5, +1/Tag (Morvath +1 mehr ab 6 Knoten), +3 je Seele, Gleichstand Veyl; Waffenruhe ≥ −40, Treueschwur 1 Seele, ≥ −20, Fehde alle 3 Tage; Rangprüfungen 3 / 6 Aufträge der Toten, 3 Seelen, 1 Überfall; Gruftnetz Stufen 3/4/4/5, Ebenen 2/3/3/4. · **E42** Kürzung der Sternbilder (Auswahl der 46 Sterne, 4 Kettenwege) und Talentziel REGELN §7 vorläufig 50–76 % statt 50–70 % (typische Figur jetzt 33/44) · **T23** Fraktionsressourcen: alle Zahlen in data.js `FAC_RES` (Spec-Werte); selbst gesetzt: Eichung der Kette auf 56 Köpfe (`mul` 0,2/0,45/0,8), Vesk zahlt 30 Gold je Gefangenen (Grausamkeit −3), Aurelion „stärker nach Wohlstand“ = Fallchance ×1,5/×1/×0,5 und Sonnenlegion 14/20/26, Prise der Klinge-Seite ohne „Zoll verweigert“ (jede Klinge-Seite zählt). **Zu entscheiden (T23, 09.10.):** (a) Tribut leert die Tributdörfer (Messung: Einwohner 24/28/20 → 5 in 40 Tagen) — so lassen, Tribut nur aus Überschuss, oder Ernte +5 zurück? (b) Seelen am Deckel 200 und Eifer 5 nach ~3–4 Wochen als Dauerzustand — gewollt?

### E40 Totenland (P5, GATE 08.10. — beantwortet 09.10., ENTSCHEIDUNGEN §5h: groß/C, Besuch mit Regeln, füllen, Hinterland, echte Marktgüter, Thronfolgekampf oder Fürstentümer; S1–S3 gebaut, Zahlen ⚖ in P5)
| Nr. | Frage | Vorschlag |
|---|---|---|
| 1 | Umfang: klein (A), mittel (B) oder groß (C)? | B in Scheiben, A zuerst |
| 2 | Ton: Können Lebende die Totenstadt besuchen (mit Regeln: Schweigen, Maske, Totensiegel) oder bleibt ohne Rang/Pakt alles zu (heute `deadWelcome`)? | Besuch mit Regeln, Handel/Aufträge erst mit Rang/Pakt |
| 3 | Fläche: Region (≈ 24 % des Festlands) nur füllen oder Karte vergrößern (eigener Seed-Zweig)? | füllen |
| 4 | Krieg: Osten in den Kriegsgraphen (Fronten, Heerzüge aus dem Osten) oder Hinterland? | erst Hinterland, Krieg später nach Messung |
| 5 | Wirtschaft: Seelen/Knochen/Grabgut als neue Marktgüter oder nur Händlerware? | erst Händlerware |
| 6 | Nach Garmadons Tod: Thronfolgekampf, Zerfall in Fürstentümer oder Fortbestand unter Veyl/Sael? | Thronfolgekampf als Story-Faden |

### Design offen
E1 Haltung/Humpeln verwundeter Gegner · E3 Händlergesicht nach Ruf · E4 schwerer Hieb (Faktor, Ladezeit, Ausdauer, Touch, Koop) · E5 14 Gegnerideen · E6 Mutanten-Hinterhalt/Blutschöpfer · E7 Skilltree-Scheiben 3/4 streichen · E8/E9 Betriebskasse · E10 Bewohner rufen / Story-Szene / Beute-Hinweis · E11 Kartenausschnitt im Brief · E13 Symbolsatz Sprechblasen · E18 Belagerung S3 (Kellerweg, Varons Strenge) · E19 Bionik im Krieg · E20 Luftbrücke (4) · E21 NPC-Ziele (4) · E22 Welt-Ereignis-Karte (4) · E23 Städte-Visual (4) · E24 Morrgrund (3) · E25 Wasservolk · E26 organische Stadtanordnung (Vorschlag: nur neue Häuser) · E27 Karraks Wüste (Vorschlag: friedlich) · E28 Bodenauflösung · E29 Ende der Brüder (8 Ideen) · E30 70 stumme Figuren · E31 Gift/Feuer/Blutung 60 % · E32 Pferde-Sprites reichen? · E33 17 Fit-Urteile · E34 Ideenspeicher freigeben? · E35 Welle 2 Reihenfolge · **E37 Spec-Reihenfolge vs. alte APPROVED-Pakete** · **E38 Katana: Schwert-Unterart oder eigene Waffenklasse?** · **E39 Skill-System: Sternbild-Talente bleiben und Skills ergänzen (Vorschlag) oder zusammenlegen?** · **E41 Holz endlich? (09.10.):** Gefällte Bäume hinterlassen einen Stumpf mit Schösslingen, wachsen aber nicht nach — (a) nie, (b) nach N Tagen wieder Baum (Vorschlag: 10 Tage), (c) nur gepflanzt · **E43 Gold und Ruf (09.10., Agent Städte):** (a) Sollen die 36 Ruf-Stellen mit `+=` ohne Grenze auch auf ±100 begrenzt werden? (Vorschlag ja) (b) Hinterlegtes im Kontor beim Erbe ganz erhalten? (gebaut: ja) (c) Betriebssteuer 10 % / Einzahlgebühr 3 % bestätigen · **E42 Sternbilder zusammenlegen?** Sichtbarkeitsregel ist gebaut (1–4 statt 25 sichtbar); Bäume/Klassen zusammenlegen hieße Klassen zusammenlegen — gewünscht? (Vorschlag: nein, nur doppelte Allerwelts-Sterne streichen)

---

## 7. Gesamt-Abnahme (Gesamt-QA)

Am Ende läuft, nach allen Paketen, ein vollständiger Regressionstest über die Testfälle aus Spec Welt §51 (Tutorial, NPCs, Familien, Gebäude, Kampf, Betriebe, Städte, Quests) und Spec Skills §55 (Kampf, Gathering, Crafting, Save/Load, Permadeath), dazu mindestens ein unabhängiger Testlauf und ein End-to-End-Durchlauf.

**Gesamtziel (Spec Welt §54):** Wer eine Stadt betritt, denkt nicht „Welche NPCs haben eine Quest für mich?", sondern „Was passiert hier eigentlich?" — und Quests entstehen daraus.

**Gesamtziel (Spec Skills §60):** Ein Charakter, der durch das geprägt ist, was er tatsächlich getan hat — vom miserablen Holzfäller über den Schmied zum Katana-Meister.
