# System Hunter — Hunt 1 (02.10.2026)

Code-Stand 1983784, kein Spielcode geändert. Alle Aussagen stammen aus Code, der in diesem Lauf geöffnet wurde. **Browser war nicht verfügbar** (`tabs_create`: „Browser pane gone, gate off, or tab cap reached“). Alles ist also nur durch Lesen belegt und nicht live reproduziert. Spielstand nicht berührt.

Gelesen: game.js 8324–8885 (Varonsburg, Exil, Varons Tod, Stadt ohne Schutz, Burgfrieden, Schmuggel, varonChoices, royalStart), 1860–1931 (Start, capStart), 2775–2815, 3420–3555 (hurt/limbLost/downed/KO), 480–580 (Prothese/Auge/Öl/Heilmittel/Heiler-Kanal), 5173–5191 (arrestCheck), 6186–6305, 6760–7010 (Aufträge, townContracts, Wachstum), 8225–8247 (mechMenu), 9905–9955 (Bionik-Zugang), 10870–10900, 11570–11620 (Banden, Verletzungen über Tage, Heiler), 12885–12990 (Preise, Laden, Kauf/Verkauf), 13695–13715, 14035–14045; body.js komplett; economy.js komplett; sim.js 36–60, 100–138, 330–449.

## Kandidaten

### SH-01 Wachmörder bekommt beim Befreien den vollen Dank (+10)
- **Ort:** game.js:8454–8456 (`schutzFreed`)
- **Was passiert:** Bei `who === 'player'` wird zuerst der Ersatz abgezogen (`Z.lost -= n`, `Z.byP = min(Z.byP, Z.lost)`). Erst danach wird `clean = Z.byP / max(1, Z.lost+1) < 0.5` berechnet. Deckt der Ersatz alle Verluste, ist `byP` 0 und `clean` wahr: Valen +10, Text „dankt dir“.
- **Was passieren sollte:** MECHANIKEN.md:896: „dankt dir (+10), außer du hast selbst die Wache erschlagen.“
- **Auslöser:** Dorf mit ≤ 3 Posten (Valen-Ersatz 3 Mann; Aurelion 2, Händler 1). Der Spieler erschlägt alle Wachen, die Bande übernimmt, der Spieler erschlägt den Anführer (`bandLead` → game.js:11572).
- **Beleg:** Reihenfolge der Zuweisungen in Zeile 8454 gegen 8455. Rechenbeispiel: lost 3, byP 3 → n=3 → lost 0, byP 0 → clean.
- **Sicherheit:** hoch (reine Rechenreihenfolge).
- **Repro:** `S.schutz.X={lost:3,byP:3,stage:4,taker:{by:'band',id:b.id}}` für ein Valen-Dorf mit 3 Posten, dann `schutzFreed('X','player')` → Valen +10, Logtext „dankt dir“.
- **Schwere-Vorschlag:** 3

### SH-02 Wohlstand fällt unter Bandenherrschaft gar nicht, schutzlos und gesetzlos viel weniger als dokumentiert
- **Ort:** game.js:6998 (`growthDay`)
- **Was passiert:** `prosper + 3 (Grundzuwachs) − {2:4, 3:8, 4:3}[stage]`. Netto ergibt das: schutzlos −1, gesetzlos −5, übernommen 0. Mit Ruf > 30 kommt noch +1 dazu, dann steigt der Wohlstand unter Bandenherrschaft sogar (+1).
- **Was passieren sollte:** MECHANIKEN.md:875 („Wohlstand sinkt um 8 je Tag (schutzlos: −4)“) und :895 („Wohlstand sinkt um 3 je Tag“).
- **Auslöser:** jede Stadt mit `S.schutz[k].stage` ≥ 2.
- **Beleg:** Formel Zeile 6998.
- **Sicherheit:** hoch.
- **Repro:** `growthOf(k).prosper=50; S.schutz[k]={stage:4,lost:3,taker:{by:'band'}}; RF.growthDay()` → bleibt 50 (bzw. 49,x wegen `built*0.25`).
- **Schwere-Vorschlag:** 3

