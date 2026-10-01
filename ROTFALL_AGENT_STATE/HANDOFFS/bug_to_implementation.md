# bug_to_implementation

Schriftliche Hunter-Berichte (Control: fehlten bisher als Datei). Kurzfassung, Volltexte liegen in den Agenten-Protokollen.

## Hunter 1 (Sonnet), 01.10. — Varonheim, A1, V1
- Varonheim: keine Fehler (Wege, POIs, Portal, Rundweg, Atlas, Reisende, neue Welt).
- HIGH: Untote nehmen alle 15 Knoten in ~20 Tagen → RB-001 (behoben).
- MEDIUM: simFight hinterließ S.difficulty → RB-002 (Hunter-Fix). LOW: ARMY_CAP → RB-003 (Hunter-Fix).
- LOW-Vorschlag Tageswechsel `while` → RB-007 abgelehnt.
- Design: Varonheim ohne Kriegsknoten → Nutzer: belagerbar (offen).
- Selbsttest 323/323.

## Hunter 2 (Sonnet), 01.10. — T04, T06, Krieg
- CRITICAL: Slotwechsel nach save() schreibt falschen Platz → RB-008. MEDIUM: gepackter Platz aus anderem Tab liest null → RB-009.
- T04 (Klang, Partikel, Nachbild): kein Befund. Krieg 60–80 Tage: kein Totalsieg, Deckel gehalten; Entsatz feuerte nicht (Valen hatte noch ein Heer — beabsichtigt).
- Selbsttest 325/325.

## Hunter 3 (Sonnet), 01.10. — Blutkult Scheibe 1 (Vampir), Control-Fixes (A1, Speichern, v=23)

Commit c0174b3. Selbsttest frisch geladen: **330/330**. Echter Spielstand unberührt (`_quiet` während aller Proben aktiv, Backup/Fortsetzen nach Vorschrift, kein zweites Speichern ausgelöst).

### RB-013 — Sonnen-/Dauerschaden am Spieler durch Trefferzonen-Zufall stark verwässert
- **TITLE:** `hurt()` verteilt Dauerschaden (Sonnenbrand; vermutlich auch Gift/Feuer/Blutung) über zufällige Körperteile, dadurch kommt im Mittel nur ~55–70 % des nominellen Werts beim Spieler-LP-Pool an.
- **SEVERITY:** HIGH (kein Absturz/Datenverlust, aber dokumentierte Balance-Zahl stimmt systematisch nicht; betrifft vermutlich jede Dauerschaden-Quelle am Spieler, nicht nur den Vampir).
- **SYSTEM:** Kampf/Körperzonen (body.js) × Blutkult-Vampir (game.js).
- **REPRODUCTION:** `?dev`, Vampir freischalten (Debug „Blutkult: Vampir“ → „Vampir werden“), `RF.S.paused=true`, Mittag/klar (`RF.S.minute=720`, `RF.S.weather='clear'`), `RF.B.fullHeal(p)`, dann `RF.hurt(p,1,null,'Sonnenlicht')` 60× in einer Schleife (oder `RF.tick(ms)` über mehrere Sekunden mit sauber zurückgesetztem `p.body`). Gemessen (mehrere saubere Läufe, je mit vollständig geheiltem Körper vorher): 0,5/s, 0,667/s (30 s Probe), 0,693 Schaden je nomineller 1-Punkt-Dauerschadens-Anwendung (n=60 Einzeltreffer über `RF.hurt`).
- **EXPECTED:** 1,2 Schaden/s bei voller Sonne und Blutdurst < 70 (docs/MECHANIKEN.md „Blutkult, Scheibe 1“, Entwickler-Entscheidung F2).
- **ACTUAL:** real ankommender Schaden am LP-Pool ≈ 0,5–0,7/s, d. h. 42–58 % des dokumentierten Werts.
- **ROOT CAUSE:** `vampTick()` ruft `hurt(c, n, null, 'Sonnenlicht')` ohne `kind` (→ Standard `'physical'`), `hurt()` leitet das daher **immer** durch `B.pickPart(null, target, false)` (Gewichte `HIT_W = {head:6, torso:46, larm:12, rarm:12, lleg:12, rleg:12}`, body.js:9/56). Bei den vier Gliedmaßen (zusammen 48 % Trefferchance) wirkt in `B.damagePart()` die „Streuschaden“-Regel (body.js:76): `glance = dmg*0.4; dmg -= glance; torso.hp -= glance*0.5;` — von 1 Punkt nominellem Schaden landen dann nur 0,2 Punkte im (für `c.hp`/`c.maxHp` zählenden, body.js:43–47 `syncHp`) Rumpf/Kopf-Pool, der Rest verschwindet in der (nicht in `c.hp` gezählten) Gliedmaßen-Reserve. Erwartungswert: 0,52×1 + 0,48×0,2 ≈ 0,616 — deckt sich mit den Messungen. Dieselbe Verwässerung träfe jeden anderen `hurt(c, n, null, cause)`-Aufruf mit kleinem `n` (Gift `game.js:2756`, Feuer `game.js:2755`, Blutung `game.js:2753`) — die Vampir-Funktion deckt nur einen vorbestehenden Mechanismus auf, führt ihn nicht ein.
- **FILES:** `src/game.js:12471` (`vampTick`, Aufruf von `hurt`), `src/game.js:3330` (`hurt`), `src/body.js:56` (`pickPart`), `src/body.js:72–93` (`damagePart`, Zeile 76 Streuschaden).
- **FIX (Vorschlag, nicht umgesetzt):** Dauerschaden ohne Angreifer (`source == null`) soll nicht über die Trefferzonen-Zufallsauswahl laufen, sondern direkt den Rumpf (oder den LP-Pool) treffen — analog zum bereits vorhandenen Sonderfall `brawlHit` in `hurt()`, der ebenfalls `part` vorab festlegt:
  ```diff
  -  if (target.body) { part = brawlHit ? 'torso' : B.pickPart(source, target, crit); result = B.damagePart(target, part, dmg, crit);
  +  if (target.body) { part = brawlHit || !source ? 'torso' : B.pickPart(source, target, crit); result = B.damagePart(target, part, dmg, crit);
  ```
  Das ist eine Entscheidung mit Tragweite (ändert auch Gift/Feuer/Blutung bei Spieler **und** NPCs/Gegnern) — bitte vom Systems-/Kampf-Balance-Spezialisten freigeben lassen, nicht einfach durchreichen. Alternative, enger gefasste Lösung: in `vampTick` einen eigenen Pfad ohne `B.damagePart` (z. B. direkt `target.body.torso.hp -= n; B.syncHp(target);`), falls die generelle Änderung an Gift/Feuer/Blutung nicht gewollt ist.
