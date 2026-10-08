# Visueller Umbau — Priorität 5: ITEMS / BEUTE

Analyst C · 02.10.2026 · Status: **ANALYSE, kein Code** (VISUAL.md §5, GATE.md §1–§8)
Kennzeichnung: **FAKT** (mit Funktionsname belegt), **VORSCHLAG**, **ANNAHME**. Keine neuen Regeln oder Zahlen für das Spiel; Zahlen in Vorschlägen sind reine Darstellungswerte (Pixel, Millisekunden) und als solche markiert.

---

## 0. Bestand (FAKT, per grep belegt)

**Daten (`data.js`)**
- `RARITY` (6 Namen), `RARITY_ORDER`, `RARITY_DROP` (62 / 24 / 10 / 3,5 / 0,5 %), `RARITY_VALUE` (×1 … ×8), `RARITY_AFFIXES` (0/1/2/3/2/0).
- `AFFIXES` (15 Einträge, je `slots`, `name`, `v`, `fmt`; `major` bei Blutzoll, Zerfetzen, Dornen). `LEGENDS` (3: Blutdurst, Nachhall, Ahnenwall).
- `ARMOR_SETS` (13; `pieces`, optional `extra`, `t3`, `t4`, `desc`, `tdesc`). `BOSS_LOOT`, `LOOT` je Gegnertyp. `ITEMS` mit `lore`, `desc`, `sdesc`, `unique`, `fixed`, `bound`, `classSet`.

**Logik (`game.js`)**
- `mkItem(key, count, roll)` — Exemplar; Ausrüstung bekommt **immer** `cond = 0.55 + rnd·0.45`; Rarität nur mit `roll`.
- `rollRarity(o, it, bonus, force)` — `o.rar`, `o.afx`, `o.leg`; nie unter Grundrarität. `rarOf`, `legOf`, `afx`, `hasLeg`, `setOf(c)` (liefert `n`, `bonus`).
- `dropLoot(e)` mit `lootTier(e)`; `dropItemAt(map,x,y,item)` legt `{kind:'item'}` in `S.ents`. Gold: `float(e, '+g Gold', gold)` direkt am Gegner.
- Aufheben: `doInteract` → `giveItem` → `log('Aufgehoben: …','world')` → `onItemGained(key)` (nur Questzähler). Koop: `doInteractFor(m)` („wer zuerst aufhebt“).
- Truhen: `t.loot` → `mkItem(k,1,{bonus})` → `log('Gefunden: … (Selten)')` + `UI.toast('… geöffnet')`. Kisten ohne `loot`: ein Zufallsding aus fünf.
- `eliteDrop(c)` (Kopfgeld-Minibosse).

**Darstellung**
- `render.js drawGroundItem(e, now)`: Schwebe-Wippen (sin), Schatten, Seltenheits-**Kreis** (rgba je Rarität, pulsiert), Icon aus `groundIcon(key)` (Stil R: `iconR` 24 px) bzw. `SP.itemAtlas` (Stil F, aus).
- `render.js drawItemIconTo(canvas,key,raw)` → Stil R `iconR` (aus dem echten Sprite geschnitten), sonst `drawItemVec` (Metallfarbe nach **Grund**rarität `it.rarity`, nicht Exemplar).
- `ui.js itemInfoHTML(slot, cmpWith)` — Name in Raritätsfarbe, „Rarität · Platz“, `itemPurpose`, `sdesc`, Güte/Hersteller, Magitech-Energie, Bionik-`desc`, „Gebraucht“, Affixzeilen (`.affix`, `.major`), Legendär (`.legend-fx`), `lore`, `history`, Werte mit `.better/.worse` **nur für Schaden und Rüstung**, Zustand mit Tooltip, Grundwert.
- `style.css`: `.r-common … .r-mythic` (Textfarbe), `.cell.r-*` (Rahmen; legendär/mythisch mit Innenrahmen).
- Set: Anzeige nur in „Aktive Effekte“ (`game.js` ~Z. 11920, `add('Ausrüstung','⛨','Set: …')`), nicht am Gegenstand.
- Klang: `sfx.js` hat `ui`, `metal`, `bell` u. a.; **kein** Münz-, Aufheb- oder Seltenheitsklang.
- Piktogramme: `icons.js` (`iconURL`) hat `muenzen`, `beutel`, `stern`, `warn`, `res_gold` u. a.

