# Game Design Document — Rotfall: Legacy

Regeln, Werte und Entscheidungen. Begründungen und Verlauf: `archive/GDD_bis_S13.md`, `CHANGELOG.md`.
Soll/Ist aller Systeme: `WELTREGELN.md`. Datenstrukturen: `DATA_SCHEMAS.md`.

## Kern
- Globaler Zustand `S` (state.js), RNG mulberry32 je Spielstand. Nur `S.map` wird voll simuliert.
- Fristen über Kartengrenzen auf der Spieluhr `clock() = Tag · 1440 + Minute` (1 s Echtzeit = 1 Spielminute).
- KI-Einstieg nur `think(e, dt)`. Detailstufen: nah voll, > 520 px jedes 3. Bild, > 900 px nur Versetzen, Gegner > 1150 px ruhen.
- Dev: `?dev` → `window.RF` (`selftest`, `tick`, `duel`, `shot`, `styleArea`).

## Tod und Boden
- Tod ist terminal: `die()` nullt Schwung, Ansage, Sonderangriff, Ziel, Zorn; Gegner → Leiche, Personen → Grab.
- Boden (`downed`): keine KI, keine Bewegung. Verbluten nach 11 s (NPC) / 15 s (Spieler) ohne Hilfe.
- Aufhelfen nur, wer nicht verfeindet und nicht zornig ist. Nahkampftreffer auf gestürzten Feind = Gnadenstoß.
- Pfeile fliegen über Liegende. Stehende im Schlagbogen haben Vorrang.

## Szenenübergänge
| Wer | Verhalten beim Kartenwechsel |
|---|---|
| Gegner mit `interiors: true` (Menschen, Goblins, Untote außer Tieren/Kolossen, Automaten) | folgen durch dieselbe Tür nach Laufzeit (Abstand / Tempo + 1,5 min), höchstens 4 |
| Gegner mit `interiors: false` (Tiere, Koloss, Aasschwinge, Knochenhund) | lauern 90 Spielminuten am Eingang, danach misstrauisch (Sicht ×1,5 für 5 h) |
| Bosse (Tabelle **und** Regionalbosse) | halten ihr Revier, brechen die Jagd ab (S14) |
| Diener, Tierbegleiter | gehen mit ihrem Herrn; Reittier bleibt draußen (abstrakt, `S.mount`) |

- Verfolger nur mit Aggro auf den Spieler und < 560 px. Folge-Absicht verfällt 60 Spielminuten nach der Ankunftszeit.
- Kommt der Spieler zurück, bevor ein Folgender die Tür erreicht: er steht draußen vor dem Eingang. Ankunftspunkte fest.
- Zornige NPCs: > 12 Spielminuten ohne Sichtkontakt = aufgegeben.

## Zorn, Verbrechen, Kerker
- Strg+Angriff auf Neutrale = Provokation. Wachen/Kämpfer zornig, Zivilisten und Händler fliehen. Zeugen < 240 px.
- Leine: Zorn endet > 640 px vom Posten oder nach 12 Spielminuten ohne Sicht (320 px); danach 3 h misstrauisch.
- Spieler am Boden: Zornige hören auf. Mit Ordnungsmacht (Wache, Valen, Orden): bis 30 Gold Buße, Aufrichten.
- Kopfgeld bei der Fraktion des Opfers: Angriff 25, Mord 75, verfällt 5/Tag; ohne Zeugen keins.
- Wache stellt bei Sicht: zahlen / Kerker / Widerstand (+25). Kerker: 10–20 min Echtzeit je nach Tat, Kaution
  1,5 × Kopfgeld (mind. 100), Schloss knacken (Dietrich +30 %) oder absitzen. Gefangenen-Aufträge nur in Salzhafen.
- Ab 150 Gold Kopfgeld: Kopfgeldjäger draußen alle 2 Tage; Stufe folgt dem Spieler in 3er-Schritten, Deckel Stufe 14.