- **REGRESSION TEST:** neue Selbsttest-Probe, die über ausreichend viele Einzelanwendungen (≥ 50) den **Mittelwert** des ankommenden Schadens misst, nicht nur `hp < h0` (siehe nächster Punkt — die bestehende Probe tut genau das nicht).
- **STATUS:** REPRODUCED, root cause bekannt, **kein Fix umgesetzt** (Bug-Hunter ändert `src/` nicht).

### Testabdeckung — bestehende Probe zu schwach
- Die Selbsttest-Probe „Blutkult S1 (§5g.2): Vampir-Schema …“ (`src/game.js:16779`, Zeile 16786: `const h0 = p.hp; vampTick(p, 5000); const burnt = p.hp < h0 && stat(p, 'sunburn');`) prüft nur **ob** HP sinken, nicht **wie viel**. RB-013 besteht diese Probe unbemerkt (330/330 bleibt grün, obwohl der Schaden nur ~50–70 % des dokumentierten Werts beträgt). Empfehlung: Assertion auf eine ungefähre Bandbreite (z. B. `burnt` UND `h0-p.hp` zwischen 4 und 7 bei 5000 ms/volle Sonne/Blutdurst 30) erweitern.

### Audit T02 / T04 — neue Proben, Stärke geprüft (keine Änderung, nur Bewertung wie angefragt)
- **Audit T02** (`src/game.js:16517`, Krieg/Nachschub Valen-Entsatz): prüft reale Zustandsübergänge (Heer entsteht nur in einer `valen`-eigenen Stadt; ohne eigene Stadt entsteht ein Heer exakt bei `northcity`). Da `sim.js:376` das Entsatzheer fest mit `at:'northcity'` erzeugt, ist der zweite Teil der Probe strukturell nicht umgehbar (kein Zufallspfad dorthin nötig) — aber genau deshalb auch nicht blind: eine Regression, die `muster` falsch bestimmt oder das Entsatz an die falsche Fraktion/Stadt hängt, lässt die Probe zuverlässig scheitern. Bewertung: **ausreichend stark** für ihren Zweck.
- **Audit T04** (`src/game.js:17115`, Effekte/Partikel/Zufall): prüft, dass `fx()`/`float()` den Spielzufall (`rnd()`) nicht verbrauchen (`seedRng` davor/danach gleich), einen Partikel-Deckel (`FX_CAP+6`) und dass `'afterimage'`/`'ghost'` in `FIXED` stehen. Bewertung: **ausreichend stark** gegen die konkret benannten Regressionen (Zufalls-Verbrauch, Deckel-Bruch, Nachbild/Schleier-Zuordnung); sie prüft nicht die *visuelle* Richtigkeit (Position/Farbe), aber das war laut Auftragstext (C3/C5, RB-005) auch nicht ihr Zweck.

