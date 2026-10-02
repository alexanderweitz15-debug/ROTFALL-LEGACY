# Plan: Reliquien (Trinket-System, Endgame-Macht)

Stand 02.10.2026. Status: **Entwurf, wartet auf Designentscheidungen (Abschnitt 9).** Noch kein Code.

Arbeitsname im Spiel: **Reliquien**. Kollision: `RELICS` (game.js) heißt schon ein einzelnes Weltstück („Die letzte Wache“). Alternativen stehen in Entscheidung E5.

---

## 1. Audit — was es schon gibt (und was wir wiederverwenden)

| Bereich | Bestand | Folge für Reliquien |
|---|---|---|
| Ausrüstung | `GEAR` (game.js:146): weapon, offhand, head, chest, feet, cloak, hands, legs, **talisman**. 14 Talismane (data.js:270–284), nur Zahlen über `fixed` → `afx` | Talisman bleibt Zahlen-Schmuck. Reliquien bekommen eigene Plätze, **nicht** in `GEAR` (sonst zählt `afx()` sie mit und das Balancing der Affixe kippt). |
| Item-Modell | `mkItem` → `{key,count,cond,rar,afx,leg,qual,history}`; Exemplarfelder werden gespeichert | Reliquie = normales Item mit `slot:'relic'` und Exemplarfeldern `tier`, `xp`, `path`, `name`, `history`. Inventar, Handel, Grab, Truhe, Beute funktionieren ohne Sonderweg. |
| Seltenheit | `RARITY` common…mythic, `RARITY_DROP` (mythisch nie zufällig) | Wiederverwendet, oben zwei Reliquien-Stufen ergänzt (siehe 4). |
| Aufrüsten | Kein Aufrüsten vorhandener Stücke. Handwerk mit Güte, Königseisen, Reparatur gegen Gold | Neues Aufrüsten, angedockt an vorhandene Orte: Runenschmiedin Hilda (Tiefhall), Altar Omegas, Schmiede. |
| Werte | `damageOf`, `armorOf`, `speedOf`, `cdMul`, Krit in `hit`, Angriffstempo in `attack`, Lebensraub in `hit` | Ein Aufruf `relicFx(c,k)` je Stelle, analog zu `afx()`/`tfx()`. |
| Auslöser | Kill: `die()` (Vorbild Legende „Durst“, :3671). Ausweichen: `evaded()` (:14638). Parade: `guarded()`. Krit: `hit()`. Abklingzeit: `cooldowns` + `cdMul` | Ein Ereignisbus `relicOn(ev, data)` an genau diesen Stellen. Kein zweites Kampfsystem. |
| Zeitwirkungen | `c.status` mit `addStatus`, erscheinen automatisch im Effekte-Fenster (X) und als HUD-Symbol | Reliquien-Effekte wie „Blutrausch 3 s“ laufen als Status. Sichtbar ohne neues UI. |
| Ressourcen | Titelklassen-Ressourcen `c.tres` mit HUD-Balken; keine Kill-Serie, keine Seelen | Kill-Serie und Seelen als `tres`-ähnliche Ressource am Helden, Balken im HUD wie Verderbnis/Fokus. |
| Beute | `dropLoot` + `BOSS_LOOT` (8 Bosse), `ELITES` (~30, je ein Drop), Regionalbosse ohne Beute-Haken, Dungeons ohne Endtruhe | Neue Spalte `relic` in `BOSS_LOOT`, Haken in `regionBossSlain`, Endtruhen in Dungeons (Nutzerwunsch). |
| Messen | `RF.simFight` — ein Gegner, Kill-Effekte feuern dort nicht | Für Kill-Serien eigener Prüfstand (mehrere Gegner hintereinander). |
| Tod | Ausrüstung liegt am Grab, der Erbe kann sie holen; Ahnenfeind nimmt die Waffe; Titel/Talente/Zauber gehen verloren; `S.fame`, `S.legend`, `S.res`, Lager bleiben | Siehe Entscheidung E1. |
| Speichern | Alles auf `S` und am Helden wird gespeichert, fehlende Felder sind `undefined` | Felder am Item → keine Migration. Neue `S.relic`-Felder mit `||=`. |

