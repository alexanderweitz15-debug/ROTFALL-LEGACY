# Emergente Quests: Bruder, Spur, Witwe, Vermisstenwelle (Scout-Runde 7, Ideen 2, 4, 5, 6)

**Status:** PROPOSED → WAITING_FOR_DEVELOPER (der Entwickler hat noch keine der vier gewählt). **Autor:** Designer (Opus) · **Stand:** 01.10.2026
Kennzeichnung: **FAKT** (Datei:Zeile, per grep geprüft), **VORSCHLAG**, **ANNAHME** (im Spiel nicht geprüft).
Jede Idee ist eine **eigene Scheibe** (E1–E4) und für sich baubar. Keine Scheibe braucht eine andere. Abhängigkeiten zu T08, T12 und `npc_eigene_ziele.md` stehen jeweils unter „Anschluss“.

---

## 0. Systemprüfung (vor dem Entwurf)

| Befund | Beleg (FAKT) | Folge |
|---|---|---|
| `evDeserters` spawnt 3 namenlose Räuber „Deserteur“ und hängt ein **fremdes** Zufalls-Kopfgeld aus (`postContract('valen','bounty')`), das mit den Deserteuren nichts zu tun hat | `game.js:10060–10066`; Ereignis-Pool `EVENTS` `10314` | E1 bindet die Deserteure an eine echte Bande mit Anführer |
| Banden sind schon ein System: Lager, Anführer mit Namen, Unterhändler, Schutzgeld, Zerfall nach 12 Tagen, Kopfgeld bei Anführertod. Gespeichert in `S.bands`, Figuren flüchtig | `bandsOf` `11236`, `bandFound` `11237`, `bandDay` `11251`, `bandSpawn` `11259`, `bandTick` `11269`, `bandKill` `11285`, `bandChoices` `11290` | E1 und E2 bauen **Banden**, keine eigenen Lager |
| Ein Gerücht-Auftrag `kind:'rumor', rk:'band', bandRef` zeigt ein Bandenlager auf der Karte und gilt als erfüllt, sobald die Bande fort ist | `game.js:13441` (T08-Verhör), Auswertung in `rumorTick` `11814`, Abschluss `rumorDone` `11827` | E1 und E2 nutzen diese Form fast wörtlich |
| Wachen sind dauerhafte Figuren (nicht `transient`) mit Vornamen, `guard: true`, `post: town`. Valen-Posten: Eren, Nordfurt, Salzhafen, Grenzwacht | `GUARD_POSTS` `675–684`, `spawnGuardPosts` `696`, `guardChar` `708` | Das Gegenargument zu Idee 2 („Attrappe“) trifft nicht zu: benannte Wachen gibt es. Familie haben sie nicht, die setzt E1 |
| Rächer gibt es schon: nach einem Kopfgeld kommt zu 35 % der Bruder (`S.avenge`, ein einzelnes Feld), Begegnung `avenger` mit Kampf, Blutgeld (60) oder Wahrheit | `claimContract` `6912`, `captiveLetGo` `13446–13449`, `ENC_KINDS.avenger` `2568`, Text `2577`, Auswahl `2695`, Dialog `2643–2646` | E3 nutzt dieselbe Begegnungs-Mechanik, aber mit **Ursache** (Mord) und **Auftraggeber** (Witwe), nicht als Zufall |
| Mord an einem Unschuldigen: Ruf, Kopfgeld, Gruppenmoral, Zeugenprüfung `seen` | `bloodshed` `3649–3670`, Aufruf aus `die` `3636`; Adel/Klerus `murderOfRank` `3677` | E3 hängt sich hinter `bloodshed` ein (nur `wasFoe === false`) |
| Bewohner haben Beziehungen und können heiraten: `c.rel = { friend, rival, foe }`, Hochzeitsszene setzt `a.married = b.id` | `planDays` `1120–1122`, Hochzeit `2247`/`2272` | E3 braucht kein neues Familiensystem: Ehepartner (`married`) und Hausgenossen (`homeId`) reichen |
| `spouseOf` betrifft nur den **Spieler**-Ehepartner | `game.js:13920` | Nicht verwenden; E3 liest `victim.married` |
| Die Große Karawane stirbt → `SIM.caravanDied(c); caravanSurvivors(c)` → Aushang „Überlebende der Karawane“ (`missing`), sonst nichts | `die` `3565`, `caravanSurvivors` `7079–7086`, `sim.js:317` | E2 hängt eine Folgestufe an den geretteten Kutscher |
| Der Hinterhalt auf die Große Karawane spawnt nackte `bandit` ohne Bande | `sim.js:282–291` | E2 macht sie nachträglich zu einer Bande (oder ordnet sie einer nahen zu) |
| Vermisste gibt es zweimal: Auftrag `missing` (eine Person, Wendung `captive`) und der Varonheim-Kult (`S.cult.missing`, jede 2. Nacht, Blutzeichen, Vermisstenliste, Käfige, Befreiung) | `makeContract` `6780`, Ziel `7145–7148`, Heimschicken `7012`; `cultTake` `13042`, `cultProps` `13031`, `cultFree` `13165` | E4 ist die **weltliche** Verallgemeinerung des Kult-Musters ohne Kult |
| Spurensuche (`trail`): 3 sichtbare Spuren, dann ein Lager mit dem Täter | `makeContract` `6786–6788`, `TRAIL_CLUES` `7049`, `trailStep` `7064` | E4 (und optional E2) verlängern die Spur bis zu einem **echten** Ort |
| Das Brett räumt alle 3 Tage offene Angebote weg | `townContracts` `6849–6858` | Ereignis-Aushänge entweder sofort annehmen lassen (wie `nemesisHeir`) oder das Brett vorher auffrischen (wie `hauntContract` `6823`) |
| Orte aus `LOCATIONS` haben `kind` (`ruin`, `wild`, `camp`, `dungeon`) und `threat` | `world.js:20ff.` | E4 sucht den Unterschlupf dort, ohne neue Weltgenerierung und ohne `rnd()` in `world.js` |

