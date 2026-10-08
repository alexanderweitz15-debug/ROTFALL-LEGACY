# Visueller Umbau — Priorität 1: DIALOGE (Analyst A, 02.10.2026)

Status: **ANALYSE — WAITING_FOR_DEVELOPER** (kein Spielcode geändert). Ablauf nach VISUAL.md §2, Gate nach GATE.md §8.
Bewertungsmaßstab für jede Variante: passt sie zu ROTFALL — dunkler, detailreicher Pixelstil, im Code gezeichnet (Canvas/DOM, keine Bildgeneratoren, keine Bilddateien), persistente simulierte Welt (die Welt läuft weiter), Kenshi-Härte, bestehende Werkzeuge (Inventar Abschnitt A)?
Skala: **++** passt sehr · **+** passt · **o** neutral/teuer · **−** passt nicht.
Inspiration nur als UX-Muster aus dem Gedächtnis beschrieben, nichts übernommen.

Teilelemente: D1 Gesprächsfenster · D2 Antwortoptionen · D3 Körpersprache im Gespräch · D4 Kamera bei wichtigen Gesprächen · D5 Alltags- vs. Story-Gespräch · D6 Blasen und Rufe (Barks) · D7 Folgen, Proben, Reaktionen · D8 Lange Texte, Wissen, Gerüchte.

---

## D1 — Gesprächsfenster (I-01, I-03, I-18)

**Problem heute:** `ui.js:dialogue` zeigt immer dieselbe Leiste: Porträt 64 px, Name, kursiver Textblock. Wer spricht, wie er gestimmt ist und ob es wichtig ist, liest man nur aus dem Wortlaut. Stimmung (Angst, Ruf, Stigma) steckt nur im Begrüßungssatz (`contextGreet`, `FEAR_GREET`). Wenn man weggeht, verschwindet das Fenster wortlos (`updatePrompt`, 170 px).

**Inspiration (UX):** Darkest Dungeon (dunkle Leiste, kräftiges Porträt, Rahmen trägt Stimmung) · Pillars/Pentiment (Text läuft ein, Schlüsselwörter hervorgehoben) · Hades (Porträt groß, Name als Schild, Text Zeile für Zeile) · Stardew (Porträt mit Stimmungsvariante) · Kenshi (nüchtern, Welt läuft weiter) · klassische JRPGs (Textfenster mit Fortsetzungs-Pfeil).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Leiste bleibt, Porträt wird größer und atmet** (Brustbild aus `drawPortraitTo` doppelt so groß, sanftes Auf/Ab, Blinzeln). | + billig, nutzt Vorhandenes; allein zu wenig |
| 2 | **Stimmungsrahmen**: Rahmenfarbe/Ornament des Porträts nach Beziehung, Angst, Stigma, Fraktion (Wappenfarbe aus `FACTIONS.colors`). | ++ Information ohne Text, rein aus vorhandenen Werten |
| 3 | **Text läuft ein** (Schreibmaschine), Klick/Taste vervollständigt sofort; Optionen erscheinen erst danach. | + Rhythmus; Risiko für Proben (Textinhalt muss sofort im DOM stehen) |
| 4 | **Mimik-Porträts**: neue Kopfvarianten (wütend, ängstlich, freundlich) in `sprites`/`fig5`. | o stark, aber neues Zeichenpaket je Raster und Volk |
| 5 | **Diegetische Sprechblase statt Leiste** für jede Antwort, Optionen als Fächer am Spieler. | − bricht bei 20 Optionen und langen Texten; Proben/Koop hängen an `#dlg-*` |
| 6 | **Pergamentblatt** mit Siegel für jedes Gespräch. | − Pergament ist laut Entscheidung nur für Lesefenster (Kodex, Chronik, Erbe, Auftragsbuch) |
| 7 | **Namensschild mit Rolle und Wappen** über dem Text (Cinzel wie `nameCard`, darunter Beruf/Rang, kleines Fraktionswappen). | ++ wer spricht, sofort erkennbar |
| 8 | **Abblende-Übergang**: Leiste fährt hoch/runter statt zu springen; Weggehen lässt sie sichtbar verblassen. | + löst I-18 ohne Text |
| 9 | **Zweiter Sprecher**: Spielerporträt rechts, wenn der Held antwortet (Optionstext wird kurz als Heldensatz gezeigt). | o mehr Lesestoff, Nutzen gering |
| 10 | **Hintergrund-Unschärfe/Verdunkeln** des Spielfelds hinter der Leiste. | − die Welt soll sichtbar weiterlaufen (Kenshi-Prinzip, Gefahr während Gesprächen) |