## NPC-Reaktionen
| Ereignis | Wache | Gruppe | Händler | Zivilist | Gegner | Tier |
|---|---|---|---|---|---|---|
| Spieler angegriffen | greift an (< 300 px), ruft Wachen < 480 px | kämpft mit | flieht, Stand zu | flieht | Gleiche < 240 px eilen herbei | Wild flieht |
| Spieler greift Neutrale an | greift ein | Moral −5 („Was tust du da?!“) | flieht, Laden bis morgen zu | flieht | — | — |
| Spieler tötet | Zeugen-Wachen zornig, Kopfgeld | Moral −10, Erinnerung | später kalter Ton | meidet den Spieler 1 Tag | — | — |
| Spieler bewusstlos | eilt herbei (< 520 px), richtet auf, Buße statt Tod | stabilisiert (Knien 4 s) | hält Abstand | holt Wache (< 1400 px) | wechselt das Ziel | — |
| NPC stirbt | Grab, Chronik | Moral −14 | — | Angst bei Tat des Spielers | — | — |
| Gegner in der Stadt | greift an, ruft Wachen | kämpft | flieht, Stand zu | flieht | — | — |
| Paktgebundener Spieler | Ordenswache greift an (Ruf ≤ −25) | Orden verweigert Gespräch | — | grüßt ängstlich | Untote der Schar verbündet | — |

Rollen: Wache (Posten, Alarm, hilft auf) · Verteidiger (Borin, Kelan, Aldric, Tomas; Leine 360 px) · Heilerin (kämpft nie,
hilft auf) · Zivilist (flieht, holt Hilfe) · Händler (flieht, schließt). Gespräche mit Zornigen/Fliehenden gesperrt.
Gleiche Fraktion bekämpft sich nie (außer zornig oder Diener). Dialog schließt sich, wenn man sich entfernt.

## Kampf
**Deckung (Umschalt halten)**
- Tempo ×0,45, keine Ausdauer-Erholung, kein Hieb; braucht Ausdauer > 1. Nur von vorn (±70°).
- Parade: erste 180 ms nach dem Heben — Angreifer taumelt 0,9 s (Boss 0,45 s), kein Schaden, 3 Ausdauer. Eine je Deckung.
- Neu gehoben innerhalb 0,4 s nach dem Senken: keine Parade (S14, gegen Takt-Tippen).
- Block danach: Schild 15 %, Waffe 45 % des Schadens nach Rüstung; kostet Schaden × 0,8 (Schild) / 1,2 (Waffe).
- Reicht die Ausdauer nicht: Deckung bricht, voller Treffer, 0,5 s Taumeln, 0,9 s keine Deckung.
- Geschosse: blockbar, nicht parierbar. **Flächenangriffe** (Ringe, Einschläge, Strahl): weder Deckung noch Schild noch
  Nahkampfabwehr — heraustreten oder rollen (S14). Kriegshammer: kein Schild hält, Deckung kostet doppelt.

**Rolle und Bewegung**
- Rolle 240 ms i-Frames, 92 px, Abklingzeit 850 ms, Kosten 20 × (1,2 − Ausdauer-Attr. · 0,02); beendet die Deckung.
- Eigener Hieb bremst auf 55 %. Rückwärts im Kampf (Gegner < 280 px): zu Fuß 70 %, beritten 40 % (S14).
- Gehen kostet 1,2 Ausdauer/s; bei 0 Ausdauer 55 % Tempo.

**Anti-Kiting (§34)** — alle Nahkämpfer gegen Spieler und Gefährten: nach ~2 s vergeblicher Verfolgung ×1,45 Tempo,
Mindesttempo 2,0 (Wiedergänger ausgenommen), angesagt mit „!“ und Staub. Dazu je Art: Wolf Sprung, Hund Flanke, Goblin
Hit & Run, Bandit Umkreisen, Bär Revier-Ansturm, Speerträger Reichweite. Fernkämpfer ausgenommen.

**Gegner-Ausdauer (§28)** — Maximum 1,2 × Spieler-Maximum; Hieb −26, Sprung −30; Erholung 14/s (Elite/Boss 20/s).
Bei 0: 1,1 s wanken (Boss 0,7 s), dann 25 Punkte. Nur Angriffe kosten.

**Treffer** — Körperteile (body.js), Krit (Wahrnehmung, Dolch von hinten), Rüstung/Durchschlag, Schleichangriff auf
Ahnungslose ×1,5 (von hinten ×3). Taumeln je Waffenklasse, Standfestigkeit: nach Taumeln 1,2 s kein neues, Rückstoß 30 %.
Enthauptung selten (Kopf 0 ohne Krit gedeckelt). Waffengefühl `FEEL` (Gewicht, Hit-Stop, Wackeln, Ausfallschritt).