**Balance-Regeln heute** (BALANCE_GUIDE §8): Affixe+Set Schaden ≤ +40 %, Tempo ≤ +25 %, Lebensraub ≤ 10 %, Legenden nie dauerhaft +X %. Reliquien brauchen eine **ausdrückliche Endgame-Ausnahme** — siehe E4.

---

## 2. Grundgedanke

Reliquien sind keine Rüstung. Sie sind **Fundstücke mit Geschichte**, die mit dem Helden wachsen: jede trägt eine Spielweise (Blut, Schatten, Sturm …), schaltet über Stufen neue Mechaniken frei und verbindet sich mit den anderen getragenen Reliquien zu Synergien.

- **Früh:** eine Reliquie, kleine bedingte Boni („nach einem Kill 2 s +6 % Tempo“).
- **Mitte:** zwei Reliquien, erste Synergien, die Spielweise verschiebt sich.
- **Endgame:** drei Reliquien auf hoher Stufe, Kreisläufe (Ausweichen → Tempo → Schaden → mehr Angriffe → schnelleres Ausweichen). Der Held wird absurd stark — bewusst.

---

## 3. Plätze (Vorschlag, E2)

| Platz | Freigeschaltet durch | Begründung |
|---|---|---|
| 1 | erste gefundene Reliquie (frühestens Stufe 10) | Kein Einfluss aufs frühe Spiel. |
| 2 | erster großer Boss erschlagen (Varg, Hrodvar, Aldhelm, Weißbart …) | Mitte des Spiels. |
| 3 | Endgame: Garmadon oder Omega erschlagen | Erst dann darf es eskalieren. |

Eigener Bereich „Reliquienkranz“ im Charakterfenster, nicht in der Ausrüstungsliste. Der Talisman bleibt unverändert.

---

## 4. Stufen und Seltenheit

### Stufen einer Reliquie (Namen im Setting)

| Stufe | Name | Bedarf (Vorschlag) | Was neu kommt |
|---|---|---|---|
| I | Roh | — | Grundeffekt (klein, bedingt) |
| II | Geweiht | Gold | Zahl ↑ |
| III | Gehärtet | Gold + Glut | **neue Mechanik 1** |
| IV | Geschmiedet | Gold + Glut | Zahl ↑ |
| V | Erwacht | Glut + Material vom Boss | **neue Mechanik 2**, Leuchten am Symbol |
| VI | Entfesselt | Glut + Splitter | **Pfadwahl** (zwei Spezialisierungen, eine wählen) |
| VII | Sternberührt | Splitter | **Synergie-Effekt** mit einer anderen Reliquie |
| VIII | Rotfall | Splitter + Endgame-Beute | **Verwandlung**: neuer Name (vom Spieler oder aus der Geschichte), neues Symbol, Spielweise kippt |

Ab Stufe VI gelten Reliquien-Werte außerhalb der Balance-Grenzen (E4). Stufe VIII nur nach Garmadon oder Omega.

### Seltenheit (was man findet)

Bestehende Stufen gewöhnlich → mythisch bleiben. Seltenheit bestimmt **Startstufe und höchste Stufe**, nicht nur Zahlen:
- gewöhnlich/ungewöhnlich: Stufe I–IV, keine Pfadwahl
- selten/episch: Stufe I–VI
- legendär: bis VII, eigener Sondermechanismus
- mythisch (nur Bosse): bis VIII, mit Boss-Mechanik

---

## 5. Währungen (Vorschlag, E3)

