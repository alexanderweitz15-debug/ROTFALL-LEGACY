# Gegnerideen — Sammlung

Grundlage: `docs/IST_ZUSTAND.md` §2.7, `src/data.js` (`MONSTERS`, `ELITES`), `docs/MECHANIKEN.md` §2–3,
`src/body.js`, Weltaufteilung aus `CLAUDE.md`, `ROTFALL_STATE/DECISIONS.md` (letzter Abschnitt, Neue Gegner).
Nicht nochmal vorgeschlagen: Bomben-Skelett, Großes Skelett, Mutierte Menschen (bereits in Arbeit).

**Bestand laut `src/data.js` (43 Kampfgegner ohne Tiere/Übungsziele):** Totenland/`undead` 18 Typen,
Blutkult/`blut` 5, Kette/`chain` 4, Banditen/`bandit` 4, Goblins/`goblin` 4 (+2 Bosse: Dodon, Gorak),
Seevolk/`pirate` 3, Omega/Engel 4, **Aurelion/`aurel` nur 1** (Kriegsautomat), Himmelsinsel: **0** eigene
Gegnertypen (nur Hofpersonal). Das ist die auffälligste Lücke im heutigen Bestand.

Ton: grimdark, eigenständig, keine Kopien anderer Spiele — nur als Denkanstoß genutzt.

---

## Westen — Kette / Eisenmark

### 1. Brandwärter
- **Region:** Eisenfeste, Schmelzen und Minenschächte der Kette.
- **Aussehen:** Breite Silhouette mit Lederschürze und glühender Zange am Gürtel, Gesicht hinter rußiger Maske — auch klein als dunkler Klotz mit orangem Glühpunkt erkennbar.
- **Verhalten:** Wirft an Engstellen (Stege, Brücken über die Schmelze) glühende Schlacke im Bogen; die Einschlagfläche wird vorher rot markiert wie bei schweren Angriffen. Steht mit dem Rücken zur Schmelze — von hinten angegriffen, stößt er in die Glut und erleidet selbst Brandschaden.
- **Nutzt Bestehendes:** Ansage/Flächenangriff (nicht blockbar), Status Brennen, Fraktion `chain`.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Eigene Fläche „Schmelze“ als Prop nötig, oder reicht ein bestehender Lava-/Feuer-Tile-Platzhalter?

### 2. Kettenhenker
- **Region:** Eisenfeste, Richtplatz und Sklavenlager.
- **Aussehen:** Vermummter Riese mit Henkersbeil, Kette als Gürtel mit Fußeisen daran — wuchtige, kopflose Silhouette (Kapuze verschmilzt mit Schultern).
- **Verhalten:** Sucht gezielt am Boden liegende Gegner (Gefährten, NPC-Verbündete) und gibt ihnen den Gnadenstoß, bevor er den Spieler angreift — zwingt dazu, Verbündete zuerst aufzurichten statt nur Schaden zu machen.
- **Nutzt Bestehendes:** „Am Boden“-System (15 s bis Verbluten, Gnadenstoß durch Feinde existiert bereits bei NPCs), schwere Hiebe, Fraktion `chain`.
- **Aufwand:** M — die KI-Priorität „liegende Ziele zuerst“ ist neu, das Gnadenstoß-Verhalten selbst nicht.
- **Braucht neue Mechanik:** kleine KI-Erweiterung (Zielpriorität auf `downed`-Entitäten).

---

## Mitte — Menschenland / Banditen

### 3. Fallenleger
- **Region:** Straßen und Waldrand zwischen den Dörfern, Banditenlager.
- **Aussehen:** Hager, mit Lederriemen voller Schlingen und Draht behängt — kauert eher als er steht, auch klein an der gebückten Haltung erkennbar.
- **Verhalten:** Legt vor dem Kampf unsichtbare Schlingen auf dem Weg (kurz als Grasrest sichtbar, wer genau hinsieht); wer durchläuft, steht 2 s fest und nimmt leichten Schaden — danach greift die Gruppe aus dem Gebüsch an.
- **Nutzt Bestehendes:** Fraktion `bandit`, Hinterhalt-Logik (Banditenlager existieren schon).
- **Aufwand:** M. **Braucht neue Mechanik:** Fallen-Entität (Trigger beim Betreten, sichtbar bei genauem Hinsehen/Wahrnehmung).
- **Offene Entscheidungen:** Zählt eine ausgelöste Falle als „entdeckt“ fürs Wahrnehmungssystem? Kann der Spieler Fallen selbst stellen (Parallele zu Audit A4/A8)?

