# Reproduktions-Liste 1 (neutral, ohne Begründung der Finder)
Je Eintrag: Behauptung, Ort, Auslöser, Repro-Vorschlag. Urteil je Eintrag: CONFIRMED / NOT REPRODUCED / CANNOT TEST.

### R-SH-01 Wachmörder bekommt beim Befreien den vollen Dank (+10)
- **Ort:** game.js:8454–8456 (`schutzFreed`)
- **Auslöser:** Dorf mit ≤ 3 Posten (Valen-Ersatz 3 Mann; Aurelion 2, Händler 1). Der Spieler erschlägt alle Wachen, die Bande übernimmt, der Spieler erschlägt den Anführer (`bandLead` → game.js:11572).
- **Repro:** `S.schutz.X={lost:3,byP:3,stage:4,taker:{by:'band',id:b.id}}` für ein Valen-Dorf mit 3 Posten, dann `schutzFreed('X','player')` → Valen +10, Logtext „dankt dir“.

### R-SH-02 Wohlstand fällt unter Bandenherrschaft gar nicht, schutzlos und gesetzlos viel weniger als dokumentiert
- **Ort:** game.js:6998 (`growthDay`)
- **Auslöser:** jede Stadt mit `S.schutz[k].stage` ≥ 2.
- **Repro:** `growthOf(k).prosper=50; S.schutz[k]={stage:4,lost:3,taker:{by:'band'}}; RF.growthDay()` → bleibt 50 (bzw. 49,x wegen `built*0.25`).

### R-SH-03 Heiler lehnt ab, wenn nur Arme oder Beine verletzt sind
- **Ort:** game.js:11613–11617 (`woundedGroup`, `healCost`, `healerTreat`); body.js:43–47 (`syncHp`)
- **Auslöser:** Glied ausgefallen, Rumpf und Kopf voll (z. B. nach Verband auf den Rumpf oder nach Schlaf).
- **Repro:** `p.body.lleg.hp=-50; RF.B.syncHp(p);` → `p.hp===p.maxHp`; dann eine Heilerin ansprechen → „Dir fehlt nichts“.

### R-SH-04 Kauf von Ausrüstung leert das Stadtlager nur bis Tagesende
- **Ort:** game.js:12950 (`buy`) gegen economy.js:272 (`ecoDay`, Verbrauch minus `t.bought`)
- **Auslöser:** In einer Stadt mit Waffenverbrauch ≥ 0,5 eine Waffe oder Rüstung kaufen und einen Tag warten.
- **Repro:** `a0 = S.towns.northcity.stock.arms`, 2 Schwerter bei einem Nordfurter Händler kaufen, `ecoDay()`; mit einem zweiten Lauf ohne Kauf vergleichen. Der Endstand ist gleich.

### R-SH-05 Entzündung weckt Bewusstlose auf statt sie zu schwächen
- **Ort:** game.js:11600 (`woundDay`), dazu 2804–2809
- **Auslöser:** Held oder Gefährte mit Status `infektion` ist am Boden, während `dayTick` → `woundDay` läuft.
- **Repro:** Infektion setzen, `p.body.torso.hp = -p.body.torso.max*0.7; p.downed=true;` dann `woundDay()` → Rumpf = 1.

### R-SH-06 Paktritter (Zauber) heilt ausgefallene Glieder
- **Ort:** game.js:14041 (`pact_knight`)
- **Auslöser:** Paktritter wirken, während ein Glied ≤ 0 ist.
- **Repro:** `p.body.lleg.hp=-100`, Paktritter wirken → `lleg.hp===1`, Speed-Faktor wieder 1.

### R-SH-07 Bruch überlebt das Abtrennen: neue Prothese bei 40 % gedeckelt, Narbe am Messingarm
- **Ort:** body.js:87 (Abtrennen löscht `mech*`/`mod`, nicht `broken`/`splint`), body.js:125 (`attachProsthesis` ebenso), game.js:9922 (Tausch eines gesunden Glieds), game.js:11596 (`woundDay` zählt Brüche ohne Blick auf `lost`/`mech`), 11605 (Schienen-Angebot)
- **Repro:** `P=p.body.larm; P.broken=4; RF.B.damagePart(p,'larm',9999)` (wiederholen bis `lost`), `RF.B.attachProsthesis(p,'larm',2)` → `P.broken===4`, `topOf(P)===0.4*max`.

