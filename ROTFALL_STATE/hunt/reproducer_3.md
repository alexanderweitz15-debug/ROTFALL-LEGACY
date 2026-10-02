# Reproducer 3 — Urteile zu Reproduktions-Liste 3 (Quests, neutral)

Arbeitsweise: Code gelesen (aktuelle Zeilen über Funktionsnamen gesucht, nicht die im Auftrag genannten Zeilennummern — die sind
teils verschoben, aber inhaltlich noch dieselben Funktionen). Live im Browser (`?dev`, Tab eigener `tabId`) geprüft: R-QA-03
vollständig End-zu-Ende (Spielstand-Sicherheit beachtet, Wegwerf-Slot `__hunt_testR3` angelegt und danach gelöscht, Backup
zurückgespielt). Die übrigen 19 Urteile stammen aus genauem Lesen der zitierten und benachbarten Funktionen (Codebeleg
jeweils mit Zeile/Zitat); keine volle Durchspielung der Questketten, da das bei 20 Einträgen im Rahmen nicht zu leisten war.
Das ist ausdrücklich vermerkt — kein Urteil behauptet mehr Prüfung, als stattfand.

## Tabelle

| ID | Urteil | Kurzbeleg |
|---|---|---|
| R-QA-01 | NOT REPRODUCED | `offerQuest` spawnt die Skelette bei genau `x:76,y:52` — identisch mit `LOCATIONS.find(l=>l.key==='shrine')` (`world.js:29`, `x:76,y:52`). Keine Abweichung gefunden. |
| R-QA-02 | CONFIRMED | `evaded()` (game.js:13900) schreibt Ausweich-Fortschritt nur in `S.quests.q_monk`, hart codiert. Für `c_mon1/2/3` (dodge-Ziele in data.js:1174–1179) gibt es keinen zweiten Aufrufer — nirgends sonst wird ein `dodge`-Objective-Fortschritt erhöht. |
| R-QA-03 | CONFIRMED (live) | Live reproduziert: `p.vamp.frenzyT` = alter `performance.now()`-Wert übersteht Speichern/Laden (Lade-Reset game.js:2075–2111 nennt `vamp` nicht). Nach Reload bleibt `frenzyT > performance.now()`, `RF.tick()` setzt `vx=vy=0` jede Runde — Figur bewegungsunfähig. |
| R-QA-04 | CONFIRMED | „Ich fordere dich heraus“ setzt `w.parley=false` (game.js:7813) dauerhaft; einzige Stelle, die `parley` für Weißbart je wieder auf `true` setzt, existiert nicht. `teamOf()` (3098) verlangt `c.parley` für „neutral“ — danach bleibt er für immer Feind/stumm. |
| R-QA-05 | CONFIRMED | `cancelQuest('c_'+id)` ruft `failContract` (game.js:6902), die nur `C.state`/`S.quests[...]` ändert, aber `S.flags.varonQ` nicht zurücksetzt. `royalStart`-Angebot erscheint nur bei `Q===0` (8887), `Q===1`-Fortsetzung nur mit `varonQ1done` (8889) — beides unerreichbar nach Abbruch. |
| R-QA-06 | CONFIRMED | Gorak wird einmalig gespawnt (`spawnEnemy('gorak','mine',32,13,{level:10})`, game.js:1832), kein Respawn. `q_mine`-Ziel ist `kill:gorak:1` (data.js:1120); die Vorab-Anrechnung beim Start (game.js ~12396) gilt nur für `hrodvar` und `REGION_BOSSES` (alpha/sandlord/chainmaster) — Gorak ist dort nicht gelistet. |
| R-QA-07 | CONFIRMED | `tribTick()` (game.js:5881): `byPlayer = L.lastKiller === S.player.id \|\| (dist(S.player, L) < 220 && !L.brawl)` — reine Nähe zählt schon als „geraubt“, unabhängig vom tatsächlichen Totschläger (Hinterhalt-Banditen). |
| R-QA-08 | CONFIRMED | `openPen()` (game.js:5577) bricht sofort ab, wenn `S.flags.chainsBroken` (Varg gefallen) — vor der Fortschritts-/Abschlusslogik. Kein anderer Code schließt `q_pferch`; Quest bleibt `active` hängen, falls vor Vargs Fall angenommen, aber die Pferche nicht geöffnet wurden. |
| R-QA-09 | CONFIRMED | `q_rotfall.progress` wird in `omegaFrag()` bis `OMEGA_NEED=9` hochgezählt (game.js:9196–9204), aber nirgends wird `S.quests.q_rotfall.state` auf `'done'` gesetzt oder `gainXp` für `QUESTS.q_rotfall.reward.xp` (400, data.js:1163) aufgerufen. Die Folgequest `q_omega` schließt separat ab (9282) — `q_rotfall` bleibt für immer `active`. |
| R-QA-10 | CONFIRMED | `stormCheck()` (game.js:7760) setzt bei Sturm-Abbruch nur `d.goblinStorm=false; d.aggroId=null` — anders als `goblinStormWon()` (7765) setzt es **nicht** `d.parley=true` und auch den `anchor` nicht zurück. Dodon bleibt daher ohne Dialogmöglichkeit. |
| R-QA-11 | CONFIRMED | `buildCatacombs()` (game.js:13494, Zeile mit `if (krypta && C.end !== 'destroyed' && C.end !== 'player')`) prüft nur `C.end`, nicht `C.aldhelmDead`. Stirbt der Spieler-Blutfürst, setzt `cultHeroDied()` (13674) `C.end='hidden'` — das erfüllt die Spawn-Bedingung erneut, Aldhelm erscheint wieder, obwohl er vorher (als Aldhelm) schon gefallen war. |
| R-QA-12 | CONFIRMED | `cancelQuest` löscht nur `S.quests[k]` (game.js:6914), kein Sperr-Flag. `questAvailable('q_grisk_rache')` prüft nur `S.flags.goblinsFreed` — erneutes Annehmen möglich. `spawnChainRest()` (6331) und `seaTagSpawn()` (7785) setzen bei ihren Spawns kein `transient:true` — jeder Zyklus Abbrechen→Neu-annehmen erzeugt zusätzliche dauerhafte Gegner. |
| R-QA-13 | CONFIRMED (strukturell) | `spawnType()` (game.js:1791) wandelt nach `chainsBroken` jeden `rotgardist`/`kettenschuetze`-Spawn in `bandit` um (Eisenmark-Gebiete) und unterdrückt `goblin`/`goblin_warrior` nach `goblinsFreed` vollständig. Rang-/Klassenaufträge mit `kill:rotgardist`/`kettenschuetze` als Ziel (z. B. `g_dod2`, data.js:1184) werden dadurch nach Vargs Fall kaum noch erfüllbar. Nicht jede einzelne „Rangauftrag“-Quelle einzeln nachverfolgt — nur der zentrale Umwandlungsmechanismus geprüft. |
| R-QA-14 | CONFIRMED | `c_nec2` (data.js:1158) verlangt `kill:crypt_warden`. Der „Wächter der Nekropole“ entsteht nur über `urnRite()` (game.js:12416), die nur feuert, solange `q_pact.state==='active'` ist — bei Necromancer-Klassenauftrag Stufe 2 ist `q_pact` aber längst `'done'`. `QUEST_WHERE.c_nec2` zeigt trotzdem auf `'necropolis'` (14653). Die einzige andere `crypt_warden`-Quelle ist der Gruft-Boss „Tempelgruft“ (10317), nicht die Nekropole — der Wegpunkt führt ins Leere. |
| R-QA-15 | CONFIRMED | `die()`/Ausstiegslogik (game.js, früher Rückkehr-Zweig): `if (c.kind==='enemy' && (teamOf(c)!=='foe' \|\| dist(S.player,c)>500))` beendet die Funktion **vor** `onKill`/`regionBossSlain` — Verbündeten-Kills oder Tode weiter als 500px vom Spieler zählen nicht für Regionalbosse. |
| R-QA-16 | CONFIRMED | `sell()` (game.js:13045) blockt nur `ITEMS[key].bound`. `scout_report` (data.js:373) und `kings_iron` (374) sind nicht `bound`, aber als `take:'scout_report'`/`take:'kings_iron'` für `q_frontier`/`q_kingsiron` nötig (data.js:1191, 1146) — verkauft, hängt der Auftrag endgültig. |
| R-QA-17 | CONFIRMED | `corvanTalk()` (game.js:9924) setzt beim Abschluss `Q.state='done'; Q.progress=[1,1]; Q.outcome=...` — **ohne** `gainXp`-Aufruf, obwohl `q_ratssitz.reward.xp=600` (data.js:1223). Die 600 EP werden nie ausgezahlt. |
| R-QA-18 | CONFIRMED | `holyCourt()`/Klage (game.js:10013ff): Sieg-Formel ist rein deterministisch aus Werten (`favor(...)+...+(willpower-10)*4>10`), kein Zufall, kein Tagescounter — bei genug Willenskraft/Gunst beliebig oft 350 Gold für 100 Gold Einsatz. `courtHearing()` (Verhandlung) vergibt +3 Gunst je Klick ohne Tagessperre — beliebig wiederholbar. |
| R-QA-19 | CONFIRMED | `kid.taken=true` und `C.kidId=kid.id` werden bei Entführung gesetzt (game.js:13830f). `kidId` taucht im ganzen game.js nur an dieser einen (schreibenden) Stelle auf — nirgends gelesen. `kid.taken` wird nirgends zurück auf `false` gesetzt. Das Kind kann also nie als „zurückgebracht“ markiert werden. |
| R-QA-20 | CONFIRMED | In `buildVault()` (um game.js:10295) hat die „Verborgene Truhe“ (Geheimkammer) keine Fortschritts-Sperre — anders als die Boss-Truhe (`!(prog.chests||={})[floor]`) und die Hort-Truhe (`!prog.looted`) im selben Funktionskörper. Bei jedem Neubau der Ebene (Wiederbetreten) kann die Geheimtruhe erneut erscheinen und geplündert werden. |