**Dopplungen geprüft:**
- `docs/IST_ZUSTAND.md` Z. 793–807 (Auftragsarten, Wendungen, Rächer, Echo), Z. 817 (`evDeserters`), Z. 853 (Begegnungen). Nichts davon hat Namen, Verwandtschaft oder eine Spur zu einem echten Lager.
- `npc_eigene_ziele.md` §5.2 (#39 Kriegsmüdigkeit → Deserteurbanden über `bandFound`, `origin`) und §5.4 (#37 Hauptmann desertiert, „Zurück auf deinen Posten“). **E1 ist dazu ein Zusatz, keine Kopie:** E1 hängt an *jede* Deserteurbande eine Verwandtschaft. Heute entsteht sie aus `evDeserters`, später aus #39. Führt nach #37 ein Hauptmann die Bande, entfällt E1 für diese Bande (er ist selbst die Beziehung).
- `t12_strassen_herren.md` §5.2 plant `b.loot` (Beute) und `b.good`. E2 schreibt in **dasselbe** Feld, damit T12 es später übernimmt.
- `t10_ahnenfeind_heldentod.md`: Ahnenfeind = NPC tötet Spieler. E3 ist die Gegenrichtung (Spieler tötet NPC). Der Grund ist ein anderer und die Datenstruktur auch: Sie braucht keinen Kampfwert-Verlauf und keine Waffe aus dem Grab.
- `t08_gefangene_steckbriefe_ruf.md`: `captiveMenu`, `captiveChoices`, `rk:'band'`. E1 nutzt die Übergabe an eine Wache.
- `t23_fraktionsressourcen.md` F4 (Sklavenjagd der Kette gegen Tributdörfer). **E4 nimmt die Kette als Täter bewusst aus**, sonst doppelt.

---

## E1 — Der Deserteur und sein Bruder (Idee 2) · Größe **M**

### Kern
Eine Deserteurbande hat einen Anführer mit Namen. Sein Bruder steht als Wache am Tor der nächsten Valen-Stadt. Die Wache spricht den Spieler an: „Bring ihn heim, nicht tot.“ Der Spieler kann ihn heimholen, ihn töten (der Bruder erfährt es), ihn gefesselt dem Bruder übergeben oder die Sache liegen lassen.

### Auslöser im Code
- `evDeserters` (`game.js:10060`), aufgerufen über den Ereignis-Pool `EVENTS` (`10314`) aus `worldEvent()`.
- VORSCHLAG: `evDeserters` legt statt drei loser Räuber eine **Bande** an: `bandFound(t, [bx, by])` (`11237`). Danach folgen `b.origin = 'deserter'`, `b.lead` mit Vornamen, `b.name = 'Die Zerrissenen Röcke'` (falls frei, sonst der Name aus `BAND_NAMES`) und `deserterKin(b, t)`. Ist der Bandendeckel (3) voll oder schlägt `bandFound` fehl, läuft der alte Weg weiter (3 Räuber, ohne Bruder).
- Das fremde Zufalls-Kopfgeld in `evDeserters` entfällt. Stattdessen gibt es ein Kopfgeld auf **diese** Bande über den vorhandenen `bandKill`-Lohn.

### Ablauf
1. **`deserterKin(b, t)`:** Wähle die lebende, nicht automatische Wache `g` (`guard && post && GUARD_POSTS[post].faction === 'valen' && !robot`) in der Valen-Stadt mit Posten, die dem Lager am nächsten liegt. **Nie Varonheim** (die Belagerung ist frisch kalibriert). Gibt es keine, bleibt die Bande ohne Bruder.
   - `b.kin = { guardId: g.id, guard: g.name, post: g.post, state: 'open' }`, `g.kinBand = b.id`.
   - Anführername: `${Vorname}, ${g.name}s Bruder` steht nur im Bruder-Dialog. In Log und Lager heißt er `b.lead` (z. B. „Bero Graurock“), damit die Bandentexte gleich bleiben.
2. **Hinweis:** Log (`'faction'`): „Deserteure unter Bero Graurock lagern bei {where}. In {post} fragt eine Wache nach dir.“ Chronik wie heute.
3. **Die Wache spricht:** Neuer Talk-Hook `kinChoices(npc, choices)`, eingereiht neben `bandChoices` (Liste `11539`). Er gilt nur für `npc.kinBand` mit Bande am Leben und `b.kin.state === 'open'`.
   - Text: „„Bero ist mein Bruder. Er ist gegangen, als sie uns ohne Sold an die Furt schickten. Jetzt raubt er. Ich kann meinen Posten nicht verlassen — bring ihn heim. Nicht tot.““
   - Wahl **„Ich rede mit ihm.“** → Auftrag `kind:'rumor', rk:'band', bandRef: b.id, kin: true`, Kartenpunkt am Lager (`lie: false`), `giverName = g.name`, sofort angenommen (`acceptContract`, wie `13441`). Der Lohn steht unten.
   - Wahl **„Er hat sich entschieden.“** → nichts, `b.kin.state` bleibt `open`. Die Wache fragt beim nächsten Besuch nicht erneut (`g.kinAsked = day`).
4. **Am Lager** (der Unterhändler aus `bandSpawn`, `bandChoices` `11290`): Ist `b.kin` offen, kommt eine zusätzliche Wahl **„{g.name} schickt mich. Sag Bero, sein Bruder wartet.“** Bero tritt vor (die Figur `bandLead` wird kurz `parley`). Drei Ausgänge:
   - **Heimholen:** Gelingt, wenn eins zutrifft: Valen-Ruf ≥ 0, oder 60 Gold „Sold, den die Krone schuldet“, oder Ruf der Klinge ≥ 40 (T08 `styleOf()`). Dann gehen Bero und die halbe Bande (`b.men = ceil(men/2)`). Danach `bandGone(b, …)`, `b.kin.state = 'home'`. Ist in `S.schutz[post].lost > 0` ein Posten frei, füllt Bero ihn (`lost − 1`, Log „Bero steht wieder am Tor von {post}“). Sonst geht er heim (nur Log).
   - **Scheitern:** Bero lacht. „„Für eine Krone, die nicht zahlt?““ Kampf, Anführer wie bisher.
   - **Lebend fangen** (T08, schon gebaut): Kommt Bero gefesselt zu **seinem** Bruder, gibt `captiveChoices` (`13510`) eine eigene Wahl „Deinen Bruder übergeben“: `state = 'handed'`. Die Bande zerfällt, und der Bruder entscheidet nach Charakter: 50 % Gnade (Bero geht heim), 50 % Krone (Bero hängt). Beides kommt in die Chronik.
5. **Tod des Anführers** (in `bandKill` `11285`, wenn `b.kin`): `state = 'killed'`. Die Wache weiß es beim nächsten Gespräch: Beziehung −40, Gruß „„Du hast ihn erschlagen. Geh mir aus den Augen.““, keine Plauderei und keine Aufträge von ihr. Mit 35 % setzt der Tod `S.avenge = { day: day + ri(2, 4), name: b.lead }`. Das ist der **vorhandene** Rächer (`2577`), jetzt mit echtem Grund. Die Wache bleibt auf dem Posten (die Regel „angegriffene Wachen helfen nie auf“ bleibt unberührt).
6. **Liegen lassen:** Zerfällt die Bande von selbst (`bandDay`, `11253`), dann `state = 'lost'` und Log „Die Röcke haben sich zerstreut. Von Bero hat man nie wieder gehört.“ Die Wache sagt beim nächsten Besuch „„Er ist fort. Vielleicht ist das besser so.““

### Lohn und Balance (`docs/BALANCE_GUIDE.md` §6)
- Heimholen: 40 Gold (Erspartes der Wache) + Beziehung +30 + EP wie ein Auftrag (≈ 4 Kills, d. h. `50 + Stufe × 8`). **Kein** Bandenkopfgeld: Wer heimholt, verzichtet auf `bandKill`-Gold (60 + 10 × Männer). Das ist der Preis der Gnade.
- Valen: Heimholen −2 (Fahnenflucht ungestraft), Übergeben an die Krone +3, Töten +1 (wie heute über `facAdd` in `bandKill`).
- Bero als Anführer: unverändert `bandSpawn` (Leben ×1,8, Elite). Keine neuen Kampfwerte, keine `simFight`-Messung nötig.

### Speicherfelder (alte Stände tolerieren)
- `S.bands[i].kin` (Objekt oder fehlt) und `S.bands[i].origin` (fehlt = gewöhnliche Bande). `npc_eigene_ziele.md` #39 und T12 verwenden dasselbe `origin`.
- Auf der Wache: `kinBand`, `kinAsked`. Wachen werden gespeichert. Stirbt die Wache, gilt `state = 'orphan'` (byId → tot): Der Auftrag scheitert ohne Rufverlust, so wie `conTick` heute bei toten Auftraggebern verfährt (`7124`).
- Keine Migration nötig: Ohne `kin` verhält sich alles wie heute.

### Debug-Eintrag (`debugSections`, Abschnitt „Ereignisse“, `14718`)
- „Deserteure mit Bruder (nächste Valen-Wache)“ → `evDeserters()` und danach ein Toast mit Bande, Anführer und Wache.
- „Bruder-Auftrag: Anführer heimholen (sofort)“ → setzt die Heimholen-Folge an der ersten Bande mit `kin`.

### Selbsttest-Proben (in `selftest()`, mit `sandbox()`)
1. **„E1: evDeserters baut eine Bande mit Bruder“:** Bandendeckel leeren, `evDeserters()`. Prüfen: neue Bande mit `origin 'deserter'`, `kin.guardId` zeigt auf eine lebende Valen-Wache, deren `kinBand` passt. Mit drei Banden voll: der alte Weg (3 Gegner, keine Bande).
2. **„E1: Tod des Anführers kränkt den Bruder“:** Bande mit `kin` anlegen, Anführer spawnen, `die(lead, …, p)`. Prüfen: `kin.state === 'killed'`, Beziehung der Wache um 40 gesunken, Bande fort. Das echte `S.avenge` vorher sichern und nachher zurückschreiben.

### Exploits
- **Doppelt kassieren** (heimholen, dann die Restbande für Kopfgeld töten): `bandGone` beim Heimholen entfernt die Bande ganz. Die halbe Bande „geht mit“.
- **Wache töten, damit der Auftrag verfällt:** Mord an einer Wache = vorhandene Folgen (`bloodshed`). Der Auftrag scheitert ohne Lohn.
- **Heimholen für 60 Gold kaufen:** Gewollt (die Krone schuldet Sold), aber nur einmal je Bande. Kosten und Lohn (40 Gold) gleichen sich fast aus; der Gewinn ist die Beziehung.

### Anschluss
- `npc_eigene_ziele.md` #39: Sobald Deserteurbanden aus der Kriegsmüdigkeit entstehen, ruft deren `bandFound(…, opts)` ebenfalls `deserterKin`. #37: Führt ein desertierter Hauptmann die Bande (`b.vmOf`), dann **kein** `deserterKin`.

---

## E2 — Den Karawanenräubern bis ins Lager folgen (Idee 4) · Größe **S** (Kern), **M** mit Spur

### Kern
Stirbt die Große Karawane, waren es **bestimmte** Räuber. Der gerettete Kutscher sagt, wer und wohin. Daraus wird ein Auftrag, der auf ein echtes Bandenlager zeigt, in dem die Ladung liegt.

### Auslöser im Code
- `die()` Zweig `kind === 'caravan'` (`game.js:3564–3570`) → `caravanSurvivors(c)` (`7079`).
- Abschluss der Kutscher-Rettung: die Wahl „Geh heim. Der Weg ist frei.“ in `conChoices` (`7012`) → `conProgress(C)`.

### Ablauf
1. **Täter bestimmen** (in `caravanSurvivors`, VORSCHLAG `caravanCulprit(c)`):
   - (a) `byId(c.lastKiller)?.bandId` → diese Bande.
   - (b) sonst die nächste `bandsOf()`-Bande im Umkreis von 60 Feldern.
   - (c) sonst eine neue Bande: `bandFound(town, [Überfallort ± 25–40 Felder abseits der Straße])` mit `origin: 'caravan'`.
   - (d) Bandendeckel voll und keine nahe Bande → heutiges Verhalten (nur Vermisstensuche).
   - Ist der Spieler oder seine Gruppe `lastKiller`, gibt es **keinen** Täter und **keine** Überlebenden-Suche. Stattdessen Händler −10, Chronik `'crime'` „Wer die Karawane überfiel, trug kein Bandenzeichen.“ Das schließt den naheliegenden Missbrauch.
2. **Beute:** Die zweite Hälfte der Ladung (die erste liegt heute auf der Straße, `3567`) geht an die Bande: `b.loot += Summe`, `b.good = häufigste Ware`. Dasselbe Feld wie T12 §5.2. Bis T12 kommt, wirkt `loot` nur als Kiste (Schritt 4).
3. **Räuber ziehen ab** (ANNAHME: KI kehrt ohne Ziel zum Anker zurück): Noch lebende Hinterhalt-Räuber im Umkreis von 15 Feldern bekommen `bandId = b.id`, `anchor` = Lager. Wer zusieht, sieht sie mit der Beute weggehen. So wird „verfolgen“ wörtlich.
4. **Kutscher:** Das Angebot „Überlebende der Karawane“ bleibt. Der Text nennt jetzt die Bande: „„Es waren {b.name}. Sie haben die Ochsen mitgenommen.““ Wird er heimgeschickt (Wahl `7012`), folgt sofort der Folgeauftrag:
   - **Kern (S):** `kind:'rumor', rk:'band', bandRef: b.id, caravan: true`, Titel „Die Ladung zurückholen: {b.name}“, Kartenpunkt am Lager. Erfüllt über die vorhandene Prüfung in `rumorTick`, sobald die Bande fort ist.
   - **Mit Spur (M, optional):** `kind:'trail'` mit `C.bandRef`. `C.pts[0..2]` liegen auf der Linie Überfallort → Lager, `C.pts[3]` = Lager. `trailStep` spawnt in Stufe 3 **kein** Ersatzlager (`7071–7076`), weil die echte Bande über `bandTick` da ist. `conKill` schaltet weiter, wenn `e.bandLead && e.bandId === C.bandRef`. Neue Spurtexte: Wagenspuren, verlorener Salzsack, Ochsendung.
5. **Lagerkiste:** Fällt der Anführer (`bandKill`), steht am Lagerfeuer eine Kiste mit `min(20, b.loot)` Stück `b.good` (T12 §5.2 plant genau diese Kiste; E2 baut sie vor). Spieler-Wahl beim Kontorhändler von Nordfurt/Eren: **„Die Ladung zurückgeben“** (je Ladung 4 Gold Finderlohn, Händler +4, Stadtlager `+n`, `stockShock` positiv) oder behalten (Händler −3, wenn der Kontorhändler die Ware im Inventar sieht; nur Log, keine Strafe sonst).

### Spieler-Hinweis
- Log beim Tod der Karawane: „Die Spuren der Räuber führen nach {where}. Wer den Kutscher findet, erfährt mehr.“
- Kutschertext (oben) und Toast „SPUR: {b.name}“, wenn der Folgeauftrag entsteht.

### Lohn und Balance
- Folgeauftrag: `reward.gold = 40 + tier × 25` (Formel aus `makeContract` `6767`) + `bandKill`-Kopfgeld (vorhanden) + Finderlohn. Insgesamt bei Stufe 10 ≈ 90 + 100 + 40 Gold. Das liegt im Rahmen von „Lager ausheben“ (`camps`: +50 je Lager).
- Kampf: unverändert eine Bande mit 4–6 Mann (`bandFound`). Kein neuer Gegner.

### Speicherfelder
- `S.bands[i].origin`, `.loot`, `.good` (fehlen = 0/keins). Auftrag: `C.bandRef`, `C.caravan`. Alles darf fehlen.

### Debug-Eintrag
- „Karawane stirbt jetzt (mit Täterbande)“ → sucht die Karawane und ruft `die(c, 'Räuber', nächsterBandit)`.
- „Kutscher gerettet (Folgeauftrag)“ → erfüllt den offenen Überlebenden-Auftrag.

### Selbsttest-Proben
1. **„E2: Karawanentod legt eine Täterbande mit Beute an“:** `caravanSurvivors({ x, y, cargo: { salt: 8 } })` ohne Banden. Prüfen: Bande mit `origin 'caravan'`, `loot === 4`. Der Überlebenden-Auftrag nennt den Bandennamen. Die vorhandene Probe `16870` muss weiter grün sein (Titel enthält „Karawane“).
2. **„E2: Spieler als Täter → keine Bande, Händler −10“:** `lastKiller = p.id`, `caravanSurvivors`. Prüfen: keine neue Bande, kein Auftrag, `S.factions.merch` um 10 gesunken (danach zurückschreiben).

### Exploits
- **Karawane selbst töten:** abgefangen (siehe 1., Händler −10, kein Auftrag).
- **Kiste farmen:** Die Kiste gibt es nur einmal je Bande. `b.loot` stammt nur aus echten Überfällen. Die Karawane braucht nach dem Tod 2 Tage (`S.caravanBack`, `sim.js:320`).
- **Bandendeckel sprengen:** (c) gilt nur, wenn weniger als 3 Banden aktiv sind. Je Karawanentod höchstens eine neue Bande.

---

## E3 — Die Witwe heuert einen Mörder (Idee 5) · Größe **M**

### Kern
Wer einen verheirateten Bewohner oder einen Hausgenossen tötet, hinterlässt jemanden. Diese Person trauert einige Tage und kauft dann einen Mörder. Der Mörder trägt einen Zettel bei sich. Der Spieler kann die Witwe danach aufsuchen: Wergeld zahlen, mit ihr reden, sie der Wache melden oder (schlechtester Weg) auch sie töten.

### Auslöser im Code
- `bloodshed(victim, wasFoe)` (`game.js:3649`), am Ende, **nur** bei `wasFoe === false` (Mord an einem Unschuldigen). Gerufen aus `die` (`3636`), auch für Koop-Mitspieler.
- Hinterbliebene: (a) `byId(victim.married)` lebt → Witwe/Witwer; (b) sonst ein lebender, erwachsener Bewohner mit gleichem `homeId` (`spawnResidents` `866`) → Bruder/Schwester/Mutter, nach `femTrade`. Gibt es keinen, entsteht kein Groll.

### Ablauf
1. **Groll anlegen** (`grudgeFrom(victim, seen)`): Chance (a) 70 %, (b) 40 %. Ohne Zeugen (`seen === false`) halbiert, denn die Witwe muss es erst erfahren. Höchstens **2** offene Groll-Einträge, je Opfer einer.
   - `S.grudges.push({ id, who: kin.id, whoName, victim: victim.name, town: kin.homeTown, day, at: day + ri(3, 6), tries: 0, state: 'mourn' })`, `kin.grudgeId = id`.
   - Hinweis sofort: Spricht man die Hinterbliebene an, sagt sie „„Du. Du warst es.““ (Talk-Hook `grudgeChoices`, neben `bandChoices` in `11539`). Mit Zeugen außerdem Log (`'crime'`): „{whoName} hat gesehen, wer {victim} erschlagen hat.“
2. **Trauer → Anwerbung** (`grudgeDay()`, täglich aus `dayTick` `11078`): Ist `day >= at`, die Hinterbliebene lebt und `state === 'mourn'`, dann `state = 'hired'`. Ihr Ort verliert `prosper −2` (sie verkauft, was sie hat). Gerücht über den Wirt (`tavernChoices`, vorhanden): „„{whoName} hat ihr letztes Silber zu {Bande} getragen. Pass auf, wen du nachts triffst.““ Ist keine Bande in der Region, heißt es „zu einem Fremden mit Narbengesicht“.
3. **Der Mörder kommt:** Über die vorhandene Begegnungs-Auswahl (`2695`). Ist ein Groll `hired` und der Spieler in der Wildnis, wird statt einer Zufallsbegegnung `spawnChoiceEncounter(…, 'hired')` gewählt. Neue `ENC_KINDS.hired` nach dem Muster von `avenger`:
   - Name „Gedungener“ (bzw. „{Name} aus {Bande}“), Gruß „„Nichts Persönliches. {whoName} hat bezahlt.““
   - Wahlen: **Kämpfen**; **Überbieten** (das Doppelte des Lohns, 80–120 Gold: Er geht, aber der Groll bleibt `hired`, und in 4–7 Tagen kommt der nächste); **„Sag ihr, ich komme selbst.“** (er greift trotzdem an, aber die Witwe ist danach auf der Karte markiert).
   - Kampfwerte: `bandit` oder `bandit_spear`, Stufe = Spielerstufe + 1, Leben ×1,5, `elite`. Auf Schwer 1 Gehilfe, auf Sehr schwer 2 (aus `conPool`).
   - Tot oder geschlagen: Log „In seiner Tasche: ein Zettel mit deinem Namen. Unterschrieben von {whoName} aus {town}.“ Dazu `tries++`. Dann folgt ein Auftrag `kind:'rumor', rk:'grudge', ref: id` mit Kartenpunkt bei der Witwe, Titel „Die Auftraggeberin: {whoName}“.
4. **Auflösung bei der Witwe** (`grudgeChoices`):
   - **Wergeld zahlen** (50 + 20 × Spielerstufe / 5, höchstens 150): `state = 'paid'`. Ihr Gruß wird kalt, der Groll ist vorbei. Chronik „{p} zahlte Wergeld für {victim}“. Ruf der Klinge +2 (T08 `styleAct`).
   - **Reden** (nur wenn die Tat `wasFoe` knapp verfehlte, d. h. das Opfer hatte den Spieler bedroht, ANNAHME über `c.threatId`, oder mit Wahrnehmung ≥ 12): 40 %, dass sie aufgibt.
   - **Der Wache melden:** Eine Wache im Ort nimmt sie mit (wie der Deserteur `2639`). Ihr Haus wird leer (`emigrate`-Weg `1440` mit Grund „Kerker“). Valen bzw. die Ortsfraktion +1, Ort `prosper −3`. Die Gruppe murrt (Moral −4, außer `grausam`).
   - **Töten:** ein zweiter Mord mit allen Folgen von `bloodshed`. Er kann einen **neuen** Groll eines weiteren Hausgenossen auslösen (Deckel 2 bleibt).
   - **Nichts tun:** Nach 2 gescheiterten Mördern (`tries >= 2`) gibt sie auf: `state = 'done'`. Log „{whoName} hat nichts mehr, womit sie zahlen könnte.“
5. **Ende ohne Spieler:** Stirbt die Hinterbliebene anderweitig, `state = 'done'`. Beim Erbenwechsel (`chooseSuccessor`) bleibt der Groll bestehen und trifft den Erben (das Haus ist gemeint), aber mit `tries = max(tries, 1)`, damit er schneller ausläuft.

### Balance
- Ein Mörder = ein Elite-Mensch der Gefahr 2 auf Spielerstufe + 1. Leitfaden §4: Elite-Menschen sterben am Rumpf (≈ 45 %), Leben ×1,5 bleibt unter dem Bandenanführer (×1,8). Ziel: 15–35 % Lebensverlust bei gleicher Stufe ohne Trank. Messen mit `RF.simFight('bandit', { level: L, elvl: L + 1, ehp: …×1,5, mode: 'smart' })` für L = 5, 15, 30, je 3 Seeds.
- Häufigkeit: höchstens 2 Groll-Einträge × 2 Mörder = 4 Kämpfe je Mordserie. Das ist weniger als die vorhandenen Kopfgeldjäger ab 150 Gold Kopfgeld (`addBounty`).
- Lohn des Mörders (sein Beutel): 40–80 Gold, aus dem Wohlstand der Witwe (`prosper −2`). Das ist kein Geld aus dem Nichts.

### Speicherfelder
- `S.grudges` (Liste, fehlt = leer). Auf der Hinterbliebenen: `grudgeId`. Bewohner werden gespeichert. Flüchtige Figuren (`transient`) bekommen **keinen** Groll.
- Auftrag `rk:'grudge'`. In `rumorTick` endet er, wenn der Groll `paid/done` ist oder die Witwe nicht mehr lebt.

### Debug-Eintrag
- „Groll: nächster Bewohner trauert (sofort angeworben)“ → `grudgeFrom` am nächsten Bewohner mit Hausgenossen, `at = day`.
- „Gedungener Mörder jetzt“ → `spawnChoiceEncounter(near, 'hired')`.

### Selbsttest-Proben
1. **„E3: Mord an Verheiratetem legt Groll an, Feind-Tod nicht“:** zwei `actor` mit `married` aufeinander. `bloodshed(a, false)` bei erzwungenem Wurf: Groll mit `who === b.id`. `bloodshed(a2, true)`: kein Groll. Ruf, Kopfgeld und Flaggen sichern und zurückschreiben (wie die Probe `15450`).
2. **„E3: Trauerzeit, Anwerbung, Wergeld beendet“:** Groll mit `at = day`, `grudgeDay()` → `hired`. Wergeld-Wahl → `paid`; die Begegnung `hired` wird danach nicht mehr gewählt.

### Exploits
- **Mörder farmen** (Beutel, EP): höchstens 2 je Groll, 2 Groll-Einträge zugleich, und jeder Groll braucht einen Mord (Ruf −10, Kopfgeld 250 mit Zeugen). Lohnt nie.
- **Überbieten als Dauerschleife:** Überbieten verlängert den Groll, ohne ihn zu beenden. Wer zahlt, zahlt weiter. Wergeld ist der billigere Weg.
- **Witwe vor der Anwerbung töten:** zählt als zweiter Mord (siehe oben). Kein Schlupfloch.
- **Koop:** Nur der Wirt würfelt. Der Mörder sucht den Helden des Wirts. ANNAHME: Gäste-Morde laufen schon über `bloodshed` (`3636`) und landen damit im selben Haus.

### Abgrenzung
- `S.avenge` (einzelnes Feld, Zufall nach Kopfgeld) bleibt unverändert. E3 baut **nicht** darauf auf, sondern daneben, weil `S.avenge` nur einen Eintrag fasst und keinen Auftraggeber kennt. Dieselbe Begegnungs-Auswahl entscheidet, wer zuerst kommt: `avenge` hat Vorrang (älter).

---

## E4 — Vermisstenwelle außerhalb Varonheims (Idee 6) · Größe **M**

### Kern
In einem Dorf verschwinden Menschen, aber es ist **kein** Kult. Ghule schleppen Schlafende in eine Ruine, Goblins rauben Arbeitskräfte, Menschenfänger fangen Leute für die Märkte. An den Türen liegen Spuren. Am Brett hängt die Suche. Die Spur endet an einem echten Ort der Karte. Wer schnell ist, findet die Vermissten lebend.

### Auslöser im Code
- Neuer Tagesschritt `vanishDay()` in `dayTick` (`game.js:11078`, neben `conEchoDay`). Tageszeit-Teil über die Stundenschleife wie `cultHour` (Nacht 2 Uhr).
- Vorlage: `cultTake` (`13042`), `cultProps` (`13030`), `cultFree` (`13165`). Ort des Unterschlupfs: `LOCATIONS` (`world.js:20`). Ziel-Ablauf: `trail` (`makeContract` `6786`, `trailStep` `7064`).

### Ablauf
1. **Beginn** (`vanishDay`): Keine Welle aktiv, Tag ≥ 15, `day >= S.vanishCd`, Chance 3 % am Tag. Ortswahl: ein Dorf (`TOWN_PLAN[k].village`), nicht `varonheim`, nicht `vharnholm`, nicht zerstört oder besetzt, ohne laufendes großes Ereignis (`hasBigAt`). Es braucht einen `LOCATIONS`-Ort mit `kind` in (`ruin`, `wild`, `dungeon`) und `threat ≥ 2` in 30–90 Feldern.
   - Täter nach Region des Unterschlupfs (`regionAt`): `deadland` oder Ort mit `faction 'undead'` → **Ghule**; `mountain/eisen` → **Goblins** (wilde, nicht Grubenhort-Freie); sonst → **Menschenfänger** (`bandit`, `bandit_spear`). **Nicht** die Kette (T23 F4).
   - `S.vanish = { town, cause, loc: key, tx, ty, day0: day, taken: [], clue: 0, state: 'on' }`. Log und Chronik erst beim ersten Opfer.
2. **Nächtliches Verschwinden** (jede 2. Nacht 2 Uhr, höchstens 4): wie `cultTake`, aber mit `villagersOf(town)` (`6080`) und denselben Ausschlüssen (Händler, Wachen, benannte Figuren, Bettlägerige). Die Figur wird aus der Welt genommen und mit Tag in `taken` gespeichert.
   - Spur an der Haustür (Prop, `transient`, neu gesetzt beim Laden wie `cultProps`): Ghule → `blood` mit Label „Schleifspur“; Goblins → `blood` mit Label „Kleine Fußabdrücke, Ruß“; Menschenfänger → `sign` mit Label „Seilfasern am Fensterladen“. Lesen gibt einen Satz zum Täter.
   - Log (`'world'`): „In {Ort} fehlt seit heute Nacht {Name} ({Beruf}). {Spurtext}“; Chronik `'news'`. Ort `prosper −2`, `badDays +1` (wirkt über die vorhandene Abwanderung `migrationDay` `1430`).
   - Am Platz eine **Vermisstenliste** (`sign`, Label „Vermisstenliste“), deren Text Namen und Tage nennt (wie `cultProps`).
3. **Aushang:** Beim ersten Opfer frischt `vanishPost(town)` das Brett auf (`townContracts(town, 'board')`, Muster `hauntContract` `6823`). Dann hängt ein `trail`-Auftrag mit `C.vanish = true` aus:
   - `C.pts[0..2]` vom Ortsrand Richtung Unterschlupf, `C.pts[3]` = Unterschlupf. Eigene Spurtexte je Täter (3 je Art).
   - Titel „Die Verschwundenen von {Ort}“, Text nennt die Zahl der Vermissten.
   - Läuft der Auftrag schon, aktualisiert ein neues Opfer nur den Text. Das Brett räumt den Auftrag nicht weg (`C.vanish` wird in `townContracts` beim Fegen übersprungen).
4. **Am Unterschlupf** (Zweig in `trailStep`, wenn `C.vanish && C.have === 3`, statt des Ersatzlagers `7071–7076`): Je nach Täter spawnen 3–5 Gegner aus `conPool` der Gegend, dazu ein Anführer (`elite`, Leben ×1,5; Ghule: ein Ghul der Stufe +2 als „Alter Fresser“). Dazu die Gefangenen:
   - **Lebend**, wenn `day − taken.day ≤ 5`: gefesselt (`captiveOf`, wie Vermisste mit Wendung `captive`, `7147`). Nach dem Kampf „Geh heim“ → Figur kehrt mit `homeId` zurück (Muster `cultFree`).
   - **Zu spät:** Ghule → ein Grab mit Namen; Menschenfänger → „verkauft“ (Log: „{Name} wurde nach Süden verkauft.“; ein späterer Hook nach Aurelion ist möglich, hier nicht gebaut); Goblins → „in den Stollen“ (tot).
   - Der Auftrag ist erfüllt, wenn alle Auftragsgegner tot sind: `S.vanish.state = 'done'`, `S.vanishCd = day + 20`.
5. **Nichts tun:** Nach 4 Opfern oder 12 Tagen endet die Welle von selbst: `state = 'fed'`, Ort `prosper −8`. Chronik „{Ort} hat vier Menschen verloren. Niemand kam.“ (vergleichbar `ignoredContract` `6805`). Abkühlung 20 Tage.

### Spieler-Hinweis
- Erstes Opfer: Log + Toast „VERMISST IN {ORT}“. Spurprop an der Tür. Liste am Platz. Wirte und Wachen haben 2 Zeilen für `gossip` (`TOWN_GOSSIP`-artig, aus `S.vanish`).
- Im Auftragstext steht die Frist offen: „„Wer länger als fünf Tage fort ist, kommt nicht wieder. Sagt der Jäger.““ (Regel „Explain to player“).

### Lohn und Balance
- Auftrag: `trail`-Lohn (`40 + tier × 25 + 70`) + 30 Gold je lebend Heimgekehrtem + Ort `prosper +3` je Heimkehrer. EP: 5 gleichwertige Kills (Leitfaden §6, Auftrag ≈ 3–8 Kills).
- Gegner: Gefahr 1–3 aus `conPool`, Zonenstufe. Anführer wie Bandenanführer, aber ×1,5 statt ×1,8, weil keine Bande dahintersteht. Ziel nach Leitfaden §4: Gruppe 30–50 % Lebensverlust auf gleicher Stufe. Messen: `simFight` gegen Anführer ×3 Seeds; die Gruppe lässt sich nicht nachbilden, also eher pessimistisch rechnen.

### Speicherfelder
- `S.vanish` (Objekt oder fehlt), `S.vanishCd` (Zahl oder fehlt). `taken[]` speichert die Bewohner-Figur wie `S.cult.missing[].ent`. Das ist bewährt, denn `cultTake` macht es schon so und es übersteht das Speichern.
- `ensureVanish()` in `newGame()`/`continueGame()` (neben `ensureBloodCult();`, `1874`/`2064`) setzt Türspuren und Liste neu (flüchtige Props).

### Debug-Eintrag
- „Vermisstenwelle im nächsten Dorf starten“ → `vanishStart(nächstesDorf)` + sofort ein Opfer.
- „Vermisstenwelle: 3 Tage vorspulen (Opfer altern)“ → `taken[].day −= 3`.

### Selbsttest-Proben
1. **„E4: Welle nimmt einen Bewohner, legt Spur, Liste und Aushang an“:** Dorf mit Unterschlupf wählen, `vanishStart` + `vanishTake`. Prüfen: Bewohnerzahl −1, `taken.length === 1`, Türspur-Prop vorhanden, `trail`-Auftrag mit `vanish`, Endpunkt = Ort aus `LOCATIONS`. Nie in Varonheim (zweiter Aufruf mit `town = 'varonheim'` liefert `null`).
2. **„E4: Rechtzeitig befreit kehrt heim, zu spät nicht“:** zwei Opfer, eins mit `day − 7`. `trailStep` auf Stufe 3 → genau ein gefesselter Gefangener. Gefangenen heimschicken → Figur wieder in `villagersOf`. Welt danach zurücksetzen (`sandbox`).

### Exploits
- **Welle auslösen und Befreiung farmen:** eine Welle gleichzeitig, 20 Tage Abkühlung, höchstens 4 Opfer, Lohn je Heimkehrer 30 Gold.
- **Opfer absichtlich altern lassen:** bringt nichts (weniger Lohn).
- **Mit Kult kombinieren:** Varonheim ist ausgeschlossen, also kann der Spieler die Kultspuren nicht verwechseln.
- **Dorf leer laufen lassen:** `villagersOf` braucht mindestens 3 Bewohner, sonst beginnt keine Welle. `ruinCheck` (letzter Bewohner tot) kann nicht über E4 ausgelöst werden, weil Opfer nicht sterben, solange sie in `taken` sind.

---

## 5. Gemeinsame Regeln (alle vier Scheiben)

- **Explain to player:** Jede Scheibe hat Log und Chronik beim Auslösen, einen Dialog oder Aushang mit Ziel und einen sichtbaren Ort auf der Karte. Am Ende jeder Runde kommt ein Absatz in `docs/MECHANIKEN.md` (Regel aus `CLAUDE.md`).
- **Determinismus:** Keine Scheibe ruft `rnd()` in `world.js` auf. Neue `chance()`/`pick()` in `game.js` verschieben zufallsabhängige Proben. Fällt eine fremde Probe, zuerst deren Zwischenwerte loggen.
- **Koop:** Nur der Wirt rechnet und speichert. Dialoge laufen über `uiHooks` wie heute.
- **Keine Code-Zeile hinter `//`**, CRLF in `game.js` und `sim.js` bewahren (`scratchpad/ed.py`).
- **Reihenfolge, wenn mehrere gewählt werden:** E2 (klein, reiner Anbau) → E1 → E4 → E3. E1 vor E3, weil E3 die Begegnungs-Auswahl teilt.

## 6. Fragen an den Entwickler (höchstens 3)

1. **Welche Scheiben zuerst?** Empfehlung: **E2 (Kern, S) und E1 (M)** zuerst. Beide nehmen deine Beispiele wörtlich und bauen nur auf vorhandene Banden. E4 folgt als nächste, E3 zuletzt (zweites Rachesystem, größtes Risiko).
2. **E1: Darf ein heimgeholter Deserteur wieder Wache werden** (einen verlorenen Posten füllen, `S.schutz[post].lost − 1`), oder geht er nur heim? Empfehlung: **ja, er füllt einen Posten**, aber nur in Valen-Städten mit Verlusten und **nie in Varonheim**. So greift die Gnade sichtbar in die Welt ein.
3. **E3: Trifft der Groll auch den Erben?** Empfehlung: **ja, aber verkürzt** (höchstens noch ein Mörder). Das Haus bleibt schuldig, ganz wie beim Ahnenfeind, und Sterben wischt eine Untat nicht weg.
