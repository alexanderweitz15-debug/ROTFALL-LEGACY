# Rotfall: Legacy — Ist-Zustand (Feature-Inventar aus dem Code)

Stand: 29.09.2026, Code-Version 19 (`index.html` lädt `src/game.js?v=19`). Dieses Dokument beschreibt, **was im Code steht**,
nicht was geplant ist. Es soll einer anderen KI (oder einem Menschen) zeigen, was es gibt, damit sich Lücken finden lassen.

**Quellen:**
- `src/data.js` wurde ganz gelesen, die Tabellen sind vollständig ausgezählt.
- Aus `src/game.js` wurden gelesen:
  - alle Konstantentabellen,
  - die Kernfunktionen (Kampf, Magie, Tod, Welt-Tick, Ereignisse, Aufträge, Recht, Wirtschaftsmenüs, Titel, Debug),
  - die Funktionsliste je Abschnitt.
- Nur in Teilen gelesen:
  - `world.js`, `ui.js`, `state.js`, `body.js`, `cloudsave.js`, `sfx.js`, `economy.js`, `sim.js`,
  - die Grafikmodule `render.js`, `fig5.js`, `sprites.js` und `figure.js`.
- Wo eine Angabe nur aus Kommentaren oder Doku stammt, steht das dabei.

**So ist jeder Eintrag aufgebaut:**
- was er im Spiel tut,
- wie man darauf stößt,
- Zahlen,
- Code: Datei und Funktion,
- Zustand: Feld in `S.*`.

Zeilennummern gibt es bewusst nicht, weil der Code sich ändert.

---

## 1. Kurzüberblick

- **Genre:** Offene Welt, Action-RPG mit Simulation, angelehnt an Kenshi und Mount & Blade. Man spielt ein **Haus**, keinen einzelnen Helden: Stirbt die Figur, übernimmt ein Erbe.
- **Perspektive:** 2D, von oben bzw. schräg von oben. Die Figuren schauen in 4 Richtungen und sind im Code gemalte Pixelgrafik (Canvas).
  - Kachelgröße 32 px (`world.js` `TS`).
  - Die Welt ist ein Entwurfsraster mit Faktor 1,5 (`WS`) und einer Westerweiterung (`OX = 256`).
- **Plattform:** Browser, ES-Module ohne Build. Einstieg ist `index.html` → `src/game.js?v=19`. Titel: „ROTFALL: LEGACY“.
- **Steuerung:** Tastatur und Maus, dazu ein Touch-Overlay (Stick, Angriff, Ausweichen, Deckung, Benutzen). Details in §2.1.
- **Grafikstile** (`S.settings.art`, Einstellungen → Grafikstil):
  - **R** „Neu (gezeichnet)“ ist Standard seit S15 (`fig5.js`, Rahmen 40 × 56).
  - **D** „Klassisch“ (`sprites.js`).
  - **F** „Referenzblatt“ (`figure.js`).
  - Ein Einmal-Flag `S.flags.artR_S15` hat alte Stände auf R umgestellt.
- **Speichern:**
  - `localStorage` unter dem Schlüssel `rotfall.legacy.save`, `SAVE_VERSION = 4` (`state.js`).
  - Gespeichert wird automatisch bei jedem Tageswechsel (`dayTick` → `save()`) und beim Schließen der Seite (`beforeunload`), dazu von Hand in den Einstellungen.
  - Verschlüsselter Export und Import als `.rfsave` (`cloudsave.js`), siehe §26.
- **Schwierigkeit:** Wahl beim Start (`#cr-diff`): Angsthase, Schwer (Standard), Sehr schwer (`DIFF`, `applyDifficulty`), siehe §27.
- **Entwicklerwerkzeuge:**
  - Das Debug-Menü öffnet sich mit Strg + Umschalt + D (`toggleDebug`, `debugSections`).
  - Mit `?dev` in der URL gibt es `window.RF` mit vielen internen Funktionen, u. a. `tick(ms)`, `loadProbe`, `talk`, `cinematic`, `spawnEnemy`, `growTown`, `councilSession`.
  - Selbsttest im Debug-Menü: rund 271 `ok(...)`-Proben in `game.js`, Abschnitt „Selbsttest“. Die Proben laufen in einer Sandbox mit `S._quiet`.

---

## 2. Systeme

### 2.1 Steuerung und Tasten (`game.js` `bindInput`, `controlPlayer`, `moveInput`, `bindTouch`)

| Taste | Wirkung |
|---|---|
| W A S D / Pfeiltasten | Bewegen (Laufen kostet 1,2 Ausdauer je Sekunde) |
| Linksklick / Leertaste | Angriff zur Maus |
| Strg + Angriff | Neutrale bewusst angreifen (`forceStrike`, mit Ruf-Folgen) |
| Umschalt halten | Deckung/Block (`updateGuard`); die ersten 180 ms sind eine Parade |
| Q | Ausweichrolle (`dodge`) |
| E | Interagieren (`doInteract`) |
| R | Pferd pfeifen, auf- und absitzen (`toggleMount`) |
| 1–9, 0 | Schnellleiste (`useSlot`) |
| I / C / G / B / F / K / M / J / T / Z / H / X | Inventar, Charakter, Gruppe, Lager & Siedlung, Fraktionen, Chronik, Weltkarte, Aufträge, Talente, Zauberbuch, Kodex, Aktive Effekte |
| N | Minikarte an/aus (`S.settings.minimap`) |
| Esc | Platzieren abbrechen, Dialog oder Fenster schließen, sonst Einstellungen öffnen |
| Esc / Leertaste während einer Kamerafahrt | Kamerafahrt überspringen (`cineEnd`) |
| Mausrad | Zoom 0,7–2,4 |
| Rechtsklick | Ziel auswählen, Kontextfeld rechts (`UI.renderContext`) |
| Strg + Umschalt + D | Debug-Menü |

- **Ausweichen** (`DODGE`):
  - 240 ms Rolle, 92 px weit (mehr mit Beweglichkeit), 850 ms Abklingzeit.
  - Kosten: 20 Ausdauer × (1,2 − Ausdauer-Attribut × 0,02), für Mönche × 0,75.
  - Unverwundbar bis auf die letzten 40 ms. Danach 110 ms Landung mit halbem Tempo und ohne Hieb.
  - Mit Beinen unter 50 % Tempo ist Rollen gesperrt.
- **Deckung** (`GUARD`):
  - Parade-Fenster 180 ms und Winkel 1,22 rad. Nach einer Parade taumelt der Angreifer 900 ms (Boss 450 ms). Der nächste Rapierstich ist 1,2 s lang eine **Riposte** (×2,2, sicher kritisch).
  - Eine Parade je gehobener Deckung, `rearm` 400 ms. Danach wird nur noch geblockt.
  - Rückwärts laufen und zuschlagen ist verlangsamt (`backMul`); wer zuschlägt, bewegt sich mit 55 % Tempo.

### 2.2 Charakter

**Erstellung** (`buildCreation`, `index.html` `#creation`). Man wählt Name, Haus, Schwierigkeit, Herkunft, Körperbau und Attribute.
- **Herkünfte** (`ORIGINS`, 5):

  | Herkunft | Startgold | Besonderheit |
  |---|---|---|
  | Feldknecht | 8 | – |
  | Jäger | 12 | Bogen 8 |
  | Lehrling | 22 | – |
  | Ehemaliger Soldat | 10 | Valen +10 |
  | Wanderer | 30 | – |

  Jede Herkunft bringt eigene Attribut- und Fertigkeitsboni und Startausrüstung.
- **Körperbau** (`body.js` `BUILDS`, 5):
  - Ausgewogen.
  - Drahtig: Tempo ×1,1, +12 Ausdauer, Rumpf und Arme ×0,85.
  - Bullig: Rumpf ×1,25, Tempo ×0,9.
  - Hochgewachsen: Kopf wird ×1,35 öfter getroffen.
  - Gedrungen: Kopf ×0,6, Beine ×1,2.

  Der Körperbau ändert Aussehen und Werte.
- **Attribute** (`baseAttrs`, je 8): Stärke, Beweglichkeit, Ausdauer, Intelligenz, Wahrnehmung, Willenskraft. NPCs haben teils auch `charisma`, beim Spieler gibt es das nicht als Attribut.

**Abgeleitete Werte** (`recalc`):
- Leben = (40 + Ausdauer × 4 + Stufe × 6), multipliziert mit dem Paktpreis, der Omega-Narbe (×0,8) und Talent-, Affix- und Set-Boni. Das Leben wird auf die Körperteile verteilt.
- Ausdauer = 20 + Ausdauer × 10 + Stufe × 2 + Körperbau + Talente + Affixe + Set.
- Mana gibt es nur für Magier, Kleriker, Paladin oder wer einen Zauber kennt: 30 + Int × 4 + Wille × 2 + Stufe × 2.
- Gepäck: 24 Plätze plus Talent „Packesel“ (+6).
- Gruppengröße `partyCap` = 3 + Führung/10 + 1, wenn man eine Siedlung hat.

**Stufen und Punkte** (`gainXp`, `levelUp`):
- Die nötige Erfahrung wächst je Stufe um ×1,35, ab Stufe 10 um ×1,2, ab Stufe 20 um ×1,04 (Balance-Runde). Höchststufe 60 (≈ 0,42 Mio. EP). Viel Erfahrung auf einmal ergibt mehrere Stufen.
- Jede Stufe gibt +1 Statpunkt (C), jede 5. Stufe einen zusätzlich („Meilenstein“). Talentpunkte (T): 1 zum Start und 1 auf jeder dritten Stufe (21 bei Stufe 60; `TALENT_EVERY`). Siehe docs/BALANCE.md.
- Ein Aufstieg heilt voll, außer man liegt am Boden.
- „Ausgeruht“ gibt +10 % Erfahrung, der Trank der Lehre mehr.

**Fertigkeiten** (`SKILL_NAMES`, 14): Einhändig, Zweihändig, Stangenwaffen, Bogen, Verteidigung, Medizin, Zähigkeit, Überleben, Jagd, Handwerk, Schmieden, Handel, Schleichen, Führung.
- Fertigkeiten wachsen durch Tun: jeder Treffer mit der Waffe +0,12; Verteidigung beim Getroffenwerden; Zähigkeit +0,04 je Treffer; Überleben beim Zähmen.
- Verteidigung ≥ 40 ergibt eine Abwehr mit Gegenhieb: von vorn höchstens 30 % Chance, der Schaden sinkt auf 35 % (`hit`).

**Körperteile, Wunden und Prothesen** (`body.js`):
- Sechs Teile: Kopf, Rumpf, linker/rechter Arm, linkes/rechtes Bein. Trefferwahrscheinlichkeit Kopf 6, Rumpf 46, Glieder je 12.
- Arme und Beine haben 100 LP × Körperbau. Bei 0 fallen sie aus:
  - Arm aus: die Waffe fällt.
  - Ein Bein aus: man humpelt. Beide aus: man kriecht.
- Ein Glied wird erst unter −200 abgetrennt, auf „Sehr schwer“ unter −100, auf „Angsthase“ nie (`cutOf`). Ein Gliedtreffer gibt 40 % des Schadens halb an den Rumpf weiter.
- Kopftreffer ohne Krit sind auf 60 % des Kopf-Maximums gedeckelt. **Enthauptung** gibt es nur bei einem Krit mit Überschuss ≥ 50 % des Maximums, sonst geht man bewusstlos zu Boden.
- **Prothesen** (Verbrauchsgut, `useConsumable` `prosthesis`) passen nur an ein verlorenes Glied:

  | Prothese | Preis | Stufe |
  |---|---|---|
  | Schrottarm / -bein | 220 / 200 Gold | 1 |
  | Aurelionischer Arm / Bein | 900 / 850 Gold | 2 |
  | Meisterarm / -bein von Gelenkhall | 2400 / 2200 Gold | 3 |

  - Ein Meisterarm erhöht den Schaden (`B.mechBonus`).
  - Prothesen nutzen sich je Treffer um 1,2 ab. Unter 30 % wirken sie nicht mehr; die Werkbank in Gelenkhall setzt sie instand.
- Die Anzeige ist ein Körperdiagramm im Charakterfenster (`ui.js` `bodyChart`, `woundNotes`).

**Zustände** (`addStatus`, Tick in `update`; Anzeige in `FX_ICON`, `FX_DESC`, Fenster X „Aktive Effekte“):
- **Negativ:**
  - `bleeding` Blutend: 12 s nach Treffer > 10 mit 25 % Chance, 30 s nach Abtrennung. Stillen mit Verband, Heilerin, Schlaf oder Zauber.
  - `poisoned`: Gift, Seuchenbiss.
  - `chilled`: unterkühlt oder gefesselt, −40 %.
  - `grabbed`: Wiedergänger, −50 %.
  - `shackled`: versklavt.
  - `burning` Brennt.
  - `frost`: stapelt bis 3, je −15 % Tempo; bei 3 Stapeln 1,5 s eingefroren.
  - Schock: Betäubung, danach 3 s immun.
- **Positiv:**
  - `rested` Ausgeruht: 10 Minuten, +10 % Erfahrung.
  - `frenzy` Raserei.
  - `song` Kriegslied.
  - `blessing` Segen: +5 Rüstung.
  - `omegawrath`: +10 % Schaden, gegen Untote +35 %.
  - `poison_coat` Giftöl.
  - `bone_ward`: Schild bzw. Absorption.
  - `regrowth` Regeneration.
  - `elixir`: immer nur eines zugleich.
  - `counter`: Gegenstrom des Mönchs.
- **Schlaf** heilt Blutung, Gift, Unterkühlung und Griff (`SLEEP_CURES`).
- **Hunger:** Die Gruppe isst täglich; ohne Nahrung sinkt die Moral (§2.7). Beim Spieler senkt Hunger den Rumpf um 4 (`dayTick`).

### 2.3 Kampf

**Nahkampf** (`attack`, `resolveSwing`, `hit`, `hurt`):
- Jede Waffe kostet Ausdauer je Hieb (`ITEMS.stam`, gesenkt durch das Affix `vigor`).
- Das Waffengefühl `FEEL` je Waffentyp bestimmt Gewicht, Hit-Stop (28–118 ms), Kamerawackeln, Ausfallschritt und Taumeln.
  - Beispiele: Dolch 28 ms, Schwert 50, Axt 72, Kolben 78, Zweihänder 100, Kriegshammer 118.
  - Schwere Waffen (Taumeln ≥ 0,6) brechen die Angriffsvorbereitung eines Gegners.
- **Schaden:**
  - Gegner: `MONSTERS.dmg` × (1 + Stufe × 0,05) × `BAL.dmg` (1,4) × Schwierigkeitsgrad.
  - Spieler: `damageOf`.
  - Krit-Chance: 5 % + Wahrnehmung × 0,4 % + Talente und Affixe. Ein Krit macht ×1,8 oder den Wert der Waffe.
  - Rüstung zieht 55 % ab. Panzerbrechen (`ap`, Affix `pierce`, höchstens 90 %) senkt die wirksame Rüstung.
  - Gegen einen Gegner, der gerade offen ist (nach einem schweren Angriff): +25 %.
- **Schleichangriff** auf ahnungslose Gegner: ×1,5, von hinten ×3. Bei Kettenleuten löst das Alarm aus (Kette −10).
- **Rückstoß:** höchstens 20 px, bei Bossen ×0,25. Taumeln 260 ms × Waffengewicht. Danach ist das Ziel 1,2 s standfest (`poiseUntil`).
- **Spezielle Waffen** (`weaponMult` und Waffenfelder):
  - Hinrichtung `execute`: Henker, Rotklaue, Schwarzzahn.
  - Gegen Ungerüstete `raw`: Rabenbeil.
  - Fesseln `bind`: Kettenpeitsche.
  - Blutung `bleed`.
  - Frost und Kühle.
  - Totenglocke: Feinde ringsum werden eingeschüchtert.
  - Wucht `crush`: Kriegshammer, kein Schild hält ihn, Deckung kostet doppelt.
  - Streitflegel-Schwung.
  - Armbrust spannen: Tempo 60 %.
  - Zauberstab mit Manaschuss.