### SH-03 Heiler lehnt ab, wenn nur Arme oder Beine verletzt sind
- **Ort:** game.js:11613–11617 (`woundedGroup`, `healCost`, `healerTreat`); body.js:43–47 (`syncHp`)
- **Was passiert:** `c.hp` und `c.maxHp` zählen nur Kopf und Rumpf; Glieder werden mit `continue` übersprungen. Steht der Rumpf voll, aber ein Bein liegt bei −150 (lahm), ist `woundedGroup()` leer. Der Heiler sagt dann „Dir fehlt nichts. Komm wieder, wenn es blutet.“ Umgekehrt heilt `fullHeal` die Glieder kostenlos mit, sobald der Rumpf verletzt ist (der Preis zählt nur Rumpf und Kopf).
- **Was passieren sollte:** Ein Heiler versorgt Wunden; ein lahmes Glied ist eine Wunde (MECHANIKEN.md:24; Körperbogen zeigt „aus“).
- **Auslöser:** Glied ausgefallen, Rumpf und Kopf voll (z. B. nach Verband auf den Rumpf oder nach Schlaf).
- **Beleg:** body.js:45 `continue` für LIMBS; game.js:11613 Filter `c.hp < c.maxHp`.
- **Sicherheit:** hoch.
- **Repro:** `p.body.lleg.hp=-50; RF.B.syncHp(p);` → `p.hp===p.maxHp`; dann eine Heilerin ansprechen → „Dir fehlt nichts“.
- **Schwere-Vorschlag:** 3

### SH-04 Kauf von Ausrüstung leert das Stadtlager nur bis Tagesende
- **Ort:** game.js:12950 (`buy`) gegen economy.js:272 (`ecoDay`, Verbrauch minus `t.bought`)
- **Was passiert:** Ein Kauf zieht 0,5 der Basisware ab und bucht dieselbe Menge auf `t.bought`. `t.bought` ist aber der Topf der NPC-Markteinkäufe (game.js:1265–1278: „vom Tagesverbrauch abgezogen, damit nichts doppelt zählt“). Am Tagesende verbraucht die Stadt deshalb genau so viel weniger. Netto: Kauft der Spieler bis zur Höhe des Tagesverbrauchs, ändert sich das Lager über den Tag hinaus nicht. Ein Verkauf (12963) fügt dagegen dauerhaft +0,5 hinzu, ohne Ausgleich.
- **Was passieren sollte:** T09 „ein Kauf zieht Ware aus dem Lager“ (Kommentar 12950); RB-029 wollte Kauf und Verkauf als Gegenstücke.
- **Auslöser:** In einer Stadt mit Waffenverbrauch ≥ 0,5 eine Waffe oder Rüstung kaufen und einen Tag warten.
- **Beleg:** 12950 `T.bought[b] += 0.5`; economy.js:272 `stock -= max(0, use − bought)`.
- **Sicherheit:** hoch.
- **Repro:** `a0 = S.towns.northcity.stock.arms`, 2 Schwerter bei einem Nordfurter Händler kaufen, `ecoDay()`; mit einem zweiten Lauf ohne Kauf vergleichen. Der Endstand ist gleich.
- **Schwere-Vorschlag:** 3. Neue Information zu RB-029 (die Kaufseite).

### SH-05 Entzündung weckt Bewusstlose auf statt sie zu schwächen
- **Ort:** game.js:11600 (`woundDay`), dazu 2804–2809
- **Was passiert:** `torso.hp = Math.max(1, torso.hp − 4·d)`. Liegt der Held am Boden (Rumpf ≤ 0, z. B. −40 %), setzt der Tageswechsel den Rumpf auf +1. Damit gilt `T.hp > −T.max*0.5`. Läuft danach `downTimer` ab, „kommt er zu sich“ (2808) statt zu sterben. Das ist eine Heilung durch Schaden.
- **Was passieren sollte:** Entzündung = Rumpf −4 × Tage (MECHANIKEN.md:483); Downed-Regel: am Boden keine Selbstheilung.
- **Auslöser:** Held oder Gefährte mit Status `infektion` ist am Boden, während `dayTick` → `woundDay` läuft.
- **Beleg:** Zeile 11600.
- **Sicherheit:** mittel (der Code ist eindeutig, das Zeitfenster ist klein).
- **Repro:** Infektion setzen, `p.body.torso.hp = -p.body.torso.max*0.7; p.downed=true;` dann `woundDay()` → Rumpf = 1.
- **Schwere-Vorschlag:** 3