| Währung | Quelle | Verwendet für |
|---|---|---|
| **Gold** | wie bisher | Stufe I→II, II→III (Grundkosten) |
| **Glut** (Seelenglut) | Elite-Gegner, Dungeon-Endtruhen, schwere Ereignisse (Belagerung, Rückeroberung, Wellen), Bosse | Stufe III–VI |
| **Sternsplitter** | nur Bosse, Endgame-Dungeons, Omega-Krater, große Weltereignisse | Stufe VI–VIII, Pfadwechsel |
| **Boss-Material** (vorhanden: `trophaee`, Bossbeute) | der jeweilige Boss | Erwachen (V) der passenden Boss-Reliquie |

Keine Würfel auf Erfolg (kein „Upgrade fehlgeschlagen, alles weg“) — passt nicht zu Permadeath. „Fehlgeschlagen“ heißt nur: Ressourcen fehlen oder Platzbedingung nicht erfüllt.

---

## 6. Archetypen und Katalog (Entwurf)

Jede Reliquie hat **einen Grundeffekt, zwei Stufenmechaniken, eine Pfadwahl, eine Verwandlung**. Zahlen sind Startwerte für das Messen mit dem Prüfstand.

| Reliquie | Archetyp | Grund (I) | III | V | Pfad (VI) | Verwandlung (VIII) |
|---|---|---|---|---|---|---|
| Schlächterherz | Berserker | je 10 % fehlendes Leben +2 % Schaden | unter 35 % Leben +15 % Angriffstempo | Kills heilen 3 % | A: Raserei hält länger · B: Lebensraub statt Tempo | **Herz, das nicht stehen bleibt**: unter 20 % Leben kein Tod für 3 s (einmal je Kampf) |
| Schattenfaden | Tempo | nach Ausweichen 1,5 s +15 % Lauftempo | nächster Hieb nach Ausweichen +25 % | perfektes Ausweichen (Treffer in der Rolle) setzt die Ausweichzeit zurück | A: Nachbild schlägt mit · B: Ausweichen kostet keine Ausdauer | **Faden ohne Ende**: Ausweichen durch Gegner hindurch, jeder durchquerte Gegner blutet |
| Blutkranz | Blut/Kill | Kill: 2 s +6 % Angriffstempo | Kill-Serie (bis 10) verlängert | volle Serie: Lebensraub 6 % | A: Serie verfällt langsamer · B: Serie explodiert beim Verfall | **Kranz des Gemetzels**: jeder 10. Kill heilt voll |
| Seelenkessel | Seelen (Totenland) | Kills hinterlassen Seelen (sammeln durch Darüberlaufen) | Seelen stärken Zauber (+2 %/Seele, max 10) | volle Seelen: nächster Zauber kostet nichts | A: Seelen → Rüstung · B: Seelen → Schaden | **Kessel des Toten Königs**: Seelen kämpfen als Geister mit |
| Sturmglocke | Bewegung | +1 % Schaden je 5 % Lauftempo über Grund | Laufen lädt „Sturm“ (bis 3 Ladungen), nächster Hieb entlädt Blitz | Ladungen springen auf 2 Gegner über | A: Kette länger · B: Ladung lädt schneller | **Glocke im Sturm**: im Lauf sind Fernschüsse 50 % schwächer gegen dich |
| Uhrwerksherz (Aurelion) | Abklingzeiten | jeder Krit −0,3 s auf alle Fähigkeiten | Parade setzt die längste Abklingzeit um 50 % zurück | Fähigkeiten nacheinander: jede dritte ohne Abklingzeit | A: Mana statt Zeit · B: Ausdauer statt Zeit | **Herz aus Aurelion**: 4 s Zeitlupe für Gegner nach drei Fähigkeiten in 5 s |
| Henkerschlinge | Hinrichtung | +20 % Schaden gegen Gegner unter 25 % | Gegner unter 12 % sterben beim nächsten Treffer (nicht Bosse) | Hinrichtung erfrischt Ausdauer | A: Schwelle 18 % · B: Hinrichtung erzeugt Furcht ringsum | **Schlinge des Richters**: Bosse unter 8 % ebenso |
| Rotdorn | Krit | +4 % Krit | Krit setzt „Dorn“ (stapelt): nächster Krit +10 % je Dorn | Krit-Kette: Krit trifft einen zweiten Gegner | A: Krit-Schaden · B: Krit-Chance | **Dorn des Sterns**: jeder fünfte Treffer ist sicher kritisch |
| Eisenmal (Kette) | Tank | +3 Rüstung | Block erzeugt Schild (absorbiert 10 % maxLeben) | Dornen 10 % | A: Schild wächst · B: Dornen wachsen | **Mal des Kettenmeisters**: Treffer gegen dich verlangsamen den Angreifer (Kette) |
| Splitter des Stern­falls | Magie/Fläche | +8 % Zauberkraft | Flächen +20 % Radius | Zauber-Kills laden Mana | A: Fläche · B: Einzelziel | **Sternregen**: jeder 4. Zauber ruft einen kleinen Stern |
| Wolfsfang | Gruppe/Begleiter | Begleiter +5 % Schaden | Kills des Helden heilen Begleiter | Rudel: je Begleiter +4 % Tempo | A: Begleiter · B: Pferd/Tier | **Leitwolf**: Begleiter erben einen Teil deiner Reliquien-Effekte |