**Fertigkeiten (Kenshi, S13)** — Waffenfertigkeit steigt durch Benutzung (Schaden, Tempo); Nahkampfabwehr (bis 30 %
Abwehr, ab 40 Gegenhieb); Zähigkeit (aus nicht kritischer Lage selbst aufstehen, mit Timer); Ausdauer-Punkt +10.

**Balancing (§82)** — `BAL = { hp: 1,7, dmg: 1,4 }` für alle Gegner = „Schwer (Standard)“. Messung mit `RF.duel`:
| Messung (Mittel) | vorher | nachher |
|---|---|---|
| Stufe 3, Langschwert, Leder — Bandit stehend | 3,1 s / 10 % | 4,0 s / 19 % |
| … Wolf stehend | 2,5 s / 8 % | 3,2 s / 19 % |
| … Skelett stehend | 4,4 s / 10 % | 4,7 s / 19 % |
| … Bandit rückwärts | 0 % ab Stufe 8 | 16 s / 25 % |
Bosse: Antwort auf Abstand (Gorak-Sturm, Hrodvars Eislanze) und dritte Phase unter 25 %.

## Waffenklassen
| Klasse | Stärke | Schwäche | Spielstil |
|---|---|---|---|
| Dolch | sehr schnell, Krit ×2,6 von hinten | Reichweite 26, kaum Wucht | Rücken |
| Schwert | ausgewogen, weiter Bogen | nichts herausragend | Allrounder |
| Zweihänder / Große Axt | Wucht, breiter Bogen, langer Hit-Stop | ≈ 1 s, teuer an Ausdauer | Timing |
| Beil / Streitkolben | Durchschlag, Wucht | kurze Reichweite | gegen Gerüstete |
| Speer | Reichweite 74, trifft in Linie | schmaler Bogen | Abstand |
| Bogen | Distanz | schwach im Nahkampf | Kiten (Nachsetzen beachten) |
| Stab | Magie-Skalierung | wenig Waffenschaden | Kontrolle |
| Rapier | 380 ms, Krit ×2,2, Riposte ×2,2 nach Parade | Bogen 0,45 | Deckung + Konter |
| Kriegshammer | ignoriert Schilde, Ziel taumelt, 60 % Durchschlag | 1,15 s, 20 Ausdauer | gegen Schild, Platte |
| Hellebarde | Reichweite 82, fegt den Bogen, Spitze ×1,15 | Schaft nah 60 % | Gruppen |
| Armbrust | sofort, 50 % Durchschlag | 1,9 s spannen (60 % Tempo) | ein Schuss |
| Zauberstab | Einhand-Fernzauber, Schild frei | 4 Mana je Funke | Magier mit Schild |
| Streitflegel | Schwung +15 %/Stufe, ab Stufe 2 rundum | Anlauf | Druck |
- Keine Kombos (ein Hieb = eine Entscheidung). Vom Ziel abhängig: `execute`, `raw`; weitere Felder `chill`, `toll`, `ally`.
- Leitlinie: Waffen sehen gebaut und benutzt aus; Rot nur als Akzent der Kette. Nicht übernommen: Skorpionschwanz,
  Käferpanzer, Repetierarmbrust, Harpune, „Sklaven arbeiten schneller“.

## Rarität und Beute
| Stufe | Gefahr 0 | Gefahr 1 | Gefahr 3 | Affixe | Wert |
|---|---|---|---|---|---|
| Gewöhnlich | 62 % | 59 % | 51 % | — | ×1 |
| Ungewöhnlich | 24 % | 22 % | 19 % | 1 klein | ×1,35 |
| Selten | 10 % | 13,5 % | 21 % | 2 klein | ×1,9 |
| Episch | 3,5 % | 5 % | 8 % | 3, davon 1 spielverändernd | ×3 |
| Legendär | 0,5 % | 0,7 % | 0,8 % | Sondereffekt + 2 klein | ×5 |
| Mythisch | nie zufällig | — | — | Unikat mit Mechanik | ×8 |
- Gewürfelt beim Fund (Beute, Truhen = Gefahr 1), Läden verkaufen Grundware. Gefahr = Gegner-Gefahr − 1 (+1 Boss).
- Affixe klein: Schärfe, Leichtigkeit, Auge, Durchschlag, Atem; Härte, Lebenskraft, Leichtfuß, Zähigkeit.
  Spielverändernd: Blutzoll, Zerfetzen, Dornen. Legendär: Blutdurst, Nachhall, Ahnenwall. Nie auf Fernwaffen: Blutzoll, Zerfetzen.