**Zusammenfassung:** 19× CONFIRMED (eine davon — R-QA-03 — zusätzlich live im Spiel nachgestellt, Wegwerf-Slot danach
gelöscht, Backup zurückgespielt), 1× NOT REPRODUCED (R-QA-01), 0× CANNOT TEST.

## Details zu R-QA-03 (live, mit Belegschnipsel)

Sicherheitsablauf eingehalten: vor jedem Reload `rotfall.legacy.save` aus `rotfall.backup.s14c` wiederhergestellt,
`rotfall.slot.active` auf `legacy`. Echte Speichertests liefen auf dem Wegwerf-Slot `__hunt_testR3` (über `setSlot()`
aus `state.js`, nicht per Hand in `localStorage`, da `SAVE_KEY` sonst nicht mitzieht). Nach dem Test: `deleteSlot('__hunt_testR3')`,
Legacy-Slot erneut aus Backup wiederhergestellt.

```js
// Setup (Wegwerf-Slot, S._quiet aus, damit save() nicht blockt):
RF.S._quiet = false;
const p = RF.S.player; p.vamp = p.vamp || {};
p.vamp.frenzyT = performance.now() + 3.6e6;          // simuliert: Raserei spät in einer langen Sitzung
const m = await import('/src/state.js?v=23');
m.setSlot('__hunt_testR3');
await m.saveCompressed();                              // ok=true
RF.S._quiet = true;
// Reload mit ?dev, [data-act="continue"] klicken, dann:
RF.S._quiet = true;
const p = RF.S.player, now = performance.now();
p.vx = 3; p.vy = 0; RF.tick(50);
// Ergebnis: frenzyT (3685326) >> now (89805) → gate aktiv; p.vx/p.vy nach RF.tick() = 0,0 trotz gesetzter Geschwindigkeit.
```

Danach: `m.deleteSlot('__hunt_testR3')`, `rotfall.legacy.save` aus `rotfall.backup.s14c` wiederhergestellt,
`rotfall.slot.active='legacy'`.

## Was nicht geprüft wurde
- Für R-QA-02, 04–20 wurde **kein** vollständiger In-Game-Durchlauf (Dialogketten, echte Kämpfe, echte Auftragsannahme über
  die UI) gemacht — die Urteile stehen auf genauem Lesen der zitierten Funktionen und ihrer einzigen Aufrufer/Gegenstücke.
  Wo eine zweite, von mir nicht gefundene Codestelle denselben Zustand doch noch korrigieren könnte, ist das Risiko eines
  falschen CONFIRMED nicht auf null.
- R-QA-13 wurde nur am zentralen Umwandlungsmechanismus (`spawnType`) geprüft, nicht an jeder einzelnen genannten
  Rangauftrags-Quelle (Valen 4b, Untote 4b) einzeln nachvollzogen.
- Keine Berichte anderer Sucher gelesen (wie vorgegeben).
