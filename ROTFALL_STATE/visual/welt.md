# Analyse: Welt-Ereignisse (Priorität 11)

## Bestand (belegt per grep)

- **Zufallsereignisse (stündlich, 10 %):** `game.js` `worldEvent`, `EVENTS` — Steuereintreiber, Deserteure, Missernte, Pilgerüberfall, Brand (`evFire`/`startFire`/`fireTick`), Magitech-Unfall, Spuk, Magiekern, Anomalie, Meteorsplitter, Erbfolgestreit, kleine Meldungen. Präsentation: `log(...)`, `chronicle(...)`, teils `UI.toast`.
- **Große Weltereignisse:** `BIG_START` (Objektliteral je Ereignis: `ok`/`go`), `S.big`, `bigDay`, `bigTick`, `bigSecond`, `bigEnd`, `bigAnnounce(title,text)` — Seuche, Heuschrecken, Turnier, Adelsball, Luftschiffabsturz, Schatzkarawane, Hexenprozess, Gildenstreik, Streik. `bigAnnounce` macht **log + Chronik + `UI.toast(title.toUpperCase())`** — reine Text-/Toast-Ankündigung, kein Bild/Szene für die meisten Typen. Einige Typen spawnen echte, benannte NPCs mit `greet`-Text (Herold Anselm, Zeremonienmeisterin Liviane, Meister Odo, Grete Rußhand) — das ist schon „in der Welt“ statt nur Text, aber ohne besondere Inszenierung beim Erscheinen.
- **Szenen-Engine (T17, Regiebuch) existiert bereits:** `cinematic(...)`, `cineBeat`, `cineBeats`, `nameCard(title,sub,ms)` (Cinzel-Schrift-Namenskarte, nie zwei gleichzeitig), `bossIntro` (Boss-Auftritt, 4–6 s, Spiel pausiert laut `DECISIONS.md`), `capitalScene(kind,a)` — fertige Inszenierung für den Krieg um Varonheim (`host`/`siege`/`fell`: marschierende Skelette, Kamerafahrt, Toreinsturz, Namenskarte „VARONHEIM IST GEFALLEN“, Exil-Dialogzeile). Das ist die einzige der großen Welt-Ereignis-Familien, die bereits mit echter Kameraführung/Partikeln/Ton inszeniert ist.
- **Belagerung/Krieg:** `sim.js`/`game.js` Kriegsgraph (`SIM.warGraph`, `S.war.nodes`), `raidDay`/`raidTick`/`raze` (Überfälle auf Dörfer), `campaignDay` (Feldzüge der Kette), `tributeDay` (Tributzüge), `undeadRaidChoices`/`startMyRaid` (spielergeführte Überfälle) — alles mit echten Figuren im Kampf, wenn der Spieler in der Nähe ist (`materialize`), sonst abstrakt im Hintergrund.
- **Jahreszeiten/Glaube:** `seasonDay` (Ansage bei Wechsel), `faithDay` (Opferfest, Ketzerjagd, Wallfahrt, Kreuzzug) — ebenfalls textbasiert angesagt.
- **`afterSay`/`S.after`:** `afterSay(title,text,kind,toast)` ist die zentrale Funktion für *Folgen* von Ereignissen (Seuche, Hexenprozess-Ausgang, Omegas Ende usw.) — strukturell wie `bigAnnounce`, ebenfalls Text+Toast, kein Bild.
- **Was laut Code fehlt:** Die meisten `BIG`-Ereignisse (Seuche, Heuschrecken, Adelsball, Hexenprozess, Streiks) haben **keine** Eröffnungs-Inszenierung wie `capitalScene`/`bossIntro` — nur Toast+Log+Chronik und ein spawnender NPC mit Grußzeile. Es gibt kein Symbol/keine Markierung *in der Welt* (z. B. Rauchsäule über brennendem Haus ist über `startFire` vorhanden, aber eine Seuche in einer Stadt hat laut Bestand kein sichtbares Zeichen außer dem kranken NPC selbst).