**Wahl (Kombination):** 1 + 2 + 7 + 8, dazu 3 als **abschaltbare** Option (Text steht sofort vollständig im DOM, nur sichtbar eingeblendet — Proben lesen weiter `textContent`). Mimik (4) erst später, wenn Grafik Kapazität hat.

---

## D2 — Antwortoptionen (I-02, I-04, I-16)

**Problem heute:** `talk` sammelt bis zu ~20 Einträge aus ~30 Helfern. Quest, Handel, Heilung, Wissen, Beitritt, Plaudern und „[Gehen]“ stehen als gleich aussehende „— Text“-Zeilen; die Reihenfolge entsteht aus `unshift`-Aufrufen. Was eine Option kostet oder bringt, steht in Klammern im Satz.

**Inspiration:** WoW (Symbol vor jeder Gossip-Zeile: Quest, Handel, Lehrer) · Mass Effect/Witcher (Optionen nach Art gefärbt; Hauptpfad vs. Nebenfragen) · Disco Elysium (Probe als Kennzeichen mit Fertigkeit) · Pillars (Bedingung als Präfix) · Fallout 4 (Rad — bewusst nicht).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Piktogramm je Optionsart** (Auftrag, Abgabe, Handel, Dienst, Lehre, Wissen, Plaudern, Gefahr/Verbrechen, Gehen) aus `icons.js`-Raster; Text bleibt. | ++ schnell scannbar, Pixelstil, Text bleibt für Proben |
| 2 | **Gruppen mit Trennlinie** (oben Auftrag/Abgabe, dann Dienste, dann Gespräch, unten Gehen). | ++ Hierarchie ohne neue Worte |
| 3 | **Radialmenü** um den NPC. | − langsam mit Maus, schlecht bei 20 Einträgen, Touch-Pfad neu |
| 4 | **Dienste als Knopfreihe** (Münze/Hammer/Kreuz als Kacheln) über der Liste, Gespräch darunter als Text. | + spart Zeilen; Achtung: Proben suchen Text in `#dlg-choices button` |
| 5 | **Farbcode** der Zeilen (Gold Auftrag, Rot Gefahr, Grau Plaudern). | + allein zu schwach für Farbschwäche; nur mit Symbol |
| 6 | **Folgen-Chips** rechts in der Zeile: Wappen der Macht mit ▲/▼, Würfel+Attribut für Proben, rote Hand für Verbrechen, Münze mit Betrag. | ++ ersetzt die Klammertexte (I-04) bildhaft |
| 7 | **Tastenziffern 1–9** vor jeder Option. | + Tempo; kollidiert mit Schnellleiste 1–0 nur, wenn der Dialog Tasten nicht abfängt (prüfen) |
| 8 | **Untermenüs**: Wissen/Gerüchte/Omega hinter einem „Reden“-Eintrag. | + kürzt Liste; ein Klick mehr |
| 9 | **„Schon gefragt“ ausgrauen** (wie heute „•“ nur bei Themen). | + kleine Hilfe |
| 10 | **Hover-Vorschau**: Maus über Option lässt NPC eine Geste andeuten (z. B. Handel → zeigt auf Ware). | o charmant, aber wenig Information |

**Wahl:** 1 + 2 + 6, ergänzt um 9. Umsetzung als **optionale Felder** an den Choice-Objekten (`k` = Art, `fx` = Folgen) mit Rückfall auf eine Text-Erkennung für alte Aufrufe, damit nicht 344 Aufrufe gleichzeitig angefasst werden. Untermenüs (8) erst, wenn D2 steht und die Liste immer noch zu lang ist.

---

## D3 — Körpersprache im Gespräch (I-15, I-41)