- Unikate: Nachtfrost (mythisch, Hrodvar), Goraks Hackmesser (legendär).
- Fraktionssets (Bonus nur mit allen Teilen): Rotgarde, Eisenfürst, Kronwache (Brann), Weißer Orden, Sonnenlegion (Aurelheim).

## Gegner
Stufe = Spielerstufe ± 2 innerhalb der Spanne des Gebiets (`zoneLevel`, Spanne nach Gefahr 0–5: 1–8, 1–10, 3–15, 8–22,
15–35, 25–50); +4 % Leben und +5 % Schaden je Stufe. Frühe Gebiete werden später leicht, späte bleiben hart.
| Gegner | LP / Tempo | Verhalten | Ansage | Konter gegen Kiten | Schwäche | Innen |
|---|---|---|---|---|---|---|
| Wolf | 30 / 1,55 | duckt, springt; Rudel | 280 ms | Sprung | wenig LP | nein |
| Wilder Hund | 24 / 1,65 | flankiert | — | Flanke | sehr wenig LP | nein |
| Wildschwein | 46 / 1,35 | stürmt | — | Sturm | dreht schwer | nein |
| Bär | 150 / 1,15 | Revier | 480 ms | Revier-Ansturm | langsam | nein |
| Goblin / Krieger | 28 / 1,35 · 54 / 1,25 | Hit & Run; Krieger mit Schild | — | Hit & Run, Schildvorstoß | wenig LP / träge | ja |
| Bandit | 48 / 1,4 | Duellant, umkreist, weicht aus | — | Umkreisen | Ausdauer | ja |
| Speerträger | 50 / 1,3 | hält 66 px, stößt zurück | 320 ms | Reichweite | seitlich, nah | ja |
| Banditenschütze | 36 / 1,35 | hält 190 px, spannt sichtbar | 520 ms | Fernkampf | Nahkampf | ja |
| Untoter Krieger | 44 / 1,15 | langsam, sagt an | 380 ms | Nachsetzen | Heiliges, Wucht | ja |
| Wiedergänger | 70 / 0,85 | Griff bremst, steht einmal auf | 420 ms | Griff | Feuer | ja |
| Geist | 38 / 1,7 | nach Treffer körperlos | — | Tempo | Heiliges trifft immer | ja |
| Kultist | 34 / 1,2 | Schattenblitz, heilt Untote | 1700 ms | Fernkampf | Nahkampf | ja |
| Knochenritter | 120 / 0,95 | Schildwall frontal −70 % | 480 ms | Schild | Flanke, Wucht | ja |
| Knochenschütze | 36 / 1,1 | hält Abstand | 520 ms | Fernkampf | Nahkampf | ja |
| Nekromant | 52 / 1,0 | ruft 3 Knochendiener | 7 s | Beschwörung | stirbt er, zerfallen sie | ja |
| Seuchenleiche | 80 / 0,7 | Biss vergiftet | 360 ms | zäh | langsam | ja |
| Aschdämon | 170 / 1,05 | Glutaura, feuerfest | 460 ms | Fläche | Heiliges | ja |
| Schattenwesen | 40 / 1,5 | springt hinter das Ziel | — | Meuchler | wenig LP | ja |
| Knochenhund | 34 / 1,8 | Hetzer | — | Tempo | wenig LP | nein |
| Aasschwinge | 22 / 2,0 | fliegt, beißt | — | Flug | wenig LP | nein |
| Leichenkoloss | 340 / 0,6 | Stampfen im Ring, Wagen ×3 | 900 ms | Fläche | langsam | nein |
| Todesritter | 230 / 1,1 | Elite, Lebensraub | 500 ms | Ausdauer | Heiliges | ja |
| Wächter der Nekropole | 150 / 1,1 | Elite, Schild | 520 ms | Nachsetzen | Ansage lang | ja |
| Hauptmann der Toten | 170 / 1,1 | letzte Befreiungswelle | 500 ms | Zweihänder | Ausdauer | ja |
| Hirsch | 30 / 1,9 | flieht, greift nie an | — | — | — | nein |
- Varianten je Art (S13b): Aussehen, Stärke, Verhalten (Flankieren, Anführer, Kapitulation).