**Beobachtungen (FAKT, mögliche Fehler — nicht Teil dieses Auftrags, an Engineer)**
1. `ui.js slotLabel` kennt `hands`, `legs`, `talisman` nicht → im Tooltip steht das englische Schlüsselwort.
2. Vergleich (`cmp`) nur Schaden/Rüstung; Affixe, Legendär, Set, Tempo, Reichweite werden nicht verglichen.
3. `drawItemVec` färbt Metall nach Grundrarität; ein seltenes Langschwert sieht im Stil D aus wie ein gewöhnliches (Stil R: Icon ohne Raritätsbezug).
4. Seltene Beute von Gegnern wird **nirgends** angekündigt (nur Truhen schreiben die Rarität ins Protokoll).

---

## 1. Itemkarte (die „Karte“ eines Gegenstands)

**Problem:** `itemInfoHTML` ist ein Textblock aus bis zu 15 Zeilen; Bild fehlt im Detail, Seltenheit nur als Wort und Textfarbe. Wichtig (Schaden, Rüstung) und Nebensache (Grundwert, Lore) stehen gleich groß.
**Inspiration:** Diablo II/IV (Kopf mit Rarität, Kernwert groß), PoE (Trennlinien je Block), Hades (Karte mit Bild und einem Satz), Darkest Dungeon (Schmuckstück auf Pergamentrahmen), Albion (Kennzahl-Zeile mit Piktogrammen).

| # | Variante | Idee |
|---|---|---|
| 1 | Klassische Tooltip-Karte | Kopf (Name, Rarität), Kernwert groß, Blöcke durch Linien getrennt, Lore unten kursiv. |
| 2 | Bildkarte | Großes Pixel-Icon (×4) links, rechts drei Kennzahlen mit Piktogramm; Rest einklappbar. |
| 3 | Pergament-Etikett | Gegenstand „hängt“ an einem Anhänger mit Siegel in Raritätsfarbe. |
| 4 | Waffenschmied-Tafel | Schwarzes Eisenbrett, Werte als eingeschlagene Ziffern, Affixe als Runen. |
| 5 | Kartenstapel | Grundwerte vorn, Affixe/Legende/Lore als hintere Karten, durchblätterbar. |
| 6 | Ringdiagramm | Werte als Segmente um das Icon (Schaden, Tempo, Reichweite). |
| 7 | Steckbrief | Wie Bestiarium: Bild, Herkunft (`history`), wer es trug. |
| 8 | Zwei-Ebenen-Karte | Kurz (Name, 1 Kennzahl, Vergleichspfeil) beim Überfahren; lang mit Umschalt/Klick. |
| 9 | Diegetisch am Boden | Karte erscheint über dem Gegenstand in der Welt, statt im Fenster. |
| 10 | Hybrid 2 + 8 | Bildkarte mit Kennzahl-Piktogrammen als Kurzform, aufklappbar zur vollen Karte. |

**Bewertung:** 1 ist vertraut, aber bleibt Text. 3/4 sind atmosphärisch, kosten aber eine zweite Stilwelt (ui_redesign: Pergament nur für Lesefenster). 5/6 sind langsam zu lesen. 7 passt zu `history`, ist aber nur für Erbstücke sinnvoll. 9 kollidiert mit der Spielfeldmitte (ui_redesign Prinzip 5). **10** nutzt vorhandenes (`drawItemIconTo` in groß, `icons.js`-Piktogramme, `.better/.worse`) und trennt Wichtiges von Nebensache.
**Wahl:** **10**, mit der Rahmenfarbe aus 1 und dem `history`-Block aus 7 als Fußzeile, wenn vorhanden.

## 2. Tooltip (wann und wo die Karte erscheint)

**Problem:** Im Inventar zeigt Überfahren nur den Namen (`cell.title`, Browser-Tooltip); die Werte erst nach Klick in der rechten Spalte. Im Handel nur per `onmouseenter` (kein Touch-Pfad). Ausrüstungsplätze haben gar keinen Tooltip, Klick legt sofort ab (`A.unequip`).
**Inspiration:** WoW (Tooltip folgt der Maus, Umschalt vergleicht), PoE (Alt zeigt Affix-Stufen), Stardew (Tooltip klein, sofort), Runescape (Rechtsklick-Menü mit „Untersuchen“).

