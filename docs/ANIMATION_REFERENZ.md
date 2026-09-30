# Animations-Referenz — Techniken anderer Spiele, übersetzt auf ROTFALL

Zweck: keine Assets kopieren, sondern **Techniken** verstehen, mit denen Spiele ohne 3D und mit wenigen Frames Gewicht, Schmerz und Drama erzeugen — und daraus konkrete, im bestehenden Renderer umsetzbare Regeln für ROTFALL ableiten.

Technische Basis (Ist-Zustand, siehe `src/fig5.js`, `src/sprites.js`, `src/game.js`):
- Figuren sind **code-gemalte** 40×56-Pixelraster (Stil R), keine Frame-Sheets. Jede Pose ist eine Funktion von Gelenkwinkeln (`rigS`/`rigW`), nicht ein gezeichnetes Bild.
- Posen-Satz (`poseOf`, `paintR`): `i0/i1` (Atmen), `w0..w3` (Gehen), `hit`, `kb` (Rückstoß), `guard`, `cast`, `trade`, `carry`, `kneel`, `search`, `sit`, `die1`, `tuck`, `down`, `dead`.
- Schwungkurven (`swingOf` in `fig5.js`) unterscheiden Stoßwaffen (Dolch, Rapier, Speer: zurückziehen → vorschnellen → einholen) von Wucht-Waffen (Schwert, Axt, Keule, Hammer, Zweihänder, Stangenwaffe: Ausholen → Schlag → Nachschwung, bei `v===2` Überkopfhieb).
- Bereits vorhandenes Trefferfeedback (`game.js`): Hit-Stop (`hitStop`, Welt friert kurz ein), Kamerawackeln (`camShake`), weißer Blitz-Silhouette (`flashOf` in `sprites.js`), Rückstoß-Vektor (`c.kb = {x,y,t,T}`, klingt über `t/T` ab).
- Ein Waffen-„Gefühl“ existiert schon als Tabelle `FEEL` (`game.js` Z. 2772–2781): Gewicht, Hit-Stop-Dauer, Kamerawackeln, Ausfallschritt, Taumelwert je Waffentyp — das ist die reale Grundlage, auf der dieses Dokument aufbaut, nicht ein Neuentwurf.
- Verfügbare Transformationen für eine 40×56-Figur: Rumpf hoch/runter (`by`), Kopf-Offset (`hx/hy`), seitliche Neigung (`lean`), Rocksaum-/Umhangschwung (`sw`/`cs`, eine Phase verzögert = sekundäre Bewegung), IK-Arme/Beine, Gliedmaßen-Stümpfe (`limbSt`), Farbblitz, Kamera-Punch (`R.cam.punch`).

Diese Liste ist die Leitplanke für alles Folgende: Empfehlungen bleiben im Rahmen von Winkel, Versatz, Stauchung, Blitz, Drehung — keine Empfehlung setzt Frame-Sheets oder gezeichnete Einzelbilder voraus.

---

## 1. Referenzspiele — was sie technisch tun

### 1.1 Kenshi
Kenshi zeigt Kampf mit sichtbar wenigen, harten Übergängen: Ausholen, Treffer, Trefferreaktion sind einzelne, deutlich unterscheidbare Posen ohne weiche Zwischenbilder — Wucht kommt aus dem harten Schnitt, nicht aus Interpolation. Verletzungen sind strukturell sichtbar (Humpeln, fehlender Arm ändert die Kampfpose dauerhaft), nicht nur kosmetisch. Das deckt sich mit ROTFALLs eigenem `limbSt`/Stumpf-System — Kenshi bestätigt, dass dauerhafte Körper-Zustandsänderung mehr Wucht trägt als ein einmaliger Trefferframe.

### 1.2 RimWorld
RimWorld verzichtet fast vollständig auf Kampfanimation und erzählt Gewalt stattdessen über Text-Log, Farbmarkierung (Blut-Overlay) und Konsequenz (Narbe, Behinderung, Tod als Objekt in der Welt). Design-Philosophie von Tynan Sylvester: Grafik ist Trägermedium für Vorstellungskraft, nicht Ersatz dafür — „RimWorld has graphics like a novel has a typeface“. Für ROTFALL heißt das: nicht jeder Treffer braucht ein aufwendiges visuelles Ereignis; der Kombattext/Float-Text (`float()`) trägt einen Teil der Lesbarkeit, die Animation nur den Rest.