## Bosse
| Boss | Ort | Kampf | Weltfolge |
|---|---|---|---|
| Gorak | Grube | Hieb; ab 50 % Brüllen, Sturm, Beben | — |
| Hrodvar | Tiefhall | Eiskreis (Ring, 900 ms) + Durchfroren; unter 50 % drei Tote; Eislanze auf Abstand | Quest „Königseisen“ (Brann) |
| Graumähne | Wolfsschlucht | Sprung, 170 LP; < 50 % zwei Wölfe | Westwald −30 % Deckel, 60 % Wolf → Wilder Hund, Eren +8 Felle, Valen +3 |
| Karrak | Rote Wüste | Duellant, Stufe 12; ruft zwei Schützen | −30 % Deckel, 60 % Bandit → Goblin-Krieger (nach Vargs Fall friedlich), Händler +8, Bande −25 |
| Varg | Kernburg | Kettenpeitsche (70, fesselt), Hofstaat; spricht | Goblins frei, Kette −100, Eisenfeste fällt |
| Garmadon | Gruft des Toten Königs | spricht; Blutwelle, „Erhebt euch“ (60 %), Omegas Blut (30 %) | Fall der Untoten |
| Omega | Krater | Auge mit Engeln; Sternenfall, Blick, Nova | drei Enden |
- Jeder Boss ruft unter 50 % einmal Verstärkung. Flächenangriffe aller Bosse sind nicht blockbar.

## Gefahrenregionen
| Stufe | Wirkung |
|---|---|
| 0–2 | unverändert |
| 3 Tödlich | +2 Stufen, 25 % Veteranen |
| 4 Verboten | +4 Stufen, 50 % Veteranen |
- Veteran: +30 % Leben, größer, Beute +1. Dungeons = Stufe 3. Warnung beim ersten Betreten, dunklere Tönung.

## Spawns
- Feste Gebiete mit Deckel (`SPAWN_AREAS`), Nachschub nur > 620 px außer Sicht; nie in Siedlungen (+4 Kacheln).
- Reise-Begegnungen fern der Siedlungen, Abklingzeit 26 s. Hinterhalte erscheinen nie sichtbar.
- Nach Vargs Fall keine feindlichen Goblins auf der Oberwelt.

## Stufen
- XP nur für eigenen Schaden (Anteil am Schaden). Gruppe bekommt 60 % der Spieler-XP.
- Nächste Stufe: ×1,35 bis Stufe 10, ×1,2 bis 20, danach ×1,12. Alle 5 Stufen +1 Attribut- und +1 Talentpunkt.
- Je Stufe: Leben, Ausdauer, Mana, Schaden +0,35, Rüstung +0,25. Seitenleiste zeigt die Gegnerstufen des Gebiets.

## Klassen, Talente, Titel
| Klasse | Ressource | Signatur | Schwäche | Lehrer |
|---|---|---|---|---|
| Berserker | Ausdauer | Wuchtschlag, Raserei (8 s +35 % Schaden, +15 % Tempo) | +20 % eingesteckt in Raserei | Oda |
| Assassine | Ausdauer | Meuchelstich, Schattenschritt (nächster Hieb ×2,5) | nicht in Kette/Platte | Rook |
| Barde | Ausdauer | Kriegslied (+15 %), Missklang | −15 % Waffenschaden | Lioba |
| Alchemist | Heilkraut | Feuerflasche, Giftöl, Trank | ohne Kraut nichts | Quirin |
- Lehrer: Borin Krieger · Tomas Schütze → Waldläufer · Rook Schurke → Assassine · Elena Kleriker · Morvath Magier ·
  Kelan Ritter → Paladin · Oda Berserker. Dunkler Hochpaladin: Rang der Kette (Weihe bei Varg), kein Lehrer.
- Talente: 1 Punkt zum Start und je Stufe; Knoten brauchen einen gelernten Knoten darüber. Zweige Kampf, Magie,
  Überleben (je 7 Knoten, 2 Schlüssel mit Preis). Umlernen beim Lehrer: 30 + 10 × Stufe Gold; Titel und Preise bleiben.
- Titelzweige (Nekromantie, Hexerei, Hainkunde, Stille Hand) sichtbar, versiegelt bis zum Titel.