| # | Variante | Idee |
|---|---|---|
| 1 | Maus-Tooltip | Eigene schwebende Karte am Mauszeiger, sofort, ersetzt `title`. |
| 2 | Feste Detailspalte | Wie heute, aber Überfahren statt Klick füllt sie. |
| 3 | Verzögerter Tooltip | Erst nach 250 ms (VORSCHLAG), damit schnelles Überfahren nicht flackert. |
| 4 | Rechtsklick-Untersuchen | Kontextmenü mit Untersuchen/Anlegen/Ablegen (Runescape). |
| 5 | Tastenmodus | Alt hält erweiterte Karte (Affix-Spannen `v`). |
| 6 | Touch-Halten | Langes Drücken öffnet die Karte, Loslassen schließt. |
| 7 | Doppel-Tooltip | Neben der Karte die des angelegten Teils (Vergleich, siehe §7). |
| 8 | Fokus-Rahmen | Tastatur/Pfeile wandern durchs Raster, Karte folgt. |
| 9 | Im-Welt-Tooltip | Kurzkarte über Bodenbeute bei Annäherung (statt Prompt-Text). |
| 10 | Kombination 1 + 6 + 7 | Maus-Tooltip mit Vergleich daneben; Touch über Halten. |

**Bewertung:** 2 ist der kleinste Schritt, 1 der größte Gewinn ohne Klick. 4 ist mit der vorhandenen Aktionsleiste (`showDetail` Knöpfe) doppelt. 5 ist Kür. 6 nötig, weil das Spiel ein Touch-Overlay hat (`bindTouch`). 9 gehört zu §4 Präsentation.
**Wahl:** **10**; Detailspalte (2) bleibt für die Aktionsknöpfe (`showDetail`), Ausrüstungsplätze bekommen denselben Tooltip (Klick legt nicht mehr ohne Blick ab — siehe offene Frage I-2).

## 3. Seltenheit

**Problem:** Rarität ist Wort + Textfarbe + 1-px-Rahmen (`.cell.r-*`). Im Handel, im Lager-Raster und in der Ausrüstungsliste fehlt sie ganz. Das Icon selbst ist bei allen Raritäten gleich.
**Inspiration:** Diablo (Farbe des Namens + Lichtsäule), PoE (Rahmenform je Stufe), Terraria (Farbname), Darkest Dungeon (Schmuck-Rahmen), Borderlands (Farbstrahl — nur als UX-Gedanke).

| # | Variante | Idee |
|---|---|---|
| 1 | Nur Farbe überall | `.r-*`-Farben konsequent in allen Listen. |
| 2 | Rahmenform je Stufe | Gewöhnlich ohne, Ungewöhnlich Ecken, Selten Doppellinie, Episch Nieten, Legendär Zierrahmen, Mythisch Splitter. |
| 3 | Edelstein-Marke | Kleiner Pixel-Stein in der Zellenecke (Form + Farbe, auch für Farbenblinde). |
| 4 | Hintergrund-Glut | Zellenhintergrund verläuft leicht in Raritätsfarbe. |
| 5 | Animierter Glanz | Ein Lichtstreif läuft über Episch+ (selten, langsam). |
| 6 | Ziffer/Römisch | I–VI in der Ecke. |
| 7 | Icon-Tönung | Metallteile des Icons in Raritätston (wie `drawItemVec` schon für Grundrarität). |
| 8 | Klang je Stufe | Beim Aufheben/Überfahren ein Ton, Höhe nach Stufe. |
| 9 | Name-Banner | Name in der Karte auf Banner in Raritätsfarbe. |
| 10 | Kombination 2 + 3 + 1 | Form und Marke zuerst (lesbar ohne Farbe), Farbe zusätzlich, Glanz nur Legendär/Mythisch. |