- **Legendäre Sondereffekte** (`LEGENDS`):
  - Blutdurst: ein Todesstoß heilt 8 %.
  - Nachhall: 20 % Chance auf einen zweiten Treffer mit halbem Schaden.
  - Ahnenwall: +8 Rüstung unter 30 % Leben.
- **Knochenritter:** Frontalhiebe richten nur 30 % Schaden an; von der Seite ist er verwundbar.

**Fernkampf** (`shoot`, `updateProjectiles`, `projHit`):
- Braucht freie Sicht (`clearLine`). Pfeile prallen an Wänden ab und fliegen über Liegende hinweg.
- Fernwaffen: Bogen, Armbrust (Nachladen), Zauberstab, Wurfmesser und Wurfbeil, Schleuder, Messingpistole, Donnerbüchse.

**Flächenangriffe** (`areaHit`): Ringe, Einschläge und Strahlen umgehen Deckung, Schild und Abwehr. Man kann ihnen nur ausweichen.

**Schwere Angriffe mit Ansage** (`startHeavy`, `heavyTick`, `MONSTERS.heavy`):
- Diese Gegner haben einen:

  | Gegner | Angriff |
  |---|---|
  | Kettenknecht | slam |
  | Rotgardist | thrust |
  | Plünderer der Sturmklinge | thrust |
  | Hauptmann der Toten | slam |
  | Knochenritter | sweep |
  | Todesritter | sweep |
  | Dodon | slam, jeder 2. Angriff |

- Eine rote Bodenmarkierung zeigt Kreis, Ring oder Linie. Das Ausholen dauert 650–900 ms × Schwierigkeitsfaktor `tele`. Danach ist der Gegner 600 ms offen.

**Ausdauer der Gegner** (`ESTA`, `enemyStamina`, `tickCombatant`): Gegner ermüden auch; bei 0 wanken sie.

**Rüstung und Block:**
- Rüstungswert = Summe der Teile × (0,4 + 0,6 × Zustand) + Affix „Härte“ + Stufe × 0,25 + Set + Talente. „Bollwerk“ gibt ×1,3.
- Ein Schild blockt passiv mit seiner Chance `block` × 0,7 plus Set-Bonus.
- Der Rotgardistenpanzer gibt Standhaftigkeit neben einem Verbündeten.

**Waffenverschleiß:** Jeder Schlag −0,0016 Zustand, jeder Schildblock −0,004, Untergrenze 0,05. Reparatur siehe §20.

**Am Boden und K.o.** (`downed`, `reviveTick`, `koLift`, `stabilize`):
- Liegt man am Boden, bleibt Zeit bis zum Verbluten:
  - Spieler: 15 s allein, 30 s mit Gruppe.
  - NPC: 11 s.
  - Zähigkeit kürzt die Ohnmacht (bis −50 %).
- Aufrichten heilt 10 % des Rumpfs je Sekunde bis zur Schwelle von 25 %; Medizin beschleunigt das. Nur der Held kommt von allein zu sich.
- NPCs und Gefährten stehen nur auf, wenn jemand sie heilt (E, Verband, Zauber, Gefährte oder Bewohner in der Nähe).
- Wer vom Pferd geschlagen wird, stürzt.

**Tod** (`die`):
- **Gegner** hinterlassen eine Leiche (20 s) und Beute (§2.5), dazu mit 50 % Chance 1–6 + Stufe Gold.
- **Erfahrung** nach Beitrag (`credit`, `xpShares`): Anteil am Schaden = Anteil an der Erfahrung. Gefährten bekommen zusätzlich 60 % dessen, was der Spieler erhält.
- **Bosse** geben Ruhm (+15 in der eigenen Region, +5 in allen anderen), einen Chronik-Eintrag und einen Toast.
- **Anführer-Variante:** Stirbt ein Anführer, fliehen 50 % seiner Leute.
- **Mord an Personen** (`bloodshed`):
  - Zeugen fürchten den Spieler, Wachen greifen an.
  - Ruf: −10 mit Zeugen, −3 ohne.
  - Kopfgeld 250 Gold, bei Hohem Rang 800.
  - Die Moral der Gefährten sinkt (außer bei „grausam“).
- **Hoher Rang** (`HIGH_RANK`, `murderOfRank`): Wer Adel, Dorfvorsteher oder Geweihte tötet, verliert −35 Ruf mit Zeugen bzw. −18 ohne.
  - Adel: **Blutbann**, 5 Tage lang greifen die Wachen der Fraktion ohne Anruf an.
  - Geweihte: zusätzlich **Kirchenbann**, 7 Tage lang hilft niemand auf, Orden −30.
  - Kopfgeldjäger kommen sofort.
- **Tote Personen** bekommen ein Grab mit Grabinschrift; ihre Ausrüstung liegt im Grab (`makeGrave`). Der Ort trauert 2 Tage (`S.mourn`).
- **Waffe mit Namen:** Nach 15 Tötungen bekommt die Waffe einen Namen („Namen der Figur + s Waffe“) und eine Geschichte (`dayTick`).

**Tod des Spielers und Erbe** (`playerDeath`, `makeSuccessorCandidates`, `chooseSuccessor`, `adoptSuccessor`):
- Es erscheint ein Todesbildschirm mit Nachruf (`S.legacy.ancestors`).
- Erben sind Gefährten und zufällige Verwandte: Sohn, Tochter, Vater, Mutter, Geschwister, Vetter oder Base. Die Chance hängt vom Alter ab und sinkt je Generation um 12 % (Untergrenze 35 %). Höchstens 3 Kandidaten.
- Der Erbe übernimmt 70 % des Goldes und 50 % jedes Rufs; die Generation steigt (`S.legacy.gen++`).
- Ohne Erben erlischt das Haus.
- Stirbt man während des Goblin-Sturms, fällt Morrgrund (`morrFall`).

### 2.4 Klassen, Titelklassen, Titelgrade, Talentbaum, Todesritter

**Grundklassen** (`CLASSES`, 13). Man lernt sie nie im Menü, sondern immer bei einem Lehrer (`teach`):
- Die Beziehung zum Lehrer muss ≥ 20 sein, bei Rook ≥ 40.
- Folgeklassen brauchen die Elternklasse.
- Paladin braucht zusätzlich `q_paladin3`.

| Klasse | Stufe | Eltern | Fähigkeiten | Schwäche |
|---|---|---|---|---|
| Wanderer | 0 | – | – | – |
| Krieger | 1 | Wanderer | Wuchtschlag | – |
| Schütze | 1 | Wanderer | Gezielter Schuss | – |
| Schurke | 1 | Wanderer | Meuchelstich | – |
| Kleriker | 1 | Wanderer | Heiliges Heilen | – |
| Magier | 1 | Wanderer | Feuerball | – |
| Barde | 1 | Wanderer | Kriegslied, Missklang | eigener Schaden −15 % |
| Alchemist | 1 | Wanderer | Feuerflasche, Giftöl, Trank brauen | braucht Heilkraut |
| Ritter | 2 | Krieger | Wuchtschlag, Segen | – |
| Waldläufer | 2 | Schütze | Gezielter Schuss, Ziel markieren | – |
| Berserker | 2 | Krieger | Wuchtschlag, Raserei | nimmt 20 % mehr Schaden in der Raserei |
| Assassine | 2 | Schurke | Meuchelstich, Schattenschritt | nicht in Ketten- oder Plattenpanzer |
| Paladin | 3 | Ritter | Heiliger Schlag, Segen, Heiliges Heilen | Orden |
| Todesritter | 3 | Krieger | Lebensentzug, Wuchtschlag, Grabhieb | Tote (Todesweihe) |
| Dunkler Hochpaladin | 3 | Krieger | Kettenschlag, Furcht-Aura, Befehl der Kette, Blutpreis | freie Dörfer fürchten ihn |

**Lehrer** (`NPCS.teaches`):

| Klasse | Lehrer |
|---|---|
| Krieger | Borin (Eren), Hauke Eisenfaust (Nordfurt), Kaelis Vey (Aurelheim) |
| Schütze, Waldläufer | Tomas (Eren), Wenzel (Weidenau) |
| Schurke | Rook, Kaelis, Nix (Salzhafen); Assassine bei Rook |
| Kleriker | Elena (Eren), Schwester Adela (Lichtenrain) |
| Magier | Morvath, Serafine (Kreuzweg) |
| Ritter, Paladin | Kelan, Hauke |
| Berserker | Oda (Grenzwacht), Ulfar (Rastfurt) |
| Barde | Lioba (Kreuzweg), Jasper (Kupferhafen) |
| Alchemist | Quirin (Salzhafen), Orrin (Mühlbach) |

- Die Weihen sagen beim Rangaufstieg, wo man sie bekommt (`promote`):
  - Dunkler Hochpaladin: Weihe bei Varg ab Kettenrang Aufseher (`chainRite`).
  - Todesritter: Todesweihe bei Sael oder Ysra ab Totenrang 3 (`deathRite`).
- **Klassenwechsel:** Im Fenster „Ausbildung“ kann man zwischen bekannten Klassen wechseln (`setClass`). Talente vergessen (`respec`) kostet Gold (`respecCost`).

**Titelklassen** (`TITLE_CLASSES`, 4, `MAX_TITLES = 2`, aktiv ist eine; freigeschaltet durch eine Tat, `unlockTitle`):

| Titel | Ressource (max) | Regel | Makel | Dauerpreis | Freischaltung | Meister |
|---|---|---|---|---|---|---|
| Nekromant | Seelenessenz (6) | +1 je Tod im Umkreis | eigener Waffenschaden −15 %, Heiliges Heilen halb | Leben −10 % | Ahnenurne aus der Nekropole zu Ysra (`q_pact`) | Ysra |
| Hexenmeister | Verderbnis (100, Start 20) | Fähigkeiten laden auf, −4/s außerhalb des Kampfes | über 70 −1,5 Leben/s, bei 100 Ausbruch (15 Schaden, zurück auf 60) | Ausdauer −10 | Urne zu Vhal statt Ysra | Vhal |
| Druide | Wildkraft (100, Start 40) | +5/s nur draußen auf Gras, Erde, Sumpf | in Ketten- oder Plattenpanzer halbes Wachstum | Stärke −1 | „Der Ruf des Hains“ bei Mira (`q_grove`) | Mira |
| Mönch | Fokus (5) | +1 je Ausweichen ins Leere, −1 je Treffer | in Ketten- oder Plattenpanzer kein Fokus | halbes Gold ans Kloster; Rook wird Feind; kein Beitritt zu den Toten | „Probe der Stillen Hand“ bei Ilva (`q_monk`) | Ilva |

- Ausschlüsse: Nekromant und Hexenmeister schließen einander und den Mönch aus.
- Man kann einen Titel aufgeben (`forsakeTitle`). Die Klasse ist dann für immer gesperrt, laufende Klassenquests scheitern.
- Jeder Titel ändert den Ruf (`rep`) und gibt ein sichtbares Leuchten (`glow`).

**Titelgrade I–III** (`GRADE_NEED`, `titleDeed`, `gradeTalk`):
- Grad 2 braucht 30 Taten und Stufe 8, Grad 3 braucht 90 Taten und Stufe 16. Der Meister weiht.
- Gradnamen:

  | Titel | Grad 1 | Grad 2 | Grad 3 |
  |---|---|---|---|
  | Nekromant | Totenrufer | Knochenfürst | Herr der Stillen Schar |
  | Hexenmeister | Schattengebundener | Seuchenwirker | Stimme des Obelisken |
  | Druide | Hainhüter | Dornenwächter | Wolf des Hains |
  | Mönch | Hand des Ordens | Strömender | Stille selbst |

- Die Grade schalten Fähigkeiten frei (`TITLE_CLASSES.grades`).

**Titelfähigkeiten** (`ABILITIES` mit `title`):
- **Nekromant:** Totenruf, Knochenschild, Seelenernte, Leichenbersten, Seelenfessel, Heerruf.
- **Hexenmeister:** Fluch, Chaosblitz, Entfesseln, Schattenruf, Paktritter, Seuchenfluch, Obeliskentor, Dunkler Pakt.
- **Druide:** Rankenfessel, Geisterwolf, Erdsegen, Dornenhaut, Wolfsgestalt (20 s, eigenes Bild, keine Gegenstände), Rudelruf.
- **Mönch:** Handkante, Stilles Wasser, Hundert Schritte, Gegenstrom, Stille Hand, Wirbel.

**Klassen-Rüstung über Questreihen** (`QUESTS c_nec1–3`, `c_war1–3`, `c_dru1–3`, `c_mon1–3`, `dk_1–3`):
- Je drei Aufträge beim Meister, jeder gibt ein gebundenes Teil (Wert 0).
- Ab 2 Teilen: stärker plus eine Fähigkeit (`GEAR_ABILITY`: Heerruf, Dunkler Pakt, Rudelruf, Wirbel).
- Die Mönchsrobe weicht selbst aus: 20 % Chance bei 2 Teilen, 30 % bei 3.

**Todesritter (P19):**
- Questreihe „Eidwacht“ bei Sael mit drei Teilen (Helm, Harnisch, Frostmantel):
  - ab 2 Teilen die Fähigkeit Todesmahr,
  - mit 3 Teilen eine Frostaura (`dkAuraTick`).
- Todesritter reiten ein Totenross (`dkSteed`).
- Eigener Talentzweig: Frostklinge, Blutdurst, Runenklinge, Totenpanzer, Todesgriff (aktiv), Schlüsselknoten Frostgeboren oder Blutfürst.

**Talentbaum** (`SKILL_TREE`, 49 Knoten; `SKILL_BRANCHES` 8 Zweige; `learnNode`, `nodeState`, `treeFx`):
- Allgemeine Zweige:
  - **Kampf:** Zähigkeit, Kraftschlag, Eiserne Haut, Klingenmeister, Kampfatem, Kampfschrei (aktiv), Schildwall, Schlächter; Schlüsselknoten Berserker und Bollwerk.
  - **Magie:** Arkane Ader, Gedankenschnelle, Zauberkraft, Sammlung, Blinzeln (aktiv), Fluss, Feuerseele; Schlüsselknoten Glaskanone und Gelehrter Geist.
  - **Überleben:** Lebenskraft, Leichtfüßig, Feldscher, Ausdauernd, Packesel, Feldverband (aktiv), Ausweichkünstler, Wundheiler; Schlüsselknoten Zweiter Atem (höchstens alle 3 Spielstunden) und Wildnisläufer.
- Titelzweige erscheinen erst mit dem Titel. Je Titel gibt es zwei Schlüsselknoten, die einander ausschließen (`excl`):

  | Titel | Schlüsselknoten |
  |---|---|
  | Nekromant | Legion ↔ Einsamer Rufer |
  | Hexenmeister | Blutpakt ↔ Leeres Herz |
  | Druide | Hüter des Hains ↔ Tier im Herzen |
  | Mönch | Vollkommene Stille ↔ Sturmhand |
  | Todesritter | Frostgeboren ↔ Blutfürst |

- Jeder Schlüsselknoten hat einen Preis und ein `designIntent`.

**Aktive Fähigkeiten** (`ABILITIES`, 79 Einträge inklusive 30 Zauber; `useAbility`, `syncHotbar`, `useSlot`):
- Kosten sind Ausdauer, Mana, Heilkraut oder die Titelressource.
- Die Abklingzeiten stehen in `ABILITIES.cd`; Talente wie Gedankenschnelle und Fluss senken sie.

### 2.5 Gegenstände, Beute, Sets