**Problem heute:** `talk` spielt eine zufällige Startgeste (`zeigen`/`achsel`, bei Ruf < −20 `abwehren`). Danach reagiert der NPC nicht mehr; der Held dreht sich nicht zu ihm. Wut und Angst kommen als Fenster („Waffe runter!“, „Bleib weg von mir!“).

**Inspiration:** Kenshi (Figuren drehen sich, Abstand wahren) · Mount & Blade (Begrüßungsgesten) · Stardew/Darkest Dungeon (kleine Emote-Symbole über dem Kopf) · Hades (Figuren reagieren auf die Antwort) · Guild Wars 2 (Emotes der NPCs in Gesprächen).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Zuwenden**: NPC und Held schauen einander an, solange das Fenster offen ist (`act(..., toward)` erneuern). | ++ billig, sofort glaubwürdig |
| 2 | **Reaktionsgeste nach der Wahl**: Beziehung steigt → `salutieren`/`jubeln`; sinkt → `abwehren`; Probe misslingt → `achsel`; Trauer → `trauern`. | ++ nutzt 7 vorhandene Gesten |
| 3 | **Emote-Symbol über dem Kopf** (Pixel: Ausrufezeichen, Frage, Zornwolke, Herz, Schweißtropfen, Totenkopf). | + sehr lesbar; neues kleines Symbolset nötig |
| 4 | **Abstand als Gefühl**: ängstliche NPC weichen einen Schritt zurück, wütende treten vor. | + stark, braucht Bewegung im Gespräch (Fenster schließt bei 170 px — Grenze beachten) |
| 5 | **Neue Gesten** (nicken, Kopfschütteln, Arme verschränken, Geld zählen). | o gut, aber je Geste Arbeit in `rigS`/`rigW` |
| 6 | **Wut/Angst ohne Fenster**: statt Dialog eine Blase + Geste + Zurückweichen, Prompt bleibt. | ++ ersetzt I-41 durch Körper; Fenster nur, wenn es Optionen gibt |
| 7 | **Idle-Animation während des Zuhörens** (Gewicht verlagern, Blick wandert). | o Grafikarbeit, geringer Gewinn |
| 8 | **Gefährten kommentieren mit Blase** (Satz aus `TRAIT_SAY`) während man spricht. | + lebendig; Gefahr: zu viele Blasen |
| 9 | **Requisit in der Hand** (Händler hebt Ware, Wirt Krug) beim Öffnen des Dienstes. | o braucht `act.tool`-Erweiterung je Dienst |
| 10 | **Beziehungs-Funken** (fx `heal`/`spark` bei großer Beziehungsänderung). | + billig, aber leicht kitschig; nur bei großen Sprüngen |

**Wahl:** 1 + 2 + 6, dazu 3 mit einem kleinen Symbolset (Grafik-Auftrag). 5 und 8 später.

---

## D4 — Kamera bei wichtigen Gesprächen (I-10)

**Problem heute:** Kein Gespräch hat Kamera. Story-Momente (Garmadon spricht, Weißbart verhandelt, Rat, Gericht) sehen aus wie ein Gespräch am Brunnen. Das Regiebuch kann Kamera (`zoom`, `focus`), sperrt aber Speichern und Eingabe (`S.cine`).