### Kontrollierte Nachprüfungen ohne Befund (Blutkult Scheibe 1)
- **Sonne nach Bedingung** (Code gelesen + laufzeitgeprüft, abgesehen von RB-013s Betrag): Haus (0), geschlossene Karte (0), Mitternacht (0), Dämmerung halb, Kapuze halbiert, Wolken/Sandsturm halbiert, Regen/Nebel/Schnee 0,3×, am Boden Brandrate halbiert (`c.downed?0.5:1` in `vampTick`, game.js:12477) — Formel im Code korrekt, Betrag s. RB-013. `bloodrain` (soll 0 sein) ließ sich im Debug nicht isoliert auf Weltkarte halten: `S.weatherLeft=0` wird sofort erzwungen, weil `bloodrain` dort nicht im Wetter-Pool ist (regionales Wetter, game.js `REGIONAL_WEATHER`/`weatherPool`) — kein Vampir-Bug, nur eine Testgrenze; müsste in der Zielregion selbst geprüft werden.
- **Trinken:** nur Wehrlose (am Boden/ergeben/gefesselt/schlafend) oder Tier/Phiole; Mensch −45, zweites Mal selben Tag tötet (`die()` + `bloodshed()`, Mord/Kopfgeld/Bann liefen korrekt an); Tierblut −10, nie unter 50; Gefährten in der Nähe verlieren Moral. Alles live über Tastatur-Hotbar (`1`) gegen echte Debug-NPCs geprüft.
- **Zeugen/Stigma:** `bloodSeen` meldet korrekt an alle Fraktionen mit Sichtlinie ≤ 280 px; `valen`/`report:'guard'` löst `addBounty(valen,60,…)` aus, **einmal je Tag** (`V.rep[f]!==day`-Sperre bestätigt); `order`/`report:'hunt'` zählt `S.flags.vampOrderHeat` hoch. Stigma-Begrüßung/Abweisung (`stigmaOf`) und Preisaufschlag (`repPrice`) greifen wie in `STIGMA.vampire` (data.js:798) hinterlegt.
- **Heilung:** Mutter Aldis und Sankt Serin (über Debug-Kurzschluss `cureTitle` geprüft) entfernen Titel, Ressource, Leuchtfarbe korrekt; **Wiederansteckung** funktioniert sofort wieder (Nutzer-Entscheidung „beliebig oft“ korrekt umgesetzt, kein `forsaken`-Flag). Stigma-Wissen bleibt nach Heilung bestehen, aber `stigmaOf()` blendet es nach `cured+10 Tage` korrekt aus (Code gelesen, `game.js:12526–12528`) — kein „nie zurücksetzen“-Fehler.
- **Interaktion mit anderen Titelklassen:** Mönch ↔ Vampir schließen sich **in beiden Richtungen** aus (live geprüft: `unlockTitle('monk')` scheitert mit aktivem Vampir und umgekehrt) — `data.js:737`/`765` symmetrisch korrekt gepflegt.
- **Heilmittel halbiert:** per Code bestätigt (`game.js:550`: `(dkNode(target,'k_bloodlord')||isVamp(target)?0.5:1)` bei Verband/Heilkraut); Laufzeit-A/B-Test scheiterte an einer Verband-Anwendung, die über einen 1,6-s-Kanal läuft (`c.channel`, game.js:538) statt sofort zu wirken — kein Fehler, nur Testaufbau ohne Wartezeit.
- **Exploits:** zweites Trinken am selben Tag tötet (bestätigt); Blutphiolen sind reiner Inventargegenstand (kein unendlicher Nachschub ohne Hedda/Scheibe 2); Trinken an Gefährten ist in Scheibe 1 **gar nicht möglich** — `feedTarget()` schließt Parteimitglieder generell aus (`!S.party.includes(e.id)`, game.js:12504). Das widerspricht nicht der Spielbarkeit, weicht aber von `proposals/blutkult.md` §15 ab, wo „Gefährten als Spender“ ausdrücklich als erlaubt (mit Moral/Beziehungs-Preis) vorgesehen ist — siehe Design-Beobachtung unten, kein Bug.
- **Speichern/Laden (Code gelesen, kein Risiko gefunden):** `p.tres.blood`, `p.stigma`, `p.vamp` sind gewöhnliche Felder der Spielerfigur; `SKIP` (state.js:144) listet sie nicht aus, die Spielerfigur ist nie `transient` → werden über `saveData()`/normales Entity-Speichern mitgenommen. Kein Testlauf gegen den echten Speicherpfad (Regel: Selbsttest/Dev-Schnipsel dürfen `_quiet` nicht aufheben); Einschätzung daher **UNVERIFIED durch Laufzeittest, aber durch Code plausibel**.