### 1.3 Hyper Light Drifter
Extrem sparsame Palette an Frames pro Aktion, dafür jede Aktion mit klarer Lesbarkeit aus der Silhouette: Wischschlag ist ein Bogen aus 2–3 Posen, kein Zwischenschritt. Weltdesign ohne Text verlangt, dass jede Handlung optisch eindeutig ist — das erzwingt starke Posen-Extreme statt vieler mittlerer Frames. Übertragbares Prinzip: lieber 3 sehr unterschiedliche Posen (Ausholen weit zurück, Treffer weit vorn, Nachschwung sichtbar überschossen) als 6 ähnliche.

### 1.4 Dead Cells
Dead Cells baut Treffergefühl aus Schichten, die einzeln billig sind, gemeinsam aber „Juice“ ergeben: Hit-Stop, Partikel, leichte Verzerrung/Screenshake, Soundtreffer exakt synchron zum Aufprallframe. Wichtig: die Schichten sind **additiv und unabhängig** — Hit-Stop kostet keine Grafik, Screenshake keine Animation. ROTFALLs `hitStop`/`camShake`/`flashOf` sind genau diese Art von billigem, additivem Layer und sollten konsequent pro Waffenklasse skaliert bleiben statt situativ Sonderfälle zu bekommen.

### 1.5 Hades
Hades nutzt Kamera aktiv als Erzählmittel: kurzer Zoom/Fokus beim Betreten eines Boss-Raums, spürbarer, aber kurzer Kamera-„Punch“ bei kritischen Treffern, Zeitlupen-Momente bei besonderen Fähigkeiten. Die Kamera bleibt sonst ruhig und nah — Dramatik wird durch das seltene Abweichen vom Normalzustand erzeugt, nicht durch Dauerbewegung. ROTFALL hat mit `R.cam.punch` (bei kritischen Treffern) bereits genau diesen Hades-Mechanismus; er sollte gezielt auf wenige Momente (Boss-Intro, kritischer Treffer, Vollendungsschlag) beschränkt bleiben, damit er wirkt.

### 1.6 Darkest Dungeon
Darkest Dungeon inszeniert Kampf fast ohne echte Bewegungsanimation: Kamera zoomt kurz auf den Treffer, Ziel wird farbgetönt (rot für Gegner, cyan für Verbündete bei kritischen Treffern), leichte Kamera-Neigung bei Krits. Die Dramatik kommt aus Stillstand + Fokuswechsel + Farbe, nicht aus Bewegung des Charakters selbst. Für ROTFALLs Figurengröße (40×56 Pixel, aus der Distanz gesehen) ist das direkt anwendbar: ein kurzer Farbstich (die vorhandene `flashOf`-Silhouette) plus Mikro-Zoom bei kritischen Treffern trägt mehr als ein zusätzlicher Animationsframe.

### 1.7 Stardew Valley
Stardew Valley kommt mit nur 4 Frames je Laufzyklus aus (Kontaktpose, Passierpose, Kontaktpose Gegenseite, Passierpose), jeweils rund 200 ms gehalten — bei kleiner Pixelgröße reicht das für einen glaubwürdigen Gang. Übertragbares Maß: bei kleinen Sprites braucht ein Laufzyklus keine feineren Zwischenschritte als 4 Phasen; ROTFALLs `w0..w3` deckt das bereits exakt ab.

### 1.8 Enter the Gungeon
Schnelle, eindeutige Ausweichrolle mit kurzer Unverwundbarkeit, stark überzeichneter Bewegungsspur, knappe, aber klare Wiederherstellungsphase danach (Landung, kurze Verwundbarkeit). Übertragbares Prinzip: eine Ausweich-/Rollbewegung braucht drei klar getrennte Phasen (Anlauf/Absprung, Flug mit visuellem Trail, Landung mit kurzem Nachwippen) und darf nicht symmetrisch „rein/raus“ wirken.