### SH-06 Paktritter (Zauber) heilt ausgefallene Glieder
- **Ort:** game.js:14041 (`pact_knight`)
- **Was passiert:** Kosten: `p.body[k].hp = Math.max(1, hp − 0.2·max)` für jedes nicht verlorene Teil. Ein lahmes Bein (hp −150) wird auf 1 gesetzt und funktioniert wieder. Ein bewusstloser Rumpf würde ebenfalls auf 1 gehoben, wenn er ≤ 0 ist.
- **Was passieren sollte:** Der Pakt kostet Leben (Kommentar „großer Diener gegen Leben“).
- **Auslöser:** Paktritter wirken, während ein Glied ≤ 0 ist.
- **Sicherheit:** hoch.
- **Repro:** `p.body.lleg.hp=-100`, Paktritter wirken → `lleg.hp===1`, Speed-Faktor wieder 1.
- **Schwere-Vorschlag:** 3 (ausnutzbar)

### SH-07 Bruch überlebt das Abtrennen: neue Prothese bei 40 % gedeckelt, Narbe am Messingarm
- **Ort:** body.js:87 (Abtrennen löscht `mech*`/`mod`, nicht `broken`/`splint`), body.js:125 (`attachProsthesis` ebenso), game.js:9922 (Tausch eines gesunden Glieds), game.js:11596 (`woundDay` zählt Brüche ohne Blick auf `lost`/`mech`), 11605 (Schienen-Angebot)
- **Was passiert:** In einem Kampf wird ein Arm erst lahm (60 % Bruch) und dann abgetrennt. `broken` bleibt stehen. Nach `attachProsthesis` deckelt `topOf` jede spätere Heilung der Prothese auf 40 %. Der „Bruch“ verheilt nach Tagen trotzdem am Stumpf bzw. an der Prothese und gibt eine Narbe (+1 Rüstung). Die Heilerin bietet an, den abgetrennten Arm zu schienen. Dasselbe gilt für den freiwilligen Tausch eines gebrochenen gesunden Glieds.
- **Was passieren sollte:** MECHANIKEN.md:235 „neue Prothese kommt immer frisch“; :481 Bruch nur „nicht abgetrennt, keine Prothese“.
- **Sicherheit:** hoch.
- **Repro:** `P=p.body.larm; P.broken=4; RF.B.damagePart(p,'larm',9999)` (wiederholen bis `lost`), `RF.B.attachProsthesis(p,'larm',2)` → `P.broken===4`, `topOf(P)===0.4*max`.
- **Schwere-Vorschlag:** 3

### SH-08 Verband, Trank und Heiler heilen Prothesen; Prothesen bluten und entzünden sich
- **Ort:** body.js:98–115 (`healPart`/`heal`/`fullHeal` ohne `mech`-Prüfung), game.js:549 (`worstPart` wählt auch Prothesen), 576 (Heiler `fullHeal`), 3510/3512 (`limbLost`: Blutung und `woundSet` auch an Prothesen)
- **Was passiert:** Ein lahm geschlagener Messingarm (hp ≤ 0) wird mit einem Verband „wieder zu gebrauchen“. Ein abgetrennter Prothesenarm blutet 30 s und entzündet sich zu 60 %.
- **Was passieren sollte:** MECHANIKEN.md:267 „Medizin heilt Fleisch, Werkzeug repariert Maschine. Verbände und Heiler tun für Prothesen und Auge nichts.“
- **Sicherheit:** mittel. Der Absatz kann nur den Zustand (`mechCond`) meinen und nicht die LP; dann wäre es ein Fit-Befund.
- **Repro:** Prothese anlegen, `p.body.larm.hp=-20`, Verband auf den Arm → hp > 0, Log „wieder zu gebrauchen“.
- **Schwere-Vorschlag:** 3