**Titelklassen** — höchstens zwei erwerbbar, eine getragen (Wechsel im Ausbildungsfenster, nicht im Kampf). Erwerb nur
durch eine Tat in der Welt. Unumkehrbar. Talentzweige beider gelten; Makel gilt für den getragenen; Preis dauerhaft;
Fraktionsfolgen hängen am Pakt (auch mit abgelegtem Titel); Merkmal glimmende Augen bleibt.
| | Nekromant | Hexenmeister | Druide | Mönch |
|---|---|---|---|---|
| Ressource | Seelenessenz 0–6: +1 je Tod in der Nähe | Verderbnis 0–100: Fähigkeiten laden auf, außer Kampf −4/s | Wildkraft 0–100: +5/s nur draußen auf Natur | Fokus 0–5: +1 je Ausweichen ins Leere, Treffer −1 |
| Fähigkeiten | Totenruf (2), Knochenschild (1), Seelenernte (alle) | Fluch (+20), Chaosblitz (+15), Entfesseln (ab 40) | Rankenfessel (25), Geisterwolf (40), Erdsegen (30) | Handkante (1), Stilles Wasser (2), Hundert Schritte (ab 3) |
| Passiv | Diener nähren dich | Schaden wächst mit V | 0,5 Leben/s in der Natur | Ausweichen −25 % Ausdauer |
| Makel | Waffenschaden −15 %, heiliges Heilen halb | über 70 V −1,5 Leben/s, bei 100 Ausbruch | in Kette/Platte halbe Wildkraft | in Kette/Platte kein Fokus |
| Preis | Leben −10 % | Ausdauer −10 | Stärke −1 | halbes Gold ans Kloster, Bande −30 |
| Ruf | Untote +20, Orden −30, Valen −10 | Untote +15, Orden −30, Valen −10 | — | Orden |
| Erwerb | Pakt der Stillen Schar → Ysra | Pakt → Vhal | Ruf des Hains (Mira) | Probe der Stillen Hand (Ilva) |
- Ausschluss: Nekromant ↔ Hexenmeister ↔ Mönch; Druide mit allen kombinierbar.
- Pakt der Stillen Schar: Morvath (Grabsiegel) → Ysra (Ahnenurne aus der Nekropole; Mitglied der Schar: Wächter tritt
  beiseite) → Urne zu Ysra oder Vhal → Ritual, Preis sofort → Titel.
- Folgen des Paktes: Orden spricht nicht mehr; Ordenswachen greifen ab Ruf −25 an; Bewohner grüßen anders; Ordensbrett leer.
- Vorschläge (nicht gebaut): Kopfgeldjäger („Fährte“), Todesritter als Titel der Schar.

## Fraktionen und Ruf
| Stufe | ab Ansehen | Preis | Folge |
|---|---|---|---|
| Vertraut | 70 | −15 % | herzlicher Gruß |
| Verbündet | 40 | −10 % | herzlicher Gruß |
| Freundlich | 15 | −5 % | — |
| Neutral | −5 | normal | — |
| Misstrauisch | −30 | +12 % | kühl |
| Feindlich | −60 | +30 % | kalt |
| Verhasst | darunter | kein Handel, Brett leer | Wachen greifen an |
- Beitritt ab Ansehen 10 (Untote 15). Erzfeinde schließen einander aus (S14): Orden ↔ Untote, Valen ↔ Untote und Bande,
  Kette ↔ Untote und Goblins; Mönch tritt den Toten nicht bei. Bestehende Doppelränge bleiben.
- Rangverlust ab Ansehen ≤ −60; Garmadons Tod verstößt aus den Rängen der Untoten. Legendäre Ränge: `WELTREGELN.md` §5.

## Aufträge
- Höchstens 5 gleichzeitig, Frist je Art (Eskorte 3 Tage … Lager 6), selbst abbrechen: Ruf −3.
- Eskortierter stirbt: gescheitert, Ruf −6, das Dorf redet, weniger Angebote. Auftraggeber stirbt: hinfällig ohne Verlust.
- Aufträge gehen nicht aufs Erbe über. Ignorierte Angebote können Folgen haben (Folgeauftrag).
- Arten: Eskorte, Paket (jeder Bewohner der Zielstadt nimmt an), Vermisste, Vorräte, Kräuter, Spurensuche (3 Spuren →
  Lager → Täter), Lager ausheben (2–3), Kopfgeld, Bestie, Jagd, Streife, Schmuggel in besetzte Städte, Überlebende.
- Geber je Rolle (Schmied, Händler, Bauer, Priester, Wache, Adel, Gelehrte, Wirt, Richterin, Offiziere, Werkmeister) plus
  Anschlagbrett. Das Brett ist leer in besetzten/zerstörten Orten und für Verhasste bzw. Paktgebundene am Ordensbrett (S14).