- **Gegenstände** (`ITEMS`, 216):
  - 57 Waffen (Nahkampf, Bögen, Armbrust, Wurfwaffen, Schleuder, zwei Feuerwaffen, Zauberstab und Stab).
  - 4 Schilde.
  - Viele Harnische und Helme, darunter 13 Sets.
  - 11 Handschuhe und Beinschienen.
  - 13 Talismane und Seltenes.
  - 10 Elixiere.
  - 6 Prothesen.
  - Verbrauchsgüter: Brot, Dörrfleisch, Heilkraut, Heiltrank, Verband, Seelenphiole.
  - 6 Werkzeuge der Bewohner.
  - 13 Handelswaren (`GOODS`).
  - Quest- und Schlüsselgegenstände: Siegel des Ordens, Grabsiegel, Ahnenurne, Königseisen, Vargs Kette und Tagebuch, Himmelssplitter, Seekarte, Salzsiegel, Späherbericht, Auftragspaket, Dietrich, Wassereimer, Meteorsplitter, Tributgut, Automatenkern.
- **Ausrüstungsplätze** (`GEAR`, 9): Waffe, Nebenhand, Kopf, Rumpf, Hände, Beine, Füße, Umhang, Talisman.
- **Rarität je Exemplar** (`mkItem`, `RARITY_*`):
  - Gewöhnlich 62 %, Ungewöhnlich 24 %, Selten 10 %, Episch 3,5 %, Legendär 0,5 %. Mythisch fällt nie zufällig.
  - Affixe: Ungewöhnlich 1, Selten 2, Episch 3 (davon einer „major“), Legendär 2 plus ein Legendärer Effekt.
  - Gefährliche Gegner verbessern die Chancen.
- **Affixe** (`AFFIXES`, 16): Schärfe, Leichtigkeit, Auge, Durchschlag, Atem, Härte, Lebenskraft, Leichtfuß, Zähigkeit, Blutzoll (major), Zerfetzen (major), Arkane Kraft, Totenbann, Schützenauge, Dornen (major).
- **Beute-Stufen** (`lootTier`, `dropLoot`):
  - Normale Gegner lassen Ausrüstung mit ×0,35 fallen, Elite, Veteran und Anführer mit ×1,5.
  - Bosse ziehen aus `BOSS_LOOT` (6 Bosse): 90 % eine Waffe, 60 % ein Rüstungsteil, 25 % ein Einzelstück.
  - Alles wird mit dem `loot`-Faktor der Schwierigkeit multipliziert.
- **Sets** (`ARMOR_SETS`, 13, Bonus mit allen Grundteilen, `setOf`):
  - Rotgarde, Eisenfürst, Kronwache Valens, Weißer Orden, Sonnenlegion, Sternwacht, Grubenkönig, Rooks General, Ordensmeister.
  - Mit 3 und 4 Teilen: Thron des Hochreichs, Blutkette, Totenkrone, Hochritter Valens.
- **Elixiere** (`useConsumable` `elixir`): Stärke, Ausdauer, Eile, Steinhaut, Wut, Arkan, Scharfes Auge, Wacht, Erneuerung, Lehre. Es wirkt immer nur eines, danach 30 s Magenpause (`elixirCd`).
- **Talismane:** Ausdauer, Beweglichkeit, Krieger, Wächter, Jäger, Toten, Magie, Leben; seltene sind Magiekern, Splitter des Rotfalls (kostet Leben), Blutstein, Eulenauge, Münze des Fährmanns.
- **Verbände herstellen** (`craftBandage`): Tuchballen → 3 Verbände, Leinenkittel → 2. Das Anlegen dauert 2,5 s, Heilen 1,6 s (`CHANNEL_MS`).
- **Zustand von Rüstung:** Der Zustand `cond` senkt den Rüstungswert auf bis zu 40 %.

### 2.6 Magie

- **Schulen** (`SCHOOL`, 8): Feuer, Frost, Blitz, Arkan, Schatten, Glaube, Heilung, Schutz. Jede hat eine eigene Farbe für Rune und Effekt.
- **Zauber** (`ABILITIES sp_*`, 30):

  | Schule | Zauber |
  |---|---|
  | Feuer | Funke, Feuerpfeil, Flammenstoß, Flammenkreis, Feuerwand |
  | Frost | Froststoß, Eisspeer (durchdringt 3), Einfrieren, Eiswand (blockiert 8 s) |
  | Blitz | Schock, Blitz, Kettenblitz (3 Sprünge, nur mit Sichtlinie) |
  | Arkan | Energiegeschoss, Magieschild, Kurzteleport (180 px, nie in eine Wand), Magieunterbrechung |
  | Schatten | Schattenpfeil, Seelenzug (50 % Lebensraub), Skelett erheben (einer, 45 s), Seelenbersten, Nachtglas (legendär: Zeit um dich 6 s auf 30 %) |
  | Glaube | Heilige Flamme, Schutzsegen, Lichtstrahl, Inquisition (deckt Verborgene auf) |
  | Heilung | Kleine Heilung, Blutung stillen, Regeneration (Gruppe), Starke Heilung |
  | Schutz | Schild, Schutzkreis (Gruppe) |

- **Wirker** (`startCast`, `castTick`, `castSpell`):
  - Die Sammelzeit beträgt 150–900 ms. Dabei leuchtet eine Rune in der Schulfarbe unter dem Wirker.
  - Wird man in dieser Zeit getroffen, bricht der Zauber ab; die Hälfte des Manas kommt zurück (`interruptCast`).
  - Formen: bolt, line, nova, area, chain, self, group, blink, dispel, wall, raise, timeslow.
- **Stärke** (`spellPower`): Basis + Intelligenz × Faktor, mal Rang (×1 / ×1,25 / ×1,5). Glaubenszauber wachsen zusätzlich mit Kettenrang und Glaube (`faithMul`).
- **Übung statt Punkte:** Rang II nach 25 Einsätzen, Rang III nach 100 (`S.player.spellUse`, `S.player.spells`).
- **Weltspuren** (`spellGround`, `groundTick`, flüchtig): Brandfläche 8 s und Eisboden 10 s nach Nova oder Fläche. Die Feuerwand schadet zweimal je Sekunde; die Eiswand ist fest und steht im Kollisionsindex.
- **Zauberbuch** (Z, `ui.js` `spellUI`): Reiter je Schule, „Auf Leiste legen“ (`spellToBar`). Unbekannte Zauber zeigen, wer sie lehrt.
- **Lehrer** (`spellMenu`, `learnFrom`, `spellLack`):

  | Lehrer | Ort | Zauber |
  |---|---|---|
  | Serafine | Kreuzweg | Funke, Feuerpfeil, Energiegeschoss, Schild |
  | Elena | Eren | Kleine Heilung |
  | Morvath | Alter Friedhof | Funke, Feuerpfeil, Flammenstoß |
  | Mutter Aldis | Sonnwacht | 6 Heil- und Schutzzauber, Regel Orden-Rang |
  | Magister Corvinus | Akademie Aurelheim | 15 Zauber, braucht Aufenthaltsschein; Stufe III nur für Bürger oder Adepten |
  | Irmgard | Eisenfeste | 4 Glaubenszauber; Kettenrang oder Glaube 20/40/60 |
  | Ilvar Nachtglas | Turm | Schatten nach Vertrauen 0/25/50/75, Nachtglas nur nach der Endprüfung |

  - Preis je Stufe: 30, 80 oder 180 Gold. Nötige Intelligenz: 8, 11 oder 14 (`SPELL_PRICE`, `SPELL_INT`).
  - Die Beziehung zum Lehrer und die Haltung der Macht zur Schule ändern den Preis (`MAGIC_VIEW.love`).
- **Akademie-Prüfungen** (`TRIALS`, `startTrial`, `trialTick`, `endTrial`; `S.trial`, `S.acad`, `S.acadRank`):
  - Zielübung: 5 Puppen in 30 s, nur mit Zaubern.
  - Schildprüfung: 25 s, 8 von 10 Geschossen mit einem Schildzauber abfangen.
  - Heilprüfung: 60 s, eine verletzte Studentin heilen.
  - Duell: 90 s gegen einen Studenten; es endet unter 20 %, niemand stirbt.
  - Ränge: Hörer, Adept (schaltet Stufe III frei), Magister.
- **Turm und Ilvar** (§2.9, `ilvarTalk`, `ILVAR_TOPICS`, `S.ilvar.trust` 0–100):
  - Vertrauen gewinnt man durch Gespräche (je Thema +3), Seelenphiolen, eine kluge Antwort über Omega, Tuvi verraten (+10), den Meteorsplitter (+15) oder den Magiekern (+20).
  - Bei Vertrauen 100 kommt die Endprüfung: 45 s Geisterwellen, danach der Zauber Nachtglas.
- **Verbotene Magie** (`magicSeen`, `FORBIDDEN_TITLES`, `MAGIC_VIEW.hate`):
  - Schatten- oder Totenmagie vor Zeugen einer Macht, die sie hasst, bringt Kopfgeld; beim Orden doppelt.
  - Welche Macht welche Schule hasst: Orden, Valen und Goblins hassen Schatten; die Kette hasst Schatten und Arkan.
- **Magierjäger** (`spawnMageHunters`, `mageHunterTick`): ab drei Taten. Ihr Bann bricht den Zauber ab, halbiert das Mana und gibt 5 s Stille.
- **Gegner-Zauberer:**
  - Kultist der Asche: Feuerpfeil, Funke; heilt Untote.
  - Nekromant: Froststoß, Schild; ruft bis zu 3 Knochendiener.
  - Student der Akademie: Funke, Froststoß.
- **Mana-Regeneration** wird durch Talente beschleunigt (Sammlung +50 %).

### 2.7 Gegner und Bosse

**Gegnertypen** (`MONSTERS`, 51 Einträge: 43 Kampfgegner, 5 friedliche Tiere, 2 Übungsziele, 1 Soldat). Die Werte sind Basiswerte; im Spiel kommen `BAL` (Leben ×1,7, Schaden ×1,4) und die Schwierigkeit dazu. Die meisten Typen stehen in der zweiten Tabelle; Rotgardist, Kettenschütze, Hrodvar, Omega, der Leichenkoloss und die Nutztiere werden unten genannt.

| Gruppe | Typen (Leben/Schaden) |
|---|---|
| Wild | Wolf 30/7, Wildschwein 46/11, Bär 150/18 (Revier), Wilder Hund 24/6 |
| Goblins | Goblin 28/6, Goblin-Krieger 54/11 |
| Banditen | Bandit 48/10, Banditenschütze 36/9, Speerträger 50/12 (hält Abstand), Kopfgeldjäger 58/12 |
| Kette | Kettenknecht 95/15, Rotgardist 120/17, Kettenschütze 50/16 |
| Seevolk | Plünderer der Sturmklinge 62/12, Harpunier 48/14 |
| Aurelion | Kriegsautomat 140/16 |
| Tote | Untoter Krieger 44/10, Wächter der Nekropole 150/15, Hauptmann der Toten 170/16, Kultist der Asche 34/12, Wiedergänger 70/13 (steht einmal auf, außer bei Feuer oder Heiligem), Geist 38/9 (kurz körperlos), Knochenritter 120/14, Knochenschütze 36/9, Nekromant 52/11, Seuchenleiche 80/9 (Biss vergiftet), Aschdämon 170/17 (feuerfest), Schattenwesen 40/15 (springt hinter das Ziel), Knochenhund 34/8, Aasschwinge 22/6 (fliegt), Todesritter 230/20 (Lebensraub) |
| Omega | Klingenengel 90/16, Lichtschütze 60/12, Ophan 70/6 (heilt) |
| Sonstige | Soldat Valens 52/10, Übungspuppe, Student der Akademie |

- **Rollen der Toten** (`role`): Nahkampf, Schildwall, Elite, Heiler, Masse, Meuchler, Fernkampf, Beschwörer, Brecher, Hetzer, Flieger, Belagerung. Der Leichenkoloss (340/24) zerschlägt Wagen, sein Stampfen trifft alle im Umkreis.
- **Raubtiere gegen Banditen:** Wölfe, Bären und Wildschweine greifen auch Banditen an (`isHostile`).
- **Varianten** (`ENEMY_VARIANTS`): Vernarbter (Veteran), Ausgehungerter, Rasender, Gepanzerter, Anführer (nur Menschen, `rallyCall`).
- **Zonenstufen** (`ZONE`, `REGION_TIER`, `zoneTier`, `zoneLevel`): 6 Gefahrenstufen mit den Stufenspannen 1–8 bis 25–50. Die Region hebt die Stufe: Totenland 4, Eisenmark, Gebirge, Wüste und Seuchenland 3, Aurelion 2.
- **Skalierung:** `SCALING` ist leer; kein Gegner wächst mit dem Spieler.
- **Nutztiere und Reittiere:** Kuh, Schaf, Pferd, Hirsch. Sie fliehen (`prey`) und können gezähmt werden (§2.10).

**Bosse:**

| Boss | Ort | Leben | Besonderes |
|---|---|---|---|
| Graumähne, Leitwolf (`alpha`) | Wolfsschlucht | 170 | Rudelruf; danach verwilderte Hunde, Eren bekommt Felle |
| Karrak, der Sandfürst (`sandlord`) | Rote Wüste | 240 | Schützen; danach ziehen Goblin-Krieger ein |
| Varg, Kettenmeister (`chain_master`) | Kernburg der Eisenfeste | 260 | Hof aus Rotgardisten; sein Tod befreit die Goblins |
| Gorak, Grubenwart | Verlassene Grube | 240 | eigene Beute |
| Hrodvar, König unter dem Eis | Tiefhall | 280 | `frostKingAI`, Waffe Nachtfrost |
| Weißbart | Tangkron | 560 | redet zuerst (`whitebeardParley`), `whitebeardAI` |
| König Garmadon | Gruft des Toten Königs | 620 | drei Phasen, spricht, Lebensraub |
| Omega, der Gefallene | Krater | 600 | fliegt; Sternenfall, Strahl, Nova, Engelwellen (`ANGEL_WAVES`) |
| Dodon, Hüter von Morrgrund | Morrgrund | 760 | Riese, schwerer Slam jeden 2. Angriff |
| Wächter der Nekropole | Große Nekropole | 150 | Hort-Wächter |
| Gewölbe-Bosse | 5 Gewölbe | – | Krummnase, Rostzahn, Der Hohepriester, Morvhal, Der Regulator |

- Die Regionalbosse Graumähne, Karrak und Varg stehen in `REGION_BOSSES` (`ensureRegionBosses`, `regionBossSlain`, Flags in `S.flags`).
- Der Boss-Balken wird oben angezeigt (`render.js` `drawBossBar`).

### 2.8 Welt und Karte

**Aufbau** (`world.js` `genWorld` und Varianten):
- Kacheltypen: Gras, Erde, Straße, Wasser, Sumpf, Stein, Planke, Fels, Mauer, Sand, Dungeonboden, Dungeonwand, Asche, Feld.
- Sumpf, Wasser und Sand verlangsamen (`SLOW`).
- Die Weltordnung seit S12:
  - Westen: Eisenmark und Kette.
  - Mitte: Menschenländer (Valen, Orden, freie Händler).
  - Süden: Aurelion.
  - Osten: Totenland.
  - Grenzen gehen fließend ineinander über.
  - Dazu Wüstensporn und Südinseln (`SOUTH`) sowie die Gischtinseln (eigene Karte).
- Das Wetter hängt von der Region ab (`WEATHER_POOL`): klar, bewölkt, Regen, Nebel, Blutregen, Sandsturm, Schnee.

**Benannte Orte** (`LOCATIONS`, 56 plus 8 Dörfer plus 5 Aurelion-Städte):
- Städte und Dörfer:
  - Eren (Heimatdorf), Nordfurt, Salzhafen, Kreuzweg, Aschfurt, Sonnwacht (Orden), Vharnholm (Tote), Karak-Atar (Wüste), Die Eisenfeste (Kette).
  - Dörfer (`VILLAGES`): Haselbrück, Mühlbach, Weidenau (Valen), Rastfurt (Händler), Lichtenrain (Orden). Tributdörfer der Kette: Grauwasser, Hohlstein, Eisenried.
  - Aurelion (`AUREL_CITIES`): Aurelheim, Kupferhafen, Gelenkhall, Tickmar, Sankt Serin.
