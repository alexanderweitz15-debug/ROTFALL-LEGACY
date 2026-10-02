# Visueller Umbau — Rüstungsvielfalt (Analyst B, 02.10.2026)

Grundlage: VISUAL.md §3 Stil („Rüstungen variieren: beschädigt, sauber, improvisiert, schwer, leicht, Fraktion, selten, einzigartige Bossrüstung; klare Silhouetten“), GATE.md, DECISIONS.md, IST_ZUSTAND §2.28, MECHANIKEN, Code. **Nur Analyse, kein Spielcode.** Stil R (`fig5.js`, 40×56) ist Standard; D ist eingefroren, F aus — alles hier gilt nur für R.
Kosten: Rüstung kostet **nicht je Bild**, sondern über den **Frame-Cache** (`SPEC_KEYS` → `specKey` → ein Bildsatz je Kombination). Jedes neue Spec-Feld oder jeder neue Wert vervielfacht mögliche Kombinationen; Kosten entstehen beim Backen (Ruckler beim ersten Anblick) und im Speicher. Waffenbilder (Rarität, Runen) betreffen Analyst E nur für Bewegung — Aussehen der Rüstung liegt hier.

---

## 0. Bestand (Code-Inventar)

| Bereich | Was es gibt | Code |
|---|---|---|
| Rüstung → Aussehen | `humanSpec`: `ARMOR_LOOK[chest/head/cloak/feet]` (Fraktions-, Klassen-, Endgame-Sets), sonst feste Zuordnung (Lederwams, Steppwams, Brigantine, Schuppen, Kette, Platte; Lederkappe, Nasal-, Kessel-, Topfhelm) | sprites.js `humanSpec`, `ARMOR_LOOK`, `itemLook` |
| Materialklassen | `armor: 'leather' / 'chain' / 'plate'`, Farbe `armorCol` | sprites.js; fig5 |
| Wucht/Silhouette | Schulterplatten `pb` 0–2, Halsberge `gg`, Kniekacheln `kn`, Dornen `spk`, Pelzkragen `fur`, Runen `rn`, Magitech-Kern `core`, Ketten `chn`, langer Umhang `capeL`, Augenglühen `ge`, Asymmetrie `asy`, Silhouetten-Zier `sil` (Kragen, Hörner, Geweih, Flammen, Funken), Körperbau `bd`, Haltung `stance` | sprites.js `SPEC_KEYS`; fig5 (`wideS`, Rüstungswucht 0–4) |
| Zustand | `wear` 0–3 aus **Durchschnitt** des Zustands aller angelegten Teile (`cond`), Mindestwerte je Beruf (Bettler 3 …) und Gefangene 3; `blood` 0–2 aus Leben | sprites.js `condition`, `bloodOf`; fig5.js `wear` (abgedunkelte Stoffstellen, zerrissener Saum ab 2, Flicken ab 2, **Rostpunkte auf Metall**, Blutflecken) |
| Hände/Beine | Handschuhe: Panzer-, Ketten-, sonst Lederfarbe; Beine: Beinschienen (mit Kniebuckeln), Kettenbeinlinge, sonst Lederfarbe | sprites.js `humanSpec` (Zeilen `hk`/`lk`) |
| Umhänge/Kapuzen | 13+ Umhangformen, 11+ Kapuzenformen, Futter, Borte, Fibel, Fransen, Muster; Formen nach Region/Fraktion (`DRAPE_CW`) | sprites.js `itemLook`, `DRAPE_CW`; MECHANIKEN „Neue Umhänge“, „Runde 11“ |
| Fraktion | Kron-, Ordens-, Sonnen-, Kettensets; `varyChain`; Wachen Valens mit Wappenfarbe der Heimatstadt; Helmkamm in Stadtfarbe; Regionalkleidung | sprites.js `ARMOR_LOOK`, `varyChain`, Wachen-Logik |
| Improvisiert | Goblins (Blechkappe, Plündererriemen, erbeutetes Kettenhemd), Banditen (Beutehelme, Tücher, Fell), Untote (Rüstungsreste, Schildreste, Leichentücher), Flüchtlinge/Bettler (Fetzen) — **nur bei Gegnern/NPC-Varianten, nicht als Gegenstandsart** | sprites.js `varyGoblin`, `varyBandit`, `varyUndead`, `varyDead` |
| Rarität | **Nur Waffen** zeigen Rarität (Stahlfarbe `steelOf`, Runen ab episch). Rüstung: keine Raritätsdarstellung, auch nicht je Exemplar (`rar`) | sprites.js `weaponSprite`, `steelOf` |
| Bosse/Unikate | Varg, Garmadon, Todesritter, Hrodvar, Hauptmann der Toten tragen **Spieler-Endgame-Sets** (`blutkette`, `totenkrone`, `generalspanzer`) mit Farbabweichung; 32 Elite-Mini-Bosse mit eigenem Look | sprites.js `monsterSpec` (`EL`), data.js `ELITES` |
| Lücken (Skript-Zählung) | Ohne eigenes Aussehen: Brust `kanzlerrobe` (episch), `seemantel`, `cloth_shirt`; Kopf `garmadon_krone` (legendär), `dreispitz`; Füße `iron_boots`, `leather_boots`; Hände/Beine der vier Endgame-Sets (`thron_`, `blut_`, `toten_`, `hochritter_handschuhe`/`_beinschienen`) und Leder | data.js ↔ sprites.js |
| **Befund (Fehler)** | `humanSpec` setzt erst die Set-Farbe (z. B. Thronharnisch `glove: '#c8a040'`), danach überschreibt die Zeile `if (hk) s.glove = …` sie mit **Lederbraun** für jedes unbekannte Handschuhpaar; ebenso `lk` → Hose braun, ohne Kniebuckel. **Wer das volle Set trägt, hat braune Lederhände und -beine.** | sprites.js `humanSpec` |