### SH-09 Abgetrennte Glieder fangen weiter Treffer und halbieren den Schaden
- **Ort:** body.js:56–68 (`pickPart`: `HIT_W` unverändert für `lost`), 76–89
- **Was passiert:** Ein fehlender Arm wird weiter mit Gewicht 12 (seitlich bis 24) getroffen. Vom Schaden gehen 0,6 ins nicht vorhandene Glied (danach auf `cut` zurückgesetzt) und nur ~0,5 in den Rumpf. Ein Amputierter nimmt im Schnitt weniger Rumpfschaden als ein Unversehrter, bei dem ein Rumpftreffer 1,0 kostet.
- **Was passieren sollte:** Ein fehlendes Glied kann nicht getroffen werden (Treffer gehen auf vorhandene Teile); „Verletzungen zählen“.
- **Sicherheit:** mittel (die Schadensrechnung ist eindeutig; ob der Puffer gewollt ist, steht nirgends).
- **Repro:** `seedRng`, 200× `hurt(p, 10, e)` mit und ohne `larm.lost`; Rumpfschaden vergleichen.
- **Schwere-Vorschlag:** 3

### SH-10 Burgtor schiebt Gesuchte in gesetzlosem Varonheim ohne jede Meldung zurück
- **Ort:** game.js:8715 (`keepHalt`), 5178 (`arrestCheck`: in gesetzloser Stadt keine Festnahme), 2392 (Takt 250 ms)
- **Was passiert:** Mit Valen-Kopfgeld macht `keepHalt` erst `keepOut()`, setzt Gerold neben den Spieler und ruft `arrestCheck`. Ist Varonheim gesetzlos (Stufe 3), gibt `arrestCheck` sofort `false` zurück: kein Dialog, keine Meldung. Der Spieler wird alle 250 ms vor das Tor teleportiert, Gerold springt mit. Genau dieser Fall entsteht typisch, wenn der Spieler die Königsgarde erschlug (Kopfgeld 800 + gesetzlos).
- **Was passieren sollte:** MECHANIKEN.md:853 „Mit Kopfgeld bei Valen folgt die Festnahme“; :875 „Niemand verhaftet mehr“. Die beiden Regeln widersprechen sich hier, und der Spieler bekommt kein Feedback.
- **Sicherheit:** hoch (Code); nicht live gesehen.
- **Repro:** `S.bounty.valen=300; S.schutz.varonheim={lost:10,byP:10,stage:3}`, zum Burgtor gehen.
- **Schwere-Vorschlag:** 3

### SH-11 Abbrechen von „Heer gegen eine Stadt“ löscht auch Morvaths Heerzug-Ziel
- **Ort:** game.js:6915 (`cancelQuest`: `for (a of S.war.armies) a.order = null`), sim.js:55 (Heerzug hat `order: CAPK, host: true`), sim.js:52 (kein neuer Heerzug, solange einer existiert), sim.js:354 (ohne `order` meidet ein Totenheer die Hauptstadt)
- **Was passiert:** Ein Spieler mit Toten-Rang 2 bricht `q_undarmy` ab. Das nimmt jedem Heer den Befehl, auch dem Heerzug auf dem Marsch und den Übernahme-Heeren (`lawOrder`). Der Heerzug zieht danach gegen andere Orte, nie mehr auf Varonheim, und blockiert als `host` jeden neuen Heerzug. Die Bedrohung der Hauptstadt ist damit dauerhaft ausgehebelt.
- **Was passieren sollte:** Nur das vom Spieler beorderte Heer verliert den Befehl (`S.undArmyTo`).
- **Sicherheit:** hoch (Code). Liegt am Rand meines Auftrags (Kriegssystem); nur so weit verfolgt.
- **Repro:** Heerzug erzeugen (`SIM.startHost` o. ä.), `q_undarmy` aktiv setzen, `cancelQuest('q_undarmy')` → Heerzug `order===null`.
- **Schwere-Vorschlag:** 2