- Lager: Banditenlager, Überfallenes Lager, Grenzwacht, Steinbruch, Grubenhort, Morrgrund, Dünenwacht.
- Ruinen:
  - Alte Feste, Alter Friedhof, Kleine Ruine, Alter Wachturm, Versunkener Tempel, Alt-Vharn, Große Nekropole, Hundertfeld.
  - Turm des Nachtglases, Totenruinen, Gräberfeld, Seelenhügel, Grabwacht, Sandruinen, Nekrosinsel.
- Wildnis: Eren-Wald, Moorland, Westwald, Wolfsschlucht, Frostkamm, Rote Wüste, Knochenwald, Aschensee, Nebelinsel, Westgebirge, Eisenmark, Totenland, Schädelwald, Wüstensporn, Hochreich Aurelion.
- Straßen und Pässe: Alte Straße, Grubenpfad, Steinbrücke, Kettentor, Knochentor.
- Schreine: Waldschrein, Alter Hain.
- Die Schwarze Feste gilt als Stadt der Toten.

**Aurelheim** (`buildMetropolis`, rund 190 × 136 Kacheln):
- Mauerring mit vier mechanischen Toren und Siegelprüfung, zwei Prachtachsen mit Laternen.
- Regierungsplatz mit Palast (begehbar), astronomischer Uhr, Brunnen und Kaiserin-Standbild.
- 11 Bezirke: Regierungs-, Adels-, Akademie-, Magitech-, Handels-, Gilden-, Industrie- und Armenviertel, Transportbezirk, Bürgerstadt, Militärbezirk.
- Begehbare Prachtbauten (`HALL_TYPES`): Palast, Markthalle, Bank, Akademie, Sternwarte, Bibliothek, Gericht, Hospital, Badehaus, Magitech, Fabrikhalle, Legion.

**Karten neben der Oberwelt** (`DUNGEONS`, `MAP_KEYS`):

| Karte | Inhalt |
|---|---|
| Verlassene Grube (`mine`) | Goblins, Gorak |
| Tiefhall (`deep`) | Frostzwergenhalle, Hrodvar, Königseisen |
| Kerker (`kerker`) | 8 Zellen, Wachstube |
| Krater des Gefallenen Sterns (`omega`) | Omega |
| Gruft des Toten Königs (`garmadon`) | Garmadon |
| Gewölbe (`vault`) | zufällig erzeugt |
| Himmelsinsel (`sky`) | Himmelsfeste, Hof der Herrscher, Gericht |
| Tangkron (`isle`) | Gischtinseln, Viertel von Salzbund und Sturmklinge |
| Turm des Nachtglases (`tower`) | 10 Ebenen |
| Auf See (`deck`) | Schiffsdeck der Überfahrt |

- **Turm des Nachtglases** (`TOWER_LEVELS`):
  - Die zehn Ebenen: Eingangshalle, Bibliothek, Lehrsäle, Alchemielabor, Beschwörungskammer, Ritualraum, Observatorium, Seelenkammer, Verbotene Bibliothek (hinter einer Knochenkette, `openTowerSeal`), Ilvars Studierzimmer.
  - Er steht östlich der Schwarzen Feste (`NACHT`).
  - Stirbt Ilvar, stürzen die oberen Ebenen ein (`ilvarSlain`).
  - Nebenquest mit Tuvi: fliehen lassen oder verraten (`tuviTalk`). Die Seelen in der Seelenkammer lassen sich befreien (`soulJarChoice`).
- **Gewölbe** (`VAULTS`, 5; `buildVault`, `enterVault`, `vaultDescend`):

  | Gewölbe | Lage | Stufe | Ebenen | Boss |
  |---|---|---|---|---|
  | Räuberhöhle | Westwald | 1 | 2 | Krummnase |
  | Alte Kasematten | Alter Wachturm | 2 | 3 | Rostzahn |
  | Gruft des Versunkenen Tempels | Versunkener Tempel | 3 | 3 | Hohepriester |
  | Knochengruft | Knochenwald | 5 | 4 | Morvhal |
  | Verfallene Uhrwerkhalle | Tickmar | 5 | 4 | Der Regulator |

  - Jede Ebene ist ein Raumgraph mit 7 bis 10 Räumen, gewürfelt aus dem Seed.
  - Auf der untersten Ebene steht der Hort (einmal, `S.vaults[site].looted`). Gesäuberte Ebenen bleiben 7 Tage leer.
- **Fallgruben** in Dungeons schaden beim Betreten (`controlPlayer`, „Fallgrube“).

**Spawns** (`SPAWN_AREAS` rund 49 Gebiete mit Deckel; `regionSpawn`, `poiSpawns`, `initialSpawns`, `respawnTick`, `styleArea`):
- Gegner nachkommen lassen (`respawnTick`), Hinterhalte je Bodentyp (`AMBUSH_BY_TILE`), Gruppen sind einheitlich (`AMBUSH_FAM`).
- Rohstoffknoten wachsen nach (`depleted`, `respawn`).

### 2.9 Besondere Orte im Einzelnen

- **Eisenmark / Eisenfeste** (`ensureEisenmark`, `eisenPopulation`, `eisenStep`, `EISEN_JOBS`, `fortressHour`):
  - Die Festung der Kette mit Mauerring (`FORT`).
  - Versklavte Goblins arbeiten an sechs Stellen: Mine, Schmiede, Vorwerk, Holzfällerei, Ställe, Quartiere.
  - Die Tore gehen nachts zu. In der Kernburg sitzt Varg mit Rotgarde.
  - Der Hochpaladin Omegas, der Omega-Altar und Irmgard stehen hier.
- **Grubenhort und Goblindorf** (`GOBLIN_VILLAGE`, `ensureGoblinVillage`): entsteht nach der Befreiung.
  - Figuren: Grisk (Ältester), Nibbel (Händlerin), Krak, Sill, Morr.
  - Aufträge: `q_grisk_lost`, `q_grisk_rache`, `q_grisk_build`.
- **Morrgrund** (`MORR`, `ensureMorrgrund`, `morrTick`, `morrGrow`, `dodonParley`):
  - Das letzte freie Goblindorf, weit im Süden unter Hohlstein. Beim ersten Anblick rennen die Goblins und rufen „Dodon!“.
  - Drei Wege: Freund, Vorbeiziehender oder Feind (`morrTurnHostile`).
  - Questreihe `g_dod1–3` führt zum Pakt des Sturms: Greift man Varg an, stürmen Dodon und die Goblins herein (`goblinStorm`, `goblinStormWon`).
  - Stirbt man im Sturm, stirbt das Dorf (`morrFall`). Nach Vargs Fall wächst Morrgrund.
  - Alle anderen Goblins bleiben feindlich, bis Varg fällt (`goblinsFreed`).
- **Totenland und Vharnholm:** Stadt der Toten mit Sael (Händler, Todesweihe, Überfälle). Dazu Alt-Vharn (Ysra) und der Nekromanten-Turm (Vhal).
- **Garmadons Gruft** (`garmadonHost`, `garmadonParley`, `garmadonServe`, `garmadonFight`, `garmadonSlain`):
  - Garmadon spricht und lässt einen nicht gehen. Man kann knien und dienen oder ihn herausfordern.
  - Die Eiserne Legion kommt, wenn Varg sie zugesagt hat (`legionArrives`).
  - Sind beide Brüder tot, folgt eine eigene Kamerafahrt (`twinFallCheck`).
- **Himmelsinsel** (`genSky`, `ensureSkyCourt`, `skyGate`, `skyJourney`):
  - Erreichbar über den Teleportkreis in Aurelheim; die Überfahrt kostet Gold.
  - Oben sitzen die Herrscher (`SKY_RULERS`): Kaiserin Aurelia, Ratssprecher Corvan, das Uhrwerk-Orakel, Magierkönig Theron.
  - Dort tagen Gericht und Rat.
- **Gischtinseln / Tangkron** (`genIsle`, `ensureSeafolk`, `ensureWhitebeard`): Hafen, Viertel von Salzbund und Sturmklinge, Weißbarts kieloberes Schiff.
- **Wiederbesiedlung** (P11, `RESETTLE`, `resettleDay`): Nach Garmadons Fall durchlaufen befreite Orte fünf Stufen:
  1. Tag 1: Heimkehrer.
  2. Tag 5: Zelte.
  3. Tag 15: erste Häuser.
  4. Tag 30: Dorf.
  5. Tag 60: größere Siedlung.

  Jede Stufe wird mit `growTown` gebaut und steht in der Chronik.

### 2.10 NPCs und Alltag

- **Benannte NPCs** (`NPCS`, 38): Havel, Elena, Tomas, Borin, Mara, Gerold, Aldric, Jorun, Kelan, Rook, Morvath, Ysra, Vhal, Mira, Brann, Ilva, Oda, Lioba, Quirin, Sael, Hauke, Kaelis, Wenzel, Adela, Nix, Serafine, Aldis, Corvinus, Jasper, Orrin, Ulfar, Hadubrand (`key` wendel), Lila und weitere.
- Dazu kommen Figuren, die im Code entstehen:
  - Ilvar, Tuvi, Irmgard.
  - Die fünf Köpfe der Kirche (`FAITH_FIGURES`): Mechthild, Aldebrand, Konrad, Kasimir und Irmgard.
  - Grisk und das Goblindorf, Snikk, Dodon.
  - Die Herrscher der Himmelsinsel, die vier Hausherren Aurelions.
  - Weißbart, die Clanführerinnen, Rask, Mo.
- **Bewohner** (`spawnResidents`, `TRADES`, `DEAD_TRADES`, `AUREL_TRADES`, `HOUSE_CAP`):
  - Jedes Haus bekommt Bewohner mit einem Beruf nach Haustyp. Vharnholm hat eigene Totenberufe, Aurelion eigene Adels- und Magitech-Berufe.
- **Tagesablauf** (`workCycle`, `CYCLE`, `JOB_AT`, `villagerDay`, `dayTarget`, `NPC_DAY`):
  - Tagsüber Arbeit am richtigen Ort mit Werkzeug:
    - Holzfäller → Stammholz, Bauer → Weizen, Schmied → Werkzeug aus Barren.
    - Bäcker → Brot, Weber → Tuch, Handwerker → Holzwaren, Fischer → Fleisch.
  - Abends in der Schenke, nachts zu Hause.
  - Benannte NPCs haben feste Pläne.
- **Hunger und Markt** (`eatMeal`, `marketBuy`, `HUNGRY_MIN` 20 Minuten): Bewohner essen und kaufen am Markt ein.
- **Stadtfest** (`FEST_DAYS` alle 6 Tage, `festTick`, `festMeal`): Tische, Fässer, Fackeln und Musik auf dem Platz; am Vortag wird es angekündigt.
- **Reisende** (`TRAV_KINDS`, `spawnTraveler`, `travelerStep`, `roadTick`, höchstens 14):
  - Arten: Wanderer, Hausierer (Laden), Pilger, Bote, Spielmann, Arbeitssuchender.
  - Sie ziehen zwischen den Städten; Pilger gehen zum Omega-Altar.
- **Zuzug und Wegzug** (`migrationDay`, `emigrate`, `settleIn`): Leere Häuser werden neu bezogen. Benannte NPCs ziehen nie weg.
- **Nachfolger** (`successorDay`, `KEY_ROLE`, `S.succ`):
  - Stirbt ein Lehrer, Händler, Schmied, Meister oder Vorsteher, steht nach drei Tagen jemand Neues an derselben Stelle. Die Beziehung beginnt bei null.
  - Verwandte kommen nicht nach. Nach Garmadons Fall gibt es keine neuen Lehrer der Toten.
- **Gespräche** (`talk`, `npcOffers`, `contextGreet`, `contextLines`):
  - Menüpunkte, je nach Rolle:
    - Waren zeigen, Handelskontor, Ausbildung, Magie lernen, Prüfung ablegen, Wunden versorgen.
    - Ausbessern, Pferde zeigen, Söldner anheuern, Talente vergessen, Beitritt, „Was liegt an?“, Auftrag abgeben.
    - Neuigkeiten, „Ich hätte da eine Frage …“, „Wie geht es dir?“, „Wohin des Weges?“, „Was hältst du von Omega?“, Todesweihe.
  - Die Begrüßung reagiert auf Wunden, Kopfgeld, Rang, Ruhm, Uhrzeit, Trauer und Pakt (`PACT_GREET`, `PACT_TOWN`, `FEAR_GREET`).
- **Wissen im Gespräch** (`LORE`, 13 Themen; `knownTopics`, `askMenu`, `askTopic`, `loreAnswer`):
  - Themen: Garmadon, Varg, Aurelion, Magitech, Rotfall, Goblins, Seevolk, Weißbart, Nekropole, Vharnholm, Pakt, Hain, Morrgrund, Stille Hand.
  - Man kann nur fragen, was man weiß (Grundwissen, Chronik, Gehörtes).
  - Die Antwort hängt von Fraktion, Beruf oder Seevolk ab. Antworten lehren neue Themen (`teach`), so führt eine Kette von Hinweisen zu den Titelklassen.
- **Neuigkeiten und Gerüchte** (`newsTalk`, `gossip`, `TOWN_GOSSIP`, `NEWS_DAYS` 5): Schlachten, Todesfälle, Verbrechen und Nachrichten der letzten 5 Tage werden weitererzählt.
- **Beziehungen und Erinnerungen** (`addRel`, `remember`, `MEMORY_TEXT` 12 Arten; `S.relations`):
  - Erinnerungen wie „hat mir das Leben gerettet“ oder „hat mich hungern lassen“ prägen spätere Sätze.
  - Freunde und Rivalen untereinander (`planRelations`) sowie Szenen wie Streit, Hochzeit, Duell und Spielleute (`SCENES`, `ambientTick`, `ambWedding`, `ambDuel`, `ambMinstrels`).
- **Helfen bringt Ruf** (`helpedVillager`): Verbinden oder Aufrichten gibt +3 bei der Macht des Orts, einmal je Person und Tag.
- **Heiler** (`healerTreat`, `HEALER_MS` 3,5 s): heilt gegen Gold (`healCost`).
- **Möbel mit Funktion** (`FURN_USE`, `useFurniture`):

  | Möbel | Wirkung |
  |---|---|
  | Bett | Schlafen: nachts bis 7 Uhr, tagsüber 6 Stunden, Gruppe heilt voll; fremdes Bett kostet Beziehung −5; Schenkenbett 8 Gold (`INN_PRICE`) |
  | Stand, Tresen | Handeln |
  | Bank, Thron | Sitzen |
  | Fassregal | Zapfen (3 Gold) |
  | Regal, Pult, Kisten | Durchsuchen (`RUMMAGE`) |
  | Esse, Amboss, Werkbank | Ausbessern |
  | Maschine, Teilehaufen | Fabrikarbeit |
  | Trog, Brunnen | Trinken und waschen: Ausdauer voll, löscht Brennen, 20 s Abklingzeit |

- **Wachen** (`GUARD_POSTS`, `GUARD_KIT`, `spawnGuardPosts`, `raiseAlarm`, `calmDown`):
  - Wachposten in 8 Städten.
  - Die Ausrüstung hängt von der Fraktion ab: Aurelion hat Automaten, die Kette bunt bestückte Wachen, Vharnholm „Stille Wächter“.
- **Angriff auf Neutrale** (`provoke`, `GUARDISH`): Wachen greifen ein, Zivilisten fliehen, der Ruf sinkt.

### 2.11 Gruppe, Gefährten, Söldner, Tiere, Pferde

- **Gruppe** (`S.party`, `partyCap` 3+, `recruit`, `dismiss`, `sendHome`, `giveGear`, `partyCommand`, `partyAI`, `partyCare`):
  - Rekrutierbar sind Elena, Tomas, Borin, Lioba, Rook und Lila, jeweils ab einer Mindestbeziehung.
  - Befehle über das Gruppenfenster.
  - „Ausrüstung geben“ wählt das stärkste Stück (siehe BUGS: ohne Klassenprüfung).