**Kernbefund:** Die Rüstungs-Darstellung ist schon weit (Wucht, Sets, Klassen-Silhouetten, Umhänge, Abnutzung). Es fehlen: Rarität an Rüstung, echte Bossunikate, „sauber/poliert“ als Gegenpol zu Abnutzung, improvisierte Rüstung als Gegenstandsart, und ein Fehler macht volle Sets an Händen und Beinen falsch.

---

## R1 Zustand: beschädigt bis sauber

**Problem:** Abnutzung ist ein Durchschnitt aller Teile — ein zerschlagener Helm über neuer Platte verschwindet im Mittel. Metall zeigt nur Rostpunkte; Dellen, Kratzer, Risse fehlen. „Sauber/neu“ hat kein eigenes Merkmal (wear 0 = einfach ohne Spuren).
**Inspiration:** Kenshi (Rüstung zerschlissen nach Zustand), Mount & Blade (zerschrammte Ausrüstung), Darkest Dungeon (Verfall als Stimmung), Diablo (glänzende neue Stücke).

| # | Variante | Cache-Kosten | Bewertung |
|---|---|---|---|
| 1 | Zustand je Teil (Helm, Brust, Beine einzeln) | ×4 Kombinationen | Genau, aber Cache-Explosion |
| 2 | **Glanzkante bei sauber** (wear 0 + Metall: helle Kantenpixel, Politur) | 0 neue Stufen (nutzt wear 0) | Sehr gut: macht „neu“ sichtbar |
| 3 | **Dellen/Kratzer** auf Platte und Helm ab wear 1 (2-px-Linien, Seed-fest) | 0 neue Stufen | Sehr gut |
| 4 | Gerissene Riemen hängen herab (wear 2–3) | 0 | Gut |
| 5 | Schmutz nach Region (Schlamm, Asche, Schnee) | +1 Feld × Regionen | Teuer, wechselt oft → nein |
| 6 | Blut sammelt sich über Kämpfe, Waschen am Trog entfernt | neues gespeichertes Feld | Neue Mechanik → offen |
| 7 | Reparatur sichtbar (Nieten/Flicken nach Schmied) | Verlaufsfeld | Schön, aber neues Feld → später |
| 8 | Rostfarbe nach Material (Bronze grün, Eisen braun, Messing dunkel) | 0 (Material liegt vor) | Gut |
| 9 | **Risse/Lücken** in Platten bei wear 3 | 0 | Sehr gut |
| 10 | „Schlechtestes Teil zählt“ statt Durchschnitt | 0 | Gut: ein kaputter Helm wird sichtbar — **ändert aber, was wear bedeutet** |

**Wahl:** **2 + 3 + 9 + 8** (alles innerhalb der heutigen Stufen 0–3, kein neues Feld); 10 offen; 6/7 später als eigene Vorschläge.