**Inspiration:** Hades (leichter Zoom auf Sprecher) · Darkest Dungeon (Kamera rückt bei Ereignissen heran) · Diablo IV (Gespräch rahmt Sprecher, Welt dunkler) · Witcher (Schnitt Schuss-Gegenschuss — zu groß für ROTFALL).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Sanfter Zoom auf die Mitte Held↔Sprecher** solange das Fenster offen ist, nur mit „Bewegung an“ (`S.settings.motion`). | ++ nutzt `camAim`-Mitte wie Heldentod; ohne `S.cine` |
| 2 | **Dünne Balken** (wie T17 Live-Modus geplant) bei Story-Gesprächen. | + Kinogefühl; verdeckt HUD-Rand |
| 3 | **Schuss/Gegenschuss** über `cinematic` je Satz. | − sperrt Speichern, schwerfällig, passt nicht zu Menüs mit 20 Optionen |
| 4 | **Licht**: Fackelschein/Vignette um die beiden. | o Licht-Hebel fehlt laut T17 (`R.cineLight` nicht gebaut) |
| 5 | **Szenen-Einstieg** für ausgewählte Gespräche (kurze `cinematic` vor dem Fenster, dann normales Gespräch). | + gut für die wenigen großen (Garmadon, Rat); Muster `bossIntro` |
| 6 | **Zoom nur beim ersten Gespräch** mit einer benannten Figur (Kennenlernen). | + verhindert Abnutzung |
| 7 | **Kamera folgt der Blickrichtung** (leicht zum Sprecher versetzt). | + subtil |
| 8 | **Zeitlupe der Welt** während Story-Gesprächen. | − Welt soll laufen; Kampf könnte unfair werden |
| 9 | **Bild-im-Bild-Porträt** groß am Rand statt Kamera. | o DOM-lastig, wenig Raum-Gefühl |
| 10 | **Keine Kamera, nur Ton** (duck der Umgebung). | + sehr billig, als Zusatz zu 1 |

**Wahl:** 1 + 6 + 10 für benannte Figuren; 2 + 5 nur für eine festgelegte Liste großer Story-Gespräche (Offene Entscheidung D-OE2).

---

## D5 — Alltags- vs. Story-Gespräch (I-10, I-14, I-45)

**Problem heute:** Es gibt nur eine Darstellung. Ob jemand „gesprächig“ ist (`talky`), sieht man erst nach dem Ansprechen (Blase statt Fenster, einmaliger Log-Hinweis `barkHint`).

**Inspiration:** Mount & Blade (Herren mit Banner-Gespräch, Bauern nur Grußzeile) · Kenshi (benannte Figuren mit eigenem Kopf) · RimWorld (soziale Blasen) · Diablo (Story-NPC mit eigenem Glanz/Namenschild).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Drei Stufen**: Gruß = Blase, Alltag = kompakte Leiste, Story = breite Leiste mit Namensschild, Zoom, Balken. | ++ klar, nutzt D1/D4 |
| 2 | **Story-Siegel im Fenster** (kleines Wachssiegel-Symbol neben dem Namen). | + kleiner Hinweis |
| 3 | **Andere Schrift** für Story (Cinzel statt Spectral). | o schlechter lesbar bei viel Text |
| 4 | **Gesprächigkeit vor dem Ansprechen zeigen**: Prompt „E Sprechen“ vs. „E Grüßen“. | ++ kostet ein Wort, erspart Frust (I-14) |
| 5 | **Namenszeile über benannten Figuren** im Spiel (wie Koop-Namen). | o hilfreich, aber viel Text im Bild; eher bei Auswahl/Hover |
| 6 | **Musik-/Klangzeichen** beim Öffnen eines Story-Gesprächs (vorhandene `bell`, `duck`). | + Klang statt Text |
| 7 | **Pergament nur für Briefe/Urkunden** im Gespräch (Steckbrief, Siegel). | + passt zur Lesefenster-Regel |
| 8 | **Alltag ohne Fenster**: auch Dienste über Kontext-Knöpfe, Gespräch nur bei Story. | − bricht bestehende Dienstwege und Proben |
| 9 | **Story-Optionen golden**, Alltag grau. | + mit D2 kombinierbar |
| 10 | **Erinnerungsband**: kleine Zeile „kennt dich seit …“ aus `remember`. | o wieder Text |

**Wahl:** 1 + 2 + 4 + 6. Story-Kennzeichnung aus vorhandenen Daten ableiten (benannte Figur `NAMED_NPC`, Quest-Angebot/-Abgabe, Parley-Funktionen), keine neue Liste erfinden — die genaue Abgrenzung ist D-OE2.

---

## D6 — Blasen und Rufe (I-12, I-13, I-14)

**Problem heute:** Zwei Blasenstile: `drawBubble` (Szene/Boss, Spectral kursiv, folgt der Figur) und `drawBubbles` (Bewohner-Paare, Cinzel, höchstens 4, weichen aus). Gruß einfacher Leute wird auf 80 Zeichen gekürzt.