### SH-12 Übernahme durch die Toten hängt, wenn das Heer seinen Befehl verliert
- **Ort:** game.js:8460–8463 (`schutzTakerDay`, Fall `undead`), 8579 (bei `taker` kein Ersatz)
- **Was passiert:** Es wird nur geprüft, ob das Heer noch existiert, nicht ob es noch `order === k` hat. Verliert es den Befehl (SH-11 / Zeile 6915), bleibt die Stadt für immer „Übernommen“ (Stufe 4): kein Ersatz, keine Plünderer-Stufe, kein Ende.
- **Was passieren sollte:** Zieht das Heer ab, fällt die Stadt auf „gesetzlos“ zurück (so wie bei einem vernichteten Heer).
- **Sicherheit:** mittel.
- **Schwere-Vorschlag:** 3

### SH-13 Läden bleiben für immer zu, wenn die Toten eine gesetzlose Stadt per Übernahme nehmen
- **Ort:** game.js:8435 (Übernahme `undead`: Stufe 4 ohne `schutzOpen`), 8462 und 8556 (`heldBy(k)` → `delete S.schutz[k]`), 8558 (`shopClosed = 1e12; schutzShut = k`), sim.js:425 (`lawOrder` → kein `holdTown`)
- **Was passiert:** Von Stufe 2/3 sind die Läden mit `schutzShut` geschlossen. Nimmt das Übernahme-Heer den Ort ein, wird `S.schutz[k]` gelöscht. Nur `schutzOpen`/`schutzCalm` lösen `schutzShut`, und beide hängen an diesem Eintrag. Nach der Befreiung (Valen-Heer) bleiben die Läden geschlossen. `capitalFreed`/`aurelFreed` öffnen nur `fallShut`.
- **Sicherheit:** mittel.
- **Repro:** Stadt gesetzlos machen, Debug „Übernahme erzwingen (Tote)“, Knoten auf `undead` und dann zurück auf `valen` setzen → Händler `shopClosed===1e12`.
- **Schwere-Vorschlag:** 3

### SH-14 Notwehr in der Burg löst Alarm aus
- **Ort:** game.js:3003 (`attack` → `keepDraw`), 8783–8789
- **Was passiert:** Jeder Hieb im Burgbezirk (auch mit Fäusten, auch von Ritter, Offizier oder Bestochenen) zählt als Ziehen. Der zweite binnen 20 s löst den Alarm aus (Valen −20, Kopfgeld 200), auch wenn der Spieler sich gegen Kultisten, Ahnenfeind oder Kopfgeldjäger wehrt. Es wird nicht geprüft, ob Feinde da sind.
- **Was passieren sollte:** MECHANIKEN.md:854/863 meinen das grundlose Ziehen; Notwehr ist nicht ausgenommen, aber eine Garde, die zusieht, wie der Gast angegriffen wird, sollte nicht ihn jagen.
- **Sicherheit:** mittel (eher Fit, wenn der Entwickler es so will).
- **Schwere-Vorschlag:** 3

### SH-15 Betriebe: Verlust wird angezeigt, aber nicht abgezogen; stillgelegte Betriebe zahlen keine Hände
- **Ort:** economy.js:256 (`continue` vor der Ertragsrechnung bei Besatzung oder Stillstand), 265, 278
- **Was passiert:** `income < 0` → Log „Deine Betriebe: −9 Gold heute.“, aber `S.gold += Math.max(0, income)`. In besetzten oder stillgelegten Städten fallen die Lohnkosten (`hired*3`) ganz weg, ohne jede Meldung, dass der Betrieb steht.
- **Sicherheit:** hoch.
- **Schwere-Vorschlag:** 4 (falsche Anzeige), 3, falls Verluste gewollt sind.