## Problem

Die *Folgen*-Logik der Weltereignisse ist tief und persistent (`S.after`, `S.big`), aber ihre *Ankündigung* ist bei fast allen Typen reiner Text/Toast. Nur der Sonderfall Varonheim (Belagerung, Fall) hat eine echte Inszenierung. Das widerspricht dem Leitsatz aus VISUAL.md direkt für diesen Bereich: „Angesagt wird es per Log, Chronik und Toast“ (Zitat aus `docs/IST_ZUSTAND.md` zu den großen Weltereignissen).

## Inspiration (nur UX, nichts kopieren)

Guild Wars 2 (Weltereignisse mit Ankündigungstext *und* sichtbarem Vorbeben/Rauch/Horn am Ort, bevor man dort ist), Mount & Blade (Belagerungen mit sichtbarer Heeresbewegung auf der Karte, keine Pop-ups), Kenshi (Überfälle kündigen sich durch sichtbare Trupps an, nicht durch Meldung), Darkest Dungeon (kurze, stimmungsvolle Texttafel bei besonderen Ereignissen — reduziert, aber mit Bild/Rahmen statt nacktem Toast), RimWorld (Ereignis-Pop-up mit kleinem Bild/Symbol statt nur Text).

## 10 Varianten

1. **`nameCard` für alle `BIG`-Ereignisse statt nur Varonheim:** Jedes `BIG_START`-Ereignis zeigt beim Start eine kurze Namenskarte („SEUCHE IN …“, „ADELSBALL IN …“) zusätzlich zu Log/Chronik — nutzt die vorhandene, fertige Funktion `nameCard`, keine neue Infrastruktur.
2. **Kleine Kamerafahrt zum Ereignisort (wie `capitalScene`, aber leichter):** 2–3 s Kamera zum Ort, wenn der Spieler in der Nähe ist (gleiche Nähe-Regel wie bei `capitalScene`), sonst nur die Namenskarte.
3. **Sichtbares Zeichen am Ort selbst:** Rauchsäule bei Brand (schon vorhanden über `startFire`), Totenkopf-Fähnchen bei Seuche, Zelt/Fahnen bei Turnier, Absperrung bei Hexenprozess — ständige, leise Weltmarkierung statt punktuellem Toast.
4. **Horn/Glocke als Ton-Signal vor der Textmeldung:** akustische Vorwarnung (nutzt `sfx.js`), bevor der Toast erscheint — Spielgefühl „etwas passiert“ vor dem Lesen.
5. **Ereignis-Symbol auf der Weltkarte** (siehe `karte.md`, Variante 2) — hier nur als Querverweis gelistet, damit nicht doppelt gebaut wird.
6. **Reaktions-Gesten der Bevölkerung:** NPCs in der betroffenen Stadt zeigen kurz eine Geste (Angst bei Seuche, Jubel bei Turnier) beim Ereignisstart, nutzt das vorhandene Gesten-System aus `anim.js`/`cinematic`.
7. **Eigene, aber leichtere Intro-Variante je Ereignisfamilie:** Kriegsereignisse (Belagerung, Feldzug, Überfall) bekommen weiterhin volle `capitalScene`-Kameraführung; reine „Alltags“-Ereignisse (Ball, Turnier, Streik) nur Namenskarte ohne Kamerafahrt — gestufte Inszenierung nach Gewicht.
8. **Ereignis-Chronik-Eintrag mit Mini-Bild statt nur Text:** Die Chronik (`chronicle(...)`) zeigt neben dem Text ein kleines gezeichnetes Symbol (Seuche, Turnier, Ball …) statt reinem Fließtext.
9. **Fortschrittsanzeige in der Welt statt im Protokoll:** z. B. bei der Seuche sichtbare Anzahl Kranker am Ort statt nur `B.dead`/`B.cured`-Zahlen im Log.
10. **Ende-Inszenierung spiegelt den Anfang:** `bigEnd`/`afterSay` bekommt ebenfalls eine kurze Namenskarte bei besonders folgenreichen Ausgängen (z. B. „Seuche nicht eingedämmt“), nicht nur beim harmlosen Abklingen.