**Inspiration:** RimWorld (soziale Symbole statt Sätze) · Stardew (kurze Sätze, Porträt bei Klick) · Kenshi (Sätze über Köpfen, ohne Fenster) · Darkest Dungeon (Blasen mit Charakter je Sprecher).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Ein Blasenstil** für alle (Pergamentkante, Zipfel, folgt der Figur, Ausweichen), Unterschiede nur über Randfarbe (Feind rot, Bewohner Pergament, Gefährte Gold). | ++ Einheit, Vorhandenes zusammenführen |
| 2 | **Symbol statt Satz** bei Massenrufen (Gegner: Totenkopf/Schwerter; Bewohner: Herz, Münze, Tropfen). | + spart Lesen im Kampf |
| 3 | **Lautstärke**: Rufe größer, Flüstern kleiner/kursiv. | + Gefühl ohne Wörter |
| 4 | **Blasen mit Zeichenbegrenzung und Folgeblase** (T17 §2.6: 60 Zeichen). | + Lesbarkeit |
| 5 | **Gedankenblase** (Wolke) für innere Sätze des Helden. | o nur selten nötig |
| 6 | **Blasen im Log spiegeln** (Gesagtes nachlesbar). | + Barrierearm; Log hat Kategorie „Welt“ |
| 7 | **Kein Text, nur Murmel-Klang** für ferne Gespräche. | + Ambiente; `crowd`-Klang nach T17 geplant |
| 8 | **Blasen als Comic-Panel am Rand**. | − bricht Raumbezug |
| 9 | **Antwort-Blase des Helden** beim Gruß („Morgen.“). | o nett, mehr Text |
| 10 | **Blasenpriorität**: Story > Gefährte > Feind > Bewohner, wenn mehr als 4. | + ordnet, nutzt bestehende Begrenzung |

**Wahl:** 1 + 2 + 10, dazu 4 aus T17. Spiegelung ins Log (6) nur für Story-Blasen.

---

## D7 — Folgen, Proben, Reaktionen (I-04, I-05, I-09)

**Problem heute:** „(Händler +5)“, „(Willenskraft)“, „(Verbrechen)“, „(Loyalität 42)“ stehen im Satz. Nach der Wahl folgt ein weiterer Satz, Ruf-Änderung steht im Log.

**Inspiration:** Disco Elysium (Probe-Kennzeichen mit Fertigkeit, Erfolg/Misserfolg als Stempel) · Mount & Blade (Beziehungsänderung als kurze Meldung mit Gesicht) · Pillars (Ruf-Symbole) · Crusader Kings (Folgen als Symbole mit +/−).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Folgen-Chips** in der Option (Wappen ▲/▼, Würfel+Attribut, rote Hand). | ++ wie D2-6 |
| 2 | **Nach der Wahl: schwebendes Wappen +/−** über dem NPC bzw. dem Helden (`float` mit Symbol). | ++ Folge im Raum sichtbar |
| 3 | **Herz/geknicktes Herz** über dem NPC für Beziehung. | + kombiniert mit 2 |
| 4 | **Probe als Stempel** „Gelungen/Misslungen“ auf der Leiste. | + Moment; wieder ein Wort |
| 5 | **Würfelanimation** bei Willenskraftproben. | o ROTFALL würfelt verdeckt (`ri`), ein sichtbarer Würfel verspricht Transparenz, die es nicht gibt |
| 6 | **Zahlen nur im Tooltip** der Chips, Bild in der Zeile. | + entlastet; Spieler, die Zahlen wollen, behalten sie |
| 7 | **Ruf-Leiste blitzt** in der Kopfleiste (Mächte-Reiter) nach Änderung. | + Hinweis, wohin schauen |
| 8 | **Gefährten reagieren** (Geste) auf grausame/gnädige Wahl. | + vorhanden als Moral; Bild fehlt |
| 9 | **Bildschirmrand färben** (rot bei Verbrechen). | o kann mit Kampf verwechselt werden |
| 10 | **Folgen-Zusammenfassung** am Gesprächsende als Symbolzeile. | + gut für lange Ketten |

**Wahl:** 1 + 2 + 3 + 6 + 8. Ob Zahlen sichtbar bleiben oder nur im Tooltip stehen, ist D-OE4.