### 1.9 Blasphemous
Blasphemous zeigt, dass sehr aufwendige, gliederweise animierte Pixelkunst am oberen Ende der Skala steht (viele Handframes, keine Code-Generierung) — für ROTFALLs code-gemalten Ansatz nicht direkt übertragbar in der Machart, wohl aber im Prinzip: Hinrichtungs-/Tötungsmomente sind bewusst als **eigenständige, seltene Sondersequenz** inszeniert (kurze Verlangsamung, harter Schnitt, expliziter Moment), nicht als Variante der normalen Trefferanimation. Für ROTFALL: ein „Gnadenstoß“ (siehe `game.js`, `Gnadenstoß durch …`) verdient eine eigene, kurze Kamera-/Zeit-Behandlung, keine Wiederverwendung des normalen Hit-Stops.

### 1.10 Fear & Hunger
Dread entsteht hier fast ausschließlich aus **Weglassen**: minimalistischer Sound, lange Stille, keine beschwichtigende Musik, harte Kontraste zwischen ruhigen und plötzlich brutalen Momenten. Übertragbares Prinzip für ROTFALLs Totenland/Grimdark-Ton: nicht jeder Tod muss spektakulär sein — ein *plötzlicher*, fast beiläufiger Tod (kein Screenshake, kein Partikelfeuerwerk, nur ein Geräusch und Stille danach) wirkt in einem grimdark Setting oft bedrohlicher als ein aufwendiger.

### 1.11 Chrono Trigger (JRPG-Dialoginszenierung)
Ältere JRPGs wie Chrono Trigger inszenieren Dialoge trotz technischer Beschränkung dramatisch durch: feste Kamera mit klarer Rahmung der Sprecher, kurze Pausen vor wichtigen Zeilen, Sprite-„Reaktionsposen“ (Kopf hoch, Schultern zurück) statt vollständiger Neuanimation, und Stille/Musikwechsel als Szenenmarker. Übertragbares Prinzip für ROTFALLs Dialogsystem: eine Reaktionspose (z. B. `guard`/`hit`/eigene Kopf-Offsets) beim entscheidenden Dialogsatz plus kurzer Musik-/Soundbruch ersetzt eine aufwendige Kamerafahrt vollständig.

---

## 2. Übertragbare Kernprinzipien (Zusammenfassung aus 1.1–1.11)

| Prinzip | Kern | Quelle(n) |
|---|---|---|
| Hit-Stop als billigster Wucht-Kauf | 40–120 ms Einfrieren der Welt bei Aufprall verkauft Gewicht besser als jede Zusatzanimation | Dead Cells, allgemeine „Juice“-Literatur |
| Additive, unabhängige Schichten | Hit-Stop, Shake, Flash, Sound je einzeln schaltbar/skalierbar, nicht aneinander gekoppelt | Dead Cells, Vlambeer „Art of Screenshake“ |
| Seltene Abweichung wirkt stärker als Dauereffekt | Kamera bleibt neutral, Zoom/Punch nur bei Boss-Intro, Krit, Finisher | Hades, Darkest Dungeon |
| Wenige, extreme Posen statt viele mittlere | 3 klar unterscheidbare Extremposen lesen sich aus der Ferne besser als 6 ähnliche Zwischenframes | Hyper Light Drifter |
| Struktureller statt kosmetischer Schaden | Dauerhafte Zustandsänderung (Humpeln, verlorenes Glied, Blutstufe) trägt mehr als ein einmaliger Trefferframe | Kenshi, RimWorld |
| Weglassen als Stilmittel | Nicht jeder Tod braucht Spektakel; Stille nach einem Treffer kann bedrohlicher sein als Effekt-Feuerwerk | Fear & Hunger |
| Sondermomente verdienen Sonderbehandlung | Hinrichtung/Finisher/Boss-Tod bekommen eigene, kurze Inszenierung statt Wiederverwendung der Standardreaktion | Blasphemous |
| Kleine Sprites brauchen keine feinen Zwischenschritte | 4 Phasen reichen für einen glaubwürdigen Laufzyklus bei kleiner Pixelgröße | Stardew Valley |
| Reaktionspose statt Kamerafahrt | Ein Pose-/Sound-Wechsel im Dialog ersetzt eine Kamerabewegung | Chrono Trigger |
| Ausweichen braucht drei Phasen | Absprung, Flug mit Spur, Landung mit Nachwippen — nie symmetrisch | Enter the Gungeon |