### 4. Pferdedieb-Reiter
- **Region:** Straßen, Gehöfte, Pferdekoppeln der Menschenländer.
- **Aussehen:** Leichter Reiter mit Lasso, auf gestohlenem Pferd — schnelle, niedrige Silhouette, auch klein am Pferdeumriss erkennbar.
- **Verhalten:** Reitet im Kreis um den Spieler, schlägt im Vorbeireiten zu und zieht sich sofort zurück (Hit-and-Run); steigt erst ab, wenn das Pferd unter ~30 % Leben fällt oder der Weg zu eng wird — danach kämpft er wie ein normaler Bandit, aber verwundbarer.
- **Nutzt Bestehendes:** Reittier-Darstellung (Pferd ist bereits Entität mit eigenem Modell), Fraktion `bandit`.
- **Aufwand:** L. **Braucht neue Mechanik:** berittene Gegner-KI (bisher reiten nur Spieler/Gefährten als Transport, nicht im Kampf) samt Absteig-Logik.
- **Offene Entscheidungen:** Kann das Pferd getötet/gestohlen werden? Zählt das als Diebstahl beim Ruf?

---

## Süden — Aurelion (Bionik/Automaten)

*Mit nur einem bestehenden Kampfgegner (Kriegsautomat) die dünnste Gegnergruppe im Spiel — hier lohnt sich die meiste neue Vielfalt am wenigsten teuer.*

### 5. Wächterspinne
- **Region:** Aurelheim, Magitech-Werkstätten, Tickmar-Fabriken.
- **Aussehen:** Kleiner, vielbeiniger Messingkörper, der an Wänden und Decken hängt — auch klein an den gespreizten dünnen Beinen erkennbar, ganz anders als der klobige Kriegsautomat.
- **Verhalten:** Hängt reglos an Wänden/Decken (wie ein Prop) bis der Spieler nah ist, fällt dann herab und greift schnell und oft, aber schwach zu; stirbt sie, zerspringt sie in Schrapnell (kleiner Flächenschaden).
- **Nutzt Bestehendes:** `fly`-Flag (wie Aasschwinge) für wandgängige Bewegung, Automaten-Palette, kleiner Flächenschaden beim Tod (wie Leichenkoloss-Stampfen, nur beim Sterben statt beim Treffer).
- **Aufwand:** S/M. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Hängt sie sichtbar an bestimmten Wand-Props, oder überall im Innenraum?

### 6. Dampframme
- **Region:** Aurelion, Fabriktore, Werksstraßen, Verteidigung der Städte Aurelions.
- **Aussehen:** Breiter, niedriger Automat mit vorgestrecktem Rammschild, Dampfwolken aus Schulterventilen — wuchtige, rechteckige Silhouette.
- **Verhalten:** Baut eine lange Ansage auf (rote Linie quer über den Boden) und rammt dann geradeaus durch — nicht blockbar, wirft alles im Weg um; danach 1,5 s offen und muss sich erst drehen, bevor sie wieder zuschlagen kann.
- **Nutzt Bestehendes:** Ansage/Telegraph-System, „nicht blockbar, nur ausweichen“-Regel (S15), Rückstoß wie bei Rotgardist/Kettenknecht.
- **Aufwand:** M. **Braucht neue Mechanik:** neue `heavy.kind` „charge“ (geradeaus über mehrere Kacheln statt stationärer Fläche).
- **Offene Entscheidungen:** Zerstört sie Hindernisse (Fässer, Zäune) wie der Leichenkoloss Wagen zerschlägt?

### 7. Fabrikarbeiter-Golem
- **Region:** Tickmar, Fabrikstädte Aurelions (besonders während Streik-Ereignissen).
- **Aussehen:** Unförmig aus Schrott und Werkzeug zusammengeflickt, kein glattes Messing wie reguläre Automaten — wirkt improvisiert, asymmetrisch.
- **Verhalten:** Kämpft normal, aber bekommt bei kritischen Treffern eine Chance auf Kurzschluss: 2 s wild um sich schlagend, trifft dabei auch andere Gegner in der Nähe. Erscheint vor allem während des bestehenden Streik-Weltereignisses in Tickmar als Zeichen für improvisierte „Ersatzwachen“.
- **Nutzt Bestehendes:** Status Schock, bestehendes Streik-Ereignis (`docs/MECHANIKEN.md` „Streik in Tickmar“), Raubtier-greift-Banditen-Logik als Vorbild für „greift auch andere Gegner an“.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Nur während des Streik-Events spawnbar, oder dauerhaft als „billige“ Automaten-Variante in ärmeren Fabrikstädten?