- **Moral:**
  - Täglich ohne Nahrung −10, mit Nahrung +2.
  - Jeder Tote in der Nähe −14, ein Mord −10, Blutbann −20.
  - Unter 12 Moral gehen Gefährten mit 40 % Chance täglich (`dayTick`).
- **Gefährten-Sätze** (`companionTalk`, `TRAIT_SAY`, `partyReact`): Charakterzüge färben die Kommentare.
- **Söldner** (`ensureMercs`, `hireMerc`, `mercDay`, `MERC_KIT`):
  - Zwei je Stadtschenke, Stufe 3–7 (in Aurelion +2).
  - Handgeld 50 + Stufe × 12, Lohn 3 + Stufe Gold am Tag.
- **Tiere zähmen** (`TAME`, `tryTame`, `makePet`; `S.pet`):
  - Man füttert ein Tier in der Nähe:

    | Tier | Grundchance | Futter |
    |---|---|---|
    | Wolf | 20 % | Dörrfleisch, Pökelfleisch |
    | Wilder Hund | 35 % | Dörrfleisch, Pökelfleisch, Brot |
    | Wildschwein | 25 % | Brot, Weizen |
    | Bär | 8 % | Dörrfleisch, Pökelfleisch |

  - Dazu kommen: + Überleben/200, +12 % je Versuch, +15 % wenn das Tier verwundet ist, −25 % wenn es wütend ist.
  - Es gibt ein Tier zugleich; es bekommt +20 % Leben.
  - Beim Tierhändler kauft man Tiere (`BEAST_WARES`: Hund 60, Wolfshund 180, Kampfeber 140).
- **Nutztiere** (`ensureLivestock`, `herdEvents`, `farmDay`, `buyFarmAnimal`): Kühe und Schafe; Wölfe und Räuber reißen Tiere. Zum eigenen Hof siehe §2.18.
- **Pferde** (`MOUNTS`, `mountStats`, `mountTick`, `toggleMount`, `spawnHorse`, `stableOffers`, `buyHorse`, `releaseMount`, `oilMount`; `S.mount`):

  | Reittier | Preis | Tempo |
  |---|---|---|
  | Pferd | 250 | 1,55 |
  | Messingross (Kupferhafen) | 900 | 1,75 |
  | Totenross (nur Tote oder Pakt, Todesritter automatisch) | 400 | 1,65 |

  - Jedes Tier hat eigene Werte: Tempo, Ausdauer (sinkt beim Reiten, erschöpft = langsamer) und Mut (ab 70 kommt es auch im Kampf).
  - Das Angebot wechselt wöchentlich. Beim Tierhändler gibt es 3 Pferde, beim Züchter Hadubrand in Mühlbach (Koppel) 5. Ein eigenes Pferd wird mit 40 % angerechnet.
  - R pfeift das Pferd herbei; es kommt von außerhalb des Bildes. Im Kampf kommt es nicht, vor Häusern und Höhlen wartet es draußen.
  - Im Gruppenfenster kann man es verstoßen. Das Messingross muss geölt werden (`oilMount`). Fenster „Stall“ (`ui.js` `stableUI`).

### 2.12 Fraktionen, Ränge, Ruf, Ruhm, Legenden

- **Fraktionen** (`FACTIONS`, 9):

  | Fraktion | Ränge |
  |---|---|
  | Valen | Rekrut → Offizier (5) |
  | Orden | Novize → Meister (6) |
  | Untote | Diener → Kommandant (5) |
  | Freie Händler | Kunde, Partner, Teilhaber |
  | Rooks Bande | Handlanger, Klinge, Hauptmann |
  | Aurelion | Fremder → Mitglied des Hohen Rates (8) |
  | Eiserne Kette | Treiber → Dunkler Hochpaladin (5) |
  | Seevolk | Landratte → Kapitän (5) |
  | Grubenstämme | Fremder, Freund, Grubenbruder |

- **Ruf-Stufen** (`REP_TIERS`, 7):

  | Stufe | ab | Preisfaktor |
  |---|---|---|
  | Vertraut | 70 | ×0,85 |
  | Verbündet | 40 | ×0,90 |
  | Freundlich | 15 | ×0,95 |
  | Neutral | −5 | ×1,00 |
  | Misstrauisch | −30 | ×1,12 |
  | Feindlich | −60 | ×1,30 |
  | Verhasst | darunter | kein Handel, Wachen greifen an |

- **Beitritt** (`joinFaction`, `JOIN_FOES`):
  - Man braucht Ansehen 10, bei den Toten 15.
  - Verfeindete Mitgliedschaften schließen einander aus.
  - Beitritt zu den Toten: Orden −30, Valen −20. Zur Kette: Goblins −20.
- **Rangprüfungen** (`RANK_LINES`, daraus erzeugt `r_<fraktion>_<rang><a|b>`; `checkRankUp`, `promote`, `rankReady`):
  - Ein Rang braucht Ruf ≥ Rang × 25 und dann zwei Aufträge beim Anführer. Das gibt es für Händler (Gerold), Bande (Rook), Valen (Oda), Orden (Kelan), Tote (Morvath) und Kette (Kettenwache).
  - Lohn je Auftrag: 60 + Rang × 50 Gold, 80 + Rang × 70 Erfahrung, +5 Ruf.
  - Aurelion hat eigene Stufen (`autoRanks`): Aufenthaltsschein, Bürgerrecht (Ansehen 40, 1000 Gold, Fürsprecher), dann Ansehen 52/64/76/88 und die Quest „Eine Stimme im Rat“.
  - Goblins: Befreiung, dann Ansehen 20 und 60.
  - Seevolk: über die Clan-Aufträge.
- **Rangvorteile** (`RANK_PERKS`, `rankGuide`): Händler der Fraktion geben Rang × 3 % Nachlass (höchstens 35 %), Wachen grüßen, dazu Sonderrechte je Fraktion. Der Kodex hat einen Reiter „Ränge“.
- **Ruhm je Region** (`FAME_REG`, `FAME_TIERS`, `addFame`, `fameRegion`; `S.fame`):
  - Regionen: Menschenland, Westlande, Hochreich, Totenland, Gischtinseln.
  - Stufen: Unbekannt, Bekannt (15), Regional bekannt (35), Berühmt (60), Legendär (85).
  - Ruhm ≥ 60 lässt Kopfgeldjäger schon ab 100 Kopfgeld kommen. Die Leute erkennen einen, Händler geben Nachlass.
- **Legenden** (`grantLegend`, `S.legends`): Kettenbrecher, Held der Untoten, Gottestöter, Avatar Omegas, Hüter des Schlafs, Turniersieger (P15) und weitere.
- **Aktive Effekte** (X, `activeEffects`): zeigt Clan, Titel, Zustände und Bann mit ihrer Wirkung.
- **Tägliches Handeln der Mächte** (`factionAgenda`):
  - Jeden Tag handelt reihum Valen, Orden, Händler, Kette (solange sie besteht) oder Aurelion.
  - Mögliche Handlungen: Aushebung, Streifen (`sendPatrol`), Aushänge (`postContract`), Preise.
  - Das wird als Log und Chronik gemeldet.

### 2.13 Aufträge

**Story- und Fraktionsquests** (`QUESTS`, 55 fest plus 36 Rangquests, die aus `RANK_LINES` erzeugt werden):
- **Eren:** `q_wolves` (Havel), `q_herbs` (Elena), `q_lila` (Jorun, vermisste Tochter bei den Banditen, zwei Enden: `lilaOutcome`, `finishLila`), `q_mine` (Mara: Gorak), `q_greymane` (Tomas: Graumähne).
- **Orden:** `q_paladin1–3` bei Kelan (Wachsamkeit, Siegel, Schrein halten).
- **Tote:** `q_undead` (Morvath: Grabsiegel), `q_graverobbers` (Sael), `q_pact` (Ysra).
- **Valen:** `q_frontier` (Oda), `q_kingsiron` (Brann: Hrodvar und Königseisen).
- **Händler:** `q_sandlord` (Gerold: Karrak), `q_pelts` (Quirin).
- **Bande:** `q_rook` (Rook).
- **Bardin:** `q_hundred_song` (Lioba).
- **Titel:** `q_grove` (Mira), `q_monk` (Ilva), `c_nec/war/dru/mon 1–3`, `dk_1–3` (siehe §2.4).
- **Goblins:** `g_dod1–3` (Dodon); `q_grisk_lost`, `q_grisk_rache`, `q_grisk_build` (Grisk).
- **Seevolk:**
  - Salzbund: `q_salz1–3` (Schwarzsegel, Salz, Weißbart töten).
  - Sturmklinge: `q_klinge1–2` (Kampfgrube, Beute).
  - `q_wb_nebel`: Schwarzsegel-Kapitänin.
  - Man wählt eine Seite (`chooseSeaSide`) und verliert die andere; Frieden mit Weißbart ist möglich (`seaPeace`).
- **Welt:**
  - `q_tribut`, `q_runaway` (Kette).
  - `q_intrige`, `q_gilde`, `q_ratssitz` (Aurelion).
  - `q_rotfall`, `q_omega` (Omega).
  - `q_rask` (Kerker).
  - `q_anomaly` (Anomalie).
  - `q_undraid`, `q_undarmy` (Überfälle der Toten).
- **Anzeige:**
  - Auftragsbuch (J).
  - Verfolgter Auftrag mit Richtung und Entfernung am Bildrand (`render.js` `drawTrack`, `questPoint`, `QUEST_WHERE`).
  - Auftragsziele auf der Karte.
- **Lohn:** Beim Abgeben werden Gegenstände abgezogen (`take`). Ziele zählen auch, wenn Gefährten sie fern vom Helden töten (`onKill`, `onItemGained`, `questCheck`, `turnIn`).

**Verträge vom Anschlagbrett und von Bewohnern** (`CON` 12 Arten; `makeContract`, `townContracts`, `acceptContract`, `conProgress`, `claimContract`, `failContract`, `conTick`, `boardEntries`, `boardMenu`):
- **Arten:** Kopfgeld, Monsterjagd, Jagd, Verteidigung, Patrouille (3 Wegpunkte), Eskorte, Lieferung (Paket), Vermisst, Vorräte (Holz und Stein), Kräuter, Spurensuche (3 Spuren, dann Lager), Lager ausheben (2–3 Lager).
- **Lohn:** 40 + Zonenstufe × 25 Gold, 50 + Stufe × 20 Erfahrung, +4 Ruf; je Art angepasst.
- **Grenzen:** höchstens 5 zugleich (`CON_MAX`); Fristen 2–6 Tage (`CON_DAYS`).
- **Bewohner** vergeben Aufträge nach Beruf (`PROF_CON`), z. B. Bauer → Jagd, Heilerin → Kräuter, Graf → Spur.
  - Der Auftrag nennt den Auftraggeber. Ist er erledigt, zeigt der Wegpunkt auf den Bewohner selbst.
  - Auf „Sehr schwer“ gibt es weder Namen noch Wegpunkt.
- **Wendungen** (`twist`, 35 % Chance, geheim):
  - Kopfgeld: der Anführer ergibt sich (`surrenderOffer`, verschonen möglich).
  - Vermisst: die Person ist gefangen.
  - Jagd: ein Leitwolf (+20 Gold).
  - Eskorte: 45 % Verrat, der Begleitete lügt.
  - Nach einem Kopfgeld kommt mit 35 % Chance ein **Rächer** (`S.avenge`, Begegnung `avenger`).
- **Beitrag zählt** (S14): Haben Wachen oder andere die Arbeit gemacht, sinken Lohn und Ruf (`C.credit`/`C.kills`).
- **Ziele gehen nie aus** (`questTargetTick`): Fehlende Ziele erscheinen außer Sicht nach; Bosse nie.
- **Echo** (`conEchoDay`): Aufträge wirken nach, z. B. Überlebende einer Karawane (`caravanSurvivors`).
- **Spuk am Brunnen** und Schmuggel sind eigene Vertragsformen (`hauntContract`, `smuggleContract`); ignorierte Verträge haben Folgen (`ignoredContract`).

### 2.14 Weltereignisse

**Zufallsereignisse** (`EVENTS`, `worldEvent`; jede Spielstunde mit 10 % Chance):

| Ereignis | Funktion | Wirkung |
|---|---|---|
| Steuereintreiber | `evTaxman` | Beamter mit zwei Wachen in einem Valen-Dorf, Wohlstand −6, Valen +1; kommt doppelt in der Liste vor |
| Deserteure | `evDeserters` | 3 Räuber bei einer Valen-Stadt, Kopfgeld-Aushang |
| Missernte | `evFailedHarvest` | zwei Dörfer Wohlstand −10, Preise ×1,06; doppelt in der Liste |
| Pilgerüberfall | `evPilgrimRaid` | 2 Räuber jagen einen Pilgerzug |
| Brand | `evFire` → `startFire` | Haus brennt; Löschkette mit Wassereimer am Brunnen; Bewohner helfen (`FIRE_HELPERS` 4, `douse`, `fireJobStep`, `fireTick`, `endFire`) |
| Magitech-Unfall | `evMagitech` → `magitechAccident` | Automaten laufen Amok gegen alle; die Fabrik in Tickmar steht 3 Tage still; wer sie stoppt, bekommt Aurelion +2 je Automat |
| Spuk am Brunnen | `evHauntEv` → `evHaunt` | Geister nachts am Brunnen eines Orts nahe Vharnholm, Aushang |
| Magiekern | `evMagicCore` | Snikk in Grubenhort hat einen Kern; kaufen oder nehmen; dann Corvinus, Sael, Irmgard oder Ilvar geben (`CORE_DEALS`), zerschlagen (`coreSmash`) oder behalten |
| Magische Anomalie | `evAnomaly` | an einem von 6 Ley-Punkten: Mana doppelt, Zauber verrutschen; ein Schutzzauber im Zentrum schließt sie gegen Lohn (`q_anomaly`), sonst schließt sie sich nach 4 Tagen |
| Meteorsplitter | `evMeteor` | frühestens alle 20 Tage; Splitter an Irmgard (Glaube), Corvinus (200 Gold) oder Ilvar (+15 Vertrauen) (`METEOR_DEALS`) |
| Erbfolgestreit | `evSuccession` | zwei Erben eines Adelshauses; wer Fürsprache hält, verschiebt eine Ratsstimme |
| Kleine Meldungen | – | Karawane überfallen, Untote gesichtet (1 Skelett), Flüchtlinge (Preise +8 %), Truppen, neue Ader (Preise −4 %), Wegzoll (1 Bandit), Gerüchte |

**Große Weltereignisse (P15, seit Version 19 im Code)** (`BIG`, `BIG_START`, `bigDay`, `bigTick`, `bigSecond`, `bigChoices`, `bigEnd`; `S.big`, `S.bigNext`, `S.bigLast`):
- Alle 3–5 Tage kommt eines, nie zweimal dasselbe unter den letzten dreien, höchstens eines zugleich.
- Angesagt wird es per Log, Chronik und Toast.

| Ereignis | Ablauf und Wahl |
|---|---|
| Seuche | 8 Tage in einer Stadt mit ≥ 4 Bewohnern; täglich stirbt mit 50 % Chance ein Kranker; ein Heilkraut heilt (Beziehung +8, Ort +2); ab Tag 3 ohne 3 Geheilte springt sie auf den Nachbarort über; dazu ein Kräuter-Aushang |
| Heuschrecken | 3 Tage; halbes Korn, Preise ×1,06; ein Bauer weiß Rat: 10 Holz für Rauch, dann +10 Korn |
| Turnier | Nordfurt, Eren oder Salzhafen, 2 Tage; Herold Anselm; 20 Gold Einsatz; 3 Ritter, die bei 30 % Leben aufgeben; Sieg: 200 Gold, Ruhm +15, Titel „Turniersieger“ |
| Adelsball | Aurelheim, 2 Tage; nur mit Schein oder Bürgerrecht; 3 Gespräche: schmeicheln (+Gunst), Klatsch (ein Haus +, ein anderes −), frech (−5) |
| Luftschiffabsturz | Wrack in der Wildnis mit Magitech, 2 bewusstlosen Luftschiffern und 3 Plünderern; Aufrichten gibt Aurelion +6 und 40 Gold |
| Schatzkarawane | Wagen vor einer Stadt mit 4 Gildenwachen; nach 6–10 Stunden greifen 6 Räuber an, wenn man in der Nähe ist; Sieg: 120 Gold, Händler +10, Ruhm +5; sonst wird er ausgeraubt (Bande +2) |
| Hexenprozess | eine Frau wird angeklagt, 2 Tage; für sie sprechen (Willenskraftprobe; Erfolg: Ort +6, Orden −3, Misserfolg: sie brennt, Orden −5), nachts fortbringen (35 % Kopfgeld 120) oder schweigen (sie brennt, Orden +2) |
| Streik | Tickmar, 3 Tage, die Fabrik steht still; zu den Arbeitern (Vantor −10), vermitteln (Willenskraft, 60 Gold) oder brechen (Vantor +10, 100 Gold) |