**Bewertung:** Nur Farbe (1) scheitert bei Farbschwäche und dunklem Stil. 2 + 3 sind pixeltreu und billig (CSS/Piktogramm einmal gezeichnet). 5 nur sparsam, sonst „Neon“ (ui_redesign Prinzip 7). 7 müsste `iconR` je Rarität neu cachen (Speicher). 8 gehört zu §5.
**Wahl:** **10** (2 + 3 + 1), Glanz (5) nur Legendär/Mythisch.

## 4. Präsentation am Boden (Bodenbeute)

**Problem:** `drawGroundItem` zeigt Icon + Kreis; zwischen Leichen, Blut und Nacht geht Beute unter; viele Teile übereinander sind nicht unterscheidbar. Prompt nennt nur den Namen (`<b>E</b> Aufheben — Name`).
**Inspiration:** Diablo (Lichtsäule + Namensschild), PoE (Filter, Rahmen am Boden), Terraria (Item glimmt, wippt), Stardew (Schatten + Wippen), Kenshi (Beute nur im Leichen-Inventar).

| # | Variante | Idee |
|---|---|---|
| 1 | Lichtsäule ab Selten | Schmaler senkrechter Strahl in Raritätsfarbe. |
| 2 | Namensschild bei Alt | Taste zeigt Namen aller Bodenbeute. |
| 3 | Bodenschimmer | Wie heute, aber Kreis als Pixel-Raute in Raritätsfarbe. |
| 4 | Funkenpartikel | Wenige aufsteigende Funken ab Episch. |
| 5 | Leichen-Beutel | Beute bleibt an der Leiche, ein Beutel-Symbol zeigt „hier ist etwas“. |
| 6 | Kantenmarker | Liegt Beute außerhalb des Bildes, Pfeil am Rand (nur Episch+). |
| 7 | Minikarten-Punkt | Seltene Beute als Punkt auf der Minikarte. |
| 8 | Nacht-Glimmen | Raritätsschein wird nachts stärker (passt zu Licht/Wetter in `render.js`). |
| 9 | Prompt mit Raritätsfarbe | `setPrompt` zeigt Name farbig + Marke aus §3. |
| 10 | Kombination 3 + 1 + 9 + 8 | Raute für alles, Strahl ab Selten, farbiger Prompt, nachts heller. |

**Bewertung:** 5 ändert Beute-Logik (Leichen-Inventar) → Gameplay, nicht nur Optik → GATE: nicht ohne Entscheidung. 2 braucht neue Taste (Belegung offen, `bindInput` voll). 6/7 überladen. 1/3/8/9 sind reine Darstellung, billig (einmal pro Bild je Bodenbeute; Zahl der Bodenbeute ist klein).
**Wahl:** **10**.

## 5. Drop-Animation

**Problem:** `dropItemAt` setzt das Teil sofort an die Endposition (±10 px). Kein Moment „etwas ist gefallen“.
**Inspiration:** Diablo (Gegenstand fliegt im Bogen, landet mit Klang), Hades (Belohnung springt aus dem Raum), Terraria (Item hüpft heraus), Darkest Dungeon (Beute wird nach dem Kampf ausgelegt).

| # | Variante | Idee |
|---|---|---|
| 1 | Bogenwurf | Teil fliegt in kurzem Bogen vom Körper zum Landepunkt. |
| 2 | Aufprall + Staub | Landung mit `fx(…,'dust')` (vorhanden). |
| 3 | Rarität-Verzögerung | Seltene Teile fallen kurz nach den gewöhnlichen (Spannung). |
| 4 | Klang je Stufe | Gewöhnlich dumpf, Episch hell, Legendär Glocke (`sfx` synthetisch). |
| 5 | Aufleuchten | Beim Landen ein heller Blitz in Raritätsfarbe. |
| 6 | Kreisend | Teile drehen sich in der Luft (Pixel-Rotation, teuer). |
| 7 | Aus der Leiche gleiten | Teil rutscht aus dem Körper zur Seite. |
| 8 | Münzregen | Gold als kleine Münzen, die zum Spieler fliegen (siehe §6). |
| 9 | Zeitlupe bei Legendär | Kurzes Hit-Stop-artiges Halten (es gibt Hit-Stop). |
| 10 | Kombination 1 + 2 + 4 + 5 | Bogen, Staub, Klang, Aufleuchten — Stufe skaliert Klang und Licht. |