---

## Osten — Totenland

*Mit 18 Typen die mit Abstand reichste Gruppe — hier zählt eher Qualität/Rollen-Lücke als Menge. Gesucht: ein Support- und ein Diebstahl-Typ, die es dort noch nicht gibt.*

### 8. Knochenschmied
- **Region:** Nekropolen, Gruft des Toten Königs, Lager der Toten.
- **Aussehen:** Gebeugte Gestalt an einem knöchernen Amboss, glühende Runen statt Feuer — auch klein an Amboss-Silhouette und grünem Glühen erkennbar.
- **Verhalten:** Bleibt im Hintergrund, verstärkt in Intervallen die Waffen nahestehender Untoter (kurzer Schadensbonus-Schimmer); muss gezielt zuerst ausgeschaltet werden, sonst wird der Kampf gegen die Gruppe immer härter.
- **Nutzt Bestehendes:** Aura-Muster wie `war_song`/`fear_aura` (nur als Verbündeten-Buff statt Spieler-Fähigkeit), Rolle „Heiler“ (Kultist der Asche) als Vorbild für Support-Rollen bei den Toten.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Stapelt der Bonus bei mehreren Schmieden, oder wirkt immer nur einer?

### 9. Grabräuber-Geist
- **Region:** Gräberfelder, Gruften, Katakomben.
- **Aussehen:** Schmale, gebückte Geisterfigur mit langen Fingern, wirkt wie ein Dieb, der nie richtig gestorben ist.
- **Verhalten:** Stiehlt bei einem Treffer einen zufälligen Gegenstand aus dem Inventar und flieht sofort in Richtung eines Grabes, in dem er wieder auftaucht — wird er dort erschlagen, bevor er entkommt, fällt der Gegenstand als Beute.
- **Nutzt Bestehendes:** Geist-Statuswerte (kurz körperlos wie `wraith`), Fluchtverhalten (wie Angeschüchterte/Fliehende).
- **Aufwand:** M. **Braucht neue Mechanik:** Diebstahl-bei-Treffer (bisher gibt es keinen Gegner, der Items stiehlt statt nur Schaden zu machen).
- **Offene Entscheidungen:** Kann er gebundene/Quest-Items stehlen, oder nur normale Gegenstände?

---

## Varonheim — Hauptstadt

### 10. Verräterischer Stadtwächter
- **Region:** Varonheim während Belagerung, Kult-Unterwanderung oder Besatzung.
- **Aussehen:** Identisch mit normaler Burgwache, aber mit kaum sichtbarem Blutzeichen oder Kult-Symbol am Kragen.
- **Verhalten:** Verhält sich wie ein Verbündeter, bis die Unterwanderung einen Schwellenwert erreicht oder ein bestimmtes Ereignis läuft — dann greift er von hinten an. Das neue Fraktionszeichen am Gegner (Scout-Idee, bereits gewählt) müsste ihn vorher NICHT verraten, sonst wäre die Spannung weg.
- **Nutzt Bestehendes:** Blutkult-Unterwanderungssystem (Verschwundene, Maskierte, Blutzeichen), Stadtwache-Sprite, Fraktionswechsel.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Wie viele gleichzeitig (einer je Tor, oder zufällig verteilt)? Zählt ein getöteter Verräter als Mord an der eigenen Fraktion, falls er sich noch nicht gezeigt hat?

### 11. Plünderer der Belagerung
- **Region:** Varonheim und andere Städte während „Stadt ohne Schutz“/Belagerung.
- **Aussehen:** Zerlumpter Opportunist mit vollem Sack, kein Kämpfer — huscht an Hauswänden.
- **Verhalten:** Bricht in unbewachte Häuser ein, flieht sofort beim Entdecken statt zu kämpfen; wird er gestellt, gibt er gestohlene Ware zurück (oder wird gejagt wie ein Dieb). Macht die Folgen einer schutzlosen Stadt sichtbar, statt nur als Zahl im Hintergrund zu laufen.
- **Nutzt Bestehendes:** „Stadt ohne Schutz“-System, Rook-Banden-Fluchtverhalten.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Beeinflusst er den Wohlstand der Stadt messbar, oder ist er rein atmosphärisch?