**Jahreszeiten** (`seasonDay`, `S.flags.season`): Der Wechsel wird angesagt. Im Winter ziehen mit 45 % Chance Wölfe an die Weiden der Norddörfer („Wolfswinter“), und die Bretter suchen Jäger. Die Jahreszeit wirkt auch auf die Landwirtschaft (`SEASON_FARM` in `economy.js`).

**Weitere Tages- und Stundenabläufe:**
- `dayTick` ruft auf: `seasonDay`, `successorDay`, `anomalyDay`, `rebuildTick`, `growthDay`, `faithDay`, `undeadFallDay`, `refugeeWave`, `migrationDay`, `tributeDay`, `campaignDay`, `raidDay`, `undeadHeldDay`, `bigDay`, `pruneDay`, `rebuildRazed`, `aurelDay`, `mercDay`, `conEchoDay`, `factionAgenda`, `bountyDay`, `SIM.warDay`, `herdEvents`, `farmDay`.
- `hourTick` ruft auf: `aurelParade`, `rotfallCheck`, `pilgrimTick`, `fortressHour`, `travelHour`, alle 6 Stunden `SIM.warTick`, `worldEvent`, `checkRankUp` und die Siedlungsereignisse.

**Glaubensereignisse** (`faithDay`): Opferfest, Ketzerjagd (Beschuldigte, `accusedTalk`, `huntEnd`), Wallfahrt (`pilgrimTick`), Kreuzzug (`crusadeEnd`), Bruder Kasimir (`kasimirEnd`).

**Begegnungen unterwegs** (`ENC_KINDS`, `spawnChoiceEncounter`, `encTalk`, `encTurn`, `encBaitTrap`, `travelTick`):
- Verwundeter Wanderer, Wegelagerer (3, 25 Gold Zoll), Hungernde Mutter, Deserteur, Rächer, Entflohener Grubenarbeiter (P9, Kettenreiter mit Hund, `startRunaway`), Weinende Frau (Falle: Hinterhalt).
- Nicht jeder Hilferuf ist echt.

### 2.15 Krieg

- **Kriegsknoten** (`data.js` `WAR_NODES` 15, `WAR_EDGES` 19; `S.war`):
  - Knoten: Alter Friedhof, Moorland, Alte Feste, Kleine Ruine, Eren, Alte Straße, Nordfurt, Schwarze Feste, Nekropole, Alt-Vharn, Sonnwacht, Kreuzweg, Aschfurt, Salzhafen, Steinbrücke.
  - Jeder Knoten hat einen Besitzer und eine Garnison.
- **Heere** (`sim.js` `warTick` alle 6 Stunden, `warDay` täglich, `battleCheck`, `resolveNode`, `materialize`, `unitDied`):
  - Heere ziehen über den Graphen. Untote suchen den nächsten fremden Knoten, Valen den nächsten Knoten der Toten.
  - Valen hält unter Stärke 25 still.
  - Ein halber Tag vorher melden Späher, dass die Toten ziehen, mit Warn-Toast in der Nähe.
- **Schlachten:** Ist der Spieler in der Nähe, werden sie mit echten Figuren ausgetragen (`materialize`, Mischung `UNDEAD_MIX`), sonst abstrakt. Eine Schlacht endet nach 240 Minuten.
- **Befreiung** (`liberateNode`, `undeadFallDay`): Nach Garmadons Fall wird jeden Tag eine Stadt frei, das Totenland heilt (`healTick`, `applyHeal`).
- **Kriegskarte** (`drawWarmap`, `warStatus`, `facRelation`) im Kartenfenster.
- **Überfälle auf Dörfer** (`raidDay`, `raidTick`, `raidEnd`, `raze`, `defPower`, `DEF_KINDS`):
  - Die Verteidigungsmacht setzt sich zusammen aus Miliz 1, Söldnern 2, Automaten 4 und Goblin-Kriegern 1,5.
  - Zerstörte Orte (`S.razed`) bleiben zerstört, außer auf „Angsthase“ (`rebuildRazed`).
  - Stadtverteidigung: Man kann mitverteidigen (`defenseChoices`, `defenseTalk`, `ensureDefenseMasters`) und bekommt je nach Zahl der Erschlagenen bis zu +15 Ruf.
- **Feldzüge der Kette** (`campaignDay`, `planCampaign`, `startMuster`, `campStep`, `campResolve`, `CAMP_TYPES`, `CAMP_TARGETS`, `sabotageCampaign`, `campaignChoices`):

  | Feldzug | Größe | Abstand |
  |---|---|---|
  | Stoßtrupp | 8–12 | alle 4–6 Tage |
  | Feldzug | 20–30 | alle 10–15 Tage |
  | Heerzug | 40–50 | alle 20–30 Tage |

  - Ziele sind Totenruinen, Gräberfeld, Schädelwald, Seelenhügel, Grabwacht und Knochenwald. Sammelplatz ist `MUSTER`.
  - Man kann einen Feldzug sabotieren.
- **Tribut der Kette** (`TRIB_EVERY` 5 Tage, `TRIB_TAKE` 25; `tributeDay`, `spawnTribute`, `tributStep`, `arriveTribute`, `tributeTalk`, `tributeChoices`, `banditsOnTribute`):
  - Tributzüge holen Güter aus Grauwasser, Hohlstein und Eisenried.
  - Aufstand als Prügelei ohne Tote (`startBrawl`, `brawlAI`, `endBrawl`).
  - Räuber überfallen Tributzüge (`q_tribut`).
- **Dienst bei der Kette** (`chainJobs`, `chainTick`, `cmdStep`, `openGate`, `riders`, `riderStep`, `RIDE`): Grenzreiter-Runden, Tore öffnen, Entlaufene zurückbringen.
- **Fall der Eisenfeste** (`liberate`):
  - Varg stirbt, Goblins +200, Kette −100.
  - Gefangene werden frei, wilde Goblins legen die Waffen nieder.
  - Das Goblindorf entsteht, die Legende „Kettenbrecher“ wird vergeben, eine Kamerafahrt folgt.
  - Reste der Kette werden zu Räubern (`spawnChainRest`).
- **Überfälle der Toten, vom Spieler geführt (P20)** (`undeadRaidChoices`, `raidTargets`, `startMyRaid`, `myRaidTick`, `takeVillage`, `holdTown`, `applyFate`, `heldFate`, `orderArmy`, `undeadHeldDay`; `S.myRaid`, `S.fatePending`, `S.heldFate`, `S.raidReady`):
  - Bei Sael wählt man eines der 4 nächsten Dörfer. Die Horde (6–9) wartet vor dem Dorf.
  - Fallen alle Verteidiger, gehört das Dorf den Toten: 80 Gold, die Herren −15, die Toten +8.
  - Wer sich mehr als 90 Felder entfernt, bricht den Überfall ab. Der nächste geht am folgenden Tag.
  - Ab Rang 2 schickt man ein Heer gegen eine Stadt (`q_undarmy`).
  - Urteil über die Bewohner (`FATES`): Erheben (Garnison wächst, Tote +5), Versklaven (täglich Tribut) oder Vertreiben (in die nächste Stadt).

### 2.16 Wirtschaft

- **Märkte** (`economy.js` `initEco`, `ecoDay`, `census`, `S.towns`, `S.eco`):
  - Jeder Ort hat einen Vorrat an 13 Waren: Weizen, Fleisch, Salz, Tuch, Fell, Stammholz, Holzwaren, Steine, Erz, Barren, Werkzeug, Waffen, Magitech.
  - Die Lagergrenze beträgt 60 + 40 je Lagerhaus, Markthalle oder Kontor, höchstens 400.
- **Betriebe** (`TRADES` 14): Hof, Jägerhütte, Fischerei, Stall, Holzfällerei, Werkstatt, Steinbruch, Saline, Mine, Schmelze, Schmiede, Weberei, Feinmechanik, Magitech-Werk.
  - Die Arbeiter sind echte NPCs: Wer tot ist, am Boden liegt oder in der Heldengruppe ist, arbeitet nicht.
  - Warenketten: Erz → Barren → Werkzeug, Waffen, Magitech. Fehlt ein Vorprodukt, steht der Betrieb.
- **Preis** (`ecoPrice`):
  - Warenwert × (Zielvorrat / (Vorrat + 1)), begrenzt auf 0,4–3.
  - Aurelion ×1,15, besetzte Orte beim Kauf ×1,5.
  - Kaufen ×1,12, Verkaufen ×0,88.
  - Dazu kommen der Ruf-Faktor, der globale `S.prices` (täglich ±2 %, begrenzt auf 0,7–1,6), Ruhm-Nachlass und Rang-Nachlass (`price`, `rawPrice`).
- **Händlerzüge** (`sim.js` `caravanFrame`, `caravanDied`, `buildRoute`, `roadPath`): Wagenzüge mit Beiwagen und Wachen ziehen von Überschuss zu Mangel. Sie können überfallen werden; die Fracht fällt dann halb zu Boden.
- **Handelskontor** (`ecoMenu`, `ecoPrices`):
  - Zeigt Knappes und Reichliches, ankommende Züge und Hunger.
  - Eigener **Handelswagen** (`wagonMenu`, `sendMenu`): 250 Gold, 60 Ladungen, Wachen 20 Gold, Risiko je Strecke (`riskOf`).
  - **Betriebe kaufen** (`bizMenu`): Preis 120 + Ertrag × 14 + 60 je Arbeiter. Ausbau 200 × Stufe (bis Stufe 3). Arbeiter anwerben 30 Gold, 3 Gold Lohn am Tag (höchstens 3). Der Spieler bekommt gut ein Drittel des Warenwerts, abzüglich Lohn.
  - **Lieferaufträge** (`ordersMenu`, `deliver`): ×1,6 bei Mangel (laut Doku).
- **Herden** (`HERD_OUT`, `herdDay`): Kühe liefern Fleisch und Fell, Schafe Tuch, Fell und Fleisch; Nachwuchs, Notschlachtung, Risse.
- **Stadtwachstum** (`growthDay`, `growTown`, `growNow`, `investMenu`, `GROW_TYPES`; `S.growth`):
  - Der Wohlstand steigt täglich im Frieden; Überfälle und Besatzung senken ihn.
  - Bei 100 baut die Stadt ein Haus und der Wohlstand fällt auf 20. Höchstens 10 neue Häuser je Stadt.
  - Investieren an der Stadtkasse (jeweils Ruf +3):

    | Maßnahme | Kosten |
    |---|---|
    | Wohnhaus | 120 Gold + 20 Holz |
    | Werkstatt | 220 Gold + 30 Holz + 15 Stein |
    | Handel fördern (Wohlstand +25) | 100 Gold |
    | Wache verstärken | 150 Gold + 10 Eisen |

- **Viehdiebstahl:** Wer ein fremdes Tier vor Zeugen tötet, bekommt 20 Kopfgeld; der Wohlstand sinkt um 2.
- **Händler und Läden:** Ladenlisten und Pools stehen in `NPCS.pool`, `SMITH_POOL`, `STALL_POOL`, `MARKET_POOL`, `TAVERN_POOL` (`shopStock`, `buy`, `sell`, `tradeAt`, `openShop`). Aurelheims Markthalle hat Fachhändler, u. a. Juwelier (Talismane), Rüstmeisterin (Sets) und Magitech-Ingenieurin (Feuerwaffen).

### 2.17 Verbrechen und Gesetz

- **Kopfgeld** (`addBounty`, `bountyDay`; `S.bounty` je Fraktion):
  - Kopfgeld entsteht nur mit Zeugen.
  - Es sinkt täglich um max(5, 5 %) × `decay` der Schwierigkeit.
  - Ab 150 Gold (bei Ruhm ≥ 60 schon ab 100) kommen Kopfgeldjäger, höchstens alle 2 Tage und nur außerhalb von Städten. Es sind 2–3 Jäger auf Stufe 2 + 2 × (Stufe/3), gedeckelt bei Stufe 6 (`spawnHunters`).
- **Festnahme** (`arrestCheck`): Eine Wache stellt einen.
  - Zahlen, Mitkommen oder Widerstand (+100 Kopfgeld).
  - Bei der Kette geht es in Ketten statt in den Kerker.
  - Keine Festnahme in Kerker, Himmelsinsel, auf See, in Gewölben oder im Turm.
  - Wer schon in Ketten oder im Kerker sitzt, wird nicht erneut festgenommen.
- **Kerker** (`goToJail`, `ensureJail`, `jailChoices`, `jailTick`, `pickCell`, `lockResult`, `wardenCatch`, `jailExit`, `releaseJail`; `S.jail`, `S.jailTown`):
  - Die Dauer hängt vom Kopfgeld ab (`jailMinutes`). Die Kaution beträgt 1,5 × Kopfgeld, mindestens 100.
  - Die Waffe liegt beim Wärter; im Stiefel stecken drei Dietriche.
  - Wege hinaus:
    - Kaution zahlen.
    - Bestechen für 50 Gold: 45 % Chance, dass die Tür offen bleibt, sonst +1 Stunde.
    - Schloss knacken als Minispiel.
    - Die Zeit absitzen.
    - Gemeinsamer Ausbruch mit einem Mitgefangenen.
  - Erwischt ein Wärter den Ausbruch: zurück (+2 Stunden), bestechen (halbe Kaution) oder kämpfen.
  - Mitgefangene erzählen, warum sie sitzen (`INMATE_WHY`). Daraus entstehen die Quests `q_rask` (Rasks Versteck) und `q_gilde` (Diebesgilde, Dietrich).
- **Schuldknechtschaft** (`enslave`, `bondMenu`, `bondTick`, `freeBond`, `spawnBondGuard`, `bondGuardStep`, `stealKey`, `seenBond`; `S.bond`):
  - Wo: in Aurelion in der Fabrik von Tickmar, bei der Kette im Steinbruch.
  - Folgen: Fußkette, halbes Tempo, keine Waffe, ein Wächter folgt.
  - Wege hinaus:
    - Arbeiten: 1 Stunde, Schuld −15, +4 Erfahrung.
    - Freikaufen (nur in Aurelion).
    - Nachts die Fesseln lockern (45 %) und fliehen.
    - Den Schlüssel stehlen.
    - Den Wächter besiegen.
    - Der Rat schafft die Schuldknechtschaft ab.
  - Die Schuld ersetzt das Kopfgeld.
- **Aurelion-Schein** (`aurelWatch`, `robotStop`, `robotAlarm`, `expel`, `hasPermit`; `S.permit`):
  - Automaten prüfen Fremde. Wer keinen Schein hat, wird vor das Tor geführt.
  - Aufenthaltsschein am Passamt: 3 Tage 150 Gold, 7 Tage 300 Gold, nach dem Fall der Eisenfeste teurer (`bastion()`).
  - Bürgerrecht: Ansehen 40, 1000 Gold und ein Adelshaus als Fürsprecher (`S.flags.aurelCitizen`).