---

## D8 — Lange Texte, Wissen, Gerüchte (I-06, I-07, I-08)

**Problem heute:** `askTopic`, `gossip`, `companionTalk`, `encTalk`, Quest-Beschreibungen sind Absätze mit `\n`. Neues Wissen steht als Klammer „(Neues Wissen: X — frag andere danach.)“.

**Inspiration:** Pentiment/Pillars (Schlüsselwörter hervorgehoben, Glossar beim Überfahren) · Elder Scrolls (Themenliste wächst sichtbar) · Hades (Kodex-Eintrag schaltet mit Symbol frei).

| # | Variante | Bewertung |
|---|---|---|
| 1 | **Seiten**: lange Texte in Stücke, „Weiter ▸“ mit Pfeil wie JRPG. | + Lesefluss; mehr Klicks |
| 2 | **Schlüsselwörter hervorheben** (Orte, Namen, Mächte in Gold), Überfahren zeigt Kodex-Tooltip. | ++ verknüpft Welt und Text |
| 3 | **„Neues Wissen“ als Buch-Symbol**, das in den Kodex-Reiter fliegt. | ++ ersetzt Klammer durch Bewegung |
| 4 | **Gerüchte mit Ortsnadel**: Zeigt der Satz einen Ort, Knopf „auf der Karte“ (Ortskarte `mapPick`). | + nutzt Vorhandenes |
| 5 | **Vorlesen** (Sprachausgabe). | − keine Audiodateien, synthetische Stimme bricht Stimmung |
| 6 | **Kürzen** aller Texte. | o Inhaltsarbeit, nicht Darstellung |
| 7 | **Bildvignette** zum Thema (kleines Pixelbild: Turm, Krone, Schädel). | o schön, viel Grafikarbeit |
| 8 | **Wissenskarte** (Themen als Netz). | o eigenes Fenster, Kodex reicht |
| 9 | **Begegnungen mit Szene** (`encTalk`: Figur kniet/blutet sichtbar, Text kürzer). | + Gefahr spürbar, nutzt Gesten `knien` |
| 10 | **Gefährten-Status als Symbole** (Moral-, Loyalitätsbalken im Gesprächsfenster statt Klammer). | ++ ersetzt I-05 |

**Wahl:** 2 + 3 + 10, dazu 4 und 9. Seiten (1) nur für Texte über einer Länge, die D-OE3 festlegt.

---

# FEATURE IMPACT REPORT — Dialoge (GATE.md §8)

**Feature:** Bildhafte Gespräche: Fenster mit Stimmungsrahmen und Namensschild (D1), Optionen mit Art-Symbol, Gruppen und Folgen-Chips (D2/D7), Zuwenden und Reaktionsgesten (D3), leichter Kamerazoom und Klang für benannte Figuren (D4), drei Gesprächsstufen (D5), einheitliche Blasen (D6), hervorgehobene Schlüsselwörter und Wissenssymbol (D8).

### Betroffene Systeme (grep-belegt)
| System | Funktionen / Stellen |
|---|---|
| Dialog-DOM | ui.js `dialogue`, `closeDialogue`, `dialogueOpen`, `dlgWith`, `uiHooks`; index.html `#dialogue`, `#dlg-portrait`, `#dlg-name`, `#dlg-text`, `#dlg-choices`; style.css `.dialogue`, `.dlg-*` |
| Gesprächsaufbau | game.js `talk`, `talky`, `CHATTER`, `contextGreet`, `contextLines`, `worldTalk`, `companionTalk`, `askMenu`, `askTopic`, `gossip`, `newsTalk`, `encTalk`, `bigChoices`, `conChoices`, `conList`, `offerQuest`, `turnIn`, `npcOffers`, rund 30 `*Choices`-Helfer |
| Prompt | game.js `updatePrompt` (auch Schließen bei Abstand), `interactables`; ui.js `setPrompt` |
| Körpersprache | game.js `gesture`, `act`; anim.js `ANIM_DEFS.gesture`; fig5.js `rigS`/`rigW` |
| Kamera | game.js `camAim`, `camStep`, `R.cam`; `S.settings.motion` |
| Blasen | game.js `bubble`, `enemyBark`, `e.talk`; render.js `drawBubble`, `drawBubbles`, `drawFloats` |
| Folgen | game.js `addRel`, `remember`, `styleAct`, `S.factions`-Änderungen in `bigChoices`/Spezialgesprächen, `float` |
| Wissen | game.js `knownTopics`, `loreAnswer`, `S.know`, `LORE`; ui.js `codexUI` |
| Koop | coop.js `H.dialogue` (sendet `{t:'dlg', name, npcId, text, opts}`), Empfang `d.t === 'dlg'`, `uiHooks.close`, Gast-Escape |
| Proben | selftest: `#dlg-choices button`-Klicks und `#dlg-text`-Lesen (Festnahme, Kerker, Verträge `pick1`), insgesamt 38 Stellen mit Dialog-Bezug nach Zeile 15400 |
| Symbole | icons.js `iconURL` (Raster), neue Schlüssel nötig |