---

## Blutkult

### 12. Blutschöpfer
- **Region:** Katakomben von Varonheim, Kult-Außenposten.
- **Aussehen:** Schlanker Kultist mit Phiolengürtel und Schöpfkelle statt Waffe — eher Sammler als Kämpfer in der Silhouette.
- **Verhalten:** Hält sich im Kampf zurück und versucht, am Boden liegende Gegner (Spieler, Gefährten, NPCs) auszusaugen, um sich und nahe Kultisten zu heilen — exakt die bereits beschlossene „Trinken von Wehrlosen“-Regel (§15), nur als Gegner-Verhalten statt Spieler-Option. Erhöht den Druck, Niedergeschlagene schnell zu schützen.
- **Nutzt Bestehendes:** Beschlossene Blutkult-Regel (Trinken an Wehrlosen, Phiolen), Rolle „Heiler“ als Vorbild.
- **Aufwand:** S/M. **Nur bestehende Systeme kombiniert** (die Regel existiert schon als Design-Entscheidung, nur noch nicht als Gegner-KI).
- **Offene Entscheidungen:** Heilt er sich nur, oder auch andere Kultisten in der Nähe (wie Blutpreis beim Dunklen Hochpaladin)?

### 13. Sonnenflüchtling-Kultist
- **Region:** Kult-Patrouillen außerhalb der Katakomben, tagsüber unterwegs.
- **Aussehen:** Vermummt, Kapuze tief ins Gesicht gezogen, Haut ungesund blass — wirkt gehetzt, nicht aggressiv.
- **Verhalten:** Kämpft bei Tageslicht nur widerwillig (ständiger Brand-Tick, −20 % Schaden laut Beschluss) und sucht aktiv Schatten von Gebäuden/Bäumen; nachts dagegen deutlich gefährlicher und selbstbewusster. Belohnt Spieler, die Kult-Patrouillen gezielt am Tag angreifen statt nachts.
- **Nutzt Bestehendes:** Beschlossene Sonnen-Regel des Blutkults (stetiger Brand, −20 % Schaden, Schutz mildert), Licht/Tag-Nacht-System.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Sucht er aktiv Schatten-Tiles, oder reicht die passive Schwächung?

---

## Seevolk / Gischtinseln

*Nur 3 bestehende Typen (zwei Nahkampf/Fernkampf-Piraten, ein Boss) und keine eigene Tierwelt — im Vergleich zu „Wild“ im Menschenland (4 Typen) dünn für eine ganze Zusatzkarte.*

### 14. Netzwerferin der Sturmklinge
- **Region:** Tangkron, Gischtinseln, Decks der Sturmklinge.
- **Aussehen:** Leicht gerüstete Seevolk-Kämpferin mit schwerem Wurfnetz am Rücken statt Fernwaffe.
- **Verhalten:** Hält Abstand und wirft Netze (Fangnetz-Mechanik wie `net_shot`), um den Spieler festzuhalten, während Plünderer der Sturmklinge nahkommen — ergänzt das bestehende Duo Plünderer/Harpunier um eine dritte, unterstützende Rolle.
- **Nutzt Bestehendes:** `net_shot`-Fähigkeit (bisher nur Spielerfähigkeit beim Kettenjäger) als Gegner-Angriff, Fraktion `pirate`.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Hält das Netz auch Elite-Gegner/Bosse nur kurz fest (wie beim Spieler-Fangnetz: „Große taumeln nur“)?

### 15. Gezeitenaal
- **Region:** Flachwasser um die Gischtinseln, Strände, Hafenbecken.
- **Aussehen:** Kein Seevolk-Mensch, sondern ein echtes Tier — schlangenartige Silhouette, die nur als Wasserwirbel sichtbar ist, bis sie zuschlägt.
- **Verhalten:** Lauert unsichtbar in Wasser-Kacheln, zieht den Spieler bei Annäherung kurz unter Wasser (kurze Bewegungssperre, kein Dauerschaden) und taucht sofort wieder ab — zwingt dazu, Flachwasser an den Gischtinseln nicht mehr achtlos zu durchqueren. Füllt die fehlende „Wild“-Kategorie der Seekarte.
- **Nutzt Bestehendes:** Wasser-Kacheln als Terrain, Fraktion `beast` (aber neues Gebiet).
- **Aufwand:** M/L. **Braucht neue Mechanik:** terrain-gebundenes Lauern/Auftauchen (bisher laufen alle Gegner sichtbar auf Land).
- **Offene Entscheidungen:** Nur in bestimmten markierten Gewässern, oder überall im Flachwasser der Gischtinseln?