---

## 3. Vorgeschlagene Animationstimings für ROTFALL

Basis ist die bestehende `FEEL`-Tabelle (`game.js`). Die folgenden Werte sind **Verfeinerungen/Ergänzungen**, keine Konkurrenz dazu — `stop`, `shake`, `lunge`, `stag` bleiben die maßgeblichen Werte im Code; hier werden zusätzlich Anticipation/Recovery-Anteile und Idle/Walk-Timings benannt, die im Code bislang implizit über `swingDur` und die Phasenschwellen in `swingOf`/`phaseOf` laufen.

### 3.1 Idle und Gehen (posenunabhängig von Waffe)

| Zustand | Dauer/Takt | Technik im Renderer |
|---|---|---|
| Idle-Wippen (`i0`↔`i1`) | 1200–1600 ms je volle Phase (langsam, kaum wahrnehmbar) | `by`-Versatz ±1 Pixel, keine Armänderung |
| Gehen (`w0..w3`) | 4 Phasen × 130–160 ms = 520–640 ms je Schrittzyklus | Bein-IK je Phase, `sw`/`cs` eine Phase verzögert (sekundäre Bewegung, wie Stardew/Kenshi-Prinzip: 4 Phasen genügen) |
| Rennen/Kampfhaltung (`guard`) | wie Idle, aber `by` konstant abgesenkt (−1), keine Wippen-Phase | Signalisiert Anspannung ohne Zusatzframe |

### 3.2 Angriffe je Waffenklasse

`w0` ist der Gewichtswert aus `FEEL`; Spalten sind Anteile der Gesamtschwungdauer `swingDur` (siehe `swingOf`/`phaseOf`: `wind` bis Schwelle `w0`, `strike` bis 0,5, `follow` bis 0,82, danach Rückkehr in Ruhehaltung).

| Waffenklasse | `w0` (Gewicht) | Ausholen (Anteil) | Treffer-Fenster | Nachschwung (Anteil) | Hit-Stop | Kamerawackeln | Ausfallschritt |
|---|---|---|---|---|---|---|---|
| Dolch | 0,05 | 28 % | schmal, schnell | 32 % | 28 ms | 1,5 | 6 px |
| Rapier | 0,12 | 28 %, Stoßkurve | Stoß-Spitze bei ~42 % | 50 % (einholen) | 32 ms | 1,5 | 8 px |
| Schwert | 0,28–0,36 | 28–36 % | 0,5 | 50 % | 50 ms | 3 | 6 px |
| Speer | Stoßkurve, `back −9` | 30 % (zurückziehen) | Spitze bei 42 % | 55 % (einholen) | 45 ms | 2,5 | 4 px |
| Axt | 0,36 | 36 % (weiter Bogen) | 0,5 | 50 %, sichtbares Überschießen | 72 ms | 4,5 | 5 px |
| Keule/Mace | 0,36 | 36 % | 0,5 | 50 % | 78 ms | 5 | 4 px |
| Streitkolben (Überkopf, `v=2`) | steiler Bogen, `up=−0,7π` | 36 % (hoch über Kopf) | scharfer Abwärtsschlag bei 50 % | 50 % | 78–100 ms | 5–7 | 4–5 px |
| Zweihänder/„great“ | 1,0 (Referenzgewicht) | 36 % | 0,5 | 50 %, größtes Überschießen | 100 ms | 7 | 9 px |
| Hammer | 1,15 (höchstes Gewicht) | 44 % (langes Ausholen, eigens im Code markiert) | 0,5 | 50 % | 118 ms | 8 | 6 px |
| Stangenwaffe | 0,7 | 36 % | 0,5 | 50 % | 70 ms | 4,5 | 5 px |
| Bogen | Spannen `swingDur×1,15` | Zughand wandert sichtbar zum Kinn (`pull`) | Lösen bei 75 % (`swingHit`) | kurz | 30 ms | 1,5 | 0 px |
| Armbrust | 0,45 | Spannen separat (`reloadUntil`) | Lösen bei 42 % | kurz | 40 ms | 3 | 0 px |