### SH-16 Ritter mit Dolch als Hauptwaffe: Strafe ohne Abgabe
- **Ort:** game.js:8727 (`keepSmall` nimmt auch `equip.weapon`), 8749, 8699
- **Was passiert:** Als Ritter wird die Hauptwaffe nie abgenommen. Ist sie ein Dolch, bietet das Tor trotzdem „verstecken“ an. Scheitert das, zahlt der Spieler 150 Gold, bekommt Valen −5 und drei Tage Verdacht, behält den Dolch aber (`keepBlade`).
- **Sicherheit:** hoch.
- **Schwere-Vorschlag:** 4

### SH-17 Erschlagene Torwache Gerold steht nach jedem Neubau wieder
- **Ort:** game.js:8658–8659, 8493
- **Was passiert:** `burgLoss` zählt Gerold mit (7 = 6 Hofwachen + Gerold). `ensureVaronCourt` zieht die Verluste aber nur von den Hofwachen ab und baut Gerold neu, solange `lost < 7`. Wer Gerold tötet, um die Durchsuchung zu umgehen (`keepHalt`: „keine Torwache mehr“), hat ihn nach dem Laden oder dem nächsten `burgDay` wieder vor sich.
- **Sicherheit:** hoch.
- **Schwere-Vorschlag:** 4

### SH-18 Täglicher Neubau des Hofs setzt Alarm und Wunden zurück
- **Ort:** game.js:8509 (`burgDay` → `ensureVaronCourt`, solange Burgwachen fehlen), 8633
- **Was passiert:** Der Neubau ersetzt alle Hof-NPCs: wütende Gardisten nach `keepAlarm` sind am nächsten Morgen wieder friedlich und voll geheilt, Positionen zurückgesetzt.
- **Sicherheit:** mittel.
- **Schwere-Vorschlag:** 4

### SH-19 Königsauftrag 1 kann still als erledigt gelten
- **Ort:** game.js:8874 (`royalStart`)
- **Was passiert:** Findet sich kein freier Platz oder kein Untoten-Elite, setzt der Code `varonQ1done = 1` ohne Log oder Auftrag. Der Spieler kann sofort „Der Hauptmann der Toten ist gefallen“ melden.
- **Sicherheit:** hoch (Randfall).
- **Schwere-Vorschlag:** 4

### SH-20 Fällt die Hauptstadt, bekommen nur die Waffen des Helden einen Boten
- **Ort:** game.js:8775 (`keepTick`)
- **Was passiert:** `keepReturn(p)` gibt nur das Depot des Helden zurück; die Depots der Gefährten bleiben in `S.keepDepot`. Geht der Gefährte vorher oder stirbt er, ist die Abholung nur über Gerold in der befreiten Burg möglich.
- **Was passieren sollte:** MECHANIKEN.md:851 „Fällt die Stadt, bringt ein Bote die Sachen.“
- **Sicherheit:** hoch.
- **Schwere-Vorschlag:** 4

## Fit-Befunde

### SHF-01 Prothesen ohne laufenden Preis — die freigegebene T15-Wartung fehlt
- **Systeme:** body.js:118–142, game.js:3437 (Verschleiß nur durch Treffer), 9916–9924 (Tausch gesunder Glieder)
- **Typ:** Widerspruch / passt nicht zur Welt
- **Was der Code heute tut:** Verschleiß nur bei Treffern. DECISIONS.md (01.10., T15 Messing V10): Energiezelle für Stufe 4 alle 3 Tage, Kurzschluss bei Schock, Regen-Verschleiß ×1,3. Davon findet `grep` nichts (Kurzschluss, Regen, Zelle für Prothesen). Der Tausch eines gesunden Glieds gegen Stufe 2 „Aurelionisch“ (700 Gold) bringt +0 % (MECH_Q[2]), der Text sagt aber „Besser als vorher“.
- **Warum ein Problem:** Weltregel „Kybernetik ist ein Tausch, nie einfach besser: Wartung, Heilungsbedarf …“. Ein Spieler ohne Treffer an der Prothese zahlt nie etwas. Stufe 2 freiwillig ist dagegen reiner Nachteil ohne Hinweis.
- **Optionen:** T15 bauen; Stufe 2 aus dem Tausch-Menü nehmen oder den Text ehrlich machen; so lassen.
- **Gewicht:** hoch