### Bereits vorhanden (wiederverwenden, nicht neu bauen)
Porträt `drawPortraitTo`; Namenskarte `nameCard` (Cinzel); Gesten (7) und `act(toward)`; `bubble` mit `who`; Regiebuch `cinematic(..., {stay})` für die wenigen Szenen-Einstiege; `duck`, `sfx('bell')`; `camAim`-Mitte wie Heldentod; Fraktionsfarben `FACTIONS.colors`; Kodex mit `codexKnown`; Ortskarte `mapPick`; Pixel-Tooltip `.tip`; Log-Kategorie-Zeichen.

### Fehlende Infrastruktur
1. **Optionsart und Folgen als Daten** an Choice-Objekten (`{text, fn, k?, fx?}`) plus Rückfall-Erkennung aus dem Text für alte Aufrufe.
2. **Koop-Nachricht** muss `k`/`fx` und Stimmung mitschicken (`opts` als Objekte statt Strings, alte Gäste tolerieren: `VER` in coop.js prüfen).
3. **Stimmungswert** je Gespräch (aus vorhandenen Größen: Beziehung `S.relations`, `fearedBy`, `stigmaOf`, `repTier`) — eine Funktion, kein neues Spielsystem.
4. **Gesprächs-Kamera** ohne `S.cine` (sonst Speichersperre und Eingabesperre): eigener Fokus-Hebel in `camAim`, nur bei `motion`.
5. **Zuwenden während des Gesprächs**: wiederholtes `act(..., toward)` solange `dlgWith` gesetzt ist; Bewohner-KI darf das Gespräch nicht wegziehen (`updateNpc` prüft heute `act`?) — Engineer prüft.
6. **Emote-Symbolset** (Grafik) und neue Icon-Schlüssel für Optionsarten.
7. **Schlüsselwort-Markierung** im Text: Liste aus `LORE`-Namen, `LOCATIONS`, `FACTIONS`, benannten NPC; HTML statt `textContent` — dabei Escape beibehalten.

### OFFENE DESIGNENTSCHEIDUNGEN
- **D-OE1 Welt während Gesprächen:** Heute läuft die Welt weiter (nur Modale pausieren, `S.paused`). Soll das so bleiben — auch bei Story-Gesprächen? *Empfehlung: ja, überall weiterlaufen (Kenshi); Gefahr während Gesprächen bleibt Teil des Spiels.*
- **D-OE2 Was ist ein „Story-Gespräch“** (breite Leiste, Balken, Zoom, Klang)? Kandidaten aus dem Code: benannte Figuren (`NAMED_NPC`), Quest-Angebot/-Abgabe, Parley-Funktionen (Varg, Garmadon, Weißbart, Dodon), Rat/Gericht. *Empfehlung: Quest-Angebot/-Abgabe bei benannten Figuren + Parleys + Rat/Gericht; Zoom nur beim ersten Gespräch mit einer benannten Figur und bei Parleys.*
- **D-OE3 Text läuft ein:** ja/nein, Tempo, abschaltbar? Ab welcher Länge Seiten? *Empfehlung: ja, Klick vervollständigt, aus bei „reduzierte Bewegung“; Seiten nur für die längsten Texte — Länge vom Entwickler.*
- **D-OE4 Zahlen in Folgen-Chips:** sichtbar (wie heute in Klammern) oder nur Richtung mit Zahl im Tooltip? *Empfehlung: Richtung + Wappen sichtbar, Zahl im Tooltip — das ändert, wie viel der Spieler auf einen Blick weiß.*
- **D-OE5 Emote-Set über Köpfen:** welche Symbole, auch bei Bewohnern ohne Gespräch? *Empfehlung: sechs Symbole (Frage, Ausruf, Zorn, Angst, Freude, Trauer), nur im Gespräch und bei Reaktionen.*
- **D-OE6 Mimik-Porträts** jetzt oder später? *Empfehlung: später; zuerst Stimmungsrahmen.*
- **D-OE7 Angst/Wut ohne Fenster** (D3-6): Darf „Bleib weg von mir!“ nur noch Blase sein, auch wenn der Spieler E drückt? *Empfehlung: ja, solange keine Optionen angeboten werden.*