Ableitung: je höher `w0`, desto länger der Ausholanteil relativ zur Gesamtdauer (Hammer 44 % vs. Dolch 28 %) — das ist die einzige Stellschraube, die „Anticipation“ im vorhandenen System überhaupt bedeutet, und sie ist bereits im Code (`w0`-Schwelle in `swingOf`) vorhanden. Empfehlung: diese Kopplung beibehalten, nicht durch feste ms-Werte ersetzen, da `swingDur` bereits von Ausrüstung/Skill abhängt.

### 3.3 Trefferreaktionen (Ziel)

| Reaktion | Auslöser | Dauer | Umsetzung |
|---|---|---|---|
| Normaler Treffer | jeder Treffer, `stag < 0,6` | Pose `hit` 120–180 ms, dann zurück in vorherige Pose | `by=-1`, Arme nach hinten (bereits in `rigS`/`rigW` `hit` definiert) |
| Unterbrechender Treffer | `stag ≥ 0,6` (Axt, Keule, Zweihänder, Hammer, Armbrust) | 180–260 ms, bricht laufende Angriffsvorbereitung des Gegners | zusätzlich kurzer `by`-Ruck und Kopf-Offset `hx` verstärkt |
| Block-Ruck | Treffer auf Schild/Deckung | 90 ms, kleiner Rückstoß (`kb` Betrag 7) | bereits im Code (Z. 10653) — als Referenz für „kleine“ Reaktionsklasse beibehalten |
| Kritischer Treffer | `crit` | Hit-Stop × 1 + 40 ms, Shake × 1,8, `R.cam.punch = 0,04` | bereits im Code (Z. 3128–3129) — Hades-Prinzip „seltene Abweichung“ |
| Rückstoß (`kb`) | Distanzeffekt (Explosion, schwerer Treffer) | 90–220 ms Abklingzeit (`t/T`), Betrag 2–40 px je nach Quelle | Pose `kb`: `by=+1`, Arme hoch, Beine leicht gespreizt (vorhanden) |

---

## 4. Todessequenzen nach Ursache

Aktuell gibt es eine gemeinsame Sterbepose (`die1`) und einen Partikel-/Sound-Aufruf in `die()` (Blut/Knochen + „necro“-Funken + Staub, `sfx('death'|'bone')`). Das folgende ist ein Vorschlag, die vorhandene Pose `die1` (kniend, Kopf/Arme nach unten/hinten) durch Fall-Varianten zu ergänzen, die **dieselben Bausteine** (Rumpf-`by`, Kopf-`hx/hy`, Bein-IK, Rotation der ganzen Figur beim Blit) neu kombinieren — keine neuen Frame-Sheets, nur neue Winkel-Kombinationen plus Dauer/Rotation beim Endzustand `down`/`dead`.