### SHF-02 Prothesen verhalten sich medizinisch wie Fleisch
- **Systeme:** body.js:98–115, game.js:549, 576, 3510–3512, 11592
- **Typ:** Widerspruch
- **Was der Code heute tut:** siehe SH-08. Verband, Trank, Schlaf und Heiler stellen eine zerschlagene Prothese wieder her; Prothesen bluten und entzünden sich.
- **Warum ein Problem:** Die Trennung „Medizin ↔ Werkzeug“ (MECHANIKEN.md:267) ist die eigentliche Entscheidung zwischen Fleisch und Messing. Heute ist eine Prothese nach dem Kampf genauso schnell wieder einsatzbereit wie ein echter Arm.
- **Optionen:** Prothesen-LP nur über Öl, Werkbank und Kybernetiker; oder MECHANIKEN klarstellen (nur Zustand); so lassen.
- **Gewicht:** mittel

### SHF-03 Die Stadt vergisst, wer ihre Wache erschlug
- **Systeme:** game.js:8585 (`Z.byP = min(byP, lost)` bei jedem Ersatz), 8531/8560 (`guilty`), 8454
- **Typ:** gerissene Kette (Ruffolge)
- **Was der Code heute tut:** Jeder Ersatz senkt `byP` mit `lost`. Nach einer Ersatzwelle zählt der Spieler weniger oder gar nicht mehr als Täter (Grundlage auch für SH-01). Fällt die Stadt erneut, gilt er beim zweiten Alarm nicht mehr als schuldig.
- **Warum ein Problem:** „Ruffolge → neue Chance oder neues Problem“. Der Wachmord ist nach zwei Tagen vergessen, obwohl Kopfgeld und Chronik weiter bestehen.
- **Optionen:** Schuld getrennt von `lost` speichern; so lassen.
- **Gewicht:** mittel

### SHF-04 Burgfrieden gilt unverändert in gesetzloser Hauptstadt
- **Systeme:** game.js:8712–8733, 8474–8487
- **Typ:** Widerspruch
- **Was der Code heute tut:** Garde tot, Plünderer in den Gassen, „niemand verhaftet mehr“, aber Gerold durchsucht weiter nach Dietrichen (und mit Kopfgeld: SH-10).
- **Warum ein Problem:** Die Lage in der Stadt spiegelt sich nicht an ihrem wichtigsten Tor. Die Welt reagiert nicht auf die Folgen, die der Spieler ausgelöst hat.
- **Optionen:** Schutzlos oder gesetzlos → Tor geschlossen („Die Burgtore schließen sich“, sagt die Namenskarte 8544 schon) oder nur noch Torwache ohne Durchsuchung; so lassen.
- **Gewicht:** mittel

### SHF-05 Bandenstadt hängt wieder Aufträge der alten Herren aus
- **Systeme:** game.js:6888 (`townContracts`: nur Stufe 3 = keine Aushänge), 6949 (Ruf an `townFac`)
- **Typ:** Widerspruch
- **Was der Code heute tut:** Unter Bandenherrschaft (Stufe 4) erscheinen wieder 3–5 Aushänge und der Verteidigungsmeister, Lohn als Ruf beim Valen-Herrn.
- **Warum ein Problem:** Die Bande herrscht, aber der König bezahlt die Arbeit dort. Die Übernahme ist für den Spieler am Brett unsichtbar.
- **Optionen:** Unter Bande nur Aufträge der Bande oder keine; so lassen.
- **Gewicht:** niedrig

### SHF-06 Eigene Betriebe in besetzten Städten stehen ohne Meldung still
- **Systeme:** economy.js:256, 278
- **Typ:** kein Feedback
- **Was der Code heute tut:** Der Ertrag fällt einfach weg, ohne Log; das Einkommen verschwindet wortlos (siehe auch SH-15).
- **Warum ein Problem:** Krieg → Wirtschaftsfolge für den Spieler ist da, aber unsichtbar.
- **Optionen:** Einmal-Meldung „Dein Betrieb in X steht still (besetzt)“.
- **Gewicht:** niedrig