**Bewertung:** 6 teuer (Rotation zerstört Pixelraster). 9 greift ins Spielgefühl (Kampf läuft weiter, Hit-Stop gehört dem Treffer) → nicht ohne Entscheidung. 3 verschiebt nur Darstellung (Teil ist logisch sofort da) — riskant für Koop-Deltas, wenn Position animiert wird. **Daher Animation nur als Darstellungsversatz** (`e.dropT`, nicht gespeichert, `SKIP`/transient), Logikposition bleibt sofort.
**Wahl:** **10**; Koop-Gast erhält Beute über Entitäts-Deltas — Animation läuft lokal aus `dropT`, wenn vorhanden, sonst ohne.

## 6. Loot-Popups (Meldung beim Aufheben)

**Problem:** Aufheben schreibt eine Protokollzeile („Aufgehoben: X“) in 3 sichtbaren Zeilen; der Toast ist einzeln (`toast` ersetzt den alten). Gold aus `dropLoot` als `float` am Gegner, nicht am Spieler.
**Inspiration:** WoW (Beutefenster + Meldung rechts unten), Diablo IV (Aufnahme-Stapel links), Stardew (Icon + Anzahl steigt am Rand), Hades (Symbol fliegt in die Leiste), Albion (Stapelmeldung „+3 Leder“).

| # | Variante | Idee |
|---|---|---|
| 1 | Aufnahme-Stapel | Rechts unten Icon + Name in Raritätsfarbe, verblasst; mehrere zugleich. |
| 2 | Fliegt ins Gepäck | Icon fliegt vom Boden zum Reiter „Gepäck“ (Kopfleiste). |
| 3 | Zähler am Rand | Gleiche Teile werden zusammengezählt (+3 Heilkraut). |
| 4 | Großer Fund | Ab Episch: mittige Karte für 1–2 s (wie Hades-Segen), ESC schließt. |
| 5 | Nur Protokoll | Wie heute, aber Protokollzeile mit Icon. |
| 6 | Float über dem Spieler | „+Langschwert“ steigt über dem Kopf auf (`float` vorhanden). |
| 7 | Leichen-Fenster | Kleines Beutefenster beim Plündern (WoW). |
| 8 | Sammel-Zusammenfassung | Nach dem Kampf eine Zeile „Beute: …“. |
| 9 | Gepäck-Reiter pulsiert | Goldener Punkt am Reiter (`.dot` existiert) bis man nachschaut. |
| 10 | Kombination 1 + 2 + 3 + 9 | Stapel mit Icon und Zählung, Icon fliegt zum Reiter, Punkt bis geöffnet; großer Fund (4) nur Legendär/Mythisch. |

**Bewertung:** 1 deckt sich mit ui_redesign Scheibe 4 (Meldungsfluss) — **gleiche Infrastruktur nutzen**, kein zweites Popup-System (GATE §6). 7 ändert das Plündern (Gameplay). 4 unterbricht Kampf → nur ohne Pause und nur höchste Stufen. 6 verdeckt Schadenszahlen.
**Wahl:** **10**, gebaut **auf** dem Meldungsfluss aus ui_redesign Scheibe 4 (Abhängigkeit).

## 7. Vergleich

**Problem:** `itemInfoHTML` vergleicht nur `dmg` und `armor` mit `p.equip[it.slot]`; bei Zweiwaffen (`dualOn`) wird die Nebenhand nicht berücksichtigt; Affixe, Legendär, Set-Verlust, Tempo, Reichweite, Zustand fehlen.
**Inspiration:** WoW (zwei Karten nebeneinander), Diablo IV (grüne/rote Pfeile je Zeile + Gesamt), PoE (Werte-Differenz in eigenem Block), Albion (Itemkraft als eine Zahl).