---

## Himmelsinsel

*Aktuell null eigene Gegnertypen — nur Hofpersonal. Die Design-Entscheidung „wer dort tötet, auf den landen Luftschiffe mit Adelsheeren“ existiert schon, aber es gibt noch keine konkrete Gegnerfigur dafür.*

### 16. Hofspion
- **Region:** Himmelsinsel, Hof der Herrscher, Gerichtssaal.
- **Aussehen:** Wirkt wie gewöhnliches Hofpersonal (Diener, Schreiber) — keine eigene Kampf-Silhouette, bis er die Maske fallen lässt.
- **Verhalten:** Steht bis zu einem Regelbruch (Mord, Diebstahl am Hof) als harmloser NPC herum; danach greift er sofort mit einem Meuchelstich von hinten an (×3 Schaden wie bestehender Schleichangriff), bevor die Wachen/Luftschiffe eintreffen. Macht die bestehende „Konsequenz“-Regel für die Himmelsinsel erstmals spielbar statt nur beschrieben.
- **Nutzt Bestehendes:** Schleichangriff-Formel (×3 von hinten), Himmelsinsel-Hofsystem, bereits beschlossene Luftschiff-Strafe.
- **Aufwand:** S. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Einer pro Hofszene, oder mehrere je nach Schwere des Regelbruchs?

### 17. Windklinge
- **Region:** Himmelsinsel, ankommende Strafluftschiffe.
- **Aussehen:** Leichter Adelssoldat mit Gleitflügeln aus Stoff und Messing, zwei kurzen Energie-Windklingen — schlank und schnell, deutlich anders als Omegas Engel (keine Heiligkeit, reine Adelstechnik).
- **Verhalten:** Springt per Gleitflügel aus den ankommenden Luftschiffen (bestehende Strafe-Mechanik), kurze Stoßflüge statt Dauerflug, landet zum Zuschlagen kurz am Boden — macht die angedrohten „starken Adelsheere“ konkret bekämpfbar.
- **Nutzt Bestehendes:** `fly`-Flag (kurzzeitig, wie Aasschwinge), Luftschiff-Strafmechanik (bereits als Design-Entscheidung festgelegt), Aurelion-Adelsästhetik.
- **Aufwand:** S/M. **Nur bestehende Systeme kombiniert.**
- **Offene Entscheidungen:** Wellenanzahl je Strafzug? Eigener kleiner „Himmelsinsel-Alarm“-Zustand wie eine Belagerung?

---

## Turm des Nachtglases / Kerker & Stollen

### 18. Nachtglas-Schatten
- **Region:** Turm des Nachtglases (Ilvar), oberste Stockwerke.
- **Aussehen:** Durchscheinende Gestalt, die wie ein verzerrtes Spiegelbild des Spielers wirkt — gleiche Grundform, aber in Schattenfarben und ohne Gesicht.
- **Verhalten:** Kopiert kurz die zuletzt vom Spieler gewirkte Zauberschule und wirkt sie gegen ihn (z. B. nach einem Frostzauber des Spielers erscheint ein Frost-Schattenangriff) — zwingt dazu, Zauberschulen bewusst zu wechseln statt immer dieselbe zu spammen.
- **Nutzt Bestehendes:** Zauberschulen-System, `shade`-Ästhetik, Turm-Fraktion `undead`.
- **Aufwand:** L. **Braucht neue Mechanik:** „letzten Zauber merken und spiegeln“ gibt es noch nicht.
- **Offene Entscheidungen:** Kopiert er nur Schaden, oder auch Status (Frost-Stapel, Brand)? Nur im Turm, oder auch als seltene Elite anderswo?