### Control-Fixes (A1 Standfestigkeit, Speicherpfad, v=23)
- **A1 Standfestigkeit:** `hurt()` liest `poised0` vor jeder Mutation (`game.js:3242`, Kommentar nennt den Control-Befund explizit); Hammer/Wuchtwaffen setzen `poiseUntil` für `650 + 1200 ms`, danach kein neues Taumeln (`game.js:3318`); Kombo-Wuchtschlag ebenso einmalig (`game.js:3250`). Selbsttest-Probe „Audit A1“ (game.js:16538) deckt genau das ab und ist **grün**. Kein Befund.
- **Speicherpfad (state.js):** `setSlot()` (state.js:9) flusht ausstehendes/laufendes Speichern synchron in den **alten** Platz, bevor `SAVE_KEY` umspringt (RB-008, bereits behoben); `flushSave()` (state.js:231) prüft nach dem `await zipSave(...)` erneut `gen/SAVE_KEY/guardSave()` (state.js:236); `saveCompressed()` (state.js:241) ist an „Jetzt speichern“ **und** „Zum Hauptmenü“ gebunden (ui.js:1068–1069, `A.saveNow` → game.js:17322); der Quit-Knopf setzt `S._quiet=true` **vor** `location.reload()`, wodurch `beforeunload`→`saveSync()` über `guardSave()` abbricht (state.js:216, kein zweites JSON-Speichern). Alles code-geprüft, konsistent mit den Audit-Kommentaren. Kein Befund.
- **Cache-Schlüssel v=23:** `grep '?v=22'` über `index.html` und `src/*.js` ohne Treffer; alle Imports, `coop.js?v=23`-Dynamicimports und `VER=23` in `src/coop.js` stimmen überein. Kein Befund.

### Design-Beobachtung (kein Bug — getrennt vom Fehlerbefund, zur Freigabe durch Feature Designer/Entwickler)
- `proposals/blutkult.md` §15 sieht „Gefährten als Spender“ ausdrücklich als erlaubt vor (Beziehung −20, Moral −15, beim zweiten Mal verlässt der Gefährte die Gruppe — als Gegenmittel gegen den Exploit, nicht als Verbot). Die ausgelieferte Scheibe 1 schließt Parteimitglieder in `feedTarget()` jedoch komplett aus (`!S.party.includes(e.id)`, game.js:12504) — Trinken an Gefährten ist technisch unmöglich, nicht nur sozial teuer. Das ist vermutlich eine bewusste Vereinfachung für Scheibe 1 (Scheiben 2–5 bauen noch Kult-Aufträge/Hedda), aber weicht von der freigegebenen Spezifikation ab. Empfehlung: beim Feature Designer/Entwickler klären, ob das für Scheibe 1 so bleibt oder ob die Partei-Ausnahme für Scheibe 2 (oder schon jetzt) aufgehoben werden soll.

### Zusammenfassung
- 1 neuer Fehler: **RB-013** (HIGH, Sonnen-/Dauerschaden verwässert durch Trefferzonen-Zufall — betrifft wahrscheinlich auch Gift/Feuer/Blutung, nicht nur den Vampir).
- 1 Testlücke benannt (Blutkult-S1-Sonnenprobe prüft nur Ja/Nein).
- Audit T02/T04: beide Proben ausreichend stark für ihren jeweiligen Zweck.
- A1, Speicherpfad, v=23: alle drei bestätigt korrekt, kein Befund.
- 1 Design-Beobachtung (Gefährten als Blutquelle technisch blockiert statt sozial teuer — Abweichung von proposals/blutkult.md §15, keine Entwicklerentscheidung dazu gefunden).
- Selbsttest frisch geladen: 330/330. Echter Spielstand unverändert.