## Bewertung gegen ROTFALL

- Variante 1 ist der günstigste und wirkungsvollste erste Schritt: `nameCard` ist fertig, pausiert das Spiel nicht, kollidiert nicht mit dem „nie zwei Namenskarten zugleich“-Grundsatz, solange `BIG`-Ereignisse laut Code ohnehin „höchstens eines zugleich“ sind.
- Variante 2 (Kamerafahrt) sollte **nicht** für jedes Ereignis gleich stark sein wie bei Varonheim — ein Hexenprozess verdient keine 4-Sekunden-Pause-Inszenierung wie ein Bosskampf; hier ist Abstufung (Variante 7) sinnvoller als ein Einheitsstandard.
- Variante 9 (Fortschrittsanzeige in der Welt) ist reizvoll, verlangt aber neue, dauerhafte UI-Elemente über Orten (ähnlich Quest-Fortschrittsanzeigen aus Priorität 2) und sollte mit der dortigen Lösung konsistent sein, nicht separat erfunden werden.
- Variante 4 (Ton vor Text) ist mit Bordmitteln (`sfx.js`, bereits in `capitalScene`/`bossIntro` genutzt: `horn`, `bell`, `shout`) ohne neue Systeme umsetzbar.
- Variante 3 (ständiges Weltzeichen) ist am aufwendigsten, weil es für jeden Ereignistyp ein eigenes, dauerhaft aktualisiertes Sprite/Partikelverhalten braucht (kein einmaliger Effekt wie eine Namenskarte, sondern Zustand über Tage) — eigene Scheibe.

## Wahl / Kombination

**Variante 1** (Namenskarte für alle `BIG`-Ereignisse) als sofortiger erster Schritt, **kombiniert mit Variante 4** (kurzes akustisches Signal vor dem Toast, aus vorhandenen `sfx.js`-Tönen) und **Variante 7** (gestufte Inszenierung: Kriegs-/Hauptstadt-Ereignisse bleiben bei der vollen `capitalScene`-Kameraführung, alltägliche `BIG`-Ereignisse bekommen nur Namenskarte+Ton, keine Kamerafahrt). Variante 3 (dauerhaftes Weltzeichen je Ereignis) wird als eigene, größere Folgescheibe vorgemerkt, weil sie pro Ereignistyp eigene Grafik braucht.

## FEATURE IMPACT REPORT (GATE.md §8)

**Feature:** Alle `BIG`-Weltereignisse bekommen beim Start eine kurze Namenskarte und ein akustisches Signal statt nur Toast/Log/Chronik; Abstufung gegenüber der vollen Kriegsinszenierung (`capitalScene`).

**Betroffene Systeme:**
- `game.js` `bigAnnounce`, `BIG_START` (alle neun Einträge: plague, locusts, tourney, ball, airship, treasure, witch, guildstrike, strike), `nameCard`, `afterSay` (für besonders folgenreiche Enden, falls Variante 10 später mitgenommen wird).
- `sfx.js` (vorhandene Töne wiederverwenden: `horn`, `bell`, `shout`, ggf. passendere pro Ereignistyp).
- Keine Berührung von `capitalScene`/`bossIntro` selbst — die bleiben wie sie sind (Vorbild für die Abstufung, nicht Änderungsziel).

**Bereits vorhanden:**
- `nameCard` fertig und erprobt (Varonheim-Szenen nutzen sie bereits).
- `bigAnnounce` ist die einzige Stelle, die geändert werden muss, um *alle* `BIG`-Typen zu erfassen (zentrale Funktion, kein Einzel-Patch je Ereignis nötig).
- Tonbibliothek (`sfx.js`) mit den in `capitalScene` schon verwendeten Signalen.