| # | Variante | Idee |
|---|---|---|
| 1 | Zwei Karten nebeneinander | Angelegt links grau, neu rechts. |
| 2 | Pfeile je Zeile | ▲ grün / ▼ rot hinter jedem Wert. |
| 3 | Delta-Block | Eigener Block „Änderung beim Anlegen“. |
| 4 | Gesamt-Zahl | Ein Wert („Kampfkraft“) — **neue Formel = neue Regel** → verboten ohne Entscheidung. |
| 5 | Waage-Symbol | Kippende Waage zeigt besser/schlechter. |
| 6 | Pfeil im Raster | Kleiner Pfeil in der Inventarzelle (siehe inventar.md §6). |
| 7 | Set-Warnung | „Bricht Set Rotgarde“ als rote Marke, wenn `setOf` danach anders wäre. |
| 8 | Zustand im Vergleich | `cond` beider Teile als Balken. |
| 9 | Charakterwerte-Vorschau | Nur abgeleitete Werte (siehe §8). |
| 10 | Kombination 2 + 3 + 7 + 8 | Pfeile je Zeile, Delta-Block für Affixe/Legende, Set-Warnung, Zustandsbalken; zwei Karten (1) mit Umschalt. |

**Bewertung:** 4 erfindet eine Kennzahl → GATE §2 verbietet. 5 ist hübsch, aber ungenau. 2/3/7/8 lassen sich aus vorhandenen Funktionen ableiten (`setOf`, `afx`, `cond`).
**Wahl:** **10**.

## 8. Stat-Vorschau

**Problem:** Man sieht nicht, wie sich Rüstung gesamt, Schaden, Leben, Ausdauer, Tempo durch Anlegen ändern (`armorOf`, `damageOf`, `recalc` wirken über Affixe, Sets, Zustand, Talente).
**Inspiration:** Diablo IV (Charakterwerte-Änderung beim Überfahren), PoE (DPS-Änderung), FFXIV (Itemlevel-Pfeil).

| # | Variante | Idee |
|---|---|---|
| 1 | Simuliertes Anlegen | Kopie des Spielers, Teil tauschen, `armorOf`/`damageOf`/`recalc` lesen, Differenz zeigen. |
| 2 | Nur Itemwerte | Wie heute (keine Vorschau). |
| 3 | Balken-Vorschau | HUD-Balken zeigen gestrichelt den neuen Höchstwert. |
| 4 | Papierpuppe färbt | Rüstungszonen der Figur werden grün/rot. |
| 5 | Zahlen am Charakterfenster | Beim Überfahren springt `charUI` mit Pfeilen um. |
| 6 | Trefferzonen-Vorschau | `bodyChart` zeigt, welche Zone besser geschützt ist — **Rüstung wirkt im Code global (`armorOf`), nicht je Zone** → würde falsche Regel suggerieren. |
| 7 | Gegner-Vergleich | „Gegen Untote +20 %“ (Totenbann/Set) als Marke. |
| 8 | Kurz-DPS | Schaden / Angriffszeit — **neue Kennzahl** → offen. |
| 9 | Ausdauer je Hieb | Vorhandener Wert `stam` mit Pfeil. |
| 10 | Kombination 1 + 3 + 9 + 7 | Simulation mit vorhandenen Funktionen; Balken-Vorschau im Tooltip, Ausdauer je Hieb, Sondermarken. |

**Bewertung:** 1 ist ehrlich (nutzt dieselben Formeln), aber `recalc` hat Nebenwirkungen (setzt `c.maxHp`, Körperteile) → Simulation muss an einer **Kopie** laufen; Risiko: Affix- und Set-Funktionen lesen `S` (z. B. `armorOf` prüft Verbündete in der Nähe). 6 widerspricht dem Regelwerk. 8 ist neue Kennzahl.
**Wahl:** **10**, Simulation an Kopie, nur Werte, die das Spiel schon rechnet. ANNAHME: `structuredClone` der Ausrüstung + Aufruf von `armorOf/damageOf` genügt — vor Bau prüfen (Seiteneffekte von `recalc`).

## 9. Set / Affix

**Problem:** Affixe stehen als „Schärfe: Schaden +9 %“ — ohne Spanne, ohne Hinweis major/minor außer Farbe. Set-Zugehörigkeit steht **nicht** am Gegenstand; nur im Effekte-Fenster, wenn komplett. Man weiß nicht, welche Teile fehlen.
**Inspiration:** WoW (Set-Liste mit grau/gelb, Boni nach Teilen), Diablo (Set-Teile grün), PoE (Affix-Stufen bei Alt), GW2 (Runen-Zähler „(3/6)“).