### SHF-07 Plünderer nur in Spielernähe
- **Systeme:** game.js:8479–8480
- **Typ:** für den Spieler unsichtbar / Welt läuft nicht ohne ihn
- **Was der Code heute tut:** Plünderer erscheinen nur, wenn der Held ≤ 60 Felder entfernt ist; sonst wirkt die Gesetzlosigkeit nur über den Wohlstand (der zudem schwächer fällt als dokumentiert, SH-02).
- **Warum ein Problem:** „Die Welt entwickelt sich weiter, wenn der Spieler woanders ist.“ Eine gesetzlose Stadt verliert fern vom Spieler weder Bewohner noch Lager.
- **Optionen:** abstrakter Schaden je Nacht (Lager, Bevölkerung); so lassen.
- **Gewicht:** niedrig

## Quest-Hinweise für den Quest-Agenten
- Königskette (`varonQ` 0–3, game.js:8840–8857, `royalStart`/`royalTick`): Q1 kann still erledigt sein (SH-19); Q2 verfällt beim Fall der Hauptstadt (8353, „zu spät“). Kernaufgabe heute: Elite töten, einen Namen wählen, knien.
- „Varonheim zurückerobern“ (Exilkönig 8841, Brandt 8860): nur Flag `retakeAsked`, Lohn in `capitalFreed` (8623) nur bei Spieler ≤ 40 Felder — wer die Wellen bricht und sich vor dem Abschluss entfernt, bekommt nichts.
- Startaufträge Varonheim (capStart 1926–1930): drei Standardaufträge mit neuem Text, Lohn ≤ 60.
- `q_undarmy` (Sael): Abbrechen beschädigt den Heerzug (SH-11); eine Übernahme-Armee mit Befehl hält die Quest künstlich offen (6289) und sperrt „Schick ein Heer“ (6200).
- Diener-Schmuggel (servantSmuggle): eine Bestellung gleichzeitig, kein Debug-Eintrag (SC-03, bekannt).

## Nicht geprüft
- Nichts live (Browser nicht verfügbar); alle Repro-Schnipsel sind ungetestet.
- `spawnGuardPosts`, `bandFound`/`bandGone`/`bandsOf`, `tribState`, `afterAvenge`, `emigrate`, Schutzgeld am Tor unter Bandenherrschaft (MECHANIKEN.md:895) — nicht geöffnet.
- Selbstwartung an der Werkbank (game.js:4889–4950), Schwarzmarkt (`blackMarket`), Auge über `EYE_ZAP` hinaus, `stabilize`, Schlafheilung (`SLEEP_CURES`).
- UI-Menüs der Wirtschaft (`wagonMenu`, `bizMenu`, `ordersMenu`, `ecoPrices`), `ignoredContract`, `investMenu`, Debug-Einträge.
- sim.js außer den genannten Zeilen (Belagerung, `capThreatDay`), Koop-Pfade, RB-010 (Zoll).

## Beobachtungen
- game.js:3332 Armprothesen-Bonus gilt für jede Schadensart des Angreifers, auch Fernkampf (nicht geprüft, ob `resolveSwing` Projektile mitnimmt).
- economy.js:129 Warenpreise laufen 0,4–3 × plus Zuschläge, Gegenstände 0,7–1,8 (T09); ob T09 auch Rohwaren meint, ist offen.
- MECHANIKEN.md:880 nennt „mindestens 3 erschlagen und 5 tot“ — der Code (8498) passt dazu, zählt aber Gerold als Burgwache mit.
- game.js:8704 `keepBribe(force)` aus dem Debug kann Gold negativ machen (keine Prüfung).
- game.js:6200 Eine Übernahme-Armee mit `order` blendet Saels „Schick ein Heer“ aus, ohne Grund zu nennen.
- buildVaronburgOld (SC-01) bestätigt tot; `S.ents.varonburg = []` bei jedem `ensureVaronCourt`.