Weitere Ideen für später: Pestbeutel (Gift/Ansteckung), Kompass der Gischt (Seefahrt/Beute), Glocke von Moorbach (Furcht/Kontrolle — passt zum neuen Angstsystem).

### Boss-Reliquien (mythisch, Nutzerwunsch: Bosse und Dungeon-Enden)

| Boss / Ort | Reliquie | Mechanik aus dem Kampf |
|---|---|---|
| Varg, Kettenmeister | Vargs letztes Glied | Ketten: Treffer ziehen Gegner heran |
| Hrodvar | Eiskern | Eiskreis nach perfektem Ausweichen |
| Aldhelm, Blutfürst | Herz des Blutfürsten | Blut-Archetyp, Lebensraub in der Serie |
| Weißbart | (Seefahrt) Weißbarts Kompassrose | Beute und Tempo auf See |
| Garmadon | Seelenkessel des Toten Königs | Seelen, Geister |
| Omega | Auge des Gefallenen | Zeitbruch: perfektes Ausweichen → 2 s Zeitlupe |
| Ilvar / Turm des Nachtglases | Nachtglasuhr | Abklingzeiten |
| Regionalbosse (Graumähne, Karrak) | Wolfsfang / Sandglas | Rudel / Tempo im Sand |
| Dungeon-Endtruhen (Grube, Tiefhall, Kerker, Katakomben, Gewölbe, Turm) | Reliquie passend zum Ort, Seltenheit nach Gefahr des Dungeons | Endgame-Dungeons (Gruft, Krater, Turm-Spitze) geben legendär/mythisch und Sternsplitter |

---

## 7. Synergien und Schutz gegen Endlos-Multiplikatoren

- **Synergie-Paare** sind feste Einträge (z. B. Schattenfaden + Sturmglocke: Ausweichen gibt 1 Sturm-Ladung; Blutkranz + Schlächterherz: Serie zählt doppelt unter 35 % Leben). Erst ab Stufe VII einer der beiden.
- **Additive Töpfe statt Multiplikation:** jeder Wert (Schaden, Angriffstempo, Lauftempo, Abklingzeit, Lebensraub, Krit) hat **einen** Reliquien-Topf, in den alle Reliquien addieren. Der Topf multipliziert genau einmal mit dem Rest.
- **Deckel je Phase** (Vorschlag, E4): bis Platz 3 frei: Angriffstempo +40 %, Lauftempo +35 %, Abklingzeit −40 %, Lebensraub 10 %. Mit Stufe VIII: Angriffstempo +100 %, Lauftempo +70 %, Abklingzeit −70 %, Lebensraub 20 %. Harte Untergrenzen: Schwung nie unter 180 ms, Ausweich-Abklingzeit nie unter 250 ms.
- **Kreisläufe begrenzen sich selbst:** jede Rückkopplung hat eine interne Abklingzeit (z. B. Ausweich-Reset höchstens einmal je 1,5 s).