| Ursache | Bewegungsbild | Technische Umsetzung | Dauer bis `down` | Partikel/Sound |
|---|---|---|---|---|
| Sturz rückwärts (schwerer Wucht-Treffer, Explosion) | Figur kippt nach hinten, Arme reißen hoch | `lean`/`hy` progressiv gegen 90°, `kb`-Vektor nach hinten groß | 300–400 ms | Staub-Burst am Aufprallpunkt |
| Sturz vorwärts (Stoßwaffen, Genickschlag) | Figur knickt nach vorn, Kopf voran | Rotation um Fußpunkt nach vorn, Arme kurz nach vorn geworfen | 260–340 ms | Blut nach vorn versetzt |
| Knie-Kollaps (Erschöpfung, Gift, langsamer Tod) | kein Kippen — sackt gerade nach unten (`kneel`→`die1`) | reine `by`-Absenkung, keine Rotation | 400–600 ms (langsamer, „ruhiger“ Tod, Fear&Hunger-Prinzip: kein Spektakel) | nur leises Ausatmen, kein Screenshake |
| Verbrennen (Feuer) | Figur zuckt kurz (`hit`-artig), dann `down` mit Farbüberlagerung statt Formänderung | Flash-Silhouette in Glutfarbe (`flashOf`-Technik wiederverwendet, andere Füllfarbe) statt weiß, kurze Rotation | 250 ms + 400 ms Nachglühen | Funken/Rauch-Partikel, kein Blut |
| Erfrieren/„Freeze-Break“ | Figur erstarrt in Trefferpose (kein Rückstoß), zerbricht dann | letzte Pose einfrieren (kein neuer Rig-Aufruf mehr), dann Ausblenden in kleine Splitter-Partikel statt Blut | Erstarren 200 ms, Zerbrechen 150 ms | „bone“-artiges Splitter-FX, hoher, kurzer Ton |
| Auflösen (Magie/Seelenbindung, Untote bei heiligem Schaden) | keine Sturzbewegung — Figur bleibt in letzter Pose, verblasst | Alpha-Fade der gemalten Silhouette über Zeit, `motes`-Silhouette-Funken nach oben (bereits als `sil: 'motes'`-Mechanik vorhanden) | 500–700 ms Fade | „necro“-Partikel nach oben, kein Aufprallgeräusch |
| Untoten-Zerfall (Skelett, Ghoul ohne Wiederauferstehung) | Sackt in sich zusammen statt zu fallen | `by` stark negativ (Rumpf schrumpft Richtung Boden), keine Rotation | 300 ms | „bone“-Partikel (bereits vorhanden für `bony` in `die()`), kein Blut |
| Automaten-Abschaltung (Konstrukt/Automat) | kein organisches Kippen — ruckartiges Erstarren, dann kippt starr wie ein Brett | letzte Pose einfrieren, danach Rotation der gesamten Figur als starrer Körper (kein Bein-/Armnachwippen) | Erstarren 150 ms, Kippen 300 ms | Metall-/Dampf-Sound, kurzer Funkenblitz statt Blut |

Gemeinsame Regel: **Ursache entscheidet über Rotation und Partikelfarbe, nicht über eine neue Pose.** Das hält den Aufwand auf dem Niveau von zwei bis drei zusätzlichen Zahlenwerten je Ursache (Rotationswinkel, Dauer, Partikeltyp) statt neuer Rig-Definitionen.

---

## 5. Kameraregeln

| Situation | Regel | Begründung |
|---|---|---|
| Normaler Treffer | keine Kameraveränderung außer dem waffenspezifischen `camShake` aus `FEEL` | Konsistenz, Übersättigung vermeiden (Hades-Prinzip: Abweichung muss selten bleiben) |
| Kritischer Treffer | zusätzlicher kurzer `cam.punch` (bereits vorhanden), kein Zoom | Darkest Dungeon: Fokus per Punch/Farbe genügt, kein echter Zoom nötig bei 40×56-Figuren |
| Boss-Intro | einmaliger, kurzer Zoom auf den Boss (400–600 ms), danach sofort zurück auf Normalabstand; kein Dauerzoom während des Kampfs | Hades: Zoom ist ein Satzzeichen, kein Zustand |
| Finisher/Gnadenstoß | kurzer Hit-Stop deutlich länger als normale Waffen-Werte (z. B. 150–200 ms) + Stummschaltung der Umgebungsgeräusche für die Dauer | Blasphemous-Prinzip: eigene, seltene Inszenierung statt Wiederverwendung des normalen Treffer-Feelings |
| Ruhiger/„stiller“ Tod (Erschöpfung, Gift, Hinrichtung eines Wehrlosen) | ausdrücklich **kein** Shake, **kein** Punch | Fear & Hunger: Stille wirkt bedrohlicher als Effekt |
| Wichtiger Dialogsatz | keine Kamerabewegung; stattdessen Reaktionspose + kurzer Musik-/Soundbruch | Chrono-Trigger-Prinzip: Pose statt Kamerafahrt |
| Dauerzustand (Sturm, Verfolgung) | Kamera bleibt neutral, keine kontinuierliche Unruhe | Vermeidet Ermüdung/Motion-Sickness, respektiert `S.settings.motion`-Schalter, der bereits existiert |

---

## 6. Partikelbudget

Richtwert, angelehnt an die bestehenden `fx()`-Aufrufe in `die()` (Blut 12, „necro“ 10, Staub 5 als Referenzgrößen):