- **Fahndung Aurelion** (`startHunt`, `huntTick`; `S.hunt` Stufe 1–5): Wer einen Automaten zerstört, wird gesucht (Aurelion −20). Auftragsmörder kommen.
- **Magisches Gericht** (`courtTrial`) auf der Himmelsinsel:
  - Schuldig bekennen: Schulddienst 250 × Stufe.
  - Wergeld 300 × Stufe zahlen.
  - Das Orakel urteilen lassen: 40 % frei (Aurelion +5), sonst 400 × Stufe Schulddienst.
  - Kämpfen: Aurelion −30, die Sonnenlegion greift an.
  - Tötet man einen Herrscher, hat das Folgen (`rulerSlain`).
- **Blutbann und Kirchenbann** siehe §2.3 (`S.flags.bann`, `S.flags.anathema`).
- **Heiliges Gericht und Anhörungen** (`holyCourt`, `courtHearing`, `HEARINGS` 5 Fälle) in Aurelion.
- **Verfolgung über Kartengrenzen** (`leavePursuit`, `arrivingPursuers`, `arrivePursuit`, `dropPursuit`): Verfolger folgen durch Eingänge.

### 2.18 Aurelion

- **Hohes Haus und Häuser** (`AUREL_HOUSES` 4, `houseSeat`, `ensureNobles`, `favor`; `S.houses`):

  | Haus | Stadt | Oberhaupt |
  |---|---|---|
  | Aurivel | Aurelheim | Fürstin Maelis |
  | Kessmark | Gelenkhall | Graf Ottwin |
  | Solandre | Sankt Serin | Gräfin Ysolde |
  | Vantor | Tickmar | Fabrikherr Brannoc |

- **Hoher Rat** (`COUNCIL` 8 Stimmen, die Kaiserin zählt doppelt; `TOPICS`; `councilSession`, `councilPropose`, `councilDecide`, `councilVote`, `councilClose`, `applyLaw`, `corvanTalk`; `S.council`, `S.laws`):
  - Alle 7 Tage eine Sitzung auf der Himmelsinsel, mit Kamerafahrt.
  - Man überzeugt mit Gewinn, Pflicht oder Vernunft (`STYLE`); jedes Mitglied hat einen Stil.
  - Themen:
    - Flüchtlinge: aufnehmen, Lager oder abweisen (`refugeeLaw`, `refugeeWave`).
    - Schuldknechtschaft: abschaffen, begrenzen oder ausweiten.
    - Vharnholm nach Garmadon: ausrotten, vertreiben oder dulden (`VHARN_OPTS`, `vharnholmFate`).
    - Omega-Glaube: verbieten oder verbünden.
    - Legion (nach Osten oder heim) und Zölle (senken ×0,92, heben ×1,08); diese beiden sind Dauerthemen.
- **Intrige** (`intrigueTick`, `q_intrige`) und das **Rote Tuch** der Diebesgilde (`q_gilde`).
- **Erbfolgestreit** (`evSuccession`, `successionTalk`): Wer für einen Erben spricht, bekommt Hausgunst +15; Ratsmitglieder mit passendem Stil +3.
- **Fabrik** (`factoryWork`, `robotWorkStep`, `ensureMachines`, `WORK_FX`): An Maschinen kann man arbeiten. Der Stillstand einer Fabrik (`S.halt`) wirkt auf die Magitech-Produktion.
- **Magitech:** Messingpistole, Donnerbüchse, Messingross, Prothesen, Automaten als Wachen (`GUARD_KIT.aurel`, `AUREL_GUARDS` 8), Luftschiffe als Himmelsdekor.
- **Werkbank in Gelenkhall** (`mechMenu`, `mechSwapOptions`): Prothesen tauschen und reparieren.
- **Parade** (`aurelParade`) und Zuzug in die Metropole (`aurelMetroMigrate`), Flüchtlinge vor den Toren (`ensureRefugees`).
- **Akademie** mit Corvinus und Prüfungen (siehe §2.6).
- **Teleportkreis** zur Himmelsfeste mit Kamerafahrt, gegen Gold (`skyJourney`).

### 2.19 Siedlung und Lager

- **Gründung** (`foundCamp`): kostet 5 Holz. Name „Haus + heim“, Moral 60. Das Lagerfeuer wird gleich gebaut; `S.settlement` entsteht.
- **Bauten** (`BUILDINGS` 12, Platzieren mit B → `startPlacing`, `tryPlace`, `placeBuilding`, `updateBuildings`, `canAfford`, `payCost`):

  | Bau | Kosten | Wirkung |
  |---|---|---|
  | Lagerfeuer | 5 Holz | Rasten (`BUILD_USE`) |
  | Zelt | 8 Holz | 2 Plätze |
  | Hütte | 20 Holz, 8 Stein | 4 Plätze |
  | Lager | 14 Holz | öffnet das Gepäck |
  | Werkbank | 12 Holz, 4 Stein | Ausbessern bis 80 % |
  | Schmiede | 20 Holz, 15 Stein, 10 Eisen | Ausbessern bis 100 % |
  | Ackerfläche | 10 Holz | 12 Nahrung am Tag, +0,5 je Stunde |
  | Weide mit Stall | 16 Holz, 4 Stein | 6 Tiere, Hofvorrat |
  | Brunnen | 18 Stein | Moral |
  | Palisade | 6 Holz | Wehrzaun, blockiert |
  | Tor | 12 Holz, 4 Eisen | Durchlass in der Palisade |
  | Wachturm | 24 Holz, 12 Stein | warnt vor Angriffen |

- **Siedler** (`settlersHour`, `settlerJob`, `settlersDay`, `population`):
  - Je Unterkunftsplatz zieht ein Siedler zu Fuß ein und arbeitet nach Prioritäten: Verwundete versorgen, Nahrung sammeln, Verteidigung ausbessern, Holz schlagen, Handwerk, Ruhe.
  - Ertrag am Tag: Holz +2, Nahrung +1 bzw. +2 mit Acker, Stein +1. Jeder Siedler isst 0,5.
  - Bauten verfallen langsam.
- **Überfälle** (`raidSettlement`): Um 2 Uhr mit 40 % Chance; ein Wachturm warnt vorher. Es kommen 2 bis 4 + Tag/20 Angreifer (60 % Banditen, sonst Skelette) von außerhalb.
- **Anzeige:** Fenster „Lager & Siedlung“ (`settleUI`, `settleTier`).

### 2.20 Handwerk, Schmieden, Reparatur

- **Schmied** (`repairAll`): Preis = Summe (1 − Zustand) × Warenwert × 0,5, mindestens 5 Gold. Beziehung +3.
- **Selbst ausbessern** an Esse, Amboss oder Werkbank ohne Schmied (`mendAt`): bis 80 %, Eisenerz je 2 Stücke, 30 Minuten, Schmieden +0,5.
- **Eigene Siedlungsschmiede:** bis 100 % mit Eisen.
- **Handwerk:** Verbände aus Tuch; Trank brauen (Alchemist, 3 Heilkraut → Heiltrank).
- **Herstellen** (`RECIPES`, `craftItem`, `craftMenu`): an Esse (Schmieden), Werkbank (Handwerk) und Kessel (Medizin); Rezepte mit Mindestwert, Qualität nach Fertigkeit, die Fertigkeit steigt beim Herstellen.

### 2.21 Reisen

- **Kutschen** (`ensureCoaches`, `coachTalk`, `journey`, `tripOf`):
  - Fahrten gegen Gold mit Reisezeit (`passTime`).
  - Mit der Chance `risk` gibt es einen Überfall auf halber Strecke: 3–4 Gegner, der Kutscher flieht.
  - Nicht möglich, wenn Feinde nahe sind.
- **Fähre** (`FERRY`): Salzhafen ↔ Kupferhafen.
- **Überfahrt zu den Gischtinseln** (`seaVoyage`, `seaTick`, `SEA_PORTS`, `SEA_FARE` 60 Gold):
  - An Deck: 35 % Enterkampf gegen 3–4 Freibeuter, 30 % Sturm (Brecher werfen einen um, 3–7 Schaden), sonst ruhige See. Die Fahrt dauert 24 s.
  - Wer an Deck fällt, wacht im Abfahrtshafen auf.
- **Reittiere:** siehe §2.11.
- **Teleportkreis** nach Aurelheim-Himmelsfeste (§2.18).
- **Keine freie Schnellreise** (so gewollt, laut Doku).
- **Minikarte und Weltkarte** (N, M): Lehrer sind gelb umrandet, Gefahrenhinweise (`DANGER`, `dangerNote`), Wetter und Uhrzeit oben.

### 2.22 Omega, Garmadon und das Ende der Welt

- **Rotfall-Bruchstücke** (`ROTFALL` 12, `omegaFrag`, `rotfallCheck`; `S.omega.frags`):
  - Man findet sie über Garmadon, die Priesterin, Vargs Geständnis, Hrodvar, die Nekropole, das Orakel, die Bibliothek, die Kette, die Goblins, Rasks Seekarte, das Ordensverbot und den Krieg.
  - `OMEGA_NEED` 9 Bruchstücke und `OMEGA_HOURS` 50 Stunden öffnen das Ritual (`q_rotfall`, `q_omega`).
- **Ritual** (`vargRitual`, `omegaRitual`, `omegaPerform`):
  - Kosten: Garmadons Krone, Vargs Kette, Himmelssplitter, 10 Seelenphiolen und ein Gefährte als Opfer.
  - Der Held bekommt eine Narbe: Leben ×0,8.
  - Erfolgschance 40 % + Glaube/250 + Kettenrang × 6 %, begrenzt auf 30–90 %.
  - Erfolg: „erwacht“, ein Riss öffnet sich. Misserfolg: „Zorn“, Weltkatastrophe mit Blutregen, und die Toten stehen überall auf (`S.omega.cat`).
- **Drei Enden** (`omegaEnd`):
  - Omega erschlagen: „Gottestöter“, die Lebenden +20, Kette −40.
  - Avatar Omegas werden: ×1,3 Schaden, die Lebenden −50, Kette +100, höchster Kettenrang.
  - Schlaf: nur mit Glaube ≥ 30; „Hüter des Schlafs“.
- **Omega-Glaube** (`omegaStance`, `faithLine`, `priestTalk`, `omegaPray`, `ensureOmegaShrine`, `ensurePaladins` mit Eisenpaladin, Sternenpaladin und Inquisitor, `starHeal`, `inquisitorCheck`; `S.omega.faith`):
  - Beten am Altar gibt Glaube und den Zustand „Omegas Zorn“.
  - Der Glaube ist fanatisch und nur im Westen verbreitet.
- **Vargs Tagebuch** (`ensureDiary`).
- **Ende der Brüder** (`twinFallCheck`, `twinFallCinematic`): Sind Varg und Garmadon beide tot, folgen eine eigene Kamerafahrt und eine Chronik.

### 2.23 Kodex, Handbuch, Chronik, Karte, UI-Fenster

- **HUD** (`index.html`, `ui.js` `refreshHUD`):
  - Oben: Uhr, Wetter, Gold, Menüleiste (`nav`).
  - Links: Porträt, Klasse, Rang, Balken, Zustände, Körper, Gruppe, Rohstoffe.
  - Mitte: Spielfeld.
  - Rechts: Kontextfeld zum ausgewählten Ziel (`renderContext`).
  - Unten: Log mit Filtern und Schnellleiste mit 10 Plätzen.
  - Dazu Toasts, Aktionshinweis (`setPrompt`), Sprechblasen und Boss-Balken.
- **Fenster** (`openModal`): Inventar, Charakter, Gruppe, Lager & Siedlung, Fraktionen (mit Bannern), Chronik, Weltkarte (mit Kriegskarte), Handel, Einstellungen, Ausbildung, Aufträge, Talente, Aktive Effekte, Kodex, Zauberbuch, Stall.
- **Kodex** (H, `codexUI`):
  - Reiter: Handbuch (lädt `docs/GUIDE.md`, Abschnitte sind gesperrt, bis man sie kennt: `guideLock`), Lehrer, Magie, Ränge, Zustände, Gegner (nur erschlagene).
  - Suchfeld. Der Code **NACHTGLAS** schaltet alles frei (`codexCode`, `S.flags.codexAll`).
- **Chronik** (K, `chronicle`, `chronUI`): große Taten mit Jahr und Ort. NPCs kennen, was in der Chronik steht.
- **Inventar** (`invUI`, `itemInfoHTML`, `showDetail`): Vergleich mit angelegten Teilen, Zweck des Gegenstands (`itemPurpose`), Zustand.
- **Charakter** (`charUI`): Attribute mit Knöpfen für Statpunkte samt Tooltips, Körperdiagramm, Titel (`titleBlock`), Klassenkette.
- **Todesbildschirm und Erbenwahl** (`showDeath`, `showSuccessors`).
- **Titelbildschirm** mit animierter Szene (`titleLoop`, `#titlescreen`) und Zusammenfassung des Hauses (`#legacy-summary`).

### 2.24 Kamerafahrten (`cinematic`, `cineMove`, `cineNext`, `cineTick`, `cineEnd`, `cineBars`, `cineLater`)

- Während einer Fahrt gibt es Letterbox-Balken und keine Steuerung. Esc oder Leertaste überspringt. Während einer Fahrt wird nicht gespeichert.
- Laut Koordinator hat Version 19 eine Blende ergänzt.

| Fahrt | Auslöser | Einstellungen |
|---|---|---|
| Teleport zur Himmelsfeste | Teleportkreis in Aurelheim | „Der Teleportkreis glüht auf …“, „Unter dir schrumpft Aurelheim …“ |
| Die Eiserne Legion | Kampf gegen Garmadon, wenn Varg sie zugesagt hat (`legionArrives`) | „Hörner in der Tiefe … die Eiserne Legion stürmt in den Thronsaal.“ |
| Fall Vargs (`vargCinematic`) | Vargs Tod (`liberate`) | „Varg fällt. Mit ihm reißt die Kette.“, „Im Steinbruch brechen die Ketten …“, „Im Schmiedeviertel werfen sich die Goblins gegen die letzten Paladine.“ |
| Fall der Untoten (`undeadFallCinematic`) | Garmadons Tod | „Garmadon fällt …“, „[Ort] ist frei …“, „Am Knochentor jagen Soldaten die letzten Toten.“, „Vharnholm wartet …“, „Das Land atmet …“ |
| Ende der Brüder (`twinFallCinematic`) | beide Brüder tot | „Die Kernburg … steht leer …“, „Im Osten schweigt der Thron …“, „Zwei Brüder, ein Blut — beide tot …“ |
| Sitzung des Hohen Rates (`councilSession`) | alle 7 Tage auf der Himmelsinsel | Eröffnung, Thema, Reden der Mitglieder, Abstimmung mit Ja oder Nein je Mitglied |

- Das Debug-Menü hat Knöpfe für „Fall Vargs“ und „Fall der Untoten“.

### 2.25 Speichern, Export, Cloud

- **`state.js`:**
  - `save()` schreibt JSON nach `localStorage` (`rotfall.legacy.save`).
  - `load()` migriert alte Stände: Versionen unter 4 werden gesichert (`.v<N>.backup`) und nicht geladen. `rescaleSave` rechnet alte Weltmaßstäbe um.
  - `hasSave`, `wipeSave`.
- **Automatisches Speichern:** bei jedem Tagesbeginn und bei `beforeunload`.
- **Ladeprobe** `loadProbe` (Debug „Laden prüfen“).
- **Verschlüsselter Export und Import** (`cloudsave.js`):
  - Format `RFS1` | Salz 16 Byte | IV 12 Byte | AES-GCM-256(gzip(JSON)).
  - Schlüssel: PBKDF2-SHA-256 mit 600 000 Runden, Passwort mindestens 8 Zeichen.
  - Falsches Passwort oder eine veränderte Datei werden erkannt.
  - Der Import bewahrt den alten Stand als `…vor-import`. Das geht nur über https oder localhost.
  - Dateiname: `rotfall-<Haus>-tag<N>-<Datum>.rfsave`.
- **Sicherungen:** Tests setzen `S._quiet` und laufen in einer Sandbox. Laut Koordinator verhindert seit Version 19 eine Sperre im Titelmenü unbeabsichtigtes Speichern.