---

## 8. Oberfläche, Bild, Integration

**UI — Reiter „Reliquien (R)“** in der Charakter-Gruppe (neben Werte/Talente/Zauber/Effekte):
- Oben der **Kranz**: drei große Fassungen (gesperrte zeigen, womit sie aufgehen), in jeder das Symbol mit Rahmen nach Stufe.
- Darunter die gewählte Reliquie: Name, Stufe als **Leiter I–VIII** (erreichte leuchten, die nächste pulsiert, künftige zeigen ihre Mechanik ausgegraut), Kosten der nächsten Stufe mit vorhandenen Beständen, Pfadwahl als zwei Karten.
- Rechts **Synergien**: welche Paare aktiv sind, welche mit einer anderen Reliquie aufgehen würden.
- Geschichte des Stücks (wie bei Waffen: gefunden bei, getragen von, Kills).
- Keine Tabelle: Fassungen, Leiter, Karten.

**Bild:** Rahmen und Glimmen des Symbols nach Stufe (V: Glanz, VII: Funken, VIII: eigenes Symbol). Am Helden nur ab VIII ein kleiner Schein; Auslöser (Hinrichtung, Kranz voll, Zeitbruch) mit einem kurzen Effekt und Klang — nicht mehr als ein Effekt gleichzeitig.

**Integration:** Klassen (Pfadwahl mit Klassenbonus, z. B. Mönch-Fokus mit Schattenfaden), Waffen (Hiebtempo-Effekte wirken auf `swingDur`, Bögen eigener Faktor), Talente (Abklingzeit-Topf addiert zu `tfx cdr`, Deckel gemeinsam), Bosse/Dungeons (Beute), Fraktionen (Hilda und Omega-Altar als Aufrüst-Orte, Ruf senkt Goldkosten), Händler (seltene Reliquien beim Juwelier, nie über episch), Welt (große Ereignisse geben Glut), Chronik (Verwandlung ist ein Chronik-Eintrag), Angstsystem (Hinrichtungen in Städten erzeugen mehr Angst).

---

## 9. OFFENE DESIGNENTSCHEIDUNGEN (vor dem Bau zu klären)

- **E1 Tod und Legacy** (Vorgabe: nicht selbst entscheiden). Optionen aus dem Bestand:
  - a) Reliquie ist Ausrüstung → **liegt am Grab** mit voller Stufe, der Erbe holt sie (wie Waffen heute). Ein Ahnenfeind kann sie nehmen.
  - b) **Erbstück mit Bindung**: am Grab, Stufe bleibt, aber die **Erweckung** (Pfadwahl, Synergien, Verwandlung) muss der Erbe neu verdienen — passt zu „Der Erbe muss neu lernen“ (Audit A6).
  - c) Reliquie geht mit dem Helden unter, nur Glut/Splitter bleiben dem Haus.
  - d) Reliquie wird **Haus-Reliquie**: nicht im Grab, sondern im Hausschatz; jede Generation fügt eine Zeile Geschichte hinzu.
  - Empfehlung: **b** (am nächsten an der bestehenden Philosophie: Besitz bleibt am Grab, Können muss neu gelernt werden).
- **E2 Plätze:** drei eigene Plätze wie in Abschnitt 3, oder den Talisman-Platz in den ersten Reliquienplatz umwandeln?
- **E3 Währungen:** Glut + Sternsplitter (+ Gold, Boss-Material) wie vorgeschlagen, oder nur eine Währung?
- **E4 Eskalation:** Dürfen Reliquien ab Stufe VI die Balance-Grenzen brechen (Deckel aus Abschnitt 7), und wie weit?
- **E5 Name:** „Reliquien“ (Kollision mit dem vorhandenen Relikt „Die letzte Wache“), „Male“, „Siegel“ oder „Andenken“?
- **E6 Einzigartigkeit:** Jede Boss-Reliquie nur einmal je Welt (wie `unique`), oder pro Boss-Kill neu?