### Risiken
- **Proben:** Optionstext muss im Button-`textContent` bleiben (Symbole als `<img>`/Pseudo-Element davor); `#dlg-text.textContent` muss sofort den ganzen Text enthalten (Schreibmaschine nur optisch).
- **Koop:** Gast sieht ohne Protokollerweiterung nur Text; Protokolländerung braucht Rückwärtsverträglichkeit.
- **344 Dialogaufrufe:** Rückfall-Erkennung aus Text kann falsch raten („[Gehen]“ sicher, „Ich mache es.“ sicher; Spezialtexte nicht) → anfangs nur sichere Muster, Rest ohne Symbol.
- **Kamera:** Zoom darf das Schließen bei 170 px Abstand und Kampf nicht stören; bei `motion` aus kein Zoom.
- **Bewegung im Gespräch:** Zurückweichen (D3-4) kann den Abstand über 170 px treiben → Gespräch bricht ab.
- **Leistung:** Stimmungsrahmen/Porträt nur beim Öffnen zeichnen, nicht je Frame.
- **Barrierefreiheit:** Farbe nie allein (immer Symbol); Tooltip-Zahlen per Tastatur erreichbar.

### Implementierungsplan in Scheiben
1. **Scheibe D-1 (klein, ohne Designfragen):** Zuwenden während des Gesprächs (D3-1), Reaktionsgeste aus bestehenden `addRel`-Änderungen (D3-2), Fenster fährt ein/aus und verblasst beim Weggehen (D1-8), Prompt „Sprechen“ vs. „Grüßen“ (D5-4). Proben: Gesprächsprobe weiter grün; neue Probe „NPC schaut den Helden an, solange `dlgWith`“. Debug: „Gesten-Test im Gespräch“. MECHANIKEN: Abschnitt Gespräche.
2. **Scheibe D-2:** Optionsarten (`k`) mit Symbol und Gruppen (D2-1/2/9), Rückfall-Erkennung nur sichere Muster; Koop-Protokoll mitziehen. Grafik: Icon-Schlüssel.
3. **Scheibe D-3 (nach D-OE4):** Folgen-Chips (`fx`) in `bigChoices`, `encTalk`, Spezialgesprächen; schwebendes Wappen/Herz nach der Wahl (D7-2/3); Gefährten-Statusbalken (D8-10).
4. **Scheibe D-4 (nach D-OE2/D-OE3):** Stimmungsrahmen + Namensschild (D1-2/7), Story-Stufe mit Zoom/Klang (D4-1/6/10, D5-1/2/6), Text läuft ein.
5. **Scheibe D-5:** Einheitliche Blase + Symbolrufe + Priorität (D6), Schlüsselwörter + Wissenssymbol (D8-2/3), Ortsnadel bei Gerüchten (D8-4).
6. **Scheibe D-6 (nach D-OE5/D-OE6):** Emote-Set, ggf. Mimik.
Jede Scheibe: Parse-Check, `window.RF` vorhanden, Selbsttest vollständig grün, Sichtprüfung im Spiel (Bild vorher/nachher), Debug-Eintrag, `docs/MECHANIKEN.md`.