### 19. Ausbrecher-Rotte
- **Region:** Stollen des Grubenhorts, Kerker, während Sklavenaufstand oder Gefängnisausbruch.
- **Aussehen:** Abgerissene Gruppe in Lumpen, improvisierte Waffen (Spitzhacken, Kettenreste als Peitsche) — wirkt verzweifelt, nicht uniform wie reguläre Banditen.
- **Verhalten:** Kämpft in Rudeln in engen Minengängen, wirft vor dem Zuschlagen eine Handvoll Staub (kurze Sichtbehinderung/Trefferchance-Malus) — fast wie eine kleine, schmutzige Variante der Köder-Pfeife-Idee, nur als Gegnerangriff. Erscheint bei bestehenden Ereignissen (Sklavenaufstand, Gefängnisausbruch).
- **Nutzt Bestehendes:** Jail/Bond-System, Sklavenaufstand-Ereignis, Peitschen-Reichweite als Vorbild.
- **Aufwand:** M. **Braucht neue Mechanik:** kleiner neuer Status „Geblendet“ (kurzer Trefferchance-Malus) — oder Wiederverwendung von Frost/Schock als Platzhalter, falls kein neuer Status gewollt ist.
- **Offene Entscheidungen:** Eigener Blind-Status nötig, oder reicht ein bestehender Debuff als Ersatz?

---

## Markierung: neue Mechanik vs. nur Kombination

| Nur bestehende Systeme kombiniert | Braucht (kleine) neue Mechanik |
|---|---|
| Brandwärter, Fabrikarbeiter-Golem, Wächterspinne, Knochenschmied, Verräterischer Stadtwächter, Plünderer der Belagerung, Blutschöpfer, Sonnenflüchtling-Kultist, Netzwerferin, Hofspion, Windklinge | Kettenhenker (Zielpriorität Liegende), Fallenleger (Fallen-Entität), Pferdedieb-Reiter (berittene Gegner-KI), Dampframme (neuer `heavy.kind` „charge“), Grabräuber-Geist (Diebstahl-bei-Treffer), Gezeitenaal (Terrain-Lauern), Nachtglas-Schatten (Zauber-Spiegelung), Ausbrecher-Rotte (Blind-Status) |

11 von 19 Ideen brauchen **keine** neue Mechanik — nur neue Sprites, Werte und KI-Verdrahtung bestehender Bausteine.

---

## Top 5 Empfehlung

1. **Wächterspinne (Aurelion, Aufwand S/M).** Aurelion hat mit einem einzigen Kampfgegner (Kriegsautomat) die dünnste Gruppe im ganzen Spiel (zum Vergleich: Totenland 18, Kette 4, Banditen 4). Die Spinne kostet wenig (reine Flag-Kombination), liefert aber einen völlig anderen Bewegungsrhythmus (Ambush von Wänden) als der klobige Automat — die billigste große Verbesserung der Gegnervielfalt im Spiel.
2. **Dampframme (Aurelion, Aufwand M).** Zweiter Aurelion-Typ, der die Region endgültig von „ein Gegner mit zwei Werten“ zu einer eigenen Kampf-Identität (schwere, ungebremste Automaten) macht. Passt direkt zur bereits beschlossenen Linie „Aurelion wird je nach Wohlstand stärker“ (T23).
3. **Hofspion (Himmelsinsel, Aufwand S).** Himmelsinsel hat aktuell null Gegnertypen — ein Ort im Spiel ganz ohne Kampf wirkt leer, sobald Spieler ihn aus Neugier aufsuchen. Macht die bereits beschlossene Konsequenz-Regel („Luftschiffe mit Adelsheeren“) zum ersten Mal konkret spielbar, für den Preis einer reinen Backstab-Logik, die es im Spiel längst gibt.
4. **Blutschöpfer (Blutkult, Aufwand S/M).** Setzt eine Design-Entscheidung um, die im Nutzer-Protokoll (`DECISIONS.md`) schon feststeht (Trinken von Wehrlosen, §15), aber bisher nur als Spieler-Option existiert, nicht als Gegner-Verhalten. Erhöht die Spannung um niedergeschlagene Gefährten ohne ein einziges neues Spielregel-Konzept.
5. **Netzwerferin der Sturmklinge (Seevolk, Aufwand S).** Seevolk hat nur drei Kampftypen für eine ganze Zusatzkarte (Tangkron). Die Netzwerferin braucht nur eine bereits vorhandene Spielerfähigkeit (`net_shot`) als Gegnerangriff und gibt der Fraktion endlich eine dritte taktische Rolle (Kontrolle statt nur Nah-/Fernkampf).

Gemeinsamer Nenner: alle fünf sind billig (S bis S/M), schließen eine mit Zahlen belegte Lücke (Aurelion 1, Himmelsinsel 0, Seevolk 3) und bauen ausschließlich auf bereits vorhandenen oder bereits beschlossenen Systemen auf — kein Punkt verlangt eine neue, noch nicht genehmigte Spielregel.