**FEATURE IMPACT REPORT R1**
- Betroffene Systeme: sprites.js `condition` (`wear`), `SPEC_KEYS`; fig5.js `wear`, Material der Teile (`C.P[pid].mat`); game.js Verschleiß (`cond` je Schlag/Block, Reparatur `repairAll`, `mendAt`).
- Vorhanden: Stufen 0–3, Seed `wseed`, Material, Rost.
- Fehlt: Politur-, Dellen-, Riss-Zeichnung.
- Persistenz: keine neue (abgeleitet aus `cond`).
- Risiken: Alle Figuren mit Metall bekommen neue Bilder → einmaliger Neubau des Caches (Ruckler beim ersten Anblick; Vorbacken in Leerlaufzeit gibt es — `warmQ`); NPC-Wachen mit wear 0 glänzen plötzlich alle → Wachen-Mindestabnutzung beachten.
- Plan: S1 Dellen + Risse · S2 Politur · S3 Rost je Material · Debug „Rüstungszustand 100/60/30/10 % (Held)“, Probe: Spec-Schlüssel stabil nach Laden.

**OFFENE DESIGNENTSCHEIDUNGEN R1**
1. Durchschnitt oder schlechtestes Teil bestimmt das Aussehen? Empfehlung: Durchschnitt bleibt; zusätzlich darf ein Helm unter 25 % eigene Kerben zeigen (nur Kopf, ein Zusatzwert).

---

## R2 Improvisiert

**Problem:** Improvisiertes gibt es nur als Gegner-Varianten. Miliz, Flüchtlinge, Siedler, befreite Sklaven, Spieler am Anfang tragen sauber zugeordnete Kleidung. Das Gefühl „zusammengesucht, ums Überleben“ fehlt bei Menschen der eigenen Seite.
**Inspiration:** Kenshi (Topfhelm, Lumpenrüstung), Mad-Max-artige Survival-RPGs, Darkest Dungeon (Bauern-Ausrüstung), Mount & Blade (Bauernmiliz mit Mistgabel und Gambeson).

| # | Variante | Cache | Bewertung |
|---|---|---|---|
| 1 | **Mischregel:** Teile verschiedener Material-/Farbfamilien wirken zusammengewürfelt (Asymmetrie `asy`, eine Schulter nackt) | 0 neue Felder | Gut, entsteht von selbst |
| 2 | **Gurte und Seile** über Kleidung, Topf als Helm | +1 Helmform | Sehr gut, sofort lesbar |
| 3 | Fellpolster an Schultern | `fur` vorhanden | Gut |
| 4 | Holzplanken-Schild | Schildform | Gut |
| 5 | Kettenreste über Lumpen | vorhanden (Goblins) | Übertragen |
| 6 | Schrottplatten (Goblin-Art) für Grubenhort-Freie | vorhanden | Übertragen auf Freie vom Grubenhort |
| 7 | Kultmasken | vorhanden | — |
| 8 | Berufsschutz als Rüstung (Schmiedeschürze, Fischer-Ölzeug) | vorhanden teils | Gut |
| 9 | **Milizbild:** Steppwams + Topfhelm + Werkzeug (Stadt ohne Schutz, Miliz, Siedlungs-Lagerwachen) | +1 Helmform | Sehr gut, passt zu bestehenden Miliz-Systemen |
| 10 | Gefangenenkleidung mit Fesselrest nach Befreiung | vorhanden (`captive` wear 3) | Gut, nach Befreiung beibehalten |

**Wahl:** **9 + 2 + 1**, 6 und 10 übertragen; als **Gegenstand** nur nach Entscheidung.

**FEATURE IMPACT REPORT R2**
- Betroffene Systeme: sprites.js `humanSpec`, `varyGoblin`/`varyBandit` (Vorlagen), Helmformen in fig5; game.js Miliz (Stadt ohne Schutz, Stadtverteidigung `defenseChoices`), Siedlung (Lagerwachen, Siedler), Freie vom Grubenhort, T08-Gefangene; data.js (falls Gegenstände).
- Vorhanden: Formen bei Gegnern, Miliz-/Siedler-Figuren.
- Fehlt: Topfhelm-Form; Zuordnung Miliz/Siedler → Improvisiert-Look.
- Persistenz: keine (Look aus Rolle).
- Risiken: Wird „improvisiert“ ein Gegenstand (Topfhelm mit Werten), ist das neue Balance → `BALANCE_GUIDE.md`, Handwerk-Rezepte (§5d.8) betroffen.
- Plan: S1 Topfhelm + Miliz-Look · S2 Siedler/Freie · S3 (nach Entscheidung) Gegenstände.