**Fehlende Infrastruktur:**
- Keine Zuordnung Ereignistyp → passendes Signal/passender Titel-Zusatz (aktuell nutzt `bigAnnounce` einen generischen Titel/Text je Aufruf, es gibt keine Tabelle „welcher Ton zu welchem Ereignis“).
- Keine Unterscheidung in `bigAnnounce` zwischen „leise“ (nur Log/Chronik, z. B. kleine Meldungen aus `EVENTS`) und „groß“ (`BIG`) — aktuell ist das implizit durch die aufrufende Stelle gegeben, nicht durch ein Merkmal am Ereignis selbst; für eine saubere Erweiterung sollte `bigAnnounce` (nur für `BIG`) von den kleinen `worldEvent`-Meldungen klar getrennt bleiben, was heute schon der Fall ist (zwei verschiedene Funktionen) — hier also kein Fehlen, nur zur Klarheit vermerkt.

**OFFENE DESIGNENTSCHEIDUNGEN:**
1. Soll die Namenskarte bei `BIG`-Ereignissen **immer** erscheinen (auch wenn der Spieler weit weg ist, wie bei `capitalScene kind:'fell'`), oder nur in Nähe des Ereignisortes (wie bei den übrigen `capitalScene`-Fällen)? Für Ereignisse wie „Seuche in einer fernen Stadt“ ist unklar, ob der Spieler das sofort „erfahren“ soll.
2. Welcher Ton je Ereignistyp (Seuche, Heuschrecken, Turnier, Ball, Luftschiffabsturz, Schatzkarawane, Hexenprozess, Gildenstreik, Streik) — das ist eine Geschmacksfrage, die nicht aus dem Code ableitbar ist und vom Entwickler je Ereignis entschieden werden sollte, nicht erfunden werden darf.
3. Gilt die Abstufung (volle Szene nur für Kriegsereignisse) bereits als abschließende Regel, oder sollen einzelne besonders folgenreiche `BIG`-Ausgänge (z. B. „Seuche nicht eingedämmt“, „Hexe verbrannt ohne Fürsprache“) später auch eine kleine Szene statt nur Namenskarte bekommen (Variante 10)? Das ist in `DECISIONS.md` nicht festgelegt.
4. Soll die Namenskarte bei `BIG`-Ereignissen das Spiel kurz pausieren (wie beim Boss-Auftritt, laut `DECISIONS.md` ausdrücklich gewählt) oder während des laufenden Spiels einblenden (wie bisher der Toast)? Das ist eine bewusste Abweichung von der Boss-Regel und sollte nicht automatisch übernommen werden, ohne dass der Entwickler sie für diesen Fall bestätigt.

**Risiken:**
- `nameCard` verhindert laut eigenem Kommentar ausdrücklich zwei gleichzeitige Karten — bei einer Kollision mit einer laufenden Boss- oder Kapitel-Namenskarte muss die Ereignis-Karte warten oder ausfallen; das Verhalten bei Kollision ist im Code nicht ausdrücklich geregelt und sollte vor dem Einbau geprüft werden.
- Ereignisse, die mehrfach pro Spiel auftreten können (Seuche, Streik, Turnier), dürfen bei Wiederholung nicht lästig/aufdringlich wirken, wenn jedes Mal eine Namenskarte erscheint — ggf. Häufigkeit begrenzen oder nach x-tem Mal dezenter werden (offene Frage, nicht entschieden).

**Implementierungsplan (in Scheiben):**
1. Scheibe 1: `bigAnnounce` um `nameCard(title, '', ms)`-Aufruf erweitern (abhängig von Designentscheidung 1 und 4).
2. Scheibe 2: Tonsignal je Ereignistyp (abhängig von Designentscheidung 2 — Liste vom Entwickler einholen, nicht selbst festlegen).
3. Scheibe 3 (später, eigener Report): dauerhaftes Weltzeichen je Ereignistyp (Variante 3) und Reaktionsgesten der Bevölkerung (Variante 6).