### 2.26 Schwierigkeitsgrade (`DIFF`, `applyDifficulty`, `diffOf`; `S.difficulty`)

| Grad | Leben | Schaden | Ansage | Beute | Kopfgeldverfall | Glieder ab | Zerstörte Dörfer |
|---|---|---|---|---|---|---|---|
| Angsthase | ×0,75 | ×0,7 | ×1,3 | ×1,25 | ×2 | nie | bauen sich wieder auf |
| Schwer (Standard) | ×1 | ×1 | ×1 | ×1 | ×1 | −200 | bleiben |
| Sehr schwer | ×1,25 | ×1,3 | ×0,9 | ×0,85 | ×0,6 | −100 | bleiben |

- Auf „Sehr schwer“ haben Bewohner-Aufträge weder Namen noch Wegpunkt.
- Laut PLAN_OFFEN B noch nicht umgesetzt: mehr Überfälle auf „Sehr schwer“; auf „Angsthase“ Aufwachen beim Heiler statt Tod.

### 2.27 Audio (`sfx.js`)

- Alle Klänge werden mit der WebAudio-API aus Rauschen und Tönen erzeugt; es gibt keine Audiodateien.
- Klänge: swing, hit (nach Material und Rüstung), crit, break, bone, metal, dodge, step, death, bow, magic, fire, heal, ui, whistle, growl, rattle, moan, shriek, shout.
- **Hintergrundklang** (`ambience`, `ambienceTick`): hängt von Region, Tageszeit und Stadt ab, mit Grundfrequenzen je Region.
- **Lautstärke:** Aus, Leise, Normal, Laut (`S.settings.volume`). Laut der Entfernung zum Spieler (`earVol`).
- **Beobachtung:** Es gibt keine Musik. Das Feld `MUSIC` in `game.js` betrifft Spielleute (Sprechblasen), keine Tonspur.

### 2.28 Grafikstile und Darstellung

- **Stil R** (`fig5.js`):
  - Rahmen 40 × 56, `RPX` 1,25, 4 Richtungen; der Osten wird gespiegelt.
  - Die Silhouette folgt der Rüstung: Rüstungswucht 0–4, Hüftplatten, Goldkanten, Kniebuckel, Gürteltaschen, Kettenhemd-Muster.
  - Abnutzung (`wear`) mit Blut und Flicken.
  - Klassen-Silhouetten: Totenkragen, Hörnerkrone, Geweih, kahler Mönch, Kessel, Dornenkrone, Seelenflammen.
  - Arme mit IK und Schwungkurven je Waffe; der Bogen wird sichtbar gespannt.
- **Stil D** (`sprites.js`, `POSES`) und **Stil F** (`figure.js`, Referenzblatt) sind wählbar.
- **Renderer** (`render.js`):
  - Boden in gebackenen Chunks (`chunkCanvas`, `bakeGround`, `prefetchChunk`), Fels, Mauern und Wasser mit Wellen.
  - Häuser mit Innenansicht, wenn der Spieler drinnen ist (`playerInside`).
  - Karawanen mit Zugtieren, Pferde und Reiter, Wolfsgestalt, Zauberwände, der Magierturm.
  - Blut-Decals je nach Gewaltstufe (`S.settings.violence`: Kaum Blut, Reduziert, Voll).
  - Schadenszahlen (`float`), Partikel (`fx`), Hit-Stop, Kamerawackeln, Krit-Zoom (nur bei eingeschalteter Bewegung, `S.settings.motion`), Zoom.
  - Tag, Nacht und Wetter.
- **Einstellungen:** Textgröße (Klein, Normal, Groß), reduzierte Bewegung, Gewalt, Stil, Ton.
- **Touch:** virtueller Stick und Knöpfe (`#touchui`); Zielen auf den nächsten Feind (`touchAim`).

### 2.29 Debug-Menü (Strg + Umschalt + D, `debugSections`)

| Bereich | Knöpfe |
|---|---|
| Bewegung | Tempo ×1/2/4/8, Noclip, Teleport zu Stadt, Ort, NPC, Karte, Koordinaten, Auftragsziel, Himmelsinsel, Eisenfeste |
| Spieler | Gottmodus, Heilen, Ausdauer, Mana, XP, Stufe, Ruf, Rang, Beitritt, Status setzen oder entfernen, Gold +500, Material +100 |
| Gegenstände | Waffe, Rüstung, Material, Selten/Legendär |
| Welt | Uhrzeit, Tag, Nacht, +6 Stunden, Tag vorspulen, Wetter, Gegner, Tier oder NPC spawnen, NPC entfernen, zur Karawane, ganze Welt zeigen |
| Aufträge | Starten, Abschließen, Abbrechen, Zurücksetzen, Bretter erneuern |
| Ereignisse | Rotfall-Bruchstücke, Omega-Zorn, Untotenangriff, Banditenüberfall, Karawanenüberfall, Spuk, Magitech-Unfall, Erbfolgestreit, Meteorsplitter, flüchtiger Sklave, Anomalie, Magiekern, Brand, Stadtverteidigung, Goblinbefreiung, Varg-Tod, Garmadon-Tod, Sklaverei (Aurelion und Kette), Gefängnis, Fahndung, Gericht, Feldzug, Kriegsrunde |
| Magie | Zauber lernen, alle lernen, Rang +1, Mana, Abklingzeiten, Zauberer-Gegner (Kultist, Nekromant), alle vergessen |
| Turm | Zum Turm, in die Ebene, Vertrauen ±25 |
| Grafik | Stil D/R/F, Rüstungsset anlegen, ablegen |
| Kampf & Körper | Glied ausfallen oder abtrennen, Glieder zurück, Gegner töten oder taumeln lassen |
| Kerker | Ins Gefängnis, Dietriche = 3, Schloss knacken, Freilassen |
| Kamerafahrten | Fall Vargs, Fall der Untoten, Beenden |
| Test | Laden prüfen, Selbsttest, Spieler töten |

---

## 3. Lücken und Auffälligkeiten

Alles hier sind **Beobachtungen** beim Lesen. Sie sagen nichts darüber, was beabsichtigt ist.

**Inhalt und Systeme**
1. **Beobachtung — P15 im Debug nicht erreichbar:**
   - Die acht großen Ereignisse (Seuche bis Streik) haben seit Version 20 Knöpfe im Debug-Bereich „Ereignisse“ („Großes Ereignis: …“ und „Großes Ereignis beenden“).
   - `PLAN_S15.md` führt P15 inzwischen als „FERTIG (Version 19)“; Debug-Knöpfe für die acht Ereignisse gibt es seit Version 20.
   - `MECHANIKEN.md` und `GUIDE_EREIGNISSE.md` erwähnen die acht Ereignisse nicht (Stand der Durchsicht).
2. **Beobachtung — Zauberlehrer ohne Figur:**
   - `sp_regen` nennt als Lehrer „Druidin“, `sp_shock` die „Magitech-Ingenieurin“. Keine NPC-Definition hat für diese Figuren `spellsTaught`.
   - `sp_staunch` nennt „Elena in Eren“, Elena lehrt laut `NPCS` aber nur `sp_minorheal`.
   - PLAN_S15 P5 nennt Druidin, Moorhexe und Omega-Priester als offen.
3. **Beobachtung — Seevolk-Ränge 2 und 4:** `rankGuide` sagt dazu „Dieser Rang ist noch nicht erreichbar“ (auch in PLAN_S15 P8 und P21 erwähnt).
4. **Beobachtung — `SCALING` ist leer:** Kein Gegner wächst mit, auch nicht der Kopfgeldjäger, für den es laut Kommentar gedacht war. Die Jäger skalieren stattdessen über `spawnHunters`.
5. **Beobachtung (veraltet, Stand S15):** Inzwischen gibt es Herstellen an Esse, Werkbank und Kessel (`RECIPES`, `craftItem`, `craftMenu`; Qualität nach Fertigkeit). Früherer Befund: Außer Verbänden und Tränken (Alchemist) ließ sich nichts herstellen. Schmieden repariert nur. Die Siedlungsschmiede „Waffen aus Eisen“ (Beschreibung in `BUILDINGS`) stellt im Code nur Reparatur bereit (`BUILD_USE.smithy` „Schmieden“, geprüft wurde nur das Menü).
6. **Beobachtung — Keine Musik:** Es gibt nur synthetisierte Geräusche und Atmosphäre. PHASE_STATUS nennt Phase 18 (Klang) „nicht begonnen“.
7. **Beobachtung — Boss-Intros fehlen:** Es gibt keine Kamerafahrten beim ersten Sichtkontakt mit Varg, Hrodvar, Garmadon, Gorak oder Dodon, keine zum Kerkerausbruch und keine zur Ankunft in Aurelheim (PLAN_OFFEN S14 Warteschlange, noch nicht abgehakt).
8. **Beobachtung — Schwarze Feste nicht befreibar:** Das Untotenheer steht dauerhaft dort (BUG-100). Die Umgebung ist leer und dunkel, ein Goblin steht falsch im Totenland (BUG-143).
9. **Beobachtung — Schwierigkeit halb umgesetzt:** „Sehr schwer = mehr Überfälle“ und „Angsthase wacht beim Heiler auf“ fehlen im Code (PLAN_OFFEN B).
10. **Beobachtung — Banden ohne eigenes System:** Wüstenräuber, Kettenreste und Grenzplünderer als Banden mit Lager, Gebiet, Wegzoll und Schutzgeld fehlen (PLAN_OFFEN C). Rooks Bande hat nur Rang und Rangquests.
11. **Beobachtung — Valen ohne Hof:** Valen hat keinen König und keine Hauptburg; PLAN_S15 P16 will König Varon. Nordfurt ist die größte Valen-Stadt.
12. **Beobachtung — Zwerge fehlen:** Zwerge, Nordreich und Sandfürsten gibt es nicht als Völker (PLAN_OFFEN D, Phase B). Tiefhall ist nur eine Ruine.
13. **Beobachtung — Siedlung ohne Städtebau:** Die eigene Siedlung ist ein kleines Lager mit 12 Bauten, ohne Zuzug nach Attraktivität, Zonen, Stufen oder Reaktionen der Fraktionen (P14).
14. **Beobachtung — Fall Aurelions fehlt:** Tötet man den ganzen Hohen Rat, gibt es nur Einzelfolgen je Herrscher (`rulerSlain`), kein Weltereignis (P18).
15. **Beobachtung — Magitech-Waffen P10 fehlen:** Magiegewehr, Kristallkanone, Runenarmbrust, Energie-Hellebarde und die neuen Figuren (Aurelion-Magier, Scharfschütze) gibt es im Code nicht. Ereignisse wie Adelsball und Luftschiffabsturz sind über P15 inzwischen da.
16. **Beobachtung — Gruppe mit schwachen Befehlen:** Gefährten haben Moral, aber keine eigene Ausrüstungsverwaltung mit Klassenprüfung (Audit B-07); ein Tier zählt nicht als viertes Mitglied (P22).
17. **Beobachtung — Akademie ohne Innenleben:** Studenten ohne Tagesablauf in der Akademie, Bücher aus Nekropole und Akademie für Ilvar zurückbringen, Anklagepunkt „verbotene Magie“ im Magischen Gericht: alle in PLAN_S15 als „nicht gebaut“ vermerkt und im Code nicht gefunden.
18. **Beobachtung — Flüchtlinge ohne Heimat:** Drei Flüchtlinge haben keinen Heimatort (Audit A-05). 70 Figuren (Automaten, Kettenwachen) bieten nur „Gehen“ (U-02).

**Code-Auffälligkeiten**
19. **Beobachtung — Doppelte Einträge in `EVENTS`:** `evTaxman` und `evFailedHarvest` stehen je zweimal in der Liste und kommen deshalb doppelt so oft. Ob das gewollt ist, sagt kein Kommentar.
20. **Beobachtung — Wetter-Pools ohne Menschenland:** `REGIONAL_WEATHER` und `WEATHER_POOL` haben keinen Eintrag für die mittleren Menschenländer; dort gilt vermutlich ein Standard (nicht geprüft).
21. **Beobachtung — Veraltete Kommentare:**
    - Der Kommentar oben in `fig5.js` sagt noch „Stil D bleibt Standard“; `state.js` und `game.js` setzen R.
    - Der Kommentar bei `MONSTERS.hrodvar` sagt „eigene Angriffsmuster erst mit Phase 12“, obwohl `frostKingAI` existiert.
22. **Beobachtung — `VILLAGERS`:** Das Feld ist als leeres Array deklariert und wird zur Laufzeit gefüllt; es ist nicht gespeichert.
23. **Beobachtung — Rangregel für Aurelion:** Für Rang 3–6 stehen nur Ansehen-Schwellen im Rangführer, keine Prüfungen (P10 „Zwischenrang mit Prüfung“ offen).
24. **Beobachtung — Leistung und Spielstand:** BUG-108, BUG-142 und BUG-093 sind offen. Der Spielstand ist rund 1,9–2,2 MB groß, davon 1,5 MB Figuren (P-02).

**In Version 19 behoben (laut Koordinator, nicht einzeln nachgeprüft):**
- Minikarte über `drawAtlas` als Standard.
- Speichersperre im Titelmenü.
- `S.omega.frags` wird sauber angelegt.
- `endFire` gibt Wohlstand.
- `p.attributes` in Begegnungen.
- Blende bei Kamerafahrten.

---

## 4. Offene Pakete (aus `docs/PLAN_S15.md`, Statustabelle)

- **Fertig:**
  - K (Titelgrade; Urteil des Nutzers offen), K2 (Silhouetten), S (verschlüsselter Export, Stufe 1), K3 (Klassen-Rüstung), W (Wissen im Gespräch), G (Morrgrund und Dodon; Fragen offen).
  - P0–P4, P6–P9, P11–P13, P17, P19, P20.
  - **P15 ist im Code umgesetzt** (Version 19), steht in der Tabelle aber noch auf „OFFEN“.
- **P5 — teilweise:** Lehrer und Prüfungen sind fertig. Offen:
  - Akademie-Innenraum mit Studenten-Tagesablauf,
  - Druidin, Moorhexe und Omega-Priester als Lehrer,
  - Kodex „Fraktionen“.
- **P10 — offen:** Aurelion sichtbar überlegen:
  - Luftschiffe mit Schatten, Kristall-Laternen, Aquädukt, Uhr, Automaten-Streifen,
  - Fabrik-Förderband,
  - Magitech-Waffen,
  - Aurelion-Zwischenränge mit Prüfungen,
  - Luftschiffabsturz, Erfinderkongress, Adelsball, Sabotage (Absturz und Ball gibt es inzwischen über P15).
- **P14 — offen:** Eigener Siedlungsbau als Städtebau-Simulation. Nur notiert, Fragen an den Nutzer.
- **P16 — offen (später):** Schloss König Varons im Norden.
- **P18 — offen (Fragen):** Der Fall Aurelions nach dem Tod des ganzen Hohen Rates.
- **P21 — offen (später, Fragen):** Wasservolk bzw. Seevolk ausbauen, dazu Aurelion ausführlicher (mit P10).
- **P22 — offen (später):** Gruppe prüfen: Rekrutieren, Befehle, Moral, Ausrüstung der Gefährten, Tier als viertes Mitglied.
- **G — offene Fragen:** Grisk und Morrgrund zusammenlegen? Gorak als Gegenspieler? Kann Dodon sterben? Belohnung nach dem Sieg? Versöhnung nach einem Angriff?
- **Ältere Pläne, noch offen** (`PLAN_OFFEN.md`, `PHASE_STATUS.md`):
  - Schwierigkeit Rest (B), Banden (C), Weiler und Zwerge (D), Figuren-Animationen (F).
  - Doppelte Bodenauflösung (G), Brainstorm „Ende der Brüder“, Boss-Intros.
  - Phasen 18 (Klang), 20 (Leistung), 21 (zweiter Durchlauf), 22 (Abschluss-Qualität).