**OFFENE DESIGNENTSCHEIDUNGEN R2**
1. Improvisierte Rüstung als Gegenstand (herstellbar/erbeutbar) oder nur Aussehen von NPCs? Empfehlung: zuerst nur Aussehen; Gegenstand später als eigener Vorschlag mit Balance.

---

## R3 Schwer und leicht

**Problem:** Die Breite der Silhouette folgt der Rüstung (Wucht 0–4) — das ist gut. Bewegung, Klang und Stoff verraten das Gewicht aber nicht: Plattenträger laufen und klingen wie Lederträger.
**Inspiration:** Dark Souls (Rüstungsklang, Gewicht in der Rolle), Mount & Blade (Klirren), Kenshi (schwere Rüstung = langsamer, sichtbar), Witcher (Stoff schwingt, Platte nicht).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | Gangbild schwerer (kürzere Schritte) | → E (Bewegungsanimation) | — |
| 2 | **Schrittklang nach Rüstung** (Leder dumpf, Kette rasselnd, Platte klirrend) | sfx `step` + Material | Sehr gut, billig |
| 3 | Staub/Abdruck bei schweren Figuren | `fx` gedrosselt | Mittel |
| 4 | Größerer Schatten | ±0 | Gering wirksam |
| 5 | **Plattenwippen**: Schulterplatten heben sich 1 px im Laufbild | Cache: Laufbilder | Gut, aber fig5-Arbeit |
| 6 | **Leicht: Stoff schwingt** (Umhänge tun es schon; Röcke/Wämser folgen) | Laufbilder | Gut |
| 7 | Visier offen/geschlossen | Helmform | Mittel |
| 8 | **Kontrastregel:** Platte hat helle Kanten und dunkle Fugen, Leder weiche Übergänge | 0 neue Felder | Sehr gut für Lesbarkeit |
| 9 | Leichte Rüstung mit sichtbaren Taschen/Gurten | vorhanden | — |
| 10 | Gewichtsklasse im Inventar | UI | → Inventar-Analyse |

**Wahl:** **2 + 8 + 6**, 5 als Bild-Scheibe; 1 → E.

**FEATURE IMPACT REPORT R3** — Systeme: sfx.js `step` (heute zufällige Tiefpass-Frequenz), game.js Schrittauslöser, sprites.js `heavyOf`/Rüstungswucht, fig5 Schattierung. Vorhanden: Materialklasse je Figur. Fehlt: Schrittklang-Varianten; Kontrastregel in fig5. Risiken: Schrittklänge vieler NPCs → nur Held, Gefährten und nahe Figuren (`earVol`); `sfx('step')` nutzt `Math.random` (gut, kein Spielzufall). Plan: S1 Klang · S2 Kontrast · S3 Stoffschwung. Keine offene Entscheidung.

---

## R4 Fraktion

**Problem:** Valen, Orden, Aurelion und Kette haben eigene Sets; Wachen tragen Stadtfarben. Bei Banden, Seevolk-Clans, Toten, Goblins und vor allem beim **Spieler als Mitglied** fehlt ein durchgehendes Erkennungsmerkmal; Rang ist nicht sichtbar.
**Inspiration:** Mount & Blade (Wappenfarbe ganzer Heere), Total War (Einheiten nach Fraktion), ESO (Allianz-Wappen), Kenshi (Fraktionsrüstung = Zugehörigkeit, Verkleidung).

| # | Variante | Cache | Bewertung |
|---|---|---|---|
| 1 | Wappenrock mit Fraktionszeichen für alle Soldaten | `tabard`/`mark` vorhanden | Gut, teils da |
| 2 | **Farbregel aus `FACTIONS.colors`** für Schärpe/Federbusch/Futter | 0 neue Felder | Sehr gut, eine Quelle |
| 3 | **Schildwappen** je Fraktion | `shieldCol`/`mark` | Sehr gut |
| 4 | Rückenbanner für Anführer (Anführer-Feldzeichen gibt es) | vorhanden | Ausbauen |
| 5 | **Helmform je Fraktion** (Valen Nasal, Orden Topf, Aurelion Mechanik, Kette Hörner) | Helmformen vorhanden | Sehr gut, Silhouette |
| 6 | **Rangzeichen:** Federbusch, Goldkante, Umhang ab höherem Rang | +1 Feld (Rangstufe 0–2) | Sehr gut — auch für den Spieler |
| 7 | Fraktionsfarbe nur im Umhangfutter | vorhanden (`cln`) | Dezent, gut für Spieler |
| 8 | Erkennungsband (Bande, Clans) | +1 Farbe | Gut für Banden/Seevolk |
| 9 | Spieler bekommt beim Beitritt ein Abzeichen | +1 Feld | Gut, aber Spieleraussehen ändert sich ohne Zutun → offen |
| 10 | **Deserteure/Abtrünnige:** zerrissenes Wappen | wear-Kombination | Sehr gut (E1 Deserteure gibt es) |