## Erbe
- Kandidaten: Gefährten und Verwandte. Niemand → Haus erlischt. Verwandte bringen Klassenwaffe, Kittel, 2 Brot, 1 Verband.
- Ausrüstung des Toten liegt am Grab. Ankunft in Eren, 3 s Schonfrist, Gold 70 %, Ruf 50 %.

## Siedlungen
| Stadt | Rolle | Herrschaft | Landmarke |
|---|---|---|---|
| Eren | Dorf, Ackerbau | Valen | Felder mit Vogelscheuchen |
| Nordfurt | Grenzstadt, Fluss, Garnison | Valen | Mauer mit 4 Toren, Markt |
| Salzhafen | Hafen | Valen | Kai mit drei Stegen, Hafenkerker |
| Kreuzweg | Marktflecken, Söldner | Händler | Marktplatz |
| Aschfurt | Grenzposten, Karawanenhalt | Händler | Palisade, Nordtor |
| Sonnwacht | Ordensfeste, Pilger | Orden | Feste mit Schrein |
| Dörfer (8) | Haselbrück, Mühlbach, Weidenau (Valen), Lichtenrain (Orden), Rastfurt (Händler), Grauwasser, Hohlstein, Eisenried (Tribut) | — | ohne Wachen, Läden, Kriegsknoten |
- Jede Siedlung ist ein Plan (`TOWN_PLAN`), gestreckt um einen Anker (`spread`); Häuser behalten Größe und Türseite.
- Regeln (Selbsttest): Nachbarhäuser ≥ 2 Kacheln, bebaut < 35 %, Hauptstraßen ≥ 3 Kacheln, jede Tür vom Platz erreichbar.
- Einwohner = Fläche / `perHead` − Wachen − Figuren mit Namen; jedes Haus ≥ 1 Bewohner. Lieber leerer als gestapelt.
- Verfall je Haus (gepflegt / heruntergekommen / verlassen). Innenräume sind begehbare Grundrisse, Dach blendet aus.
- Wachstum: Wohlstand 0–100 täglich (+3, Ruf, − Besatzung/Raid/Blutregen); bei 100 ein Haus, bei −20 verfällt eines.
- Weltmaßstab: Entwurf 512 × 512, hochgerechnet ×1,5; Welt Valoris 1536 breit (`OX = 256`); `worldPt` für feste Punkte.

## Tagesablauf
| Zeit | Block | Tätigkeit |
|---|---|---|
| 22:00–06:30 | Nacht | im Haus |
| 06:30–07:30 | Morgen | vor dem Haus |
| 07:30–11:30 | Arbeit | fester Arbeitsplatz je Beruf, Arbeitskreislauf (Material holen, bearbeiten, abliefern) |
| 11:30–13:00 | Mittag | Mahlzeit; Platz oder Schenke |
| 13:00–16:30 | Nachmittag | Arbeit bzw. Nachbar/Platz |
| 16:30–18:00 | Markt | Platz, Markteinkauf (einmal am Tag) |
| 18:00–20:30 | Abend | Schenke drinnen (Schachbrett-Plätze) oder vor dem Haus |
| ab 20:30 | Heimweg | drinnen |
- Eigener Zeitversatz 0–45 min je Person. Unterbrechung durch Kampf: danach Block der aktuellen Uhrzeit.
- Stufe 2: Jäger 7–13:30 im Jagdgrund, danach Felle +2 an den Markt; Marktstände 7–18 Uhr offen (sichtbar);
  Wachen tags am Posten, 22–6 Uhr schläft jede zweite im Wachhaus.
- Besatzung: alle Bewohner im Haus. Hunger: halbe Arbeit, Abwanderung.
- Benannte Figuren (`NPC_DAY`): eigener Arbeitsort, Feierabend, Zuhause; Läden 7 Uhr bis Feierabend.
- Gespräche (Talk-Pairs): Nachbar ≤ 64 px, zueinander gedreht, Blasen im Wechsel (2,5 s). Höchstens 4 Blasen sichtbar,
  die nächsten; Blasen unter einem Dach nur für den Spieler im selben Haus und zählen dann nicht (S14).