| Ereignis | Partikelzahl | Lebensdauer |
|---|---|---|
| Normaler Treffer (leicht/mittel) | 3–6 | 200–400 ms |
| Kritischer Treffer | 8–12 | 300–500 ms |
| Tod (organisch, Blut) | 10–14 | 600–800 ms |
| Tod (Untote/Knochen) | 8–10 | 500–700 ms |
| Tod (Magie/Auflösen) | 6–10, langsam aufsteigend | 700–1000 ms |
| Bosskampf-Spezialangriff | max. 20 gleichzeitig (Performance-Deckel) | situativ |

Regel: Partikelzahl skaliert mit Bedeutung des Ereignisses, nie mit Waffenwert allein — ein kritischer Dolchtreffer darf mehr Partikel bekommen als ein normaler Hammertreffer, auch wenn der Hammer objektiv „schwerer“ ist (Wichtigkeit statt Waffenklasse als Steuergröße, analog Darkest-Dungeon-Krit-Fokus).

---

## 7. Minimales Event-Schema

Für die Synchronisation von Pose, Sound, Partikel und Kamera innerhalb eines Angriffs- oder Todesablaufs, angelehnt an die bereits im Code vorhandenen Phasenschwellen (`wind`/`strike`/`follow` in `phaseOf`):

```
{ t: 0.00, event: 'wind_start' }      // Ausholen beginnt (Pose-Phase 'wind')
{ t: 0.36, event: 'strike_start' }    // Treffer-Fenster beginnt (Waffenklassen-Schwelle w0, hier: Axt)
{ t: 0.42, event: 'impact', fx: 'blood', n: 8, shake: 4.5, stop_ms: 72 }
{ t: 0.50, event: 'follow_start' }    // Nachschwung beginnt
{ t: 0.82, event: 'recover' }         // zurück in Ruhehaltung
```

`t` ist der normierte Fortschritt 0–1 über `swingDur`, identisch zur bestehenden Zeitbasis in `swingOf`/`phaseOf` — kein neues Zeitsystem, nur eine explizite Liste der Momente, an denen andere Systeme (Sound, Partikel, Kamera) einhängen sollen, statt das implizit an drei verschiedenen Stellen im Code zu prüfen.

Todesfall-Variante:
```
{ t: 0,   event: 'death_flash', color: '#e8b8a0' }   // kurzer Farbstich statt weißem Standard-Flash
{ t: 0.1, event: 'fall_start', dir: 'back' }
{ t: 0.4, event: 'impact_ground', fx: 'dust', n: 6 }
{ t: 1.0, event: 'settle' }                          // Endpose 'down' erreicht
```

---

## 8. Zusammenfassung — die 10 wichtigsten Regeln

1. Hit-Stop ist der billigste Wucht-Kauf: 25–120 ms je Waffenklasse, immer additiv zu Shake und Flash, nie als Ersatz für sie.
2. Kamera bleibt neutral als Normalzustand; Zoom/Punch/Zeitlupe sind Satzzeichen für seltene Momente (Krit, Boss-Intro, Finisher), nicht Dauerzustand.
3. Drei klar unterscheidbare Posen-Extreme (Ausholen, Treffer, Nachschwung) lesen sich aus der Spieldistanz besser als viele ähnliche Zwischenframes.
4. Je schwerer die Waffe, desto größer der Ausholanteil relativ zur Gesamtdauer — das ist die eigentliche „Anticipation“ im bestehenden System.
5. Struktureller Schaden (Gliedmaßen-Zustand, Blutstufe, Erschöpfung) trägt mehr Gewicht als ein einmaliger Trefferframe.
6. Todesursache bestimmt Rotation, Farbe und Partikeltyp — nicht eine neue Pose; `die1` bleibt die gemeinsame Basis.
7. Nicht jeder Tod braucht Spektakel: ein stiller, kamerastiller Tod kann im grimdark-Ton bedrohlicher wirken als ein lauter.
8. Sondermomente (Gnadenstoß, Boss-Tod) bekommen eigene, kurze Sonderbehandlung statt Wiederverwendung des Standardtreffers.
9. Reaktionsposen ersetzen Kamerafahrten in Dialogen — ein Pose-/Soundwechsel reicht für Dramatik ohne 3D.
10. Partikel- und Kamerabudget skalieren mit der Wichtigkeit des Ereignisses, nicht automatisch mit dem Waffenwert allein.