**Wahl:** **2 + 3 + 5 + 10**, 8 für Banden/Seevolk; 6/9 offen.

**FEATURE IMPACT REPORT R4**
- Betroffene Systeme: sprites.js `humanSpec`, `monsterSpec`, `varyChain`, Wachen-Farben, `ARMOR_LOOK`; data.js `FACTIONS.colors`; game.js Ränge (`S.ranks`, `rankName`), Banden, Seevolk-Clans (`chooseSeaSide`), E1-Deserteure; render.js `facPip` (Raute muss zur Farbe passen).
- Vorhanden: Farben je Fraktion, Wappenfelder, Helmformen.
- Fehlt: zentrale Farbregel; Rangfeld; Desertion-Look.
- Persistenz: keine (aus Fraktion/Rang abgeleitet).
- Risiken: Verkleidung — wenn Aussehen später Wachen beeinflusst (Kenshi-Prinzip), wird Look zur Regel; heute nicht so → reine Darstellung bleiben. Cache: Rangfeld × Fraktionen.
- Plan: S1 Farbregel + Schild + Helmform · S2 Deserteure/Banden · S3 Rangzeichen (nach Entscheidung).

**OFFENE DESIGNENTSCHEIDUNGEN R4**
1. Soll der Spieler Rang/Fraktion automatisch an der Kleidung zeigen (Abzeichen, Federbusch)? Empfehlung: ja als kleines Abzeichen, kein erzwungener Wappenrock.
2. Soll Kleidung jemals als Verkleidung wirken? Empfehlung: nein (keine Regel vorhanden), nur Aussehen.

---

## R5 Selten (Rarität)

**Problem:** Eine epische Brigantine sieht aus wie eine gewöhnliche. Waffen zeigen Rarität schon (Stahlfarbe, Runen) — Rüstung nicht, auch nicht das gewürfelte Exemplar (`rar`).
**Inspiration:** Diablo/PoE (Seltenheit am Material, nicht als Leuchtreklame), WoW (Tier-Sets mit eigenen Formen), Dark Souls (Seltenes = andere Machart).

| # | Variante | Cache | Bewertung |
|---|---|---|---|
| 1 | **Zierkante je Rarität** (selten: Messingniete, episch: Goldkante, legendär: Gravurlinie) | +1 Feld (0–3) | Sehr gut, dezent |
| 2 | Leuchten für legendär | `glow` vorhanden | Nur legendär/mythisch, sonst kitschig |
| 3 | Partikel | `fx` je Bild | Nein (Kosten, Stil) |
| 4 | **Materialverschiebung wie bei Waffen** (`steelOf`: mythisch blasses Blau, legendär Gold) | Farbe im Feld | Sehr gut, einheitlich mit Waffen |
| 5 | Keine Darstellung, nur UI | 0 | Zu wenig |
| 6 | **Affix-Zeichen:** Dornen-Affix → kleine Stacheln (`spk` gibt es), Lebenskraft → roter Stein | Felder vorhanden | Gut, zeigt Werte ohne Text |
| 7 | Set vollständig → leichte Aura | `glow` | Mittel — offen |
| 8 | Inschrift/Name | Text | Nein |
| 9 | Bodenlicht beim Drop | → Items (Prio 5) | — |
| 10 | Kontur in Raritätsfarbe | Cache ×2 | Nein (MMO-haft) |

**Wahl:** **1 + 4 + 6 (Teilmenge)**, 2 nur mythisch/legendär; 7 offen.