- Beziehungen: Freund (jeder), Rivale (jeder Vierte, nie Hausgenosse): kein Gespräch, Ausweichen < 70 px (außer drinnen),
  Lästern in Hörweite (160 px, nicht beim Fest). Gerüchte aus der Chronik (≤ 5 Tage) als Sätze.

## Feste und Stadtleben
- Jede Stadt feiert alle 6 Tage 15–23 Uhr auf dem Hauptplatz (Vharnholm nie); Aufbau `transient`, am Vortag angekündigt.
- Kein Fest in besetzten oder zerstörten Orten; gemeldeter Überfall sagt es ab (S14).
- Festtafel: einmal je Fest satt, geheilt, ausgeruht. Dazu: Hochzeiten, Prügeleien unter Rivalen, Spielleute, Ambient-Szenen.

## Raids, Krieg, Befreiung
- Raid: Späher-Meldung → 3–6 h → Angriff (in Spielernähe echt, sonst nach Verteidigungskraft) → Folgen.
- Niederlage: 3 Wohnhäuser eine Verfallstufe schlechter, 1–3 Tote; 15 % (nach Vargs Fall 45 %) wird das Dorf zerstört.
- Zerstört = endgültig (Schwer); Angsthase: Rückkehr nach 10 Tagen, nur das eigene Dorf wird wieder aufbaubar (S14).
- Wiederaufbau: ein beschädigtes Haus je Tag in freien Städten. Verteidigung: Miliz, Söldner (Kreuzweg), Automaten, Goblins.
- Krieg in Spielernähe: Angreifer ~20 Kacheln vor dem Ort, Anmarsch mit 80 % Tempo.
- Befreiung: 2–3 Wellen (Schwarze Feste 4) von Sammelpunkten 13–15 Kacheln vor dem Ort, letzte mit Hauptmann (Stufe 6/9);
  8 Spielminuten Pause; Folgen: Chronik, Titel, 4 Heimkehrer, Einwohner +6.

## Karawanen und Reisen
- Zug: Leitwagen (LP, Ladung) mit Kutscher und zwei Ochsen, Beiwagen, zwei Söldner (Stufe 2–4, Leine 420 px).
- Route aus der Straße, 40 Spielminuten Rast am Tor. Hinterhalt 35 % auf halber Strecke; außer Sicht nach Wachenzahl.
- Geleitschutz 30 Gold, Händler +4. Händlerzüge der Wirtschaft: `WELTREGELN.md` §3.
- Keine freie Schnellreise: zu Fuß, dazu Kutschen und Fähren (Salzhafen ↔ Kupferhafen) gegen Gold, mit Reisezeit und Überfall.

## Tiere
- Zähmen: passendes Futter, ruhig nähern, mehrere Versuche; Fehlversuche reizen. Wolf, Hund, Eber, Bär.
- Ein Tierbegleiter zusätzlich zur Gruppe; Tierhändler in Kreuzweg, Nordfurt, Kupferhafen.
- Reittiere (Taste R): Pferd ×1,55, Messingross ×1,75 (alle 5 Tage Automatenkern, sonst ×0,6), Totenross ×1,65
  (Stille Schar oder Pakt). Kampf vom Pferd; wer zu Boden geht, stürzt.
- Nutztiere (Kühe, Schafe) auf den Höfen; Schlachten vor Zeugen = Kopfgeld wegen Viehdiebstahls.

## Regionen und Orte
| Land | Inhalt |
|---|---|
| Westen | Eiserne Kette: Eisenfeste (Mauer, Zitadelle, Steinbruch), Goblin-Wälder, Grubenhort, Tributdörfer |
| Mitte | Valen, Orden, Händler; Grauland |
| Süden | Hochreich Aurelion: Aurelheim, Kupferhafen, Gelenkhall, Tickmar, Sankt Serin, Himmelsfeste |
| Osten/Südosten | Totenland: Vharnholm (Stufe 1), Knochenwald, Aschensee (Seelenbrunnen), Alt-Vharn, Nekropole, Schwarze Feste |
| Grenzöde | Grenzwacht (Oda), Hundertfeld |
| Dungeons | Grube (Gorak), Tiefhall (Hrodvar), Gruft des Toten Königs, Gewölbe mit Ebenen (zufällig, Loot nach Schwere) |
- Gefangene erkennt man an Lumpen, Eisenkragen und Kette, nicht an der Hautfarbe.

## Offene Designfragen
Siehe `design/mechanik-check.md` (4 Fragen mit Empfehlung).