| # | Variante | Idee |
|---|---|---|
| 1 | Set-Liste in der Karte | Alle Teile, getragene hell, fehlende grau; Boni nach `t3/t4`. |
| 2 | Set-Zähler | „Hochritter 2/4“ als Marke im Icon-Eck. |
| 3 | Set-Puppe | Mini-Silhouette mit leuchtenden Teilen. |
| 4 | Set-Farbe | Eigene Set-Farbe (grün wie Diablo) — **kollidiert** mit Ungewöhnlich-Grün (`.r-uncommon`). |
| 5 | Affix-Symbol | Jedes Affix ein kleines Pixelzeichen (Klinge, Herz, Stiefel …). |
| 6 | Affix-Spanne | Balken: wo liegt der Wert zwischen `v[0]` und `v[1]`. |
| 7 | Major als Rune | Spielverändernde Affixe als große Rune mit Rahmen. |
| 8 | Legendär-Siegel | `LEGENDS` als Siegel mit eigenem Symbol. |
| 9 | Set-Bonus-Feier | Beim Vervollständigen kurzer Glanz um die Figur + Meldung. |
| 10 | Kombination 1 + 2 + 5 + 6 + 7 + 9 | Set-Liste + Zähler, Affix-Zeichen mit Spannenbalken, Major als Rune, Glanz bei Vollständigkeit. |

**Bewertung:** 4 kollidiert mit Raritätsfarbe. 3 doppelt die Papierpuppe (inventar.md §8). 6 zeigt eine vorhandene Zahl (`v`), keine neue Regel. 9 braucht Erkennung „Set-Stufe hat sich erhöht“ — `setOf` liefert `n`; Vergleich vor/nach in `equip` möglich.
**Wahl:** **10**.

---

## FEATURE IMPACT REPORT (GATE.md §8) — Items/Beute visuell

**Feature:** Bildkarte mit Tooltip und Vergleich, Seltenheit als Form + Marke + Farbe, Bodenbeute mit Raute/Strahl/Nacht-Glimmen, Drop-Bogen mit Klang, Aufnahme-Stapel im Meldungsfluss, Stat-Vorschau, Set-/Affix-Darstellung.

**Betroffene Systeme (Funktionen)**
- UI: `ui.js itemInfoHTML`, `showDetail`, `invUI`, `tradeUI`, `slotLabel`, `effectsUI`, `toast` (→ Meldungsfluss), `setPrompt`, `paintNav` (Punkt am Reiter).
- Render: `render.js drawGroundItem`, `groundIcon`, `drawItemIconTo`, `iconR`, `drawItemVec`; Licht/Nacht-Pass.
- Logik (nur Auslöser, keine Regeländerung): `game.js dropLoot`, `dropItemAt`, `eliteDrop`, Truhen-Zweig in `doInteract`, `giveItem`, `onItemGained`, `equip` (Set-Feier), `setOf`, `armorOf`, `damageOf`, `recalc`, `float`.
- Klang: `sfx.js sfx` (neue Fälle `coin`, `loot` — synthetisch).
- Koop: `coop.js` Entitäts-Deltas (Bodenbeute), `doInteractFor`, `uiHooks.modal`.
- Piktogramme: `icons.js` (`iconURL`; neue Zeichen für Rarität/Affixe).

**Bereits vorhanden:** Raritätsfarben (`.r-*`, `drawGroundItem`-Farben), Icons aus echten Sprites (`iconR`), Vergleich Schaden/Rüstung, Affix-`fmt`, Set-Daten mit Stufen, `fx(...,'dust')`, `float`, `bubble`, `.dot` am Reiter, Piktogramm-Erzeuger.

**Fehlende Infrastruktur:** schwebender Tooltip (DOM, einmal), Meldungsfluss (ui_redesign Scheibe 4), Rarität-/Affix-Piktogramme, Set-Abfrage „welche Teile fehlen“ (aus `ARMOR_SETS` ableitbar), sichere Stat-Simulation an Kopie, Darstellungsfeld `dropT` (transient), zwei `sfx`-Fälle.