**FEATURE IMPACT REPORT R5** — Systeme: sprites.js `humanSpec` (Exemplar-Rarität `rar` lesen), `steelOf`, `SPEC_KEYS`; fig5 Kanten; game.js `mkItem` (Rarität/Affixe je Exemplar), `AFFIXES`. Vorhanden: Rarität und Affixe je Exemplar, Waffenlogik als Vorbild. Fehlt: Raritätsfeld im Spec. Risiken: +1 Feld × 4 Stufen = bis ×4 Bilder für Träger — NPCs tragen fast nur gewöhnlich → kaum Mehrbedarf; Gefährten mit Beute ja. Plan: S1 Kante + Material · S2 Affix-Zeichen. **Offen:** Set-Aura (7)? Empfehlung: nein, Sets haben eigene Formen.

---

## R6 Bossrüstung und Unikate

**Problem:** Bosse tragen die **Spieler-Endgame-Sets** (Garmadon, Hrodvar, Todesritter: Totenkrone; Varg: Blutkette) — wer das Set trägt, sieht aus wie der Boss, und der Boss wirkt nicht einzigartig. Unikate wie `garmadon_krone` (legendär) und `kanzlerrobe` (episch) haben gar kein eigenes Aussehen.
**Inspiration:** Dark Souls (Bossrüstung erkennbar, nach Sieg tragbar), Diablo (Unikat = eigene Form), Hades (Boss-Silhouette unverwechselbar), Darkest Dungeon (Boss-Rüstung bricht in Phasen).

| # | Variante | Cache | Bewertung |
|---|---|---|---|
| 1 | **Eigenes Motiv je Boss** (Garmadons Krone + Totenmantel, Hrodvars Eisrunen-Platte, Vargs Kettengewand) als `ARMOR_LOOK`-Einträge | wenige Bosse | Sehr gut, Pflicht |
| 2 | **Boss trägt seine Beute sichtbar** (was er fallen lässt, trägt er vorher) | 0 extra | Sehr gut: Wiedererkennen nach dem Sieg |
| 3 | **Rüstung bricht je Phase** (Helm fällt, Platte reißt) | 1–2 Specs je Boss | Sehr gut (K10) |
| 4 | Silhouetten-Zier (`sil`) eigen je Boss | Feld vorhanden | Gut |
| 5 | Trophäe am Spieler nach Sieg (Krone am Gürtel) | +1 Feld | Schön, aber neues Feld → später |
| 6 | **Lebende Rüstung** (pulsierende Adern wie die Blutkult-Sense) für Aldhelm/Blutfürst | Zeichnung je Bild (wie `weaponPulse`) | Gut, gezielt |
| 7 | Übergröße | `scale` vorhanden | Nur wo passend |
| 8 | Animierter Umhang | vorhanden (`capeL`) | — |
| 9 | Leuchtinschrift | `rn` vorhanden | Gut |
| 10 | Eigenes Licht in Dunkelheit (`lightOf`) | Licht-Pass | Gut für Gruftbosse |

**Wahl:** **1 + 2 + 3**, 6 für Aldhelm, 4/9 als Mittel; 5 später.

**FEATURE IMPACT REPORT R6**
- Betroffene Systeme: sprites.js `monsterSpec` (`EL`-Liste), `ARMOR_LOOK`; data.js `BOSS_LOOT`, Unikate (`garmadon_krone`, `kanzlerrobe`, Legendäre je Boss); game.js Boss-Phasen (K10), `dropLoot`; render.js `drawCreature`, `weaponPulse`/`leechGlow` (Vorbild Puls).
- Vorhanden: Endgame-Set-Formen, Boss-Beute-Tabellen, Phasenzustand.
- Fehlt: Boss-eigene Looks; Abgleich Boss-Aussehen ↔ Beute; Phasen-Specs.
- Persistenz: keine (Boss-Look aus Typ/Phase).
- Risiken: Wer `totenkrone` heute für „Garmadons Rüstung“ hält, sieht nach der Trennung etwas anderes → Erwartung klären; Boss-Beute ist zufällig (90 %/60 %/25 %) — „trägt seine Beute“ geht nur für fest zugeordnete Unikate.
- Plan: S1 Lücken schließen (Krone, Kanzlerrobe, Seemantel, Dreispitz, Stiefel) · S2 eigene Boss-Looks · S3 Phasenbruch · Debug „Bosse nebeneinander (Look)“.

**OFFENE DESIGNENTSCHEIDUNGEN R6**
1. Sollen Bosse weiter Spieler-Sets tragen oder eigene Rüstungen? Empfehlung: eigene; die Spieler-Sets bleiben „im Stil von“.
2. Soll der Boss sichtbar tragen, was er fallen lassen kann? Empfehlung: ja, für das feste Unikat.