### R-SH-08 Verband, Trank und Heiler heilen Prothesen; Prothesen bluten und entzünden sich
- **Ort:** body.js:98–115 (`healPart`/`heal`/`fullHeal` ohne `mech`-Prüfung), game.js:549 (`worstPart` wählt auch Prothesen), 576 (Heiler `fullHeal`), 3510/3512 (`limbLost`: Blutung und `woundSet` auch an Prothesen)
- **Repro:** Prothese anlegen, `p.body.larm.hp=-20`, Verband auf den Arm → hp > 0, Log „wieder zu gebrauchen“.

### R-SH-09 Abgetrennte Glieder fangen weiter Treffer und halbieren den Schaden
- **Ort:** body.js:56–68 (`pickPart`: `HIT_W` unverändert für `lost`), 76–89
- **Repro:** `seedRng`, 200× `hurt(p, 10, e)` mit und ohne `larm.lost`; Rumpfschaden vergleichen.

### R-SH-10 Burgtor schiebt Gesuchte in gesetzlosem Varonheim ohne jede Meldung zurück
- **Ort:** game.js:8715 (`keepHalt`), 5178 (`arrestCheck`: in gesetzloser Stadt keine Festnahme), 2392 (Takt 250 ms)
- **Repro:** `S.bounty.valen=300; S.schutz.varonheim={lost:10,byP:10,stage:3}`, zum Burgtor gehen.

### R-SH-11 Abbrechen von „Heer gegen eine Stadt“ löscht auch Morvaths Heerzug-Ziel
- **Ort:** game.js:6915 (`cancelQuest`: `for (a of S.war.armies) a.order = null`), sim.js:55 (Heerzug hat `order: CAPK, host: true`), sim.js:52 (kein neuer Heerzug, solange einer existiert), sim.js:354 (ohne `order` meidet ein Totenheer die Hauptstadt)
- **Repro:** Heerzug erzeugen (`SIM.startHost` o. ä.), `q_undarmy` aktiv setzen, `cancelQuest('q_undarmy')` → Heerzug `order===null`.

### R-SH-12 Übernahme durch die Toten hängt, wenn das Heer seinen Befehl verliert
- **Ort:** game.js:8460–8463 (`schutzTakerDay`, Fall `undead`), 8579 (bei `taker` kein Ersatz)

### R-SH-13 Läden bleiben für immer zu, wenn die Toten eine gesetzlose Stadt per Übernahme nehmen
- **Ort:** game.js:8435 (Übernahme `undead`: Stufe 4 ohne `schutzOpen`), 8462 und 8556 (`heldBy(k)` → `delete S.schutz[k]`), 8558 (`shopClosed = 1e12; schutzShut = k`), sim.js:425 (`lawOrder` → kein `holdTown`)
- **Repro:** Stadt gesetzlos machen, Debug „Übernahme erzwingen (Tote)“, Knoten auf `undead` und dann zurück auf `valen` setzen → Händler `shopClosed===1e12`.

### R-SH-15 Betriebe: Verlust wird angezeigt, aber nicht abgezogen; stillgelegte Betriebe zahlen keine Hände
- **Ort:** economy.js:256 (`continue` vor der Ertragsrechnung bei Besatzung oder Stillstand), 265, 278

### R-SH-16 Ritter mit Dolch als Hauptwaffe: Strafe ohne Abgabe
- **Ort:** game.js:8727 (`keepSmall` nimmt auch `equip.weapon`), 8749, 8699

### R-SH-17 Erschlagene Torwache Gerold steht nach jedem Neubau wieder
- **Ort:** game.js:8658–8659, 8493

### R-SH-18 Täglicher Neubau des Hofs setzt Alarm und Wunden zurück
- **Ort:** game.js:8509 (`burgDay` → `ensureVaronCourt`, solange Burgwachen fehlen), 8633

### R-SH-19 Königsauftrag 1 kann still als erledigt gelten
- **Ort:** game.js:8874 (`royalStart`)

### R-SH-20 Fällt die Hauptstadt, bekommen nur die Waffen des Helden einen Boten
- **Ort:** game.js:8775 (`keepTick`)