**OFFENE DESIGNENTSCHEIDUNGEN**
- I-1 **Wie laut darf seltene Beute sein?** Lichtstrahl ab Selten oder erst ab Episch; großer Fund-Moment (Karte in der Mitte) nur Legendär/Mythisch oder gar nicht? *Empfehlung:* Strahl ab Selten, Mitte-Karte nur Legendär/Mythisch, ohne Pause.
- I-2 **Klick auf Ausrüstungsplatz legt sofort ab** (`A.unequip`). Beibehalten oder Klick = Karte, Doppelklick/Ziehen = Ablegen? *Empfehlung:* Klick zeigt Karte, Ablegen per Knopf oder Ziehen.
- I-3 **Aufheben mit E** einzeln (heute) oder „alles in der Nähe aufheben“? Das ist Gameplay (Tempo, Tasche voll). *Empfehlung:* nicht in diesem Umbau; nur Darstellung.
- I-4 **Bekommt Bodenbeute ein Namensschild-Taste (Alt)?** Tastenbelegung ist knapp. *Empfehlung:* nein, farbiger Prompt reicht.
- I-5 **Darf eine Gesamt-Kennzahl (Kampfkraft/DPS) eingeführt werden?** Neue Regel. *Empfehlung:* nein; nur Werte zeigen, die das Spiel rechnet.
- I-6 **Seltene Beute im Protokoll ankündigen** (heute nur Truhen)? *Empfehlung:* ja, Kategorie „Welt“, gleiches Format wie Truhe.

**Risiken**
- Leistung: Bodenbeute-Strahl/Glimmen je Bild; Zahl der Bodenbeute ist klein, aber Schlachtfelder (Feldschlachten, Belagerung) können viele Drops erzeugen → Effekt nur im Sichtfeld, gecachte Strahl-Bitmap je Rarität.
- Koop: Animationsfelder dürfen nicht als Delta laufen (Bandbreite); Gast sieht Beute ohne Bogen, wenn `dropT` fehlt — akzeptabel.
- Selbsttest: Proben lesen `S.ents.__a` nach `kind:'item'` (z. B. `dropLoot`-Probe, `eliteDrop`-Probe); neue Felder am Item-Entity dürfen Filter nicht stören. Proben, die `toast` erwarten, laufen unter `S._quiet` (kein DOM).
- Stat-Simulation: `recalc` schreibt in die Figur → nur an Kopie; `armorOf` liest Umgebung (`ch.ally`) → Vorschau kann in der Nähe von Verbündeten anders sein als später (Hinweis in Karte).
- Farbenblindheit: Form + Marke vor Farbe.
- RNG: keine RNG-Aufrufe in der Darstellung (`vrnd`/`Math.random` nur für Optik, nie `rnd()`), sonst kippen Proben.

**Implementierungsplan (Scheiben)**
1. **I-S1 Karte + Tooltip + Seltenheit** (nur `ui.js`/`style.css`/`icons.js`): `slotLabel` ergänzen, Tooltip-Element, Bildkarte, Rarität als Form + Marke in allen Listen (Inventar, Lager, Ausrüstung, Handel). Probe: Karte enthält Icon, Raritätsmarke, Pfeile.
2. **I-S2 Vergleich + Stat-Vorschau + Set/Affix** (`ui.js` + Lesefunktionen aus `game.js` über `bind`): Simulation an Kopie, Set-Liste, Affix-Spannen. Probe: Vorschau = Werte nach echtem `equip` (in Sandbox).
3. **I-S3 Boden + Drop** (`render.js`, `sfx.js`, `dropItemAt` setzt `dropT`): Raute/Strahl/Nacht, Bogen, Staub, Klang. Probe: `dropT` nicht im Spielstand (`SKIP` bzw. Entity-Feld beim Speichern entfernt).
4. **I-S4 Aufnahme-Stapel** — **nach** ui_redesign Scheibe 4 (Meldungsfluss): Icon fliegt zum Reiter, Zähler, Punkt am Reiter, großer Fund.
Je Scheibe: Debug-Eintrag („Beute regnen lassen: je Rarität ein Teil“), Hinweis in `docs/MECHANIKEN.md` (Seltenheitszeichen), Kodex-Handbuch-Abschnitt.

**STATUS:** TEILWEISE DEFINIERT — I-S1/I-S2 ohne offene Entscheidung außer I-2 baubar; I-S3/I-S4 warten auf I-1, I-6 und ui_redesign Scheibe 4.