---

## R7 Klare Silhouetten und Lücken

**Problem:** Viele Unterschiede liegen in Farbe und Kleinpixeln; aus Kampfentfernung (Zoom 0,7) verschwimmen Leder, Gambeson und Brigantine. Dazu der Handschuh-/Beinschienen-Fehler (§0) und Teile ohne Aussehen.
**Inspiration:** Team-Fortress-Prinzip „Silhouette zuerst“, Darkest Dungeon (jede Klasse am Umriss erkennbar), Hades (starke Formen), Kenshi (Helmformen als Erkennung).

| # | Variante | Kosten | Bewertung |
|---|---|---|---|
| 1 | **Schulterbreite als Hauptmerkmal** der Gewichtsklasse (gibt es) konsequent | 0 | Regel, schon halb da |
| 2 | **Kopfform als zweites Merkmal** (Helm/Kapuze/Haar) — jede Fraktion eine Helmform | 0 | Sehr gut (R4-5) |
| 3 | **Umhanglänge als drittes Merkmal** (Rang/Stand) | 0 | Gut |
| 4 | Waffenumriss | → E | — |
| 5 | Haltung (`stance`) je Klasse | vorhanden | Ausbauen |
| 6 | Konturfarbe je Fraktion | Cache ×n | Nein |
| 7 | Größe (`big`) | vorhanden | Nur Sonderfälle |
| 8 | Zierteile (Banner, Hörner, Geweih) | vorhanden (`sil`) | — |
| 9 | **Silhouetten-Prüfstand im Debug:** alle Rüstungen als schwarze Schatten nebeneinander, Zoom 0,7 | nur Debug | Sehr gut als Qualitätswerkzeug |
| 10 | Umriss beim Überfahren | Cache ×2 | → N10 |

**Wahl:** **Regel 1 + 2 + 3** („drei Merkmale“), **9 als Werkzeug**, **Fehler und Lücken zuerst beheben**.

**FEATURE IMPACT REPORT R7**
- Betroffene Systeme: sprites.js `humanSpec` (Zeilen `hk`/`lk` — Fehler), `ARMOR_LOOK`; data.js Rüstungsteile ohne Look; fig5; Debug-Menü „Grafik“ (Rüstungsset anlegen gibt es).
- Vorhanden: Set-Debug, Wucht-Stufen, Helmformen.
- Fehlt: Fehlerkorrektur (Set-Handschuhe/Beinschienen behalten Set-Farbe und Kniebuckel), Looks für 7 Teile, Prüfstand.
- Persistenz: keine.
- Risiken: Korrektur ändert das Aussehen aller Set-Träger (gewollt); Probe „Vielfalt“ vergleicht evtl. Spec-Werte — prüfen.
- Plan: S1 Fehler (Hände/Beine) + fehlende Looks · S2 Prüfstand · S3 Merkmal-Regel auf alle Rüstungen anwenden. Der Fehler gehört zusätzlich in `ROTFALL_STATE/BUGS.md` (Lead entscheidet).

**OFFENE DESIGNENTSCHEIDUNGEN R7** — keine; Fehlerkorrektur braucht nur Freigabe.

---

## Gesamtplan Rüstungen (Scheiben)
1. **Fehler und Lücken:** Set-Hände/-Beine, 7 Teile ohne Look (R7-S1, R6-S1).
2. **Zustand lesbar:** Dellen, Risse, Politur (R1).
3. **Fraktion:** Farbregel, Schild, Helmform, Deserteure (R4).
4. **Rarität:** Kante + Material (R5).
5. **Bosse:** eigene Looks, Phasenbruch (R6, mit K10).
6. **Gewicht:** Schrittklang, Kontrast (R3); Miliz/Improvisiert (R2).
Jede Scheibe: Debug „Rüstung vorführen“ (Prüfstand), MECHANIKEN-Zeile (z. B. „Seltene Rüstung erkennt man an der Kante“), Probe für stabile Spec-Schlüssel nach Laden, Cache-Messung (`trimCache`, Bildanzahl).

**STATUS: TEILWEISE DEFINIERT** — sofort möglich: R1, R3, R4-S1/S2, R5, R6-S1, R7. Wartet: Improvisiert als Gegenstand (R2), Spieler-Rangzeichen (R4), eigene Bossrüstungen statt Sets (R6).
