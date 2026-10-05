# IST-ZUSTAND — ROTFALL: LEGACY (Stand 04.10.2026, Version 24)

Dies ist der vollständige Ist-Zustand: jedes Feature mit Erklärung, Ort/Personen, Ablauf, Gegnern, Belohnung, Bedienung (Fenster oder Gesprächsliste), Prüfergebnis und **Fehlversuchen**. Er wurde von vier Prüf-Agenten erstellt. Sie haben dafür den Code gelesen und vieles im Spiel nachgestellt; jeder Abschnitt sagt, was im Spiel geprüft und was nur im Code gelesen wurde. Danach hat der Lead zusammengeführt.

- **Teil A: Welt, Orte, Fraktionen, Simulation.** Städte, Ränge, Ruf, Gesetz, Krieg, Wirtschaft, Ereignisse, Reisen, Geheime Orte.
- **Teil B: Aufträge.** Alle festen Aufträge, Rangreihen, Klassenprüfungen, Verträge, emergente Aufträge; mit Belohnung und Ruf.
- **Teil C: Kampf, Gegner, Charakter.** Kampfsystem, alle 63 Gegner, 32 Elites, Bosse, Zauber mit Lehrern, Klassen, Sterne, Körper, Bionik.
- **Teil D: Items, Wirtschaft, Menüs.** Alle 295 Gegenstände mit Quelle, Läden, Handwerk, Schmied, Betriebe, Siedlung, alle Fenster, Koop, Speichern.

Der alte, kürzere Stand liegt unter `docs/ist/IST_ZUSTAND_alt_2026-10-02.md`. Die Teildateien liegen in `docs/ist/`.

## Was nach der Prüfung schon behoben ist (03.10.2026, Commits ecf90da und folgende)

Die Fehlversuche in den Teilen unten sind **so dokumentiert, wie sie bei der Prüfung waren**. Diese sind inzwischen behoben:

- **A-02:** Beitritt bei Händlern und Rooks Bande ist möglich.
- **A-04, A-20:** Die Brunnen-Treppe ist betretbar; der Geheimnis-Zähler stimmt.
- **A-05:** Morrgrund zählt für die Grubenstämme.
- **A-06:** Ruf bleibt zwischen −100 und 100.
- **A-08:** Der Hexenprozess stürzt nicht mehr ab.
- **A-16:** Beim König kostet es höchstens einmal am Tag −3.
- **B-1:** „Eisen für die Grubenstämme“ ist abschließbar; Rohstoffe aus dem Vorrat zählen.
- **B-2:** Bei voller Tasche fällt die Belohnung vor die Füße.
- **B-3, B-4:** Ratssitz und Omega zahlen ihre Erfahrung aus.
- **B-5:** Angelegte Gegenstände zählen für Abgaben.
- **C-1:** Duell und Grube zählen am Rumpf.
- **C-2:** Schurkenprüfung: jeder Stich von hinten zählt.
- **C-3:** Bardenprüfung: Der Lehrer leiht das Kriegslied.
- **C-4:** Lebensbalken zeigen den Rumpf.
- **C-5:** Der Ausbrecherstollen stürzt nicht mehr ab.
- **D-1:** Der Waffenständer vermehrt keine Waffen mehr.
- **D-2:** Ladenlisten alter Spielstände werden beim Laden erneuert.
- **D-3:** Gewürzhändler und Tuchhändlerin behalten ihre Elixiere.
- **D-7:** Das Lager zeigt alle Teile.
- **Bugjagd 2:**
  - HB2-01 bis HB2-14 behoben.
  - Koop-Prüfungen gelten je Figur.
- **Nachträge 03.10. abends und 04.10.** (die Teile unten beschreiben noch den Prüfstand; hier der aktuelle Stand):
  - **Fenster statt Gesprächsliste:** Zauber lernen (`learnUI`, alle Zauberlehrer), Heiler (`healerUI`: Gruppe mit sechs Gliedern, Zuständen, Heilen und Schienen), Prothesen-Werkbank, Tierhändler, Schmied (Verbessern, Schmieden lassen). Prothesen zählen beim Heiler nicht mehr als Wunde.
  - **Wüstenbund und Zwerge:** Dünenwacht hat einen Sandreiter-Posten; Karraks Tod gibt Wüstenbund +10; Rangvorteile (Rabatt, kein Wegzoll in Karak-Atar, Eskorten +25 % ab Karawanenwächter, Hilda verbessert ab Rang 2 bis „Meisterstück“); Karak-Atar und die Tiefhall haben eigene Kerker (Wärter, Name, Entlassort; gemeinsame Zellenkarte).
  - **Fraktions-Starts, Rassen, Anwerben:** siehe Nachtrag am Ende von Teil D. Zwerge (Held und Tiefhall-Volk) sind klein und breit gezeichnet.
  - **Wanderautomaten:** Roboter ohne Herrn reisen als Reisende von Stadt zu Stadt (Kenshi-Skelette); 2 von 5 schließen sich kostenlos an.
  - **C-1 ergänzt (04.10.):** Im Duell und in der Grube kommt der Schaden jetzt sichtbar an; der Fechter stirbt nie (Rumpf ≥ 1), das Duell endet erst, wenn ein Rumpf wirklich unter 20 % liegt. Vorher wirkte der Fechter unverwundbar („unendlich Leben“).
  - **Kampfanimation:** Oberkörper dreht auch von vorn/hinten, Beine arbeiten im Hieb, größere Ausschläge (A ×1,4, B ×1,9, C ×2,4), Swoosh-Halbmond in allen Packs; **alle Nahkampfklassen** haben eigene Profile (Axt, Kolben, Stange, Rapier, Peitsche, Stab neu); Wirbel treffen rundum; **Gewicht je Klasse** (Dolch 0 … Hammer 1,2: Ausholen gehalten, Peitschen-Beschleunigung, Überschwingen, späte Erholung, Körper sinkt nach). GIFs in `docs/screenshots/kampfanimationen_v24*.gif`.
- **Andere offene Punkte:** Die noch offenen Entscheidungen und Bau-Punkte stehen in `ROTFALL_STATE/OFFEN.md`.



---

<!-- Teil A aus ist/A_welt_fraktionen.md -->

# Ist-Zustand Bereich A — Welt, Orte, Fraktionen, Simulation

Stand: 03.10.2026, Code-Version 24 (`?v=24`). Geschrieben vom Agenten für Bereich A. Grundlage: `src/world.js`, `src/game.js`, `src/sim.js`, `src/economy.js`, `src/data.js`, `src/state.js`, dazu `docs/IST_ZUSTAND.md` (alter Stand, hier übernommen, korrigiert und vertieft), `docs/MECHANIKEN.md`, `ROTFALL_STATE/OFFEN.md`, `ROTFALL_STATE/hunt/BERICHT.md`.

Zeilenangaben (`game.js:7473`) gelten für den Stand vom 03.10.2026 vormittags. Während dieser Prüfung haben andere Agenten parallel an `game.js` gearbeitet; die Zeilen sind dadurch schon um 5–10 gewandert (z. B. `townFac` steht jetzt bei 7479). Suche im Zweifel nach dem Funktionsnamen.

## Inhaltsverzeichnis

0. [Wie geprüft wurde (ehrlich)](#0-wie-geprüft-wurde-ehrlich)
1. [Weltkarte und Orte](#1-weltkarte-und-orte)
2. [Ruf-Prüfung: Geht der Ruf an die RICHTIGE Fraktion?](#2-ruf-prüfung-geht-der-ruf-an-die-richtige-fraktion)
3. [Fraktionen, Ruf, Ränge, Beitritt](#3-fraktionen-ruf-ränge-beitritt)
4. [Gesetz, Verbrechen, Kerker, Schuldknechtschaft](#4-gesetz-verbrechen-kerker-schuldknechtschaft)
5. [Aurelion: Schein, Bürgerrecht, Häuser, Hoher Rat, Gericht](#5-aurelion)
6. [Valen und Varonheim: Hof, Burgfrieden, Stadt ohne Schutz, Kelch](#6-valen-und-varonheim)
7. [Krieg: Heere, Fronten, Schlachten, Besatzung, Belagerung](#7-krieg)
8. [Wirtschaft: Märkte, Preise, Karawanen, Betriebe, Luftschiffe](#8-wirtschaft)
9. [Reisen: Kutsche, Fähre, Schiff, Luftschiff, Begegnungen](#9-reisen)
10. [Tageszeit, Wetter, Jahreszeiten](#10-tageszeit-wetter-jahreszeiten)
11. [Weltereignisse und ihre Folgen](#11-weltereignisse-und-ihre-folgen)
12. [Geheime Orte](#12-geheime-orte)
13. [Orte mit eigenem Leben (Städte, Lager, Völker)](#13-orte-mit-eigenem-leben)
14. [Zusammenfassung Fehlversuche (nach Schwere)](#14-zusammenfassung-fehlversuche)

---

## 0. Wie geprüft wurde (ehrlich)

- **Im Spiel getestet: nichts.** Ein eigener Browser-Tab ließ sich nicht öffnen (die Chrome-Erweiterung war nicht verbunden, das Browser-Fenster der App hatte die Tab-Grenze erreicht: Tabs 70–77 waren von anderen Agenten belegt). Beim ersten Versuch hat das Navigationswerkzeug den einzigen freien Tab **tab-71** auf `http://localhost:8770/?dev&x=a1` umgeleitet, ohne dass ich ihn gewählt hatte. Danach habe ich den Browser nicht mehr benutzt. Der Spielstand wurde nicht angefasst (kein „Weiter“, kein Speichern) — aber falls in tab-71 vorher ein Spiel lief, hat das Verlassen der Seite dort ein `beforeunload`-Speichern ausgelöst. **Bitte den echten Stand gegen `rotfall.backup.s14c` prüfen.**
- Alles unten ist deshalb **„nur Code gelesen“**. Wo ein Befund aus einem Lese-Agenten stammt und ich ihn selbst nachgelesen habe, steht „nachgelesen“.
- Der Selbsttest wurde nicht gestartet.

---

## 1. Weltkarte und Orte

### 1.1 Aufbau der Welt

- **Was es ist:** Eine große Oberwelt (Karte `world`) mit Regionen, die fließend ineinander übergehen: im **Westen** Westgebirge, Eisenmark und die Eiserne Kette; in der **Mitte** die Menschenländer (Valen, Orden, Freie Händler) mit der Hauptstadt Varonheim; im **Süden** das Hochreich Aurelion; im **Osten** das Totenland. Dazu im Südwesten der Wüstensporn mit Karak-Atar, im Süden Inseln (Nebelinsel, Nekrosinsel) und als eigene Karte die Gischtinseln (Tangkron).
- **Technik in einem Satz:** Die Welt wird bei jedem Laden aus demselben Seed gebaut (`world.js` `genWorld`); Städte und Dörfer haben feste Baupläne (`TOWN_PLAN`, `world.js:365`) und ziehen keinen Zufall, damit die Welt gleich bleibt. Die Westerweiterung schiebt alte Orte um 256 Felder nach Osten (`OX`, `world.js:537`).
- **Geprüft:** nur Code gelesen.

### 1.2 Alle benannten Orte (`LOCATIONS`)

Grundliste `world.js:20–57`, Erweiterungen `world.js:539–563`, Dörfer `world.js:566–576`, Varonheim `world.js:1361`, Aurelion-Städte `world.js:1411`. Dazu entstehen je Welt **Streuorte** (Höfe, Türme, Lager, Gräber, Wracks … `world.js:1646`, Kennung `poi_*`) und gefundene **Geheime Orte** (`sec_*`, `game.js:14963`).

| Ort (Schlüssel) | Art | Gefahr | Fraktion laut Liste | Besonderheit |
|---|---|---|---|---|
| Eren (`eren`) | Dorf | 0 | Valen | Heimatdorf (klassischer Start), Havel, Elena, Tomas, Borin, Mara, Aldric, Jorun |
| Eren-Wald (`forest`) | Wildnis | 1 | – | |
| Verlassene Grube (`mine`) | Dungeon | 3 | – | Eingang zur Karte `mine` (Gorak) |
| Alte Straße (`road`) | Straße | 1 | – | Kriegsknoten |
| Alte Feste (`fortress`) | Ruine | 2 | – | Kriegsknoten |
| Moorland (`marsh`) | Wildnis | 2 | – | Glockenmoor (geheimer Ort) |
| Banditenlager (`banditcamp`) | Lager | 3 | Bande | Rook, Lila |
| Alter Friedhof (`graveyard`) | Ruine | 2 | Tote | Morvath, Kriegsknoten der Toten |
| Waldschrein (`shrine`) | Schrein | 1 | Orden | Kelan |
| Kleine Ruine (`ruins`) | Ruine | 2 | – | Kriegsknoten |
| Nordfurt (`northcity`) | Stadt | 0 | Valen | Gerold (Kontor), Brann, Hauke |
| Grubenpfad (`grubenpfad`) | Straße | 1 | – | |
| Alter Wachturm (`oldtower`) | Ruine | 2 | – | Gewölbe Alte Kasematten, Sternkammer |
| Überfallenes Lager (`raidcamp`) | Lager | 2 | – | Blutspur zur Grube |
| Steinbrücke (`oldbridge`) | Straße | 1 | – | Kriegsknoten |
| Westwald (`westwald`) | Wildnis | 2 | – | Räuberhöhle, Schmugglergrotte |
| Wolfsschlucht (`wolfden`) | Wildnis | 3 | – | Graumähne |
| Salzhafen (`saltport`) | Stadt | 0 | Valen | Hafen, Kerker, Quirin, Nix, Fähre |
| Versunkener Tempel (`sunkentemple`) | Ruine | 3 | – | Tempelgruft, Der Schlund |
| Kreuzweg (`kreuzweg`) | Dorf | 1 | Händler | Serafine, Lioba, Söldner |
| Tiefhall (`deephall`) | Dungeon | 3 | – | Karte `deep` (Hrodvar), darunter `zwerge` |
| Frostkamm (`frostpeak`) | Wildnis | 2 | – | |
| Aschfurt (`ashford`) | Dorf | 1 | Händler | Grenzposten mit Kernburg |
| Rote Wüste (`redwaste`) | Wildnis | 2 | – | Karrak der Sandfürst |
| Sonnwacht (`sonnwacht`) | Stadt | 1 | Orden | Ilva, Aldis |
| Alt-Vharn (`altvharn`) | Ruine | 4 | Tote | Ysra |
| Große Nekropole (`necropolis`) | Ruine | 4 | Tote | Wächter der Nekropole |
| Die Schwarze Feste (`blackkeep`) | Stadt | 5 | Tote | Hof der Stillen Schar, Belagerung |
| Knochenwald (`knochenwald`) | Wildnis | 3 | Tote | Knochengruft, Wurzelhalle |
| Aschensee (`aschensee`) | Wildnis | 3 | Tote | |
| Vharnholm (`vharnholm`) | Stadt | 1 | Tote | Stadt der Stillen, Sael |
| Alter Hain (`grove`) | Schrein | 1 | – | Mira |
| Grenzwacht (`grenzwacht`) | Lager | 1 | Valen | Oda, eigene Wachposten |
| Hundertfeld (`hundertfeld`) | Ruine | 3 | – | Verlorene Hundert (geheimer Ort), Lioba-Auftrag |
| Nebelinsel (`mistisle`) | Wildnis | 2 | – | |
| Das Westgebirge (`westgebirge`) | Wildnis | 3 | – | Kettenreste |
| Die Eisenmark (`eisenmark`) | Wildnis | 3 | Kette | |
| Die Eisenfeste (`kettenfeste`) | Stadt | 4 | Kette | Varg, Rotgarde, Sklavenmarkt |
| Der Steinbruch (`steinbruch`) | Lager | 3 | Kette | Schuldknechtschaft der Kette, Ausbrecherstollen |
| Grubenhort (`grubenhort`) | Lager | 2 | Grubenstämme | nach Befreiung Goblindorf (Grisk) bzw. nach Aufstand Freie Siedlung |
| Morrgrund (`morrgrund`) | Lager | 2 | Grubenstämme | Dodon |
| Turm des Nachtglases (`nachtglas`) | Ruine | 5 | Tote | Ilvar, Karte `tower` |
| Kettentor (`kettenpass`) | Straße | 3 | – | |
| Das Totenland (`totenland`) | Wildnis | 4 | Tote | |
| Knochentor (`knochenpass`) | Straße | 3 | Tote | |
| Totenruinen, Gräberfeld, Seelenhügel, Grabwacht, Schädelwald | Ruine/Wildnis | 3–4 | Tote | Feldzugsziele der Kette; Kammer der Namen am Seelenhügel |
| Der Wüstensporn (`wuestensporn`) | Wildnis | 3 | – | |
| Karak-Atar (`karak_atar`) | Stadt | 3 | Bande (!) | Wüstenstadt, Yusufs Basar |
| Dünenwacht (`duenenwacht`) | Lager | 3 | Bande | nur Gegner |
| Sandruinen (`sandruinen`) | Ruine | 3 | – | Brunnen der Durstigen (geheimer Ort) |
| Das Hochreich Aurelion (`aurelion`) | Wildnis | 1 | Aurelion | |
| Nekrosinsel (`nekrosinsel`) | Ruine | 5 | Tote | |
| Haselbrück, Mühlbach, Weidenau | Dorf | 0 | Valen | Mühlbach: Koppel Hadubrand; Weidenau: Sensendorf |
| Rastfurt | Dorf | 0 | Händler | |
| Lichtenrain | Dorf | 0 | Orden | Schwester Adela |
| Grauwasser, Hohlstein, Eisenried | Dorf | 0 | Kette (Tribut) | Tributzüge alle 5 Tage |
| Varonheim (`varonheim`) | Stadt | 0 | Valen | Hauptstadt, Varonsburg, Katakomben |
| Aurelheim, Kupferhafen, Gelenkhall, Tickmar, Sankt Serin | Stadt | 0 | Aurelion | siehe Aurelion |

### 1.3 Karten neben der Oberwelt (`DUNGEONS`, `world.js:2030`)

| Karte | Name | Inhalt |
|---|---|---|
| `mine` | Verlassene Grube | Goblins, Gorak, Grubenwart |
| `deep` | Tiefhall | tote Frostzwergenhalle, Hrodvar, Königseisen; Treppe zur Zwergenstadt (`game.js:9192`) |
| `zwerge` | Tiefhall — Königsstadt der Zwerge | König Durgrim, Runenschmiedin Hilda, Händler Balin, Braumeister Orm, Wachen, Bergleute; Handel erst als „Freund der Halle“ (Wächter erschlagen oder 3 Eisenbarren, `game.js:9228`) |
| `kerker` | Kerker | Zellen, Wachstube, Mitgefangene |
| `omega` | Krater des Gefallenen Sterns | Omega |
| `garmadon` | Gruft des Toten Königs | Garmadon |
| `katakomben` | Katakomben von Varonheim | Blutkult, Aldhelm (beim Betreten gebaut, `game.js:15156`) |
| `varonburg` | Varonsburg | alte Karte; seit Scheibe 2 steht die Burg in der Oberwelt (`world.js:1382`) |
| `vault` | Gewölbe | zufällig aus Seed (siehe unten) |
| `sky` | Himmelsinsel | Hof der Herrscher, Rat, Gericht |
| `isle` | Tangkron, Gischtinseln | Salzbund, Sturmklinge, Weißbart |
| `tower` | Turm des Nachtglases | 10 Ebenen, Ilvar |
| `deck` | Auf See | Schiffsdeck der Überfahrt |

**Gewölbe** (`VAULTS`, `game.js:11210`):

| Gewölbe | Lage | Stufe | Ebenen | Gegner | Boss |
|---|---|---|---|---|---|
| Räuberhöhle | Westwald | 1 | 2 | Banditen, Wölfe | Krummnase |
| Alte Kasematten | Alter Wachturm | 2 | 3 | Goblins, Banditen | Rostzahn |
| Gruft des Versunkenen Tempels | Versunkener Tempel | 3 | 3 | Skelette, Wiedergänger, Kultisten, Geister | Der Hohepriester |
| Knochengruft | Knochenwald | 5 | 4 | Knochenritter, -schützen, Nekromant, Schatten, Seuchenleichen | Morvhal |
| Verfallene Uhrwerkhalle | bei Tickmar | 5 | 4 | Automaten, Rotgardist, Kettenschütze | Der Regulator |
| Schmugglergrotte (geheim) | Westwald | 2 | 2 | Banditen | Die Schmugglerkönigin |
| Sternkammer (geheim) | Alter Wachturm | 4 | 3 | Geister, Schatten, Kultisten | Der Sternenlose |
| Wurzelhalle (geheim) | Knochenwald | 4 | 3 | Wölfe, Bären, Wiedergänger | Die Mutter der Wurzeln |
| Der Ausbrecherstollen (geheimer Ort) | Steinbruch | 3 | 1 | Kettenjäger, Kettenschützen, Goblins, Wölfe | Der Pferchmeister |
| Der Schlund (endlos) | Versunkener Tempel | 3+ | ∞ | gemischt | Wächter der Tiefe alle 5 Ebenen |

- **Beute im Hort** (`vaultLoot`, `game.js:11240`): Heiltrank(e), Verband und 1–3 Ausrüstungsteile, deren Wert zur Stufe passt (Stufe 1: 20–120 Gold … Stufe 5: 260–900 Gold), dazu eine verblasste Karte zum nächsten geheimen Gewölbe.
- **Fehlversuch (bekannt, HB-40):** Gewölbe-Geheimtruhe beliebig oft (nur Code, nicht nachgeprüft).

---

## 2. Ruf-Prüfung: Geht der Ruf an die RICHTIGE Fraktion?

Das ist der Kern deines Wunsches („Mission für die Eisenfeste — und kein Ruf“). Hier ist jede Stelle aufgeführt, an der ein Auftrag, ein Vertrag oder eine Hilfe Ruf bringt, und an welche Fraktion er geht.

### 2.1 Wie das Spiel entscheidet, wem ein Ort „gehört“ (townFac)

- **Was es ist:** Jeder Vertrag (Anschlagbrett, Verteidigungsmeister, Bewohner-Auftrag) und viele Hilfen (Verbinden, Seuche heilen, Plünderer erschlagen, Bande zerschlagen, Investieren) geben Ruf beim „Herrn des Ortes“. Wer der Herr ist, rechnet eine einzige Regel aus (`game.js:7473` `townFac`).
- **Die Regel, in dieser Reihenfolge:**
  1. Hat die Kette den Ort über „Stadt ohne Schutz“ übernommen → **Kette**.
  2. Der Ort hat im Stadtplan einen Herrn (`TOWN_PLAN[ort].lord`) → dieser. Das gilt für alle Dörfer, Varonheim und die fünf Städte Aurelions.
  3. Der Ort hat Wachposten (`GUARD_POSTS`, `game.js:727`) → deren Fraktion. Das gilt für Eren, Nordfurt, Salzhafen (Valen), Kreuzweg, Aschfurt (Händler), Sonnwacht (Orden), Vharnholm (Tote), Grenzwacht (Valen).
  4. Der Ort steht in der Ortsliste mit Fraktion **Kette** (`LOCATIONS.faction === 'chain'`) → **Kette**. Das ist die Korrektur vom 02.10. (Eisenfeste, Steinbruch, Eisenmark).
  5. Grubenhort nach dem Sklavenaufstand → **Die Freien vom Grubenhort**.
  6. **Sonst immer Valen.**
- **Geprüft:** nur Code gelesen (der Browser-Test war nicht möglich, siehe Abschnitt 0).

### 2.2 Tabelle: jeder Ort mit Aufträgen und wohin der Ruf geht

| Ort | Wer vergibt dort Aufträge | Ruf geht an | Richtig? |
|---|---|---|---|
| Eren | Brett, Verteidigungsmeister, Bewohner | Valen | ja |
| Nordfurt | Brett, Verteidigungsmeister, Bewohner | Valen | ja |
| Salzhafen | Brett, Verteidigungsmeister, Bewohner | Valen | ja |
| Varonheim | Brett (3 Startaufträge), Verteidigungsmeister, Bewohner, Königsaufträge | Valen | ja |
| Haselbrück, Mühlbach, Weidenau | Brett, VM, Bewohner | Valen | ja |
| Kreuzweg, Aschfurt | Brett, VM, Bewohner | Freie Händler | ja (aber siehe Krieg: im Kriegsgraphen gehört Aschfurt Valen, Kreuzweg niemandem) |
| Rastfurt | Brett, VM, Bewohner | Freie Händler | ja |
| Sonnwacht, Lichtenrain | Brett, VM, Bewohner | Orden | ja |
| Aurelheim, Kupferhafen, Gelenkhall, Tickmar, Sankt Serin | Brett, VM, Bewohner; in Tickmar zusätzlich der Arbeiterrat (`game.js:12178`) | Aurelion | ja (Arbeiterrat zahlt an „Aurelion“, obwohl er gegen Haus Vantor steht — Entscheidung) |
| Eisenfeste | Kettenwache, Tributoffizier, Paladinmarschall, Eisenpaladin („Hat die Kette Arbeit?“, `game.js:7854`) | Kette | **ja — behoben am 02.10.** |
| Grauwasser, Hohlstein, Eisenried (Tributdörfer) | Brett, VM, Bewohner | **Kette** | **fraglich bis falsch** — siehe 2.4 |
| Grubenhort nach dem Aufstand | Sprecherin Ranna („Aufträge der Freien“, `game.js:12176`) | Die Freien | ja |
| Grubenhort nach Vargs Fall (Goblindorf) | niemand (Grisk hat nur feste Aufträge) | — | keine Verträge |
| Morrgrund | niemand (Dodon hat nur feste Aufträge `g_dod1–3`) | — | keine Verträge |
| Karak-Atar | Brett am Markt (seit 03.10.) | Wüstenbund | ja (A-34 behoben) |
| Dünenwacht | Brett im Lager (seit 03.10.) | Wüstenbund | ja (A-34 behoben); seit 03.10. abends „Posten der Sandreiter“ mit vier Sandreitern als Wache |
| Vharnholm | absichtlich niemand (`conKinds` gibt eine leere Liste, `game.js:7474`) | — | gewollt |
| Steinbruch | niemand | (wäre Kette) | — |
| Grenzwacht | nur Oda (Rangaufträge Valen) | Valen | ja |
| Tangkron (Gischtinseln) | nur Clan-Aufträge `q_salz1–3`, `q_klinge1–2` | Seevolk | ja |
| Tiefhall (Zwerge) | Brett in der großen Halle, erst als Freund der Halle (seit 03.10.) | Zwerge der Tiefhall | ja (A-34 behoben) |
| Himmelsinsel | nur Rat, Gericht, `q_ratssitz` | Aurelion | ja |

### 2.3 Feste Aufträge (QUESTS) — Ruf je Auftrag

Alle festen Aufträge aus `data.js:1416` ff. mit Geber und Ruf-Lohn (`turnIn`, `game.js:13567`):

| Auftrag | Geber (Fraktion des Gebers) | Ruf-Lohn | Bewertung |
|---|---|---|---|
| q_wolves | Havel (Valen) | Valen +5 | richtig |
| q_herbs | Elena (Orden, wohnt in Eren) | Orden +6 | richtig (Elena ist Ordensfrau) |
| q_lila | Jorun (keine) | keiner; Lüge „Sie ist tot“ Valen −3 (`game.js:13659`) | ok |
| q_mine | Mara (Händler) | Händler +10, Valen +4 | richtig |
| q_greymane | Tomas (keine, Eren) | Valen +5 | ok |
| q_paladin1–3 | Kelan (Orden) | Orden +10/+12/+20 | richtig |
| q_undead | Morvath (Tote) | Tote +25, Orden −10 | richtig |
| q_graverobbers | Sael (Tote) | Tote +15, Valen −5 | richtig |
| q_kingsiron | Brann (Valen) | Valen +6 | richtig |
| q_frontier | Oda (Valen) | Valen +8 | richtig |
| q_sandlord | Gerold (Händler) | Händler +12 | richtig |
| q_rook | Rook (Bande) | Bande +25, Valen −20 | richtig |
| q_salz1–3 | Handelsherrin des Salzbunds | Seevolk +8/+10/+20 | richtig |
| q_klinge1–2 | Erste Maat der Sturmklinge | Seevolk +8/+10 | richtig |
| q_wb_nebel | (Weißbart-Kapitänin) | Seevolk +20 | richtig |
| g_dod1–3 | Dodon | Grubenstämme +15/+20/+25 | richtig |
| q_grisk_lost / _rache / _build | Grisk | Grubenstämme +15 / +15 (Kette −10) / +20 | richtig |
| q_pferch | Bruni (im Pferch) | Grubenstämme +10, Kette −15 | richtig |
| q_anomaly | (Ereignis) | Aurelion +4, Orden +4 | ok |
| q_pelts | Quirin (Händler) | **kein Ruf** | Lücke (Geber ist Händler) |
| q_hundred_song | Lioba (Händler) | **kein Ruf**, nur Beziehung +15 | Lücke |
| q_gilde, q_rask, q_ratssitz, q_rotfall, q_omega | — | kein Ruf | gewollt bzw. offen (HB-10) |
| q_tribut, q_runaway, q_intrige | — | Ruf im Code der Entscheidung | siehe Teil Kette/Aurelion |
| Klassenaufträge kt_*, c_*, dk_* | Lehrer | kein Ruf | gewollt |
| Rangaufträge r_<fraktion>_<rang>a/b | Rangführer | +5 bei derselben Fraktion (`game.js:14168`) | richtig |

- **Auffällig:** `turnIn` (`game.js:13574`) und `claimContract` (`game.js:7670`) addieren den Ruf **ohne Grenze** (`S.factions[f] += v`), während fast alle anderen Stellen auf −100…100 begrenzen. Ruf kann so über 100 steigen (bekannt als IH-16). `rankReady` begrenzt die Rangschwelle auf 100, daher kein Rangfehler, aber Anzeige und Preise lesen den Rohwert.

### 2.4 Fehlversuche bei der Ruf-Zuordnung

1. **Tributdörfer nach Vargs Fall: Bretter für immer zu, Ruf an eine tote Fraktion.**
   - Grauwasser, Hohlstein, Eisenried haben im Stadtplan den Herrn „Kette“ (`world.js:572–574`, übernommen in `world.js:1906`). Das ändert sich nie, auch nicht, wenn die Kette fällt.
   - `liberate()` setzt die Kette auf −100 (`game.js:11023`). Das Brett prüft den Ruf beim Herrn des Ortes (`boardShut`, `game.js:7751–7753`): „Verhasst“ = kein Handel → **„Für dich hängt hier nichts.“** Bewohner-Aufträge sind aus demselben Grund gesperrt (`game.js:7865`).
   - Der Verteidigungsmeister dort prüft das Brett nicht und vergibt weiter Aufträge; ihr Ruf geht an die zerschlagene Kette (`claimContract`, `game.js:7670`).
   - Erwartet: nach der Befreiung Valen (oder die Dörfer selbst / die Freien). Tatsächlich: Kette.
2. **Tributdörfer vor Vargs Fall: Hilfe für Unterdrückte stärkt die Unterdrücker.** Wer einen Bewohner von Grauwasser verbindet, eine Seuche dort heilt oder einen Auftrag des Bauern erledigt, bekommt Ruf bei der **Kette** (`helpedVillager`, `game.js:637`; Seuche `game.js:11598`). Wer bei der Kette schon „Verhasst“ ist (z. B. als Freund der Goblins), findet dort leere Bretter. Ob das so gewollt ist, ist eine Entscheidung des Entwicklers — logisch passt es nicht zu „Tribut wird erpresst“.
3. **Morrgrund: Goblins verbinden bringt Valen-Ruf.** Die Goblins von Morrgrund haben `homeTown: 'morrgrund'` (`game.js:8401`). Morrgrund steht weder im Stadtplan noch hat es Wachposten, und seine Ortsfraktion ist „goblin“, nicht „chain“. `townFac('morrgrund')` fällt deshalb auf **Valen** zurück. Folge: Verbinden oder Aufrichten eines Morrgrund-Goblins gibt „Königreich Valen +3“ (`helpedVillager`, `game.js:637–638`). Erwartet: Grubenstämme +3.
4. **Verbrechen an Leuten ohne Fraktion gehen überall an Valen.** `crimeFaction` (`game.js:5822`) nimmt die Fraktion des Opfers, sonst den Herrn seines Ortes (nur mit Stadtplan), sonst Valen. Betroffen: Bewohner von Karak-Atar (alle `faction: null`, `game.js:8866`), die Zwerge der Tiefhall (`faction: null`, `game.js:9215`), Reisende ohne Fraktion. Ein Mord im Basar von Karak-Atar oder in der Zwergenhalle bringt also **Kopfgeld bei Valen** und lässt Valens Wachen zugreifen.
5. **Wer nach der Befreiung einen Ort hält, ist im Kriegsgraphen oft Valen.** `liberateNode` setzt den Besitzer auf `TOWN_PLAN[k].lord || 'valen'` (`game.js:10699`). Eren, Nordfurt, Salzhafen, Kreuzweg, Aschfurt, Sonnwacht haben kein `lord` im Stadtplan (nur Wachposten) → nach der Befreiung gehört **Sonnwacht (Orden) und Kreuzweg/Aschfurt (Händler) im Krieg Valen**. Ebenso erobern Valens Heere Sonnwacht für Valen (`sim.js:394`, `capture`), und schon am Start steht Aschfurt im Kriegsgraphen als Valen (`data.js` `WAR_NODES.ashford.owner: 'valen'`), obwohl seine Wachen Händler sind. Für den Ruf aus Aufträgen ist das egal (townFac schaut nicht auf den Kriegsgraphen), aber Kriegskarte, Garnison und „Herrschaft“ in der Ortskarte widersprechen den Wachen.
6. **Gelenkhall, Sankt Serin, Tickmar: Ruf nur an „Aurelion“, nie an das Haus der Stadt.** Kessmark, Solandre und Vantor bekommen aus Stadt-Aufträgen keine Gunst. Kein Fehler im Code, aber eine Lücke, wenn Häuser-Gunst gewollt ist.
7. **Begegnung „Deserteur“ zählt immer für Valen** (`game.js:2982–2984`), auch tief in Aurelion oder im Totenland. Klein.

---

## 3. Fraktionen, Ruf, Ränge, Beitritt

### 3.1 Die Fraktionen (`FACTIONS`, `data.js:1257–1273`)

| Schlüssel | Name | Ränge | Startruf (neues Spiel, `game.js:2126`) |
|---|---|---|---|
| valen | Königreich Valen | Rekrut, Soldat, Veteran, Ritter, Offizier | 0 |
| order | Der Orden | Novize, Akolyth, Wächter, Ritter, Paladin, Meister | 0 |
| undead | Die Untoten | Diener, Adept, Grabgebundener, Todesritter, Kommandant | −100 |
| merch | Freie Händler | Kunde, Partner, Teilhaber | 0 |
| bandit | Rooks Bande | Handlanger, Klinge, Hauptmann | −100 |
| aurel | Das Hochreich Aurelion | Fremder, Registrierter Besucher, Bürger, Anerkannter Bürger, Handelsbürger, Gildenmitglied, Hoher Beamter, Mitglied des Hohen Rates | −10 |
| chain | Die Eiserne Kette | Treiber, Kettenknecht, Grenzreiter, Aufseher, Dunkler Hochpaladin | −20 |
| sea | Das Seevolk | Landratte, Deckhand, Maat, Steuermann, Kapitän | 0 |
| goblin | Die Grubenstämme | Fremder, Freund, Grubenbruder | −100 |
| wuest | Der Wüstenbund (Karak-Atar, Dünenwacht; seit 03.10.) | Karawanengast, Karawanenwächter, Sandreiter (vorläufig) | 0 |
| zwerge | Die Zwerge der Tiefhall (seit 03.10.) | Hallengast, Hallenbruder, Schildträger des Königs (vorläufig) | 0 |
| frei | Die Freien vom Grubenhort | keine | 0 |
| blut | Der Kelch | keine (Rangfolge über Titelgrade) | −40, gesetzt beim ersten Kult-Tick (`game.js:14864`) |

### 3.2 Ruf-Stufen (`REP_TIERS`, `data.js:1710`)

| ab Ruf | Stufe | Preisfaktor | Folge |
|---|---|---|---|
| 70 | Vertraut | 0,85 | |
| 40 | Verbündet | 0,90 | |
| 15 | Freundlich | 0,95 | |
| −5 | Neutral | 1,00 | |
| −30 | Misstrauisch | 1,12 | |
| −60 | Feindlich | 1,30 | |
| darunter | Verhasst | kein Handel | Brett und Bewohner-Aufträge zu (`boardShut`), Wachen feindlich |

- **Preis gesamt** (`repPrice`, `game.js:14291`): Stufe × Furcht (+20 % Kauf je Stufe) × Rang-Nachlass (3 % je Rang, höchstens 35 %, mit Legende mehr) × Stigma × Omega × Ruhm ≥ 60 (−5 %) × Corvinus-Route (−10 % in Aurelion).
- **Fehlversuch: Ruf ohne Grenze.** Viele Stellen rechnen `S.factions[f] += x` ohne Begrenzung auf −100…100: `turnIn` (`game.js:13574`), `claimContract` (`game.js:7670`), Goblins +200 beim Fall der Kette (`game.js:11020`), Kette/Untote bei Tribut und Feldzug (`game.js:6457`, `6458`, `6484`, `6505`, `6634`, `6676`, `6683`, `6710`), Aurelion (`game.js:7076`, `7323`, `7346`, `7401`, `7432`, `7438`), Beitritt (`game.js:14100–14102`), Kelch (`game.js:15148`, `15250`, `15257`, `15305`, `15311`), Karawane (`sim.js:326`, `337`). Folge: Ruf kann über 100 oder unter −100 stehen (bekannt als IH-16). Aurelion-Rang 7 hängt direkt am Ruf (siehe 5.3).

### 3.3 Beitritt (`joinFaction`, `game.js:14088`)

- **Was es ist:** Wer einer Macht beitritt, bekommt Rang 0 und kann über Rangprüfungen aufsteigen.
- **Wo / Wer:** Im Gespräch mit einem NPC dieser Fraktion erscheint „Wie tritt man bei — …?“ (`game.js:13033`), nur wenn der Rang noch −1 ist.
- **Bedingung:** Ruf ≥ 10 (Tote ≥ 15). Feindschaften (`JOIN_FOES`, `game.js:14086`): Orden ↔ Tote/Bande, Valen ↔ Tote/Bande, Tote ↔ Orden/Valen/Kette, Kette ↔ Tote/Goblins, Bande ↔ Valen/Orden, Goblins ↔ Kette.
- **Folgen:** Tote: Orden −30, Valen −20. Orden: Tote −20. Kette: Grubenstämme −20, Orden −10, Valen −5.
- **Bedienung:** Dialogliste.
- **Geprüft:** nur Code gelesen (nachgelesen).
- **Fehlversuche:**
  - **Händler und Rooks Bande kann man nicht beitreten.** `S.ranks` kennt nur valen, order, undead, chain (`game.js:2126`, `state.js:63`). Die Bedingung `S.ranks[npc.faction] === -1` (`game.js:13033`) ist bei `undefined` nie wahr; `checkRankUp` überspringt `null` (`game.js:14181`). Damit sind die Ranglinien von Gerold (`r_merch_1a–2b`) und Rook (`r_bandit_1a–2b`) tot, obwohl `MECHANIKEN.md` §9 („Rangwege für alle“) sie verspricht. Der Selbsttest prüft nur die Daten (`game.js:19947`).

### 3.4 Rangaufstieg (`RANK_LINES`, `game.js:14135`; `checkRankUp`, `promote`)

- **Was es ist:** Ruf allein befördert nicht. Ab Ruf Rang × 25 (höchstens 100) schaltet der Rangführer zwei Aufträge frei (`r_<fraktion>_<rang>a` und `…b`). Nach Teil b folgt die Beförderung mit Toast und Chronik (`game.js:13581`, `14174`).
- **Lohn je Rangauftrag:** 60 + 50 × (Rang−1) Gold, 80 + 70 × (Rang−1) EP, **+5 Ruf bei derselben Fraktion** (`game.js:14170`) — richtig zugeordnet.

| Fraktion | Rangführer | Weg | Besonderheit |
|---|---|---|---|
| Valen | Oda (Grenzwacht) | 4 Stufen über Aufträge | |
| Orden | Kelan (Waldschrein) | 5 Stufen; Rang 4 und 5 brauchen beide Ruf 100 | |
| Tote | Morvath (Alter Friedhof) | 4 Stufen | Abkürzung: Knien bei Garmadon hebt den Rang je Knien um 1 bis Rang 3 (Tote +25, Valen −20, Orden −20; `game.js:10022–10026`); Kommandant beim Fall der Eisenfeste, wenn man Rang ≥ 0 hat (`game.js:11022`) |
| Kette | jede „Kettenwache“ der Feste | 3 Linien; Rang 4 (Dunkler Hochpaladin) nur über die Weihe `chainRite` bei Varg (Kette +10, Valen −10, Orden −15; `game.js:6706–6715`) | |
| Händler | Gerold | **nicht erreichbar** (3.3) | |
| Bande | Rook | **nicht erreichbar** (3.3), Startruf −100 | |
| Aurelion | automatisch | siehe 5.3 | |
| Seevolk | Clan-Aufträge | Rang 1 bei der Wahl der Seite (`chooseSeaSide`, `game.js:8649`), Rang 3 nach `q_salz3` oder Frieden mit Weißbart (`game.js:13583`, `8662`) | **Rang 0, 2 und 4 nie vergeben** (`rankGuide` sagt „noch nicht erreichbar“, `game.js:14124`); Legende heißt „Maat des Weißen Ankers“, vergeben wird „Steuermann“ |
| Grubenstämme | automatisch nach der Befreiung | Ruf 0 / 20 / 60 → Fremder / Freund / Grubenbruder, nur ohne Kettenrang (`game.js:13169`) | |

- **Rangvorteile** (`RANK_PERKS`, `game.js:14114`): Nachlass bei Händlern der Fraktion, Wachen grüßen, Sonderrechte (z. B. Valen-Offizier ohne Durchsuchung durchs Burgtor). Kodex-Reiter „Ränge“.
- **Fehlversuch:** Untote-Rang über Garmadon ohne Ruf und ohne Aufträge (siehe Tabelle) — vermutlich nicht gewollt.

### 3.5 Ruhm je Region und Legenden

- Unverändert gegenüber `IST_ZUSTAND.md` §2.12: Ruhm in fünf Regionen (Menschenland, Westlande, Hochreich, Totenland, Gischtinseln), Stufen bis „Legendär“ (85); ab 60 kommen Kopfgeldjäger schon bei 100 Kopfgeld, Händler geben 5 % Nachlass. Jeder abgeschlossene feste Auftrag gibt Ruhm +2 (`game.js:13585`).

### 3.6 Tägliches Handeln der Mächte (`factionAgenda`)

- Jeden Morgen handelt reihum Valen, Orden, Händler, Kette (solange sie steht) oder Aurelion: Aushebung, Streifen, Aushänge, Preise. Log und Chronik melden es. (Nur Code, unverändert.)

---

## 4. Gesetz, Verbrechen, Kerker, Schuldknechtschaft

### 4.1 Kopfgeld

- **Was es ist:** Wer vor Zeugen ein Verbrechen begeht, bekommt Kopfgeld bei einer Fraktion. Es sinkt jeden Tag; ab einer Schwelle kommen Kopfgeldjäger.
- **Wem es zufällt** (`crimeFaction`, `game.js:5822`): Fraktion des Opfers; sonst Herr des Heimatorts (nur Orte mit Stadtplan); **sonst Valen**.
- **Quellen:**

| Tat | Kopfgeld | Stelle |
|---|---|---|
| Angriff vor Zeugen (240 px) | +80 | `game.js:5370` |
| Mord vor Zeugen | +250, an Hohem Rang +800 | `game.js:4151` |
| Widerstand bei Festnahme | +100 | `game.js:5862` |
| Ausbruch aus dem Kerker | +150 | `game.js:9075` |
| Diebstahl aus Möbeln vor Zeugen | +40 | `game.js:5531` |
| Verbotene Magie vor Zeugen | +60, beim Orden +120 | `game.js:13745` |
| Vampir beim Trinken gesehen | +60 (einmal je Tag und Fraktion) | `game.js:14806` |
| Quarantäne tagsüber verlassen | +40 | `game.js:12045` |
| Hexe nachts fortbringen (35 %) | Orden +120 | `game.js:11619` |
| Wachmord, Stadt wird schutzlos | +300, Varonheim +800 | `game.js:9459` |
| Königsmord | Valen +1500 | `game.js:9310` |
| Bestechung am Burgtor gescheitert | Valen +250 | `game.js:9628` |
| Alarm in der Varonsburg | Valen +200 | `game.js:9696` |
| Viehdiebstahl vor Zeugen | +20 beim Herrn des Hofs | `game.js:4053` |

- **Verfall** (`bountyDay`, `game.js:5831`): je Fraktion max(5, 5 %) × Schwierigkeitsfaktor am Tag.
- **Kopfgeldjäger** (`spawnHunters`, `game.js:5839`): ab 150 Gesamt-Kopfgeld (100 bei Ruhm ≥ 60), nur draußen, höchstens alle 2 Tage; 2 Jäger (ab Stufe 4 drei) auf Stufe 2 + 2 × min(6, Spielerstufe/3).
- **Ruf-Folgen** (`provoke` `game.js:5342`, `bloodshed` `game.js:4135`): Angriff −4 bis −19 bei der Fraktion des Opfers; Mord −10 (ohne Zeugen −3), Hoher Rang −35 (−18), Klerus zusätzlich Orden −30 (−15). Wer dabei auf ≤ −60 fällt, verliert seinen Rang (`game.js:5367`).
- **Blutbann / Kirchenbann** (`murderOfRank`, `game.js:4164`): Mord an Adel → 5 Tage greifen die Wachen der Fraktion ohne Anruf an; Mord an Klerus → zusätzlich Orden gebannt, 7 Tage hilft niemand auf.
- **Bedienung:** Log, Toast „KOPFGELD … GOLD“, Fenster „Aktive Effekte“ zeigt Bann.
- **Geprüft:** nur Code gelesen.
- **Fehlversuche:**
  - `provoke` senkt den Ruf bei `target.faction` (`game.js:5363`), das Kopfgeld geht aber an `crimeFaction` (`game.js:5370`). Bürger ohne eigene Fraktion kosten deshalb keinen Ruf, bringen aber Kopfgeld beim Stadtherrn.
  - Opfer ohne Fraktion und ohne Stadtplan-Heimat (Karak-Atar, Zwerge, Reisende) → Kopfgeld bei Valen, egal wo (siehe 2.4 Punkt 4).
  - `HIGH_RANK[victim.key]` greift nie, weil die Liste Berufsnamen enthält, keine Schlüssel (`game.js:4146`) — Hoher Rang zählt also nur über den Beruf.
  - Kommentar „+25/+75, ein Tag Kerker“ (`game.js:5819–5820`) ist veraltet (Code: 80/250, 10–20 Stunden).

### 4.2 Festnahme (`arrestCheck`, `game.js:5848`)

- **Ablauf:** Eine Wache mit Kopfgeld bei ihrer Fraktion verfolgt ab 240 px und spricht ab 44 px an: **Zahlen** (Kopfgeld weg), **Mitkommen** (Kette: Schuldknechtschaft; sonst Kerker), **Widerstand** (+100, die Wachen kämpfen 600 Spielminuten ohne Anruf).
- **Keine Festnahme:** in Kerker, Himmelsinsel, auf See, Tangkron, Gewölbe, Turm; in gesetzlosen Städten; wer schon sitzt oder in Ketten ist.
- **Bedienung:** Dialogliste.

### 4.3 Kerker

- **Was es ist:** Eine Haftkarte `kerker` mit Zellen, Wachstube und Mitgefangenen. Haft 10–20 Spielstunden je nach Kopfgeld (`jailMinutes`, `game.js:8957`; Minuten × 60).
- **Ablauf** (`goToJail` `game.js:8962`, `jailChoices` `game.js:8995`):
  - Kaution = max(100, Kopfgeld × 1,5).
  - Bestechen: 50 Gold, 45 % offene Tür, sonst +1 Stunde.
  - Schloss knacken: eigenes Minispiel-Fenster mit 3 Stiften; Feldbreite hängt an Beweglichkeit, jeder Fehlversuch bricht einen Dietrich (3 im Stiefel), jeder Versuch kostet 10 Minuten (`game.js:9017–9071`).
  - Gemeinsamer Ausbruch: ein Mitgefangener geht mit in die Gruppe.
  - Absitzen; Essen um 8 und 18 Uhr (heilt 10 %).
  - Erwischt außerhalb der Zelle (`wardenCatch`, `game.js:9104`): zurück (+2 Stunden), bestechen (halbe Kaution, mind. 40), kämpfen.
- **Aufträge im Kerker (nur in Salzhafen verhaftet):** `q_rask` (Kiste an der Küste: 150 Gold, Heiltrank, 100 EP) und `q_gilde` (Mann mit rotem Tuch: 60 Gold, 80 EP, Dietrich).
- **Bedienung:** Dialogliste; Schloss-Minispiel als eigenes Fenster.
- **Geprüft:** nur Code gelesen.
- **Fehlversuche:**
  - **Waffe für immer weg beim Ausbruch:** `jailExit` gibt die verwahrte Waffe nicht zurück (`game.js:9075`), obwohl der Kommentar bei `releaseJail` (`game.js:9084`) das Gegenteil nahelegt. Gleiches bei Flucht aus der Schuldknechtschaft (`game.js:7163`).
  - Wärter sind immer Valen-Soldaten, auch nach einer Festnahme in Aurelion (`game.js:8982`); es gibt nur einen Kerker für alle Städte.
  - **Diebesgilde endet nach einem Satz:** `S.flags.gilde` wird gesetzt, aber nirgends gelesen (`game.js:9009`).

### 4.4 Schuldknechtschaft

- **Was es ist:** Statt Kerker arbeitet man Schulden ab: Fußkette, halbes Tempo, keine Waffe, ein Wächter folgt (Stufe ≥ 20, Körper ×3–4).
- **Wo:** Aurelion — Werkbank der Schuldknechte in Tickmar (`world.js:1498`); Kette — Hauklotz am Steinbruch (`game.js:7096`).
- **Wie man hineinkommt:** Automat stoppt einen ohne Schein und man kann nicht zahlen (Schuld 300); Festnahme durch Kettenwache (Schuld = Kopfgeld); Tod durch die Kette (70 %: Schuld 200, `captureInstead`); Urteil des Magischen Gerichts.
- **Wege hinaus** (`bondMenu`, `game.js:7137`): Arbeiten (1 Stunde, Schuld −15, +4 EP), Fabrikarbeit (Schuld −15 je Stunde), Freikaufen (nur Aurelion), nachts Fesseln lockern (45 %) und fliehen, Schlüssel stehlen (gesehen: Schuld +50, 6 Schaden), Wächter besiegen, freigekauft werden (ab Tag 3, 25 % am Tag, wenn ein Gefährte, ein Haus mit Gunst ≥ 30 oder Grisk hilft), Ratsbeschluss (abschaffen befreit, begrenzen halbiert).
- **Flucht gelingt:** Ruf −15 bei Aurelion bzw. Kette, **Waffe bleibt weg**.
- **Bedienung:** Dialogliste.
- **Fehlversuche:** Wer in Aurelion versklavt ist, gilt als Schein-Inhaber (`hasPermit`, `game.js:7048`) → Aurelion-Rang 1 und Bionik Stufe 2 erlaubt. `e.bondKind` wird nie gesetzt, die Abschaffung befreit keine NPC-Schuldknechte (`game.js:10832`).

### 4.5 Stigma (`STIGMA`, `data.js:888`)

- Nur **Vampir** ist eingetragen. Orden und Kette verweigern Handel; Valen meldet an die Wache (Kopfgeld 60); der Orden schickt Vampirjäger; Aurelion, Händler, Goblins, Seevolk, Freie verlangen 20 % mehr; Tote 10 % weniger, Kelch 20 % weniger.
- Sichtbar wird es bei Sonnenbrand oder Blutdurst ≥ 70 ohne Kapuze (≤ 120 px) oder wenn die Fraktion es weiß (noch 10 Tage nach Heilung).
- **Lücke:** Kein Stigma für Nekromant, Hexenmeister oder Messing (Kommentar „T15 hängt später eine zweite Art daneben“, `data.js:887`). Totenmagie wirkt nur über „Verbotene Magie“ (Kopfgeld, ab 3 Taten Magierjäger).

### 4.6 Quarantäne

- Nach 2 Seuchentagen: 2 Quarantänewachen, Läden zu, keine Händlerzüge, 2 Schmuggelaufträge „Arznei nach …“ in Nachbarorten (+60 Gold). Tagsüber gesehen hinausgehen: +40 Kopfgeld beim Herrn des Orts (`game.js:12009–12046`).

---

## 5. Aurelion

### 5.1 Aufenthaltsschein und Automatenkontrolle

- **Was es ist:** Fremde brauchen in den Städten des Hochreichs einen Schein. Automaten-Wachen halten jeden ohne Schein an.
- **Wo:** Passamt am Westtor jeder Aurelion-Stadt (`game.js:7237`, Menü `game.js:7312`).
- **Preise:** 3 Tage 150 Gold, 7 Tage 300 Gold; nach dem Fall der Eisenfeste doppelt (`bastion()`, `game.js:7049`).
- **Kontrolle** (`aurelWatch`, `robotStop`, `game.js:7056–7074`): Sichtkegel 150 px. Strafe 100 × bastion; kann man nicht zahlen: Schuldknechtschaft (300). Fliehen: Aurelion −10. Kämpfen: Aurelion −15. Danach Ausweisung vor die Westmauer (`expel`).
- **Schein gilt auch bei:** Bürgerrecht, Heirat in ein Haus, Dienst bei einem Haus, Schuldknechtschaft.
- **Bedienung:** Dialogliste.

### 5.2 Bürgerrecht

- Ruf ≥ 40, 1000 Gold, ein Haus mit Gunst ≥ 30 als Fürsprecher → `S.flags.aurelCitizen`, Aurelion +10 (`game.js:7320`). Freie Fahrt zur Himmelsinsel mit dem Bürgersiegel.

### 5.3 Ränge Aurelions (`autoRanks`, `game.js:13164`)

| Rang | Name | Bedingung im Code |
|---|---|---|
| 0 | Fremder | kein Schein |
| 1 | Registrierter Besucher | Schein (auch als Schuldknecht) |
| 2 | Bürger | Bürgerrecht |
| 3 | Anerkannter Bürger | Bürger, Ruf ≥ 52 |
| 4 | Handelsbürger | Ruf ≥ 64 |
| 5 | Gildenmitglied | Ruf ≥ 76 |
| 6 | Hoher Beamter | Ruf ≥ 88 |
| 7 | Mitglied des Hohen Rates | Ratssitz (`q_ratssitz`) **oder** Bürger mit Ruf ≥ 100 **oder** Bürger + Heirat + Ruf ≥ 90 |

- **Fehlversuch (nachgelesen):** Rang 7 ohne Ratssitz. Der Rangführer behauptet „Hoher Beamter + Quest“ (`game.js:14122`). Weil der Ruf nicht begrenzt ist (3.2), reicht viel Aurelion-Ruf. Die Legende „Stimme im Hohen Rat“ gibt es schon für Bürger + Heirat (`game.js:13170`).
- Rang 3–6 haben keine Prüfungen, nur Ruf-Schwellen (P10 offen).

### 5.4 Adelshäuser und Gunst

| Haus | Stadt | Oberhaupt |
|---|---|---|
| Aurivel | Aurelheim | Fürstin Maelis |
| Kessmark | Gelenkhall | Graf Ottwin |
| Solandre | Sankt Serin | Gräfin Ysolde |
| Vantor | Tickmar | Fabrikherr Brannoc |

| Aktion | Gunst / Folge | Stelle |
|---|---|---|
| Dienst (7 Tage, 15 Gold am Tag, gilt als Schein) | +2 am Tag | `game.js:7337`, `7278` |
| Geschenk 150 Gold | +5 | `game.js:7333` |
| Intrige erledigt (+120 Gold) | eigenes Haus +20, Ziel −25 | `game.js:7334` |
| Heirat (Gunst ≥ 60, 500 Gold) | Aurelion +15, dann 25 Gold am Tag | `game.js:7344` |
| Begleitautomat (Vantor) | 900 Gold | `game.js:7348` |
| Erbfolgestreit: für einen Erben sprechen | +15, passende Ratsmitglieder +3 | `game.js:7304` |
| Fabrikschicht | Vantor +1 | `game.js:10913` |
| Streik gewonnen | Vantor −10 | `game.js:11874` |
| Adelsball: schmeicheln / Klatsch / frech | +max(3, Willenskraft/3) / +2 und anderes Haus −3 / −5 | `game.js:11612` |

- **q_intrige** (Brief stehlen oder Mord): Mord läuft über `bloodshed` und kostet Ruf und Kopfgeld wie jeder Mord.
- **q_ratssitz:** Angebot bei Gunst ≥ 60 und Aurelion-Rang ≥ 6; Abschluss bei Corvan auf der Himmelsinsel mit 3 Häusern (Gunst ≥ 30) und 500 Gold. **HB-37: die 600 EP werden nie ausgezahlt** (nicht nachgeprüft).
- **Bedienung:** alles Dialogliste.

### 5.5 Hoher Rat (`COUNCIL`, `TOPICS`, `councilSession`, `game.js:10777–10904`)

- **Was es ist:** Alle 7 Tage tagt der Rat auf der Himmelsinsel (Kamerafahrt). Man überzeugt Mitglieder mit Gewinn, Pflicht oder Vernunft; jedes Mitglied hat einen Stil. Stimme = Vorliebe + Beziehung × 0,5 + (passender Stil +20, sonst −5) + (Willenskraft − 10) × 2 − 10. Angenommen bei mehr Ja als Nein (die Kaiserin zählt doppelt; der Arbeiterrat sitzt nur nach gewonnenem Streik mit).
- **Beschlüsse** (`applyLaw`, `game.js:10827`):

| Thema | Beschluss | Wirkung |
|---|---|---|
| Flüchtlinge | aufnehmen / Lager / abweisen | Valen +10, Orden +5 / – / Valen −10, Orden −10 |
| Schuldknechtschaft | abschaffen / begrenzen / ausweiten | Valen +10, Zoll ×1,05, befreit den Spieler / Schuld halb / Valen −15 |
| Vharnholm nach Garmadon | ausrotten / vertreiben / dulden | siehe `vharnholmFate`; vertreiben: Valen +5 |
| Omega-Glaube | verbieten / Bündnis | Kette −20 / Kette +20, Valen −5 |
| Legion | nach Osten / heim | Untoten-Besatzungen ×0,8 / **wirkungslos** (`S.gold += 0`, `game.js:10835`) |
| Zölle | senken / heben | ×0,92 / ×1,08 (Grenzen 0,85–1,3) |

- Nach der Sitzung: Beziehung +2 (für dich) bzw. −3; Geschenk 200 Gold → +6.
- **Fehlversuche:** Legion „heim“ ohne Wirkung; Kommentar „5 von 9“ passt nicht zur Rechnung `yes > no` (`game.js:10776` gegen `10825`).

### 5.6 Fahndung, Magisches Gericht, Herrschermord

- **Fahndung** (`startHunt`, `game.js:7398`): Jeder zerstörte Automat → Aurelion −20 (unbegrenzt), Stufe bis 5. Alle 4–8 Minuten kommen min(4, 1 + Stufe) Sonnenklingen. Sühne in der Kanzlei: 400 × Stufe.
- **Gericht** (`courtTrial`, `game.js:7417`): schuldig bekennen (Schulddienst 250 × Stufe), Wergeld (300 × Stufe Gold), Orakel (40 % frei und Aurelion +5, sonst Schulddienst 400 × Stufe), kämpfen (Aurelion −30, die Sonnenlegion greift an).
- **Herrschermord** (`rulerSlain`, `game.js:7437`): Aurelion −60 und Fahndung +3 (zusammen −80). Kaiserin tot → Zoll ×1,3, Thronstreit (Städte können fallen, siehe 11).
- **Lücke:** Wer den ganzen Hohen Rat tötet, löst kein eigenes Weltereignis aus (P18 / GATE §11, bekannt).

### 5.7 Tickmar, Gelenkhall, Himmelsinsel

- **Fabrik Tickmar** (`factoryWork`, `game.js:10908`): je Stunde 18 / 14 / 12 / 8 Gold je nach Schuldknecht-Gesetz; Schuldknechte arbeiten Schuld ab.
- **Arbeiterrat** (nach gewonnenem Streik): Grete Rußhand vergibt Verträge (`conList(…, 'rat')`, `game.js:12178`); Ruf geht an Aurelion.
- **Gelenkhall-Werkbank** (`mechMenu`): eigenes **GUI-Fenster** `mech` (`game.js:9143`) — einer der wenigen echten Fenster-Dienste dieses Bereichs.
- **Teleportkreis** (`skyGate`, `game.js:7390`): 1500 Gold × bastion (also 3000 nach dem Fall der Eisenfeste) **je Fahrt**; frei mit Bürger-, Heirats- oder Ratssiegel. Dialogliste.

---

## 6. Valen und Varonheim

### 6.1 Hauptstadt Varonheim

- **Was es ist:** Die Hauptstadt König Varons auf dem Kronfels östlich von Nordfurt (`CAPITAL`, `world.js:1358`; 117 × 87 Felder, rund 90 Häuser). Viertel: Tempel/Friedhof, Adel, Händler, Markt mit Galgen, Gilden, Armenviertel, Handwerk/Garnison; im Norden die Burg mit eigener Mauer.
- **Start:** Seit Scheibe 5 Standardstart (Wahl im Erstellungsbildschirm), am Brett drei leichte Startaufträge (`game.js:2200`).
- **Auffällig:** Varonheim steht im Stadtplan mit `village: true` (`world.js:1408`). Folge: Das Brett der Hauptstadt hängt nur **3** Aushänge aus statt 5 wie in anderen Städten (`game.js:7576`); es gibt dort **keine Kutsche, kein Schankpersonal und keine Söldner** (siehe 13.1).

### 6.2 Hof und Königsaufträge

- **Hof** (`ensureVaronCourt`, `game.js:9553`): König Varon, Kanzler Aldhelm, Marschall Brandt, Spitzelmeisterin Ysmay, drei Adlige, Kerkermeister Grimm mit drei Gefangenen aus Aurelion, Kronschmied Hagen, Hoflieferant Hofmar, sechs Gardisten, Torwache Gernot.
- **Audienz:** Valen-Rang ≥ 1 oder 100 Gold beim Kanzler.
- **Königsaufträge** (`varonQ`, `royalStart`):

| Schritt | Ziel | Lohn |
|---|---|---|
| 1 | Elite-Hauptmann der Toten vor Nordfurt | 150 Gold, 200 EP, Bedrohung −5 |
| 2 | Verräter unter drei Adligen benennen | richtig: 300 Gold, Valen +10; falsch: Valen −5, ein Unschuldiger stirbt |
| 3 | Ritterschlag | Valen +15, Kronhelm, Titel „Ritter Varons“; verweigern Valen −10 |

- **Kerkermeister:** einen Gefangenen für 80 Gold laufen lassen → Aurelion +5, Valen −5.
- **Varon töten:** Valen −100 (nur wenn du/deine Gruppe), Kopfgeld 1500, Reichsverweser Aldhelm oder Brandt.
- **Bedienung:** Dialogliste.
- **Fehlversuch (nachgelesen):** Wer Aurelion-Ruf ≥ 25 hat, wird abgewiesen — und **jedes** Ansprechen des Königs kostet erneut Valen −3 (`game.js:9820`), beliebig oft.

### 6.3 Burgfrieden und Burgtor

- Grund nötig (Valen-Rang ab Soldat, Ritter, Audienz, Königsauftrag, Kult-Ermittlung) oder Bittschrift 25 Gold. Durchsuchung: Waffen, Dietriche, Stricke, Giftöl (in der Kultkrise auch Blutphiolen) in die Waffenkammer; Ritter behalten die Klinge, Offiziere werden nicht durchsucht.
- Bestechung 5000 Gold, 30 %; Schmuggel einer Kleinwaffe 15 % + Schleichen × 1,5 (5–90 %); Diener holen gegen 300 Gold eine Waffe (15 % Verrat).
- Waffe ziehen drinnen: Warnung, dann Alarm (Valen −20, Kopfgeld 200, Späher reiten — wer sie abfängt, verhindert Verstärkung).
- Alles wie in `MECHANIKEN.md` beschrieben; nur Code gelesen. Bedienung: Dialogliste.

### 6.4 Stadt ohne Schutz (`game.js:9323–9516`)

- **Was es ist:** Jede Stadt zählt ihre toten Wachen. Stufen: Bewacht → Geschwächt (≥ 50 % tot) → Schutzlos (≥ 80 %) → Gesetzlos (nach 1–4 Tagen ohne Ersatz) → Übernommen.
- **Ablauf:** Schutzlos: Sturmglocke, Bürger fliehen (−20 % Einwohner), Läden zu, Miliz. Gesetzlos: keine Festnahmen, keine neuen Aushänge (`townContracts` → 0), Kaufen +25 %, nachts 2–4 Plünderer. Übernahme: Totenheer in Reichweite, sonst Bande in 80 Feldern, sonst (Westrand) die Kette, sonst neue Bande.
- **Ruf:** jede vom Spieler getötete Wache −4 beim Herrn; jeder erschlagene Plünderer +3 (höchstens +12 je Nacht); Befreiung durch Anführer-Tod +10, wenn man nicht selbst die Wachen erschlug (`schutzFreed`). Alle über `townFac` — richtig zugeordnet.
- **Ersatz** (`SCHUTZ_REINF`): Valen 3 Mann alle 2 Tage, Aurelion 2 Automaten täglich, Kette 2 alle 2 Tage, Händler 1 täglich, Orden 2 alle 3 Tage, Tote alle sofort.
- **Fehlversuche:** HB-11/HB-12 behoben. Bekannt offen: HB-24 (Burgtor schiebt Gesuchte in gesetzloser Hauptstadt stumm zurück), SHF-04 (Burgfrieden gilt in gesetzloser Hauptstadt weiter).

### 6.5 Der Kelch (Blutkult unter Varonheim)

- Fraktion `blut` ohne Ränge, Startwert −40. Beitritt durch Trinken bei Hedda → Titel Vampir, Kelch ≥ 40. Katakomben, Aldhelm, Rote Krönung, Entführungen, Ausgänge — siehe `MECHANIKEN.md` „Blutkult Scheibe 1–5“.
- **Auffällig:** Alle Ruf-Änderungen des Kults sind unbegrenzt (`game.js:15148–15337`).

---

## 7. Krieg

### 7.1 Kriegsgraph (`WAR_NODES`, `WAR_EDGES`, `data.js:1736–1754`)

| Knoten | Besitzer am Start | Garnison |
|---|---|---|
| Alter Friedhof | Tote | 10 |
| Moorland, Alte Feste, Kleine Ruine, Kreuzweg, Steinbrücke | niemand | 0 |
| Eren | Valen | 14 |
| Alte Straße | Valen | 4 |
| Nordfurt | Valen | 40 |
| Schwarze Feste | Tote | 40 |
| Nekropole | Tote | 22 |
| Alt-Vharn | Tote | 16 |
| Sonnwacht | **Orden** | 20 |
| Aschfurt | **Valen** (Wachen dort sind Händler) | 8 |
| Salzhafen | Valen | 14 |
| Varonheim | Valen | 60, Mauern 100 |

- Startheere: Tote auf dem Friedhof (40) und der Schwarzen Feste (34), Valen in Nordfurt (50) und Salzhafen (28) (`sim.js:17`).

### 7.2 Heere und Schlachten

- **Was es ist:** Heere ziehen alle 6 Spielstunden über den Graphen (`warTick`). Tote suchen den nächsten fremden Knoten (Varonheim nur mit Befehl), Valen holt verlorene Städte zurück, unter Stärke 25 bleibt Valen stehen. Ein halber Tag Vorwarnung mit Toast in der Nähe.
- **Wachstum** (`warDay`, `sim.js:477`): Tote +min(4, 1 + ¼ je gehaltenem Knoten), nach Garmadons Tod 0. Valen +3 bei genug Korn (sonst +1) + Frontzuschlag − Kult. Deckel 110 (Schwer/Sehr schwer) bzw. 80. Valen-Heere essen Nordfurts Korn.
- **Abstrakte Schlacht:** Würfel auf Stärke; Valens Stadtgarnison ×1,3.
- **Echte Schlacht** (`materialize`, `battleCheck`): Ist der Spieler in 40 Feldern, stehen 2–7 Figuren je Seite auf dem Feld (Skelette gegen Valen-Soldaten, in Aurelion mit Dampframme). Jede tote Figur kostet ihr Heer Stärke. Ende nach 240 Minuten.
- **Befreiung in Wellen:** 2–4 Wellen (Schwarze Feste und Varonheim 4), die letzte mit einem Hauptmann der Toten; geht man weiter als 30 Felder weg, verfällt die halbe Welle. Wer befreit, bekommt den Titel „Befreier von …“ (verblasst nach 7 Tagen, `titleDay`/`p.titleUntil`) und senkt die Bedrohung der Hauptstadt um 10.
- **Belohnung:** **Kein Ruf** für Feldschlachten und Befreiungen (`sim.js:577–586`, `617`) — nur Titel, Chronik, weniger Bedrohung.
- **Fall der Untoten** (nach Garmadon, `undeadFallDay`): jeden Tag wird ein besetzter Ort mit Stadtplan frei; Wiederbesiedlung in 5 Stufen (Tag 1, 5, 15, 30, 60); das Totenland heilt.
- **Bedienung:** Kriegskarte im Kartenfenster (`drawWarmap`).
- **Geprüft:** nur Code gelesen.
- **Fehlversuche:**
  - **Sonnwacht wechselt nach einer Befreiung an Valen** (`sim.js:616`: alles außer Aurelion fällt an Valen; ebenso `liberateNode` `game.js:10699` und Eroberung durch ein Valen-Heer `sim.js:394`). Kreuzweg (niemand) wird ebenso Valen. Siehe 2.4 Punkt 5.
  - Knoten ohne Stadtplan (Alt-Vharn, Nekropole, Friedhof …) werden durch `undeadFallDay` nie befreit (`game.js:10767`); für die Schwarze Feste gibt es eigens `keepSiegeDay`.
  - Bekannt offen: HB-25/26/27 (Toten-Übernahme hängt, Läden bleiben zu, Besatzung dauerhaft gekürzt).

### 7.3 Morvaths Heerzug und Belagerung Varonheims (`CAP_SIEGE`, `sim.js:35–106`)

- Bedrohung zählt ab Tag 20 (Sehr schwer 5): +1 am Tag bei verlorener Front (6+ Orte der Toten), sonst −0,75; +0,5 ohne Valen-Feldheer; +0,5 bei fehlenden Wachen; Kult +1/+0,5; leerer Thron +0,5. Höchstens +1,5 (+2) am Tag; vor Tag 75 (60) höchstens 19.
- Stufe 10 Gerücht und Hamsterpreise (+30 % auf Korn, Fleisch, Salz, Waffen), 15 „Varonheim rüstet“, 20 Heerzug (Stärke 100 / 110), danach 30 Tage Ruhe.
- Belagerung: je Zug Mauern −max(2, 5 % der Stärke), Heer −0,4, Garnison −0,25; Sturm bei Mauern 0 (×1,2); Entsatz mit Ausfall ×1,15.
- Fall: Exilhof (Salzhafen → Nordfurt → Eren), Läden zu, Knochenwachen; Rückeroberung in 4 Wellen: 400 Gold, **Valen +20** (`game.js:9544`).

### 7.4 Überfälle der Toten auf Dörfer

- **Häufigkeit:** 6 % am Tag (35 % nach dem Fall der Kette), Osten öfter; Größe 4–7 + Tag/15 (höchstens 14), nach Garmadon 2–4; Vorwarnung 3–6 Stunden.
- **Verteidigung anwerben** beim Verteidigungsmeister (Dialogliste): Miliz 2 Mann 60 Gold (bleibt), Söldner 3 Mann 150 Gold (5 Tage), Automaten 2 Stück 400 Gold (nur Aurelion ≥ 0 und Kette steht), Goblins 3 für 60 Gold (nach Befreiung, Goblin-Ruf ≥ 20).
- **Belohnung:** Gewonnen vor Ort mit eigenen Tötungen → **Ruf beim Herrn des Dorfs** min(15, 3 + 2 × eigene Tötungen), Beziehung +6 zu allen Bewohnern (`game.js:6843`). Verloren: Betriebskassen halb, 1–3 Tote, 15 % (45 % nach Fall der Kette) Zerstörung — auf Angsthase Wiederaufbau nach 10 Tagen.

### 7.5 Feldzüge der Kette (`CAMP_TYPES`, `game.js:6567`)

| Feldzug | Größe | Abstand |
|---|---|---|
| Stoßtrupp | 8–12 | 4–6 Tage |
| Feldzug | 20–30 | 10–15 Tage |
| Heerzug | 40–50 | 20–30 Tage |

- Ziele im Totenland (Totenruinen, Gräberfeld, Schädelwald, Seelenhügel, Grabwacht, Knochenwald). Musterung mit Horn und Kriegsmeister.
- **Wahl:** mitziehen (Sieg: Kette +10, 60 Gold), sabotieren (gesehen: Kette −15), die Toten warnen (Tote +8).
- **Lücke:** Feldzüge ändern weder Kriegsgraph noch Wirtschaft — sie sind nur ein Schauplatz.

### 7.6 Tribut der Kette

- Alle 5 Tage holt ein Tributzug 25 Lasten aus Grauwasser, Hohlstein, Eisenried (harsch: doppelt). Dorf-Vorrat 60 → +5 am Tag, unter 10 hungert das Dorf.
- **Wahl und Ruf:** Kette beim Aufstand helfen (Kette +8, Dorf −15), dem Dorf helfen (Kette −10, Dorf +15), Geleit (Kette +6), Zug ausrauben (Kette −15, Tributgut, `q_tribut`), Tribut zurückbringen (Dorfruf +20, 60 EP), für das Dorf zahlen (150/300 Gold, Dorfruf +10).
- **Lücke:** Der Tribut kommt in der Eisenfeste ohne Lagerbuchung an — er verschwindet (`game.js:6482`).

### 7.7 Fall der Eisenfeste und Sklavenaufstand

- **Fall Vargs** (`liberate`, `game.js:11017`): Goblins +200 (unbegrenzt), Kette = −100, Gefangene frei (Goblins nach Grubenhort, Menschen **nach Sonnwacht** statt nach Hause), wilde Goblins legen die Waffen nieder, Legende „Kettenbrecher“, Kamerafahrt. Wer bei den Toten Rang hat, wird Kommandant. Eine offene `q_pferch` wird mit abgeschlossen (HB-09 behoben).
- **Sklavenaufstand** (`revoltStart`/`revoltWon`): ab Tag 12 2 % am Tag oder angestiftet. Gewonnen: Freie +40 (sonst +15), Goblins +15, Kette −25 (sonst −10); Freie Siedlung am Grubenhort mit Sprecherin Ranna (Verträge der Freien), Erz/Barren/Steinwaren teurer, Tributdörfer sagen sich je nach Ruf los, nach 3 Tagen Racheüberfall.
- **Fehlversuch:** Nach dem Fall bleiben die Tributdörfer dauerhaft „Kette“ (siehe 2.4 Punkt 1).

### 7.8 Überfälle der Toten unter deinem Befehl (P20)

- Mit Untoten-Rang bei Sael: eines der 4 nächsten Dörfer wählen, Horde 6–9. Sieg: 80 Gold, **Herr des Dorfs −15, Tote +8**. Urteil (Dialogliste): erheben (Tote +5), versklaven (täglicher Tribut bis 60 Gold), vertreiben. Ab Rang 2 ein Heer gegen eine Stadt (`q_undarmy`, HB-05 behoben).

---

## 8. Wirtschaft

### 8.1 Märkte und Waren

- **Was es ist:** Jede Siedlung hat ein Lager mit 13 Waren (Korn, Fleisch, Salz, Tuch, Fell, Holz, Holzware, Steinware, Erz, Barren, Werkzeug, Waffen, Magitech). Echte Bewohner erzeugen und verbrauchen.
- **Verbrauch je Kopf und Tag** (`economy.js:38`): Korn 0,18, Fleisch 0,08, Salz 0,03, Tuch 0,03, Holzware 0,03, Steinware 0,02, Werkzeug 0,015, Holz 0,05; Adel mehr Tuch/Fleisch, Magitech nur Adel und Aurelion, Waffen nach Soldaten. Vharnholm isst nicht.
- **Ziel und Lager:** Ziel = Verbrauch × 6 + 4; Lagergrenze min(400, 60 + 40 je Lager/Markthalle/Kontor).
- **Betriebe** (`TRADES`, `economy.js:12`): Hof, Jägerhütte, Fischerei, Stall, Holzfällerei, Werkstatt, Steinbruch, Saline, Mine, Schmelze, Schmiede, Weberei, Feinmechanik, Magitech — mit Ein- und Ausgangswaren. Fehlt ein Vorprodukt, steht der Betrieb. Hunger halbiert die Arbeit. Besetzte oder zerstörte Orte produzieren nicht.

### 8.2 Preise

- `ecoPrice` (`economy.js:127`): Warenwert × clamp(Ziel / (Lager + 1), 0,4–3); Aurelion ×1,15 × Zoll; Kauf in besetzter Stadt ×1,5, gesetzlos ×1,25, Bandenherrschaft ×1,5; Hamsterkäufe Varonheim bis +30 %; Folgen-Faktoren aus `S.after`. Kauf ×1,12, Verkauf ×0,88.
- Danach Handel-Fertigkeit (±20 %) und Ruf-Faktor (3.2). Karak-Atar mit verweigertem Zoll: Kauf ×1,3, Verkauf ×0,8.
- **Zoll** `S.tollMul`: Kaiserin tot ×1,3, Ratsbeschlüsse ×0,92 / ×1,08, fällt täglich um 0,01 Richtung 1.

### 8.3 Händlerzüge und Karawanen

- **Sichtbar ist nur eine Karawane:** Eren ↔ Nordfurt (`sim.js:146`), 140 Leben, Ladung aus Erens zwei größten Überschüssen, Hinterhalt mit 35 %. Schützt man sie: 30 Gold, Händler +4; geht sie verloren: Händler −2.
- **Unsichtbare Händlerzüge** (`economy.js:288`): bis 6 neue am Tag, 16 zugleich, bis 20 Stück Überschuss → Mangel; Risiko 6 % + 12 % je Totenheer an Start/Ziel + 5 % Karak-Atar, weniger mit Wachen.
- **Lücke:** Alle anderen Züge sieht man nie in der Welt.

### 8.4 Handelskontor, Wagen, Betriebe, Lieferaufträge

| Dienst | Wo | Inhalt | Bedienung |
|---|---|---|---|
| Handelskontor (`ecoMenu`) | Marktmann | Knappes, Reichliches, ankommende Züge | Dialogliste; nur „Waren kaufen/verkaufen“ öffnet das **Handels-Dock** |
| Handelswagen (`wagonMenu`, `sendMenu`) | Kontor | 250 Gold, 60 Ladungen, Wachen 20 Gold; Überfall: ab 3 Wachen 50 % abgewehrt, sonst 40–90 % Verlust; Verkauf automatisch am Ziel | Dialogliste |
| Betriebe kaufen (`bizMenu`) | Kontor | Preis 120 + Ertrag × 14 + 60 je Arbeiter; Ausbau 200 × Stufe (bis 3); Hand 30 Gold + 3 Gold am Tag (höchstens 3); Gewinn 35 % des Warenwerts in die **Kasse** | Kaufen: Dialogliste; Kasse abholen: **Fenster „Betriebe“** (Siedlungs-Dock) |
| Lieferaufträge (`ordersMenu`) | Kontor | höchstens 8, Menge 4–15, Lohn Wert × 1,6, Frist 7 Tage, Händler +2 | Dialogliste |
| Investieren (`investMenu`) | Anschlagbrett | Wohnhaus, Werkstatt, Handel fördern, Wache — je Ruf +3 beim Herrn | Dialogliste |
| Schwarzmarkt (`blackMarket`) | Rook, Nix | 4 Angebote am Tag, 25 % selten, Preis ×1,5, 40 % gebraucht | Dialogliste |

- **Kasse verlieren:** Besetzung/Zerstörung ganz, Totenüberfall/Plünderer halb.
- **Fehlversuche:** Kauf von Stadtwaren und Wagenbeladung buchen `t.bought` nicht (`game.js:14334`, `economy.js:341`), andere Käufe schon — uneinheitlicher Tagesverbrauch. Der Wagen verkauft auch in besetzten/zerstörten Zielstädten (`economy.js:366`).

### 8.5 Luftschiffe

- Flotte Aurelions: Kupferwind und Goldmöwe (Handel), „Wacht von Aurel“ (Patrouille). Ihr Zustand (`airSupply`, 0,2–1,5) bestimmt die Nahrung Aurelions. Absturzrisiko je Flugtag nach Motor und Steuerung; Neubau nach 5 Tagen für 6 Barren und 6 Holz; Werft repariert (Aurelion +2) und baut aus (Aurelion +3).
- **Kein eigener Frachtflug** für den Spieler. Hafenmeisterin/Mastwarte: Status, Passage, Reparatur, Ausbau — Dialogliste.

### 8.6 Seehandel und eigenes Schiff

- Schiff 900 Gold, Laderaum 20, Reparatur 2 Gold je %. Feste Preise je Hafen (`PORT_PRICE`, `game.js:8153`), Verkauf zu 90 %. Kurse: Handelsroute (70 % Prise: entern = 100–200 Gold, **Seevolk −12**), Wrackfeld (Rumpf −6 bis −12, Kiste), Küste (50 % Sturm).
- **Lücke:** Seehandel ist nicht mit den Stadtlagern verbunden.

### 8.7 Stadtwachstum (`growthDay`, `game.js:7717`)

- Wohlstand +3 am Tag (+1 bei Ruf beim Herrn > 30), −12 bei Besatzung, −5 bei angekündigtem Überfall, −4 bei Omegas Zorn, −0,25 je gebautem Haus; ohne Schutz feste Werte −4/−8/−3. Bei 100 ein neues Haus (höchstens 10), bei −20 verfällt eins. Nicht in Aurelheim, Vharnholm, Eisenfeste, zerstörten Orten.

---

## 9. Reisen

### 9.1 Kutsche und Fähre

- **Was es ist:** In jeder Stadt (nicht Dorf, nicht Vharnholm/Eisenfeste, nicht besetzt) steht ein Kutscher; Fähre Salzhafen ↔ Kupferhafen.
- **Preis/Dauer:** Kutsche max(10, Entfernung × 0,25) Gold, Entfernung × 2,2 Minuten; Fähre × 0,18 und × 1,6. Überfallrisiko min(35 %, 8 % + 5 % × Bedrohung), Fähre sicher. Nur die 5 nächsten Städte; ins Hochreich nur mit Schein.
- **Ablauf:** Bei Überfall endet die Fahrt nach 45–70 % der Strecke mit 3–4 Gegnern; die Zeit läuft wirklich (Stunden-Haken laufen mit), Gefährten reisen mit.
- **Bedienung:** **eigenes Reise-Fenster** (`UI.openModal('travel')`, `game.js:8825`); die Dialogfassung ist nur Rückfall für Koop-Gäste.
- **Fehlversuch (nachgelesen):** Varonheim gilt als „Dorf“ (6.1) — `coachTown` (`game.js:8091`) lässt Dörfer außerhalb Aurelions aus, also **steht in der Hauptstadt kein Kutscher**, und sie ist auch kein Kutschenziel.

### 9.2 Überfahrt zur See

- 60 Gold, Salzhafen/Kupferhafen ↔ Tangkron. An Deck 24 s: 35 % Piraten (3–4, ab Stufe 13 einer mehr), 30 % Sturm (Brecher 3–7 Schaden, unter Deck +8 s), sonst ruhig. Ankunft: 6 Stunden vergehen, Seevolk +6 (Piraten abgewehrt) / +3. Wer an Deck fällt, wacht im Abfahrtshafen auf — **ohne Erstattung**.

### 9.3 Luftschiff-Passage

- Nur mit Aurelion-Rang ≥ 1; Preis max(30, Entfernung × 0,12). Sturm 15 % (40 % bei Regen/Nebel/Schnee/Sandsturm), Motorschaden, Piraten. Helfen: Aurelion +2, Enterer abwehren +4.
- **Fehlversuch:** Bei schlechtem Wetter kann kein Motorschaden mehr auftreten — der Würfelbereich ist ganz vom Sturm belegt (`game.js:8324`).

### 9.4 Teleportkreis

- Siehe 5.7.

### 9.5 Reisebegegnungen (`ENC_KINDS`, `game.js:2907`)

- Alle 6 s draußen in Bewegung: Chance (12 % + 5 % × Bedrohung) × Nebelfaktor. Ergebnis: Hinterhalt hinter Deckung (50 %), fahrender Händler, Begegnung mit Wahl, Reisender.

| Begegnung | Wahl und Folgen |
|---|---|
| Verwundeter | verbinden: 8–25 Gold, Orden +2, Beziehung +30; ausrauben: 15–40 Gold, Moral −6 |
| Wegelagerer | 25 Gold zahlen; einschüchtern (Stärke ≥ 14, Stufe ≥ 12 oder 2 Gefährten, sonst 25 %); kämpfen |
| Hungernde Mutter | Essen geben: Valen +2, Orden +2, Moral +5, 40 % „Dankbarkeit“ |
| Deserteur | laufen lassen: Valen −1 und ein Tipp; melden: 50 % Kampf, sonst 30 Gold, Valen +4; anwerben |
| Rächer | nach Kopfgeld 35 %: kämpfen, 60 Gold Blutgeld, 50 % überzeugen |
| Gedungener Mörder | kämpfen, 100 Gold überbieten, „Ich komme selbst“ |
| Entflohener Grubenarbeiter (Westen, Kette steht) | verstecken: Goblins +8, Kette −8; ausliefern: Kette +10, Goblins −12, 30 Gold; kämpfen: Goblins +15, Kette −15 |
| Weinende Frau (Falle) | erkannt (Wahrnehmung ≥ 12 / Überleben ≥ 25): 2 Banditen; sonst 3 Banditen und 6 Schaden |

- **Fehlversuch:** Hungernde Mutter und Deserteur zählen immer für Valen/Orden, auch in Aurelion, Karak-Atar oder im Totenland (`game.js:2974`, `2982–2984`).

---

## 10. Tageszeit, Wetter, Jahreszeiten

- **Uhr:** 1 s = 1 Spielminute, ein Tag = 24 Minuten; Start Tag 1, 8 Uhr.
- **Wetter** wechselt alle 2–7 Minuten aus dem Pool der Region (`WEATHER_POOL`, `game.js:2502`): Aurelion meist klar; Totenland Blutregen/Nebel; Eisenmark Nebel/Regen/Schnee; Wüste klar/Sandsturm; Gebirge Schnee; sonst (auch Menschenland) klar/bewölkt/Regen/Nebel. Jahreszeit färbt den Pool (nicht in Wüste, Totenland, Aurelion). Omegas Zorn erzwingt Blutregen.
- **Wirkungen** (`WX`, `game.js:2479`): Regen Fernkampf ×0,9, Sicht ×0,85, Brennen halb; Nebel Sicht ×0,6, Hinterhalte ×1,6; Schnee Tempo ×0,85, Ausdauer ×0,7, nachts ohne Umhang „Unterkühlt“; Sandsturm Tempo ×0,9, Fernkampf ×0,7; Hitze (Wüste 10–17 Uhr, klar) Ausdauer ×0,7 (schwere Rüstung ×0,5); Blutregen Gegnersicht ×1,25.
- **Jahreszeiten:** je 7 Tage Frühling, Sommer, Herbst, Winter. Ernte ×0,9 / 1,1 / 1,4 / 0,4. Winter: 45 % am Tag **Wolfswinter** (3–5 Wölfe Stufe 5 an einem Norddorf, Jagdauftrag am Brett); die Gruppe isst ×1,25 (Schnee ×1,5).
- **Geprüft:** nur Code gelesen.
- **Fehlversuche:**
  - **Jahr und Jahreszeit laufen auseinander:** Ein Jahr hat 60 Tage (`year()`, `state.js:100`), ein Jahreszeiten-Kreis nur 28 Tage (`seasonOf`, `state.js:103`). Das Jahr wechselt mitten im Frühling.
  - `WX.heat.food = 1.2` wird nie benutzt (`game.js:2484`); der Hitze-Zweig in `sunOn` (`game.js:14758`) ist tot, weil `S.weather` nie „heat“ ist.
  - „Feuer brennt schwächer bei Regen“ wirkt nur auf den Zustand „Brennt“, nicht auf Hausbrände (`startFire`, `game.js:8720`).
  - Wetter gilt global nach der Region des Spielers (IHF-08, bekannt).

---

## 11. Weltereignisse und ihre Folgen

### 11.1 Kleine Ereignisse (`EVENTS`, `worldEvent`, `game.js:11640–11651`)

- **Was es ist:** Jede Spielstunde passiert mit 10 % Chance eines von 18 kleinen Ereignissen (gleich gewichtet; Steuereintreiber und Missernte stehen doppelt in der Liste).

| Ereignis | Ablauf | Belohnung / Folge | Debug |
|---|---|---|---|
| Steuereintreiber | Beamter + 2 Torwachen in einem Valen-Dorf | Wohlstand −6, Valen +1 | **fehlt** |
| Deserteure | Bande „Die Zerrissenen Röcke“ (E1) oder 3 Deserteure + Kopfgeld-Aushang | siehe Banden | „E1: …“ |
| Missernte | 2 Dörfer: Wohlstand −10, Korn halb | – | **fehlt** |
| Pilgerüberfall | 2 Banditen jagen einen Pilger | – | **fehlt** |
| Brand | Haus brennt, Löschkette mit Eimern vom Brunnen, 4 Helfer | gelöscht: Wohlstand +1; hat der Spieler ≥ 15 Hitze gelöscht: **Herr des Orts +4**, Ruhm +3; ausgebrannt: Wohlstand −6 | „Brand (hier / nächste Stadt)“ |
| Magitech-Unfall | 3–4 Amok-Automaten (Stufe 9) in Tickmar, Werk 3 Tage still | Aurelion +2 je zerstörtem Automaten; entfällt nach Petition „Arbeitsschutz“ | „Magitech-Unfall“ |
| Spuk am Brunnen | Ort nahe Vharnholm, nachts 3 Geister | Auftrag +40 Gold, +2 Ruf beim Herrn | „Spuk am Brunnen“ |
| Magiekern (einmalig) | Snikk bei Grubenhort | kaufen 150 Gold / nehmen (Goblins −10); an Corvinus (Aurelion +15, 250 Gold), Sael (Tote +15, Orden −10, 3 Seelenphiolen), Irmgard (Kette +15, Glaube +15), Ilvar (Vertrauen +20); zerschlagen (Orden +5, Aurelion/Tote/Kette −5) | „Magiekern“ |
| Magische Anomalie | Ley-Punkt, 4 Tage, Mana doppelt, Zauber verrutschen | `q_anomaly`: 120 Gold, 150 EP, Aurelion +4, Orden +4 | „Magische Anomalie“ |
| Meteorsplitter | höchstens alle 20 Tage | Irmgard: Glaube +10, Kette +5, 80 Gold; Corvinus: 200 Gold, Aurelion +5; Ilvar: Vertrauen +15, 120 Gold | „Meteorsplitter“ |
| Erbfolgestreit | Aurelion-Haus, 6 Tage | Hausgunst +15, Ratsmitglieder gleichen Stils +3 | „Erbfolgestreit“ |
| 7 kleine Meldungen | Händlerzug fehlt, Skelett bei Eren, Flüchtlinge (Korn −6), Truppen (nur Text), neue Erzader, Wegzoll-Bandit, zufälliger Ruf −2…+3 | – | **fehlen** |

- **Fehlversuche:** Fehlende Debug-Einträge (siehe Tabelle); „Valen zieht Truppen …“ ohne Wirkung; zufälliger Ruf unbegrenzt (`game.js:11649`).

### 11.2 Große Ereignisse (`BIG`, `bigDay`, `game.js:11486–11640`)

- **Was es ist:** Ab Tag 3 alle 3–5 Tage eines, nie zwei zugleich, die letzten drei Arten gesperrt. Nicht in Vharnholm, zerstörten, besetzten oder Aurelion-Orten (außer Ball/Streik). Ansage per Log, Chronik, Toast. Debug: „Großes Ereignis: …“ und „… beenden“.

| Ereignis | Ort / Dauer | Wahl | Belohnung / Ruf (an wen) |
|---|---|---|---|
| Seuche | Ort mit ≥ 4 Bewohnern, 8 Tage | Heilkraut an Kranke | je Heilung Beziehung +8, **Herr des Orts +2**; springt ab Tag 3 über, wenn < 3 geheilt |
| Heuschrecken | 3 Tage | 10 Holz an Bauer/Magd/Knecht | Korn +10, **Herr des Orts +5**; ohne Eingreifen stilles Ende |
| Turnier | Varonheim (doppelt), Nordfurt, Eren, Salzhafen; 2 Tage | 20 Gold Einsatz, 3 Ritter | 200 Gold, Ruhm +15, Titel „Turniersieger“; kein Fraktionsruf |
| Adelsball | Aurelheim, 2 Tage, nur mit Schein | 3 Gespräche | Hausgunst (siehe 5.4) |
| Luftschiffabsturz | Wildnis | Luftschiffer aufrichten | je Überlebendem Aurelion +6, 40 Gold — **schon beim Ansprechen, ohne Wahl** |
| Schatzkarawane | vor einer Stadt, Überfall nach 6–10 h | verteidigen | 120 Gold, **Händler +10**, Ruhm +5; bist du nicht da: **Bande +2 für dich** |
| Hexenprozess | 2 Tage | Fürsprache (Willenskraft-Probe) / nachts fortbringen / schweigen | gerettet: Orden −3, **Herr des Orts +6**; misslungen: Orden −5; Flucht: 35 % Kopfgeld 120 beim Orden; schweigen: Orden +2 |
| Gildenstreik | Varonheim, 3 Tage | Schuld begleichen 200 Gold / an die Esse treiben | Händler +5 / Valen +3, Händler −5, Wohlstand −5 |
| Streik | Tickmar, 3 Tage | Arbeiter / vermitteln / Vantor | Vantor −10 und Streik gewonnen / Vantor +3, 60 Gold / Vantor +10, 100 Gold |

- **Geprüft:** nur Code gelesen.
- **Fehlversuche:**
  - **Möglicher Absturz beim Hexenprozess:** Die Startprüfung erlaubt Orte, in denen nur eine Frau mit Frauenberuf, aber ohne Namen aus `FIRST_F` lebt; die Auswahl filtert nur nach `FIRST_F`. Dann ist `w` leer und `w.id` stürzt ab (`game.js:11548–11550`, nachgelesen). Selten (Bewohner bekommen meist `FIRST_F`-Namen), aber möglich bei benannten Figuren.
  - Schatzkarawane: Ansage verspricht „selbst ausrauben“, es gibt keine Interaktion dafür; Abwesenheit gibt trotzdem Bande +2.
  - Stilles Ende ohne Meldung: Heuschrecken, Luftschiffabsturz, Gildenstreik, Erbstreit.
  - Kommentar „alle acht“ — es sind 9.

### 11.3 Folgen großer Ereignisse (`S.after`)

- Auf Angsthase erholt sich die Welt nach 21 Tagen, sonst bleibt die Folge, bis der Spieler sie umkehrt. Debug-Bereich „Folgen großer Ereignisse“.
- **Dorf ausgelöscht** (`ruins`): Ruine mit Gräbern, nach 1 Tag Spuk (Priesterauftrag „Totenruhe“, nur nachts), nach 2 Tagen Räuber/Goblin-Nest („Ruine ausräuchern“); je Auftrag 60 Gold, +3 Ruf. Wars der Spieler: 400 Kopfgeld, **Herr des Dorfs −40**, alle anderen −8, Rachezug. Bei einem Tributdorf heißt das: Kette −40 (siehe 2.4).
- **Sklavenaufstand, Streik gewonnen, Städte Aurelions fallen, Seuche bleibt/Quarantäne, Hexenjagd-Welle, Omegas Ende:** wie in `MECHANIKEN.md` „Folgen großer Ereignisse“ beschrieben; Zahlen im Code bestätigt (Aufstand: Freie +40/+15, Goblins +15, Kette −25/−10; Streik: Magitech ×1,3, Arbeiterrat; Thronstreit: 30 % je Tag fällt eine Stadt, höchstens 3, ab 2 zerbricht das Hochreich; Frieden 300 Gold + Willenskraft, Häuser +5; Fleckfieber 12 % je Stunde unter Kranken, Heilung 40 Gold).

### 11.4 Stadtfeste

- Alle 6 Tage je Stadt (eigener Versatz), 15–23 Uhr, Tische, Fässer, Musik. Festmahl einmal je Fest: 50 % Heilung je Körperteil, Ausdauer voll, Vorrat +2, Gruppenmoral +10. Ansage am Vortag und am Tag im Log, Toast vor Ort. Fällt aus bei angekündigtem Überfall, nicht in Vharnholm/zerstörten/besetzten Orten.
- **Lücke:** kein Debug-Eintrag.

### 11.5 Glaube Omegas (`faithDay`, `game.js:10364`)

| Ereignis | Takt | Wahl | Ruf / Lohn |
|---|---|---|---|
| Opferfest | alle 7 Tage | beten (10 Gold) | Glaube doppelt (+10) |
| Ketzerjagd | alle 6 Tage, in einem Tributdorf | bestechen 80 Gold / mit Gewalt befreien / nichts | Kette −3 / Kette −12 / Verbrennung |
| Wallfahrt | alle 9 Tage, 4 Pilger, 3 Räuber Stufe 6 | begleiten | Glaube +8, 40 Gold, Kette +5 |
| Kreuzzug | alle 12 Tage, 8 Paladine, 3 Tage | mitziehen | Sieg: Kette +10 (sonst +2), 150 Gold, Glaube +10 |
| Bruder Kasimir | nach einer Ketzerjagd | helfen / verraten | Kette −10, Valen +5, Sternenstab / Kette +15, Glaube +5 |

- **Fehlversuche:** Kreuzzug zählt als „mitgezogen“, sobald man sich bei Konrad meldet — man muss nicht dabei sein (`game.js:10445`, `10459`). `faithDay` prüft nicht, ob die Kette gefallen ist — Kirchenereignisse der Kette laufen nach Vargs Fall weiter (Absicht unklar). Kasimir hat keinen Debug-Eintrag.

### 11.6 Blutkult in Varonheim

- Start in Varonheim nach Audienz oder ab Tag 12 (für Hauptstadt-Starter ab Tag 10 mit Stufe 5). Entführungen 23 Uhr jede 2. Nacht (mit Rangbremse jede 3.), höchstens 8, Wohlstand −2 je Fall. Spuren (Blutzeichen, Zeuge, Wachs) → Anklage; falsch: Valen −3. Rote Krönung ab Stufe 3 oder Tag 45 (+20/+10 Tage), nicht auf Angsthase.
- **Ausgänge:** zerschlagen (Valen +15, Ysmay Kanzlerin, Blutkult-Sense), selbst Blutfürst (Valen +10, Orden −30, täglich 2 Blutphiolen und 30 Gold, Vampirjäger alle 7 Tage), Erpressung 500 Gold, Beweis beim König (Valen +5; ohne Beweis −5).
- Verdächtige Wido, Merle, Albin: Heimat Varonheim, Fraktion Valen — richtig.
- **Fehlversuche:** veralteter Spielertext „Die Enthüllung folgt mit der nächsten Scheibe.“ (`game.js:15229`), obwohl sie eingebaut ist; Ruf unbegrenzt (`game.js:15148–15337`).

### 11.7 Vermisstenwelle, Wolfswinter, Banden, Plünderer, Flüchtlinge

- **Vermisstenwelle (E4):** ab Tag 15, 3 % am Tag, 20 Tage Pause; Opfer um 2 Uhr jede 2. Nacht, höchstens 4; Rettung binnen 5 Tagen: 30 Gold, Wohlstand +3; Auftrag +70 Gold; Scheitern Wohlstand −8. **Fehlversuch:** Kommentar sagt „nie die Kette“, der Code schließt Kettendörfer nicht aus (`game.js:14878` gegen `14893`).
- **Wolfswinter:** siehe 10. Nur Log, **kein Debug**.
- **Banden:** höchstens 3, neue mit 20 % am Tag (4–6 Mann, wächst bis 9 ohne Schutzgeld). Schutzgeld 20 + 8 je Mann (Barmherzige ×0,7) für 5 Tage. Anführer tot: 60 + 10 je Mann Gold, Ruhm +2, **Herr der Bandenstadt +3**, Beutekiste. Debug steht fälschlich im Abschnitt „Bionik“ (`game.js:17011`).
- **Plünderer** in gesetzlosen Städten: siehe 6.4.
- **Flüchtlinge:** Wellen nach dem Fall der Kette (höchstens 18), aus gefallenen Aurelion-Städten, durch Vertreibung. Drei Flüchtlinge ohne Heimatort (Audit A-05, bekannt).

---

## 12. Geheime Orte (`SECRETS`, `game.js:14953`)

- **Was es ist:** Orte, die auf keiner Karte stehen. Gefunden erscheinen sie im Atlas; Log zählt „Geheimnisse gefunden: n von 8“. Ein Ratgeber-Tipp weist darauf hin.

| Ort | Lage | Auslöser / Rätsel | Gegner | Belohnung / Wahl |
|---|---|---|---|---|
| Glockenmoor | Moorland | nachts bei Nebel/Regen Glocke; Pfähle Taufe → Hochzeit → Tod läuten | falsch: 3 Ertrunkene | Truhe: Glocke von Moorbach (Talisman +3 Rüstung), Pestkapuze, Kettenhemd, 2 Tränke; **Orden +5** |
| Die Verlorenen Hundert | Hundertfeld | Lanze, 1 Stunde graben | Feldherr + 3 Skelette | Feldkiste (Langschwert, Kettenhemd, Trank); Kriegsvorrat: Garnison +8 und Valen +5 / 300 Gold, Kette +5, Valen −5 / Siedlung +20 Eisen, +10 Holz |
| Der Ausbrecherstollen | Steinbruch | 3 Kreidezeichen (Wahrnehmung ≥ 12 oder Goblin in der Gruppe) | Gewölbe Stufe 3, Boss Pferchmeister | Grubenplan: Goblins +10 / 150 Gold, Kette +8, Goblins −20 |
| Der Brunnen der Durstigen | Sandruinen | am Tag nach einem Sandsturm erscheint eine Treppe | 2 Skelette, 3 Räuber | Dornensäbel, Wasserschlauch, Trank; Wasserrecht: Zoll in Karak-Atar entfällt, **Händler +10** / 250 Gold, Händler −10 |
| Die Kammer der Namen | Seelenhügel | Seelenphiole im Gepäck summt | 3 Schatten (Stufe ≥ 20) | Hort (Stufe 4); Willenskraft +n je Ahn (höchstens 3), Tote −5 / 3 Seelenphiolen, Tote +10, Morvaths Bedrohung +4 / nichts |

- **Bedienung:** E an Pfählen, Lanze, Kreide, Treppe; Wahl als Dialogliste. Debug „Geheime Orte: …“.
- **Geprüft:** nur Code gelesen.
- **Fehlversuche:**
  - **Brunnen der Durstigen im Spiel nicht betretbar (nachgelesen).** Die Treppe wird nach einem Sandsturm gesetzt (`secretWell: true`, `game.js:14972`), aber `doInteract` hat keinen Zweig dafür (Glocke, Lanze, Kreide, Kammer: `game.js:5673–5676`); `secretWell()` wird nur im Selbsttest aufgerufen (`game.js:21556`). E an der Treppe tut nichts.
  - **„von 8“ statt „von 5“:** `SECRET_N = 8` (`game.js:14961`), es gibt 5 Orte. Die übrigen drei (Uhrmacher, Leuchtfeuer, Walknocheninsel) stehen in `OFFEN.md` als „Rest“.

---

## 13. Orte mit eigenem Leben

### 13.1 Was jede Stadt mit Stadtplan bekommt

| Dienst | Wo | Stelle |
|---|---|---|
| Anschlagbrett + Verteidigungsmeister (Aufträge, Verteidigung anwerben, Investieren) | jede Stadt/jedes Dorf im Stadtplan außer Vharnholm | `ensureDefenseMasters`, `game.js:8940` |
| Bewohner mit Berufen, Tagesablauf, Bewohner-Aufträge | jede Stadt im Stadtplan | `spawnResidents`, `game.js:1005` |
| Schankpersonal (Magd, Koch, Spielmann), zwei Söldner | nur Städte, **nicht Dörfer** | `ensureTavernStaff` `game.js:8074`, `ensureMercs` `game.js:14202` |
| Kutscher | Städte, nicht Dörfer (außer Aurelion), nicht Vharnholm/Eisenfeste | `coachTown`, `game.js:8091` |
| Wachen | Orte in `GUARD_POSTS` (8) + Aurelion (Automaten) + Varonheim (Königsgarde) | `spawnGuardPosts`, `game.js:748` |
| Stadtfest, Wachstum, Markt | alle außer Vharnholm (Fest) / Aurelheim, Vharnholm, Eisenfeste (Wachstum) | |

- **Fehlversuch (nachgelesen): Varonheim ist im Stadtplan als Dorf markiert** (`village: true`, `world.js:1408`). Folgen in der größten Stadt des Spiels: **keine Kutsche** (`coachTown` `game.js:8091`), **kein Schankpersonal, keine Söldner** (`game.js:8076`, `14204`), obwohl dort Schenken stehen; nur 3 statt 5 Aushänge; Steuereintreiber und Missernte können die Hauptstadt treffen (`villOf`).

### 13.2 Städte und Lager mit eigenem Inhalt

| Ort | Wer ist dort / was gibt es | Fraktion der Leute | Aufträge / Ruf |
|---|---|---|---|
| Eren | Havel, Elena, Tomas, Borin, Mara, Aldric, Jorun; Karawane nach Nordfurt | Valen | q_wolves, q_herbs, q_lila, q_mine, q_greymane; Verträge → Valen |
| Nordfurt | Gerold (Kontor), Brann, Hauke; Tierhändler | Valen | q_kingsiron, q_sandlord; Verträge → Valen |
| Salzhafen | Hafen, Quirin, Nix (Schwarzmarkt), Kapitän des Salzbunds, Fähre, Kerker mit Mo und Rask, Hehler | Valen | q_pelts, q_rask, q_gilde |
| Kreuzweg | Serafine, Lioba, Tierhändler, Söldner | Händler | q_hundred_song |
| Aschfurt | Kernburg, Karawanenhof | Händler (Kriegsgraph: Valen!) | Verträge → Händler |
| Sonnwacht | Ilva, Aldis | Orden | q_monk, Zauber |
| Varonheim | Hof (6.2), Burgfrieden, Katakomben, Gildenviertel, Armenviertel | Valen | Königsaufträge, Blutkult, Startaufträge |
| Weidenau | Sensenwehr (4 Mann), Sensenschmiedin Walburga | Valen | – |
| Mühlbach | Pferdezüchter Hadubrand (Koppel) | Valen | – |
| Lichtenrain | Schwester Adela | Orden | – |
| Grauwasser, Hohlstein, Eisenried | Tributdörfer, Ketzerjagd | Kette | Verträge → Kette (siehe 2.4) |
| Eisenfeste | Varg, Rotgarde, Drillmeister Harrik, Zuchtmeister Grot, Sklavenhändler Vesk, Schreiberin Edda, Waffenschmied Gerlach, Quartiermeister Bodo, Feldscherin Maren, Kettenpriester, Irmgard, Hochpaladin, Omega-Altar; Appell, Drill, Auspeitschung (17 Uhr), Sklavenmarkt | Kette | q_pferch; Kettenverträge → Kette (behoben 02.10.); nach dem Fall Wahl des neuen Herrn (Goblins / Valen / Flüchtlinge) |
| Steinbruch | Gefangene, Kettenwachen, Schuldknechtschaft der Kette, Ausbrecherstollen | Kette | – |
| Grubenhort | vor dem Fall: Gegner/Goblins; nach Vargs Fall: Goblindorf (Grisk, Nibbel, Krak, Sill, Morr), wächst in 5 Stufen; nach Aufstand: Freie Siedlung (Ranna, Tobbe) | Goblins / Freie | q_grisk_*; Verträge der Freien → Freie |
| Morrgrund | 8 Goblins (+6 nach Vargs Fall), Dodon | Goblins (Heimat `morrgrund`) | g_dod1–3; **Verbinden gibt Valen-Ruf** (2.4) |
| Karak-Atar | Yusuf (Basar), Leyla (Wasser), Amina (Sternenritual), Zöllner (15 Gold, nach Karrak 8, mit Wasserrecht 0), Sandreiter, Weberin, Töpferin, Kamelhirte; nach Karraks Tod Farid | keine | **keine Aufträge, kein Ruf**; Zoll verweigern: Basar +30 %/−20 % |
| Dünenwacht | Posten der Sandreiter (seit 03.10. abends): vier Sandreiter des Wüstenbunds, Brett; die Wüstenräuber des Wasserrecht-Geheimnisses bleiben Räuber | Wüstenbund | wie Karak-Atar |
| Tiefhall / Zwergenstadt | Durgrim, Hilda (Königseisen, Zwergenaxt, Runenhammer), Balin, Orm, Wachen, Bergleute | keine | „Freund der Halle“: Wächter erschlagen oder 3 Barren; keine Aufträge |
| Schwarze Feste | Hof der Stillen Schar: Veyl, Ossara (Seelen), Grimbart (Knochenwaffen), Mutter Asch (Seelenopfer: Totensegen, Tote +3); nach Garmadon Belagerung durch Valen (Marschallin Ortrun) | Tote | Handel nur mit Rang/Pakt |
| Vharnholm | Sael, Totenberufe, Seelenobelisk; keine Verträge | Tote | q_graverobbers, dk_1–3, Überfälle (P20) |
| Turm des Nachtglases | Ilvar, Tuvi, 10 Ebenen | Tote | Vertrauen, Nachtglas |
| Tangkron | Salzbund (Handelsherrin), Sturmklinge (Erste Maat), Kapitäne, Weißbart | Seevolk | q_salz1–3, q_klinge1–2, q_wb_nebel |
| Aurelheim | Palast, Markthalle (Juwelier, Rüstmeisterin, Magitech-Ingenieurin), Akademie (Corvinus), Passamt, Kanzlei, Häuser, Teleportkreis, Luftmast | Aurelion | q_intrige, q_ratssitz, Akademie |
| Kupferhafen | Werft (Meister Holm, Schiff halber Reparaturpreis), Luftschiffhafen, Fähre, Messingross | Aurelion | – |
| Gelenkhall | Prothesenstadt, Werkbank (Fenster), Meisterin Vessa (Wartung 40 Gold) | Aurelion (Haus Kessmark) | – |
| Tickmar | Fabrik, Schuldknechtschaft, Vogt Kessler, Uhrwerkhalle; Streik/Arbeiterrat | Aurelion (Haus Vantor) | Arbeiterrat-Verträge → Aurelion |
| Sankt Serin | Tempel, Hospitäler, Mutter Aveline (Segen 10 Gold) | Aurelion (Haus Solandre) | – |
| Himmelsinsel | Kaiserin Aurelia, Corvan, Orakel, Magierkönig Theron, Sonnenlegion, Gericht, Rat | Aurelion | q_ratssitz |

- **Lücken:** ~~Karak-Atar, Dünenwacht und die Zwerge haben keine eigene Fraktion~~ (behoben 03.10.: Wüstenbund, Zwerge; eigene Kerker seit 03.10. abends). Verbrechen in der Wildnis fallen keiner Macht zu (`crimeFaction` gibt dort null).

---

## 14. Zusammenfassung Fehlversuche

Nach Schwere sortiert. „Bekannt“ = steht schon in `OFFEN.md` oder `hunt/BERICHT.md`. Alles nur im Code geprüft.

### Hoch (Spieler verliert Inhalt oder bekommt falschen Lohn)

| # | Befund | Datei:Zeile |
|---|---|---|
| A-01 | Tributdörfer (Grauwasser, Hohlstein, Eisenried) bleiben nach Vargs Fall „Kette“: Kette steht auf −100 → Bretter und Bewohner-Aufträge für immer zu; der Verteidigungsmeister gibt weiter Aufträge, deren Ruf an die zerschlagene Kette geht. Erwartet: Valen/Dorf; tatsächlich: Kette. | `world.js:572–574`, `world.js:1906`, `game.js:7473`, `game.js:7751–7753`, `game.js:7857`, `game.js:11023` |
| A-02 | Händler (Gerold) und Rooks Bande: Beitritt nie möglich, ihre Ranglinien sind tot (`S.ranks.merch/bandit` nie −1). | `game.js:2126`, `state.js:63`, `game.js:13033`, `game.js:14181` |
| A-03 | Varonheim als Dorf markiert: keine Kutsche, kein Schankpersonal, keine Söldner, nur 3 Aushänge; Steuereintreiber/Missernte treffen die Hauptstadt. | `world.js:1408`, `game.js:8091`, `game.js:8076`, `game.js:14204`, `game.js:7576` |
| A-04 | Brunnen der Durstigen nicht betretbar (kein Interaktionszweig für `secretWell`). | `game.js:14972`, `game.js:5673–5676`, `game.js:15026` |
| A-05 | Morrgrund: Goblins verbinden/aufrichten gibt Valen +3 statt Grubenstämme. | `game.js:8401`, `game.js:637`, `game.js:7473` |
| A-06 | Ruf ohne Grenze an vielen Stellen (Aufträge, Verträge, Kette, Aurelion, Kelch, Goblins +200) → Ruf > 100, Aurelion-Rang 7 ohne Ratssitz. Bekannt als IH-16, hier mit Ort. | `game.js:13574`, `game.js:7670`, `game.js:11020`, `game.js:13166`, Liste in 3.2 |
| A-07 | Waffe für immer weg nach Kerker-Ausbruch und Flucht aus der Schuldknechtschaft. | `game.js:9075`, `game.js:7163` |
| A-08 | Möglicher Absturz beim Hexenprozess (Startprüfung und Opferwahl unterschiedlich). | `game.js:11548–11550` |

### Mittel (falsch zugeordnet, widersprüchlich, halb fertig)

| # | Befund | Datei:Zeile |
|---|---|---|
| A-09 | Sonnwacht (Orden), Kreuzweg/Aschfurt (Händler) gehören nach Befreiung bzw. Eroberung im Kriegsgraphen Valen; Aschfurt schon am Start. | `sim.js:616`, `sim.js:394`, `game.js:10699`, `data.js` `WAR_NODES` |
| A-10 | ~~Verbrechen an Leuten ohne Fraktion → Kopfgeld bei Valen, überall.~~ Teilweise behoben 03.10.: Karak-Atar und Zwerge haben Fraktionen; in der Wildnis gibt es kein Kopfgeld (null); nur Innenkarten und Reisende ohne Heimat fallen noch an Valen. | `game.js:5822`, `game.js:8866`, `game.js:9215` |
| A-11 | Tributdörfer vor dem Fall: Hilfe (Verbinden, Seuche, Aufträge) gibt Ruf bei der Kette, nicht beim Dorf. Entscheidung nötig. | `game.js:637`, `game.js:11598`, `game.js:7670` |
| A-12 | Aurelion-Rang 7 ohne Ratssitz (Ruf 100 oder Heirat + 90); Rangführer sagt anderes. | `game.js:13166`, `game.js:14122` |
| A-13 | Schuldknecht in Aurelion zählt als Schein-Inhaber (Rang 1, Bionik Stufe 2). | `game.js:7048` |
| A-14 | Seevolk-Ränge 0, 2, 4 nie vergeben; Legendenname passt nicht zum Rang (bekannt). | `game.js:14124`, `game.js:8662` |
| A-15 | Untoten-Rang durch wiederholtes Knien vor Garmadon ohne Ruf und Aufträge bis Rang 3. | `game.js:10022–10026` |
| A-16 | Jedes Ansprechen des Königs mit Aurelion-Ruf ≥ 25 kostet erneut Valen −3. | `game.js:9820` |
| A-17 | Diebesgilde endet nach einem Satz (`S.flags.gilde` nie gelesen). | `game.js:9009` |
| A-18 | Ratsbeschluss „Legion heim“ ohne Wirkung. | `game.js:10835` |
| A-19 | Jahr (60 Tage) und Jahreszeiten (28 Tage) laufen auseinander. | `state.js:100`, `state.js:103` |
| A-20 | „Geheimnisse gefunden: n von 8“ — es gibt 5. | `game.js:14961` |
| A-21 | Kreuzzug zählt als mitgezogen, ohne dabei zu sein. | `game.js:10445`, `game.js:10459` |
| A-22 | Schatzkarawane: kein „selbst ausrauben“, Abwesenheit gibt Bande +2. | `game.js:11581` |
| A-23 | Luftschiffabsturz: Belohnung schon beim Ansprechen, nicht nach Wahl. | `game.js:11636` |
| A-24 | `provoke`: Ruf bei `target.faction`, Kopfgeld bei `crimeFaction` — Bürger ohne Fraktion kosten keinen Ruf. | `game.js:5363`, `game.js:5370` |
| A-25 | Feldzüge der Kette und Tribut ohne Wirkung auf Kriegsgraph und Wirtschaft (Tribut verschwindet). | `game.js:6567`, `game.js:6482` |
| A-26 | Feldschlachten und Befreiungen geben keinen Ruf (nur Titel). Entscheidung. | `sim.js:577–586`, `sim.js:617` |
| A-27 | Luftreise: bei schlechtem Wetter nie Motorschaden. | `game.js:8324` |
| A-28 | `t.bought` uneinheitlich; Handelswagen verkauft in besetzten/zerstörten Städten. | `game.js:14334`, `economy.js:341`, `economy.js:366` |
| A-29 | Kirchenereignisse der Kette laufen nach Vargs Fall weiter (keine Prüfung). | `game.js:10364` |
| A-30 | Vermisstenwelle schließt Kettendörfer entgegen dem Kommentar nicht aus. | `game.js:14878`, `game.js:14893` |

### Niedrig (Text, Debug, kleine Lücken)

| # | Befund | Datei:Zeile |
|---|---|---|
| A-31 | q_pelts (Quirin, Händler) und q_hundred_song (Lioba, Händlerin) geben keinen Fraktionsruf. | `data.js:1619`, `data.js:1622` |
| A-32 | Begegnungen „Hungernde Mutter“ / „Deserteur“ zählen überall für Valen/Orden. | `game.js:2974`, `game.js:2982–2984` |
| A-33 | Arbeiterrat und Stadtverträge Aurelions geben nur „Aurelion“, nie Hausgunst. Entscheidung. | `game.js:12178`, `game.js:7670` |
| A-34 | ~~Karak-Atar, Dünenwacht, Zwerge: keine Fraktion, keine Aufträge.~~ **Behoben 03.10.:** Fraktionen „Der Wüstenbund“ (`wuest`) und „Die Zwerge der Tiefhall“ (`zwerge`) mit Ruf, Brett, Beitritt, Rängen und Kopfgeld (siehe 3.1, 2.2). | `data.js` FACTIONS, `game.js` FAC_CON / ensureNewFactions / ensureDesertBoards / buildDwarfCity |
| A-35 | Kerkerwärter immer Valen; ein Kerker für alle Städte; Mo/Rask nur bei Haft in Salzhafen. | `game.js:8982`, `game.js:8986` |
| A-36 | Befreite Menschen der Eisenfeste ziehen nach Sonnwacht statt nach Hause. | `game.js:11031` |
| A-37 | Fehlende Debug-Einträge: Steuereintreiber, Missernte, Pilgerüberfall, 7 kleine Meldungen, Wolfswinter, Stadtfest, Kasimir; Banden/Goblins im Abschnitt „Bionik“. | `game.js:11640–11650`, `game.js:17011` |
| A-38 | Stilles Ende: Heuschrecken, Luftschiffabsturz, Gildenstreik, Erbstreit. | `game.js:11574`, `game.js:7296` |
| A-39 | Tote Zweige: `WX.heat.food`, `sunOn` „heat“, Regen gegen Hausbrand, `S.gold += 0`, `buildVaronburgOld`, `HIGH_RANK[victim.key]`, `e.bondKind`. | `game.js:2484`, `game.js:14758`, `game.js:8720`, `game.js:10835`, `game.js:9768`, `game.js:4146`, `game.js:10832` |
| A-40 | Veraltete Texte/Kommentare: „Enthüllung folgt mit der nächsten Scheibe“, „+25/+75, ein Tag Kerker“, „5 von 9“, „alle acht“. | `game.js:15229`, `game.js:5819`, `game.js:10776`, `game.js:11486` |
| A-41 | Fast alle Dienste dieses Bereichs sind Dialoglisten statt Fenster: Kontor, Wagen, Betriebe kaufen, Lieferaufträge, Investieren, Schwarzmarkt, Hafen/Werft, Seehandel, Verteidigung anwerben, Tribut, Feldzug, Passamt, Kanzlei, Häuser, Rat, Gericht, Burgtor, König, Kerker, Schuldknechtschaft, Teleportkreis. Mit Fenster: Handel, Kutsche/Fähre, Betriebskasse, Gelenkhall-Werkbank, Schloss-Minispiel. | siehe Abschnitte 4–9 |

### Behoben (zur Einordnung)

- Eisenfeste-Verträge zählen seit 02.10. für die Kette (`game.js:7471–7473`).
- HB-05, HB-08, HB-09, HB-11, HB-12, HB-23 aus diesem Bereich sind laut `hunt/BERICHT.md` behoben; der Code an den genannten Stellen passt dazu (nachgelesen: `game.js:7594`, `7604`, `7722–7723`, `11021`, `13169`).


---

<!-- Teil B aus ist/B_auftraege.md -->

# Ist-Zustand B — Aufträge aller Art (Stand 03.10.2026)

Bereich B des detaillierten Ist-Zustands: feste Aufträge (`QUESTS` in `src/data.js`), die aus `RANK_LINES` erzeugten Rangaufträge, Klassen-Prüfungen, Verträge (`CON`) mit Lohnformeln, Gerüchte, Gefährten- und Königsaufträge, emergente Aufträge E1–E4 und Geheime Orte.
Grundlage: `docs/IST_ZUSTAND.md` §2.13 (übernommen, korrigiert, vertieft), `docs/MECHANIKEN.md`, `ROTFALL_STATE/OFFEN.md`, `ROTFALL_STATE/hunt/BERICHT.md`, Code-Stand vom 03.10. vormittags. Andere Agenten bearbeiten `game.js` parallel; Zeilennummern können sich um einige Zeilen verschieben, deshalb steht immer der Funktionsname dabei.

## Inhalt

0. [So wurde geprüft](#0-so-wurde-geprüft)
1. [Grundregeln für alle festen Aufträge](#1-grundregeln-für-alle-festen-aufträge)
2. [Gesamttabelle: alle festen Aufträge mit Messergebnis](#2-gesamttabelle-alle-festen-aufträge-mit-messergebnis)
3. [Feste Aufträge im Einzelnen](#3-feste-aufträge-im-einzelnen)
   - 3.1 Eren · 3.2 Orden und Paladin · 3.3 Die Toten · 3.4 Valen · 3.5 Händler · 3.6 Rooks Bande · 3.7 Bardin Lioba · 3.8 Titelklassen über Pakt (Druide, Mönch, Nekromant/Hexenmeister) · 3.9 Klassen-Questreihen (Rüstungsteile) · 3.10 Todesritter · 3.11 Klassen-Prüfungen (kt_*) · 3.12 Dodon und der Pakt des Sturms · 3.13 Grisk (nach der Befreiung) · 3.14 Kette: Tribut, Pferche, Entlaufene · 3.15 Seevolk · 3.16 Aurelion: Intrige, Bürgerrecht, Ratssitz · 3.17 Kerker von Salzhafen: Gilde und Rask · 3.18 Rotfall und Omega · 3.19 Anomalie · 3.20 Überfälle und Heere der Toten · 3.21 Rangaufträge (RANK_LINES) · 3.22 König Varon · 3.23 Blutkult · 3.24 Ahnenfeind
4. [Verträge (Anschlagbrett, Wache, Bewohner)](#4-verträge-anschlagbrett-wache-bewohner)
5. [Gerüchte, Gefährten-, Königs- und Sonderaufträge](#5-gerüchte-gefährten-königs-und-sonderaufträge)
6. [Emergente Aufträge E1–E4](#6-emergente-aufträge-e1e4)
7. [Geheime Orte](#7-geheime-orte)
8. [Zusammenfassung Fehlversuche](#8-zusammenfassung-fehlversuche)

---

## 0. So wurde geprüft

- **Browser:** eigener Tab im Spiel-Browser (Dev-Server `localhost:8770`, `?dev`), Spielstand vorher aus `rotfall.backup.s14c` wiederhergestellt, `RF.S._quiet = true` (es wird weder gespeichert noch geloggt), danach Backup erneut zurückgeschrieben und Tab geschlossen. Der echte Spielstand wurde nicht verändert. Held „Ragnar“, Stufe 12, Tag 4.
- **Prüfgerät:** Für jeden festen Auftrag mit Geber habe ich im laufenden Spiel den Auftrag aktiv gesetzt, die Ziele erfüllt (Gegenstände echt ins Gepäck gelegt), den Geber über das echte Gespräch (`RF.talk`) angesprochen und den echten Knopf „Erledigt. (…)“ angeklickt. Vorher/nachher wurden Gold, Erfahrung, `S.factions` (Ruf), `S.ranks`, Gepäck, Rohstoffe, Beziehungen, Titel und Klassen verglichen. Das heißt: Belohnungen in Abschnitt 2 sind **gemessen**, nicht abgeschrieben.
- **Verträge:** je Art einen echten Vertrag mit `makeContract` erzeugt, mit `acceptContract` angenommen, Ziel als erfüllt markiert und über das echte Gespräch beim Verteidigungsmeister abgegeben; zusätzlich in **jeder** Stadt mit Verteidigungsmeister und in der Eisenfeste (Kettenwache) gemessen, **welche Fraktion** den Ruf bekommt.
- Was nur im Code gelesen wurde, steht unter „Geprüft“ ausdrücklich als „nur Code gelesen“.
- Erfahrung ist ohne Boni gemessen (kein „Ausgeschlafen“ +10 %, kein Trank der Lehre).

---

## 1. Grundregeln für alle festen Aufträge

### Annahme, Fortschritt, Abgabe

- **Was es ist:** Feste Aufträge haben einen benannten Geber (z. B. Havel) oder einen Beruf als Geber (Seevolk-Clans, Kettenwache). Man bekommt sie im Gespräch („Was liegt an? (Name)“), erledigt die Ziele und gibt beim Geber ab („Erledigt. (Name)“).
- **Wo / Wer:** Geber stehen in `QUESTS[k].giver` (NPC-Schlüssel) bzw. `giverProf` + `giverMap`. Ob ein Auftrag angeboten wird, entscheidet `questAvailable` (game.js, Abschnitt „Quests“).
- **Ablauf:**
  1. Annahme: `offerQuest` zeigt den Auftragsbrief (Ziel-Piktogramme und Lohnart), „Ich mache es.“ startet `startQuest`. Was schon erledigt ist, zählt sofort: Gegenstände im Gepäck, ein bereits erlegter Regionalboss oder Hrodvar.
  2. Fortschritt: Tötungen zählen über `onKill` (auch Abarten einer Grundart, auch Tötungen durch Gefährten fern vom Helden), Gegenstände über `onItemGained`/`questComplete` (zählt das **Gepäck**, auch Gekauftes), Ausweichen über `evaded` (seit HB-06 für alle Aufträge mit Ausweich-Ziel).
  3. Abgabe: `turnIn` zahlt Gold, Erfahrung, Ruf, Beziehung, zieht Abgabe-Gegenstände ab (`take`), gibt Belohnungsgegenstand, Rang, Klasse. Zusätzlich: Beziehung zum Geber +8, Ruhm +2 in der Region.
- **Belohnung / Folgen:** wie in der Tabelle. Koop: Auftragsgold wird mit Koop-Gästen geteilt (`questGold`).
- **Bedienung:** Auftragsbuch (Taste J, Pergament-Fenster), Tracker am Bildrand (verfolgter Auftrag groß, bis 3 weitere klein), Kompass, Kartenpunkte, Siegel über Gebern (Angebot/Abgabe, `giverMark`), Brief „Angenommen/Erfüllt/Zerrissen“. Debug: Abschnitt „Aufträge“ (Starten, Abschließen, Abbrechen …).
- **Geprüft:** live, siehe Abschnitt 2.
- **Fehlversuche / Lücken:**
  - **Volles Gepäck verschluckt Belohnungsgegenstände** (live bestätigt): `turnIn` ruft `addItem` auf und meldet „Erhalten: …“ ohne Rückgabewert-Prüfung (game.js `turnIn`, Zeile ≈13584). Repro: Gepäck bis `invCap` füllen, Graumähne bei Tomas abgeben → 110 Gold, 180 EP, Valen +5, aber **kein Langbogen**, nichts am Boden; gleiches bei Königseisen (Frostklinge weg). Betrifft jeden Auftrag mit `reward.item` (Langbogen, Frostklinge, Flegel, alle Klassen-Rüstungsteile, Todesritter-Teile, Salzsiegel, Entermesser, Dreispitz, Talisman, Trank) und den Kronhelm von König Varon. `rotfallDone` macht es richtig (legt ab, wenn voll).
  - **Ruf ohne Grenze:** `turnIn` und `finishLila` addieren Ruf ohne `clamp` (`S.factions[f] += v`, Zeile ≈13581 und ≈13674); auch `claimContract` und `runawayEnd`. Andere Stellen klemmen auf −100…100 (oder −100…300 bei Goblins). Ruf kann so über 100 steigen (bekannt als IH-16).
  - **Stirbt ein benannter Geber, bleibt sein Auftrag für immer offen** (nur Code gelesen): Abgabe hängt am lebenden NPC mit genau diesem Schlüssel, es gibt keinen Ersatz-Abgabeweg (Hunt-Sammelbefund, weiter offen). Verträge regeln das (`conTick`: „hinfällig“).
  - **Jeder Auftrag ist abbrechbar** — es gibt kein `main`-Kennzeichen in den Daten (`questInfo`: `cancel = !!C || !QUESTS[k]?.main`). Abbruch löscht den Eintrag; der Geber bietet ihn wieder an. Für Sonderaufträge hat das Nebenwirkungen (siehe jeweilige Abschnitte: Tribut, Omega).
  - **Debug „Abschließen“** setzt nur `state = 'done'`, zahlt aber keine Belohnung (zum Testen irreführend; „Verfolgten Auftrag abschließen“ zahlt richtig über `turnIn`).
  - Doppelt abgeben: **nicht möglich** (live geprüft: `turnIn` und `claimContract` prüfen den Zustand; behoben seit S15).

---

## 2. Gesamttabelle: alle festen Aufträge mit Messergebnis

Legende Prüfung: **✔** = live abgegeben, Lohn wie in den Daten angekommen · **✘** = live: nicht abschließbar / Lohn fehlt · **C** = nur Code gelesen.
„Bez.“ = Beziehung zum Geber (gemessen +8 bis +9 aus der Abgabe, dazu `rel` aus den Daten).

| Schlüssel | Name | Geber (Ort) | Ziele | Lohn laut Daten | Gemessen | Prüfung |
|---|---|---|---|---|---|---|
| q_wolves | Wölfe an der Hürde | Havel (Eren) | 3 Wölfe | 60 G, 40 EP, Valen +5 | 60 G, 40 EP, Valen +5 | ✔ |
| q_herbs | Elenas Kräuter | Elena (Eren) | 3 Heilkraut | 15 G, 30 EP, Orden +6, Elena +20 | genau so (Kraut wird **nicht** abgezogen) | ✔ |
| q_lila | Die vermisste Tochter | Jorun (Eren) | Lila finden | 2 Enden (siehe 3.1) | — | C |
| q_mine | Was in der Grube haust | Mara (Eren) | Gorak töten | 140 G, 150 EP, Händler +10, Valen +4 | genau so | ✔ |
| q_greymane | Graumähne | Tomas (Eren) | Graumähne (Alpha) | 110 G, 180 EP, Valen +5, Langbogen, Tomas +15 | genau so; bei vollem Gepäck **ohne Langbogen** | ✔/✘ |
| q_paladin1 | Prüfung: Wachsamkeit | Kelan (Schrein) | 4 Skelette | 80 EP, Orden +10 | genau so | ✔ |
| q_paladin2 | Prüfung: Das Siegel | Kelan | Siegel des Ordens | 110 EP, Orden +12 | genau so; **angelegtes Siegel zählt nicht** | ✔/✘ |
| q_paladin3 | Prüfung: Der Schrein | Kelan | Schrein halten | 200 EP, Orden +20, Klasse Paladin | genau so + Paladin freigeschaltet | ✔ |
| q_undead | Das Grabsiegel | Morvath (Friedhof) | Grabsiegel | 120 EP, Tote +25, Orden −10 | genau so (Siegel wird nicht abgezogen) | ✔ |
| q_graverobbers | Grabräuber in der Asche | Sael (Vharnholm) | 5 Banditen | 90 G, 140 EP, Tote +15, Valen −5 | genau so | ✔ |
| q_pact | Der Pakt der Stillen Schar | Ysra (Alt-Vharn) / Vhal | Ahnenurne | 200 EP, Titel Nekromant oder Hexenmeister | 200 EP, Urne weg, Titel Nekromant; Titel-Ruf Valen −10, Orden −30, Tote +20 | ✔ |
| q_frontier | Die Zahl der Toten | Oda (Grenzwacht) | Späherbericht + 5 Skelette | 80 G, 160 EP, Valen +8 | genau so, Bericht abgezogen | ✔ |
| q_kingsiron | Königseisen | Brann (Nordfurt) | Hrodvar + Königseisen | 80 G, 260 EP, Valen +6, Frostklinge | genau so; bei vollem Gepäck **ohne Frostklinge** | ✔/✘ |
| q_sandlord | Die Straße nach Aschfurt | Gerold (Nordfurt) | Karrak | 220 G, 260 EP, Händler +12, Flegel | genau so | ✔ |
| q_pelts | Felle für den Hafen | Quirin (Salzhafen) | 3 Wolfsfelle | 60 G, 70 EP, Heiltrank | genau so, **kein Ruf** | ✔ |
| q_hundred_song | Ein Lied für die Toten | Lioba | 3 Wiedergänger | 90 G, 150 EP, Lioba +15 | genau so, **kein Ruf** | ✔ |
| q_rook | Rooks Angebot | Rook (Banditenlager) | 2 Rivalen (Banditen) | 120 G, 90 EP, Bande +25, Valen −20 | genau so | ✔ |
| q_grove | Der Ruf des Hains | Mira (Hain) | 4 Wölfe + 3 Heilkraut | 150 EP, Titel Druide | 150 EP, Kraut weg, Druide; Titel-Ruf Orden +5 | ✔ |
| q_monk | Die Probe der Stillen Hand | Ilva (Sonnwacht) | 10× Ausweichen + 4 Skelette | 180 EP, Titel Mönch | 180 EP, Mönch; **halbes Gold weg** (Gelübde), Orden +20, Bande −30 | ✔ |
| c_nec1–3 | Totenrufer-Reihe | Ysra | 6 Skelette + 3 Knochen / Wächter der Nekropole + 2 Phiolen / Hauptmann der Toten + Grabsiegel | 220/320/450 EP, Kapuze/Gewand/Kragen | genau so, **kein Ruf** | ✔ |
| c_war1–3 | Hexenmeister-Reihe | Vhal (Turm) | 4 Kultisten + 2 Phiolen / 5 Geister / Aschdämon | 220/320/450 EP, Hörnerkrone/Robe/Schattenmantel | genau so, **kein Ruf** | ✔ |
| c_dru1–3 | Druiden-Reihe | Mira | 5 Wölfe + 5 Felle / 2 Bären + 4 Kraut / 3 Knochenhunde | 220/320/450 EP, Hainfell/Fellmantel/Geweih | genau so, **kein Ruf** | ✔ |
| c_mon1–3 | Mönchs-Reihe | Ilva | 20× Ausweichen / 6 Banditen + 15× / 30× + Hauptmann | 220/320/450 EP, Gebetsband/Robe/Wickel | genau so, **kein Ruf** | ✔ |
| dk_1–3 | Todesritter-Reihe | Sael | 3 Kopfgeldjäger + 3 Knochen / 2 Automaten + 2 Phiolen / eidbrüchiger Todesritter | 260/360/500 EP, Helm/Harnisch/Mantel | genau so, **kein Ruf** | ✔ |
| kt_* (21) | Klassen-Prüfungen | jeder Lehrer der Klasse | siehe 3.11 | 80 bzw. 110/120 EP, Klasse | genau so (bei Rook nur über „Ausbilden“) | ✔ |
| g_dod1 | Brot für Morrgrund | Dodon (Morrgrund) | 6 Brot + 3 Kettenknechte | 220 EP, Goblins +15 | genau so | ✔ |
| g_dod2 | Eisen für die Grubenstämme | Dodon | **8 Eisen** + 2 Rotgardisten | 320 EP, Goblins +20, Talisman | **nie abschließbar**: Eisen geht in den Rohstoffvorrat, nicht ins Gepäck | ✘ |
| g_dod3 | Der letzte Sturm | Dodon | 4 Kettenschützen | 400 EP, Goblins +25, Pakt des Sturms | genau so (nur erreichbar, wenn g_dod2 erledigt ist) | ✔ (blockiert durch g_dod2) |
| q_grisk_lost | Verschleppte | Grisk (Grubenhort) | 3 Goblins befreien | 60 G, 120 EP, Goblins +15 | Grisk existiert nur nach Befreiung — im Testsave nicht da | C |
| q_grisk_rache | Die letzten Glieder | Grisk | 4 Kettenreste | 90 G, 160 EP, Goblins +15, Kette −10 | — | C |
| q_grisk_build | Ein Dorf für die Freien | Grisk | 30 Holz + 15 Stein | 100 EP, Goblins +20 | — | C |
| q_pferch | Die Pferche öffnen | Bruni (Pferch, Eisenfeste) | Pferchschlüssel + nachts öffnen | 180 EP, Goblins +10, Kette −15 | Code: Ruf zahlt `openPen` selbst, EP extra | C |
| q_tribut | Geraubter Tribut | entsteht beim Überfall | behalten oder zurückbringen | zurück: 60 EP, Dorfruf +20 | — | C |
| q_runaway | Entlaufene | Tributoffizier (Eisenfeste) | Entlaufenen stellen | zurück: 25 G, 40 EP, Kette +8 · laufen lassen: 40 EP (30 %: Kette −10) | — | C |
| q_salz1 | Freibeuter vor Netzbucht | Ysolde (Gischtinseln) | 4 Schwarzsegel | 120 G, 160 EP, Seevolk +8 | genau so | ✔ |
| q_salz2 | Salz für den Bund | Ysolde | 4 Salz | 160 G, 180 EP, Seevolk +10, Salzsiegel, Seite Salzbund, Rang 1 | genau so | ✔ |
| q_salz3 | Frieden oder Anker | Ysolde | Weißbart besiegen oder Frieden | 400 G, 600 EP, Seevolk +20, Rang 3 | genau so | ✔ |
| q_klinge1 | Die Grube | Hella (Gischtinseln) | 3 Grubenkämpfer | 80 G, 160 EP, Seevolk +8 | genau so | ✔ |
| q_klinge2 | Beute für die Sturmklinge | Hella | 3 Tuchballen | 140 G, 180 EP, Seevolk +10, Entermesser, Seite Sturmklinge, Rang 1 | genau so | ✔ |
| q_wb_nebel | Die Schwarzsegel-Kapitänin | Weißbart | Morra Schwarzsegel | 350 G, 550 EP, Seevolk +20, Dreispitz, Rang 3, Legende | — | C |
| q_intrige | Heikle Angelegenheit | ein Adelshaus Aurelions | Brief rauben oder Verwalter töten | 120 G, Haus +20, Gegnerhaus −25 | — (kein EP, kein Aurelion-Ruf) | C |
| q_gilde | Das rote Tuch | Mo (Kerker Salzhafen) | Mann am Hafen | 60 G, 80 EP, Dietrich | — | C |
| q_ratssitz | Eine Stimme im Rat | Adelshaus (Gunst ≥ 60) | 3 Häuser Gunst ≥ 30, 500 G bei Corvan | **600 EP** | −500 G, Ratssitz, Rang Aurelion; **0 EP** | ✘ |
| q_rask | Rasks Versteck | Rask (Kerker Salzhafen) | Kiste an der Küste | 150 G, Heiltrank, 100 EP | — | C |
| q_rotfall | Die Spur des Rotfalls | Spuren sammeln | 9 Bruchstücke | 400 EP, Klinge „Rotfall“ | seit HB-10-Fix: zahlt (`rotfallDone`) | C |
| q_omega | Der Ruf nach Omega | Varg | Ritual am Altar | **1000 EP** | Ritual läuft, **0 EP** | ✘ |
| q_anomaly | Riss im Gewebe | Weltereignis | Schutzzauber im Zentrum | 120 G, 150 EP, Aurelion +4, Orden +4 | — | C |
| q_undraid | Überfall der Toten | Sael (Tote) | Dorf einnehmen | kein Lohn in den Daten | — | C |
| q_undarmy | Ein Heer der Toten | Kriegskarte | Stadt fällt | kein Lohn in den Daten | — | C |
| r_* (40) | Rangaufträge | Gerold, Rook, Oda, Kelan, Morvath, Kettenwache | siehe 3.21 | 60/110/160/210/260 G, 80/150/220/290/360 EP, Fraktion +5, beim b-Teil Beförderung | alle 40 genau so, Ruf jeweils bei der **richtigen** Fraktion | ✔ |

**Ruf-Bilanz der festen Aufträge (Wunsch des Entwicklers):** Alle Aufträge mit Ruf in den Daten zahlen ihn live bei der richtigen Fraktion aus. Ganz **ohne Fraktionsruf** sind: q_pelts, q_hundred_song, alle 12 Klassen-Questreihen (c_*), die Todesritter-Reihe (dk_*), die Klassen-Prüfungen (kt_*), q_gilde, q_rask, q_ratssitz, q_rotfall, q_omega, q_intrige (nur Hausgunst). Bei Ysra, Vhal und Sael (Tote) und Ilva (Orden) wäre Ruf naheliegend — das ist eine Designfrage, kein Absturz ([E]).

---

## 3. Feste Aufträge im Einzelnen

### 3.1 Eren: Wölfe, Kräuter, Lila, Grube, Graumähne

- **Was es ist:** Die ersten Aufträge rund um das Startdorf Eren. Kleine Jagd- und Sammelaufträge, dazu eine Geschichte mit zwei Enden (Lila) und zwei Bosse (Gorak in der Grube, Graumähne in der Wolfsschlucht).
- **Wo / Wer:** Havel (Wölfe), Elena (Kräuter), Jorun (Lila), Mara (Gorak), Tomas (Graumähne). Kein Vorbedingung außer bei keinem.
- **Ablauf:**
  - Wölfe: 3 Wölfe am Waldrand töten → bei Havel abgeben.
  - Kräuter: 3 Heilkraut im Gepäck → bei Elena abgeben. Das Kraut wird **nicht** abgezogen (kein `take`) — man behält es.
  - Lila: Lila steht im Banditenlager. Kommt man ihr auf 120 px nahe, gilt sie als gefunden (`questCheck`). Bei Jorun „Über deine Tochter …“ (`lilaOutcome`): *Wahrheit* („Sie ist freiwillig gegangen“) → 60 EP, Valen +2, Jorun −5, Lila wird anwerbbar (Beziehung +20). *Versprechen* („Banditen halten sie“) → 40 EP, Lila kehrt nach Eren zurück, Jorun +25.
  - Gorak: Boss der alten Grube. Ist er schon tot, wenn man den Auftrag annimmt, zählt das sofort nur für Regionalbosse — Gorak ist einmalig (siehe Lücken).
  - Graumähne: Leitwolf der Wolfsschlucht (Regionalboss, Flag-basiert: zählt rückwirkend).
- **Gegner:** Wölfe, Gorak (Grubenboss), Graumähne (Alpha, 170 Leben laut IST, Rudelruf).
- **Belohnung / Folgen:** siehe Tabelle. Graumähne gibt zusätzlich einen Langbogen.
- **Bedienung:** Dialogliste + Auftragsbrief; Kartenpunkte für Gorak/Graumähne; Lila ohne Kartenpunkt (Suche).
- **Geprüft:** Wölfe, Kräuter, Grube, Graumähne live abgegeben, Lohn exakt angekommen. Graumähne mit vollem Gepäck: Langbogen verloren. Lila nur Code gelesen.
- **Fehlversuche / Lücken:**
  - Langbogen geht bei vollem Gepäck verloren (siehe 1).
  - HB-42 (noch offen, nur Code): Stirbt Gorak, bevor man q_mine annimmt, zählt der Kill nicht (`startQuest` rechnet nur `REGION_BOSSES` und Hrodvar rückwirkend) → q_mine nie abschließbar.
  - q_herbs zieht das Kraut nicht ab (vermutlich Absicht oder Versehen — andere Kräuteraufträge ziehen ab).

### 3.2 Orden und Paladin (q_paladin1–3)

- **Was es ist:** Drei Prüfungen bei Kelan, an deren Ende die Klasse Paladin steht.
- **Wo / Wer:** Kelan am Ordensschrein. Prüfung 1 erst ab Beziehung zu Kelan ≥ 10; 2 nach 1, 3 nach 2. Wer paktgebunden ist, mit dem redet der Orden nicht.
- **Ablauf:** 4 Skelette → Siegel des Ordens aus der Grube holen → Schrein halten (bei Annahme erscheinen 4 Skelette Stufe 5 am Schrein, `S.flags.holdShrine`).
- **Gegner:** Skelette (Stufe 5 am Schrein).
- **Belohnung / Folgen:** 80/110/200 EP, Orden +10/+12/+20, nach Prüfung 3 Klasse Paladin (Aufnahmeszene).
- **Bedienung:** Dialogliste; Hinweis „Die Prüfungen der Paladine?“ erklärt fehlendes Vertrauen.
- **Geprüft:** alle drei live abgegeben; Lohn und Klasse kamen an.
- **Fehlversuche / Lücken:**
  - **Angelegtes Siegel zählt nicht** (live): Das „Siegel des Ordens“ ist ein Umhang (`slot:'cloak'`). Legt man es an, setzt `questComplete` den Fortschritt auf 0, weil nur das Gepäck gezählt wird; „Erledigt“ erscheint nicht. Repro: q_paladin2 aktiv, Siegel in `equip.cloak` statt im Gepäck, Kelan ansprechen → kein „Erledigt“. Das Siegel wird bei der Abgabe auch nicht abgezogen.
  - Hinweistext bei Kelan sagt „Tritt dem Orden bei und erledige meine Aufgaben für Akolythen“, die Bedingung im Code ist aber nur Beziehung ≥ 10 (`questAvailable`).

### 3.3 Die Toten (q_undead, q_graverobbers, q_pact)

- **Was es ist:** Der Weg zu den Toten: Morvath will ein Grabsiegel, Sael will Grabräuber tot, Ysra bietet den Ahnenpakt.
- **Wo / Wer:** Morvath (Friedhof, Beziehung ≥ 5), Sael (Vharnholm), Ysra (Alt-Vharn) und Vhal (Nekromanten-Turm).
- **Ablauf:** Grabsiegel aus dem Moor → Morvath. Danach erzählt Morvath vom Pakt („Alt-Vharn, frag nach Ysra“). Ysra gibt q_pact (nur ohne Ordensrang, ohne Pakt, mit freiem Titelplatz). Die Ahnenurne liegt in der Großen Nekropole (Wächter). Mit der Urne zu Ysra → **Nekromant**, oder zu Vhal → **Hexenmeister** (`pactRitual`).
- **Gegner:** Wächter der Nekropole, Banditen als Grabräuber.
- **Belohnung / Folgen:** siehe Tabelle; der Pakt bindet (Orden spricht nicht mehr mit dir, Mönch gesperrt), Titelkosten (Nekromant: Leben −10 % für immer).
- **Bedienung:** Dialogliste; gesperrte Wege erklären sich („Kann ich den Pakt schließen?“).
- **Geprüft:** q_undead, q_graverobbers, q_pact (Nekromant) live; Lohn exakt.
- **Fehlversuche / Lücken:** Grabsiegel wird bei q_undead nicht abgezogen (kein `take`) — es kann danach noch für kt_mage1 oder c_nec3 dienen; vermutlich gewollt.

### 3.4 Valen (q_frontier, q_kingsiron)

- **Was es ist:** Oda will die Tasche eines Spähers vom Hundertfeld, Brann schmiedet aus Königseisen die Frostklinge.
- **Wo / Wer:** Oda (Grenzwacht), Brann (Nordfurt). Hrodvar (König unter dem Eis) in der Tiefhall.
- **Ablauf:** Späherbericht + 5 Skelette am Hundertfeld → Oda. Hrodvar töten, Königseisen aus seinem Hort → Brann (Eisen wird abgezogen).
- **Gegner:** Skelette am Hundertfeld; Hrodvar (Boss Tiefhall).
- **Belohnung / Folgen:** siehe Tabelle.
- **Geprüft:** beide live; bei vollem Gepäck fehlt die Frostklinge.
- **Fehlversuche / Lücken:** Frostklinge verloren bei vollem Gepäck (siehe 1).

### 3.5 Freie Händler (q_sandlord, q_pelts)

- **Was es ist:** Gerold zahlt für Karrak, den Sandfürsten der Roten Wüste; Quirin braucht Felle.
- **Wo / Wer:** Gerold (Kontor Nordfurt), Quirin (Salzhafen).
- **Ablauf:** Karrak erschlagen (Regionalboss, zählt rückwirkend) → Gerold. 3 Wolfsfelle → Quirin (abgezogen).
- **Belohnung / Folgen:** 220 G, 260 EP, Händler +12, Flegel · 60 G, 70 EP, Heiltrank.
- **Geprüft:** beide live, exakt.
- **Fehlversuche / Lücken:** q_pelts gibt keinen Ruf (Quirin ist Salzhafen → Valen); Designfrage.

### 3.6 Rooks Bande (q_rook)

- **Was es ist:** Rook will die Nordstraße unsicher machen und braucht Klingen.
- **Wo / Wer:** Rook im Banditenlager, Beziehung ≥ 10.
- **Ablauf:** 2 „Rivalen“ töten — gezählt werden **beliebige** Banditen (`o.target === 'bandit_rival' && mtype === 'bandit'`).
- **Belohnung / Folgen:** 120 G, 90 EP, Bande +25, Valen −20.
- **Geprüft:** live, exakt.
- **Fehlversuche / Lücken:** Rook trägt in den Daten `hostile:true` (data.js NPCS `rook`). Feste Aufträge gibt er trotzdem ab, aber Siegel über ihm erscheinen nicht (`giverMark` blendet Feindliche aus) und Klassen-Prüfungen zeigen im normalen Gespräch kein „Erledigt“ (siehe 3.11).

### 3.7 Bardin Lioba (q_hundred_song)

- **Was es ist:** Lioba will ein Lied über die Toten vom Hundertfeld, aus erster Hand.
- **Ablauf:** 3 Wiedergänger (Ghule) am Hundertfeld.
- **Belohnung / Folgen:** 90 G, 150 EP, Lioba +15. Kein Ruf.
- **Geprüft:** live, exakt.

### 3.8 Titelklassen über Pakt (q_grove, q_monk, q_pact)

- **Was es ist:** Drei Wege zu Titelklassen, die nicht über `turnIn`, sondern über ein Ritual abgeschlossen werden (`pact:true`).
- **Wo / Wer:** Mira (Druide), Ilva (Mönch), Ysra/Vhal (Nekromant/Hexenmeister). Höchstens zwei Titelklassen (`MAX_TITLES`).
- **Ablauf:** Ziele erfüllen → beim Geber Sondertext („Die Wölfe sind fort …“, „Zehnmal ausgewichen …“, „Die Urne …“) → Bestätigung mit Kostenansage → Ritual (Knien, Lichteffekte).
- **Belohnung / Folgen (gemessen):**
  - Druide: 150 EP, 3 Kraut weg, Titel, Orden +5; dauerhaft Stärke −1.
  - Mönch: 180 EP, Titel; **die Hälfte des Goldes geht ans Kloster** (Test: −3370 Gold), Orden +20, Bande −30; danach kein Totenpakt.
  - Nekromant: 200 EP, Urne weg, Titel; Valen −10, Orden −30, Tote +20; Leben −10 %.
- **Bedienung:** Dialogliste mit klarer Kostenansage.
- **Geprüft:** alle drei live.
- **Fehlversuche / Lücken:** keine gefunden.

### 3.9 Klassen-Questreihen (c_nec, c_war, c_dru, c_mon)

- **Was es ist:** Je Titelklasse drei Aufträge beim Meister; jeder gibt ein gebundenes Rüstungsteil (Wert 0). Ab zwei Teilen gibt es eine Zusatzfähigkeit (`GEAR_ABILITY`).
- **Wo / Wer:** Ysra (Nekromant), Vhal (Hexenmeister), Mira (Druide), Ilva (Mönch). Bedingung: Titelklasse getragen, Grad II (Teil 1–2) bzw. Grad III (Teil 3), Vorgänger erledigt.
- **Ablauf / Gegner:** siehe Gesamttabelle (Skelette, Wächter der Nekropole, Hauptmann der Toten, Kultisten, Geister, Aschdämon, Wölfe, Bären, Knochenhunde, Banditen; Mönch zusätzlich Ausweichen).
- **Belohnung / Folgen:** 220/320/450 EP + Teil (Totenrufer-Kapuze, Gewand der Stillen Schar, Grabsteinkragen · Hörnerkrone, Robe des Flüsternden, Schattenmantel · Hainfell, Fellmantel des Hains, Geweih des Hirschs · Gebetsband, Robe der Stillen Hand, Wickel der Stillen Hand).
- **Geprüft:** alle 12 live abgegeben, Teile und EP kamen an, Abgaben wurden abgezogen.
- **Fehlversuche / Lücken:**
  - Kein Ruf bei keinem der 12 Aufträge.
  - HB-34 (offen laut Bericht, nur Code): c_nec2 braucht den Wächter der Nekropole, der nur im Pakt-Weg existiert.
  - Schlüssel-Präfix `c_` wird auch für Verträge (`c_<id>`) benutzt; der Kompass nimmt „irgendeinen aktiven `c_`-Auftrag“ (game.js ≈2774). Kein Absturz, aber Klassen-Questreihen und Verträge teilen sich das Präfix — Verwechslungsgefahr bei künftigen Änderungen.
  - Volles Gepäck: Teil verloren (siehe 1).

### 3.10 Todesritter (dk_1–3)

- **Was es ist:** Drei Schwüre bei Sael; Teile des Todesritter-Sets.
- **Wo / Wer:** Sael (Vharnholm), Klasse Todesritter gelernt.
- **Ablauf:** 3 Kopfgeldjäger + 3 Knochen → 2 Kriegsautomaten + 2 Seelenphiolen → eidbrüchiger Todesritter.
- **Belohnung / Folgen:** 260/360/500 EP, Todesritter-Helm/-Harnisch/-Mantel.
- **Geprüft:** alle drei live, exakt. Kein Ruf.

### 3.11 Klassen-Prüfungen (kt_*)

- **Was es ist:** Seit 02.10. lernt man Grundklassen über eine zweistufige Prüfung: ein Feldauftrag draußen, dann eine Prüfung „im Kreis“ beim Lehrer (`startTrial`). Jeder Lehrer der Klasse nimmt ab; der Fortschritt gehört der Figur (`p.ktSteps`).
- **Wo / Wer:** Lehrer laut `NPCS[].teaches`, z. B. Hauke Eisenfaust (Krieger, Ritter), Kelan (Ritter), Oda (Berserker), Tomas (Schütze, Waldläufer), Rook/Kaelis Vey/Nix (Schurke), Rook (Assassine), Elena/Schwester Adela (Kleriker), Morvath (Magier), Lioba (Barde), Quirin (Alchemist).
- **Ablauf je Klasse:**

  | Klasse | Schritt 1 (draußen) | Schritt 2 (beim Lehrer) | EP |
  |---|---|---|---|
  | Krieger | 4 Banditen (alle Banditenarten) | Duell bis 1/5 Leben | 80 + 110 |
  | Ritter | Platz gegen Wellen halten | Duell mit Schild | 80 + 110 |
  | Berserker | 5 beliebige Feinde | Grubenkampf, selbst unter 30 % | 80 + 110 |
  | Schütze | 3 Wölfe + 3 Felle (abgezogen) | 5 Puppen mit Bogen | 80 + 110 |
  | Waldläufer | 1 Bär | eine Nacht draußen (20–6 Uhr) | 80 + 110 |
  | Schurke | unbemerkt stehlen | 3 Meuchelstiche an Puppen | 80 + 110 |
  | Assassine | ein Steckbrief vom Brett erfüllen | — | 120 |
  | Kleriker | 5 Kraut (abgezogen) + 4 Tote | Verletzte stabilisieren | 80 + 110 |
  | Magier | Grabsiegel | 5 Puppen mit Zaubern | 80 + 110 |
  | Barde | Schenkenspiel gewinnen | 5 Feinde unter Kriegslied mit 2 Gefährten | 80 + 110 |
  | Alchemist | 8 Kraut (abgezogen) + 1 Seelenphiole | 3 Heiltränke brauen | 80 + 110 |

- **Belohnung / Folgen:** EP; der letzte Schritt schaltet die Klasse frei (Aufnahmeszene, Talentpunkt, Sternbild).
- **Bedienung:** „Kannst du mich ausbilden? (Klasse)“ → Prüfungsangebot; Abgabe im normalen Gespräch („Erledigt.“) oder über „Ausbilden“. Debug: „Klassen: laufende Prüfungsziele erfüllen“, „… zurücksetzen“.
- **Geprüft:** alle 21 Schritte live abgegeben (Ritter und Kleriker in frischem Stand, weil der Orden nach einem Pakt nicht mehr redet). EP und Klasse kamen an. Schurke bei Rook: Auftrag angenommen, Ziel erfüllt → im normalen Gespräch **kein** „Erledigt“, über „Kannst du mich ausbilden?“ dagegen schon.
- **Fehlversuche / Lücken:**
  - Rook (`hostile:true` in data.js) zeigt Prüfungs-Abgaben nur über den Umweg „Ausbilden“ (`clsTrialChoices` bricht bei `npc.hostile` ab, `trialOffer` nicht). Uneinheitlich; Spieler könnten glauben, es gehe nicht.
  - kt_alchemist1 verlangt eine Seelenphiole, zieht sie aber nicht ab (nur Kraut) — uneinheitlich.
  - kt_assassin1 zählt den Steckbrief auch, wenn die Wachen ihn erledigt haben und der Lohn auf 10 % gekürzt wurde (`questEvent('contract')` in `claimContract` unabhängig vom Anteil).

### 3.12 Dodon und der Pakt des Sturms (g_dod1–3)

- **Was es ist:** Drei Aufträge für Dodon in Morrgrund; danach stürmen die Grubenstämme mit, wenn man Varg in der Eisenfeste angreift (`goblinStorm`).
- **Wo / Wer:** Dodon, Bedingung `S.flags.morrFriend`, Morrgrund nicht zerstört; g_dod3 nur, solange die Kette steht.
- **Ablauf:** 6 Brot + 3 Kettenknechte → 8 Eisen + 2 Rotgardisten → 4 Kettenschützen am Kettentor → Dodon schwört den Sturm (`turnInStorm`).
- **Gegner:** Kettenknechte, Rotgardisten, Kettenschützen.
- **Belohnung / Folgen:** 220/320/400 EP, Goblins +15/+20/+25, Talisman des Kriegers (g_dod2), Pakt des Sturms.
- **Geprüft:** g_dod1 und g_dod3 live abgegeben (exakt). **g_dod2 live nicht abschließbar.**
- **Fehlversuche / Lücken:**
  - **g_dod2 ist nie abschließbar (Kritisch):** Ziel „Acht Eisen bringen“ (`type:'item', target:'iron'`, data.js Zeile 1573). Eisen ist ein Rohstoff (`ITEMS.iron.res = 'iron'`); `addItem` legt es in `S.res.iron`, nie ins Gepäck. `questComplete` zählt nur das Gepäck → Fortschritt bleibt 0, „Erledigt“ erscheint nie, `take:'iron'` würde auch nichts abziehen. Repro: g_dod2 aktiv, 2 Rotgardisten erledigt, `S.res.iron` = 50 → bei Dodon nur „[Gehen]“. Folge: g_dod3 und der **Pakt des Sturms sind unerreichbar**.
  - `turnInStorm` beendet `turnIn` vorzeitig: keine Beziehung +8, kein Ruhm +2, kein Log „Auftrag abgeschlossen“ (gering).

### 3.13 Grisk nach der Befreiung (q_grisk_lost, q_grisk_rache, q_grisk_build)

- **Was es ist:** Nach Vargs Fall organisiert Grisk die befreiten Goblins in Grubenhort.
- **Wo / Wer:** Grisk (nur wenn `S.flags.goblinsFreed`).
- **Ablauf:** drei Verschleppte finden und befreien (`planLostGoblins`) · 4 Kettenreste im Westgebirge (`spawnChainRest`, Kartenpunkt) · 30 Holz + 15 Stein zu Grisk (eigener Knopf, zahlt über `turnIn`).
- **Belohnung / Folgen:** siehe Tabelle; Grubenhort wächst (MECHANIKEN §Goblins nach der Befreiung).
- **Geprüft:** nur Code gelesen (Grisk existiert im Testsave nicht).
- **Fehlversuche / Lücken:** HB-32 (offen): q_grisk_rache nach Abbruch neu annehmbar, setzt erneut Kettenreste. HB-33: Rangziele mit Goblins/Kette nach der Befreiung unerfüllbar.

### 3.14 Kette: Geraubter Tribut, Pferche, Entlaufene

**Geraubter Tribut (q_tribut)**
- **Was es ist:** Wer selbst (oder seine Gruppe) einen Tributzug der Kette überfällt, bekommt Tributgut und die Frage: behalten oder dem Dorf zurückgeben.
- **Ablauf:** Überfall → Kette −15, Strafaktion im Dorf (doppelter Tribut, Paladine) → Tributgut im Gepäck. Zurück ins Dorf („Euer Tribut. Ich bringe ihn zurück.“) → 60 EP, Dorf-Vorrat +5 je Stück, Dorfruf +20. Verkauft oder ablegt man das Gut, gilt der Auftrag als „behalten“.
- **Geprüft:** nur Code gelesen (`tribTick`, `tributeChoices`). HB-09 (Täter statt Nähe) ist behoben.
- **Lücken:** Abbruch im Auftragsbuch löscht den Auftrag; danach kann man das Tributgut nie mehr zurückgeben (Knopf verlangt aktiven Auftrag), es bleibt nur „behalten“. Kein Fraktionsruf fürs Zurückgeben (nur Dorfruf), obwohl Goblins/Frei naheliegen ([E]).

**Die Pferche öffnen (q_pferch)**
- **Was es ist:** Bruni im Sklavenpferch bittet um Befreiung.
- **Ablauf:** Schlüssel von Vesk stehlen (Geschick-Wurf, bei Misserfolg Kopfgeld 60 bei der Kette) oder bei Schreiberin Edda für 80 Gold → nachts (21–6 Uhr) den Pferch öffnen (`openPen`).
- **Belohnung / Folgen:** alle Gefangenen frei, Kette −15, Goblins +10 (zahlt `openPen` selbst), 180 EP. Fällt die Kette vorher, schließt `liberate` den Auftrag mit (HB-09 behoben, aber dann nur EP, kein Ruf).
- **Geprüft:** nur Code gelesen.

**Entlaufene (q_runaway)**
- **Was es ist:** Der Tributoffizier meldet einen Entlaufenen östlich der Mauern.
- **Ablauf:** Entlaufenen finden → „Zurück in die Feste“ (25 G, 40 EP, Kette +8) oder „Lauf“ (40 EP; 30 %: ein Grenzreiter sieht es, Kette −10).
- **Geprüft:** nur Code gelesen.
- **Lücken:** „Laufen lassen“ bringt keinerlei Ruf bei Goblins/Freien (Gnade ohne Folge außer Risiko); Kette-Ruf ungeklemmt.

### 3.15 Seevolk (q_salz1–3, q_klinge1–2, q_wb_nebel)

- **Was es ist:** Auf den Gischtinseln werben zwei Clans: der Salzbund (Händler, Ysolde Kielmark) und die Sturmklinge (Plünderer, Hella Kielbrecher). Wer den zweiten Auftrag eines Clans erfüllt, wählt die Seite (`chooseSeaSide`) und verliert den anderen Clan. Beide zählen für die Fraktion „Das Seevolk“.
- **Wo / Wer:** Geber nach Beruf auf der Insel (`giverProf`, `giverMap:'isle'`); Weißbart auf seinem Schiff.
- **Ablauf:**
  - Salzbund: 4 Schwarzsegel am Weststrand (Lager entsteht bei Annahme) → 4 Salzsäcke (Salzsiegel, Seite Salzbund, Rang 1) → Weißbart besiegen **oder** Salzfrieden (`seaPeace`: Ruf ≥ 40 und Salzbund-Reihe) → Rang 3.
  - Sturmklinge: 3 Grubenkämpfer → 3 Tuchballen (Entermesser, Seite Sturmklinge, Rang 1) → bei Weißbart „Ich segle für dich“ → Morra Schwarzsegel (Elite, 2,2-faches Leben) → Dreispitz, Rang 3, Legende „Maat des Weißen Ankers“.
- **Gegner:** Schwarzsegel, Grubenkämpfer, Weißbart (Boss), Morra Schwarzsegel.
- **Belohnung / Folgen:** siehe Tabelle.
- **Geprüft:** q_salz1–3 und q_klinge1–2 live abgegeben, Lohn exakt, Seite und Rang wie beschrieben. q_wb_nebel nur Code.
- **Fehlversuche / Lücken:**
  - Seevolk-Ränge 2 und 4 sind nicht erreichbar (Rang springt 1 → 3; `rankGuide` sagt es offen). In OFFEN als [E] geführt.
  - HB-07 (Weißbart nach Herausforderung nie wieder ansprechbar) ist behoben.

### 3.16 Aurelion: Intrige, Bürgerrecht, Ratssitz

**Heikle Angelegenheit (q_intrige)**
- **Was es ist:** Ein Adelshaus gibt einen schmutzigen Auftrag gegen ein anderes Haus: Brief eines Boten rauben oder einen Verwalter töten.
- **Ablauf:** Bei einem Hausvertreter „Gibt es etwas Heikles zu erledigen?“ (Gunst ≥ 0) → Ziel mit Kartenpunkt → zurück → „Erledigt.“
- **Belohnung / Folgen:** 120 Gold, Gunst des Auftraggebers +20, Gunst des Opferhauses −25. Kein EP, kein Aurelion-Ruf.
- **Geprüft:** nur Code gelesen.
- **Lücken:** Wird der Auftrag im Buch abgebrochen, bleibt `S.intrigue` bestehen → kein neuer Intrigenauftrag, solange der alte nicht über den Vertreter abgerechnet wird (der Knopf „Erledigt.“ funktioniert trotzdem, weil er nur auf `S.intrigue` schaut).

**Bürgerrecht (kein QUESTS-Eintrag)** — Kanzlei: Ansehen ≥ 40, 1000 Gold, ein Haus mit Gunst ≥ 30 → Bürger, Aurelion +10.

**Eine Stimme im Rat (q_ratssitz)**
- **Was es ist:** Ein Haus (Gunst ≥ 60, Aurelion-Rang ≥ 6) schlägt dich für den Hohen Rat vor.
- **Ablauf:** drei Häuser mit Gunst ≥ 30 → bei Ratssprecher Corvan auf der Himmelsfeste 500 Gold Einlage.
- **Belohnung / Folgen:** Ratssitz (`S.flags.councillor`), höchster Aurelion-Rang, Legende „Stimme im Hohen Rat“, Sitzungen alle 7 Tage.
- **Geprüft:** **live** über `corvanTalk`: Gold −500, Rang Aurelion gesetzt, Auftrag „done“ — **0 Erfahrung**, obwohl die Daten 600 EP versprechen.
- **Fehlversuche / Lücken:**
  - **600 EP werden nie ausgezahlt** (HB-37 weiter offen). Stelle: `corvanTalk` (game.js ≈10902), dort fehlt `gainXp(S.player, QUESTS.q_ratssitz.reward.xp)`.
  - Ziel 1 („Drei Häuser als Fürsprecher“) zeigt bis zum Ende 0/1 Fortschritt; der Tracker zählt die Fürsprecher nicht mit.

### 3.17 Kerker von Salzhafen: Gilde und Rask

- **Was es ist:** Wer im Kerker von Salzhafen sitzt, trifft Mo die Klinke (Diebin) und Kapitän Rask.
- **Ablauf:** Mo: „Ich höre.“ → am Hafen den Mann mit rotem Tuch ansprechen („Mo schickt mich.“) → 60 G, 80 EP, Dietrich, Diebesgilde (`S.flags.gilde`). Rask: Kiste südlich der Stadt an der Küste (`placeRask`, Kartenpunkt) → öffnen: 150 G, Heiltrank, 100 EP.
- **Geprüft:** nur Code gelesen.
- **Lücken:** Rask zahlt EP direkt (`openRask`), nicht über die Daten — Daten sagen nur 100 EP, Gold/Trank stehen nur im Code. Kein Problem, aber zwei Quellen.

### 3.18 Rotfall und Omega (q_rotfall, q_omega)

**Die Spur des Rotfalls**
- **Was es ist:** Bruchstücke der Wahrheit über den Rotfall bei Toten und Lebenden, in Büchern, Liedern, Karten (`ROTFALL`, `omegaFrag`, rückwirkend `rotfallCheck`).
- **Ablauf:** Jedes Bruchstück zählt (Log, Chronik, Toast „SPUR DES ROTFALLS n/N“). Ab `OMEGA_NEED` schließt `rotfallDone` ab.
- **Belohnung:** 400 EP und Unikat-Klinge „Rotfall“ (wird abgelegt, wenn das Gepäck voll ist). HB-10 behoben (03.10.).
- **Geprüft:** nur Code gelesen.

**Der Ruf nach Omega**
- **Was es ist:** Vargs Ritual: Garmadons Krone, Vargs Kette, Himmelssplitter, 10 Seelenphiolen, ein Gefährte als Opfer, ein Fünftel des eigenen Blutes für immer.
- **Ablauf:** Varg („Ich will Omega rufen.“) gibt die Kette und startet den Auftrag; auch Vargs Tagebuch startet ihn. Am Altar der Eisenfeste (E) bzw. beim Omega-Priester das Ritual; Ausgang „erwacht“ oder „Zorn“ (Chance 40 % + Glaube + Kettenrang).
- **Geprüft:** **live** über `RF.omegaPerform`: Auftrag „done“ mit Ausgang — **0 Erfahrung**, die Daten versprechen 1000 EP.
- **Fehlversuche / Lücken:**
  - **1000 EP werden nie ausgezahlt** (`omegaPerform`, game.js ≈10225, kein `gainXp`). In OFFEN als HB-10 [E] geführt; die Rotfall-Hälfte ist behoben, die Omega-Hälfte nicht.
  - Abbruch im Auftragsbuch löscht q_omega; Varg bietet das Ritual erneut an und gibt **erneut Vargs Kette** (`addItem` bei jedem Start) — doppelte Ritualzutat.

### 3.19 Anomalie (q_anomaly)

- **Was es ist:** Weltereignis an einem von 6 Ley-Punkten: Mana doppelt, Zauber verrutschen (10 % Element-Wechsel).
- **Ablauf:** im Zentrum (≤ 3 Felder) einen Schutzzauber (Schild, Magieschild, Schutzsegen, Schutzkreis) wirken (`anomalyClose`). Nach 4 Tagen schließt sie sich selbst → Auftrag „gescheitert“.
- **Belohnung:** 120 G, 150 EP, Aurelion +4, Orden +4 (geklemmt).
- **Geprüft:** nur Code gelesen.

### 3.20 Überfälle und Heere der Toten (q_undraid, q_undarmy)

- **Was es ist:** Für Mitglieder der Toten: bei Sael einen Überfall auf ein Dorf wählen (`startMyRaid`) oder auf der Kriegskarte ein Heer gegen eine Stadt befehlen (`orderArmy`).
- **Ablauf:** Überfall: zum Dorf gehen, Wache und Miliz fallen, über die Bewohner entscheiden; weit weg = Abbruch. Heer: marschiert über die Kriegskarte; fällt die Stadt, entscheidet man über die Bewohner.
- **Belohnung:** in den Daten keine; Folgen über Krieg und Ruf (Verteidiger zählen `S.deadRaid.pk`).
- **Geprüft:** nur Code gelesen. HB-05 (Abbruch nahm allen Heeren den Befehl) ist behoben (`cancelQuest` trifft nur `S.undArmyId`).

### 3.21 Rangaufträge (RANK_LINES, r_<fraktion>_<rang><a|b>)

- **Was es ist:** Aufstieg in einer Fraktion. Hat man Ruf ≥ Rang × 25 (höchstens 100) und den Rang darunter, meldet `checkRankUp` eine Rangprüfung; beim Anführer gibt es zwei Aufträge (a = Bewährung, b = Tat). Nach b folgt die Beförderung.
- **Wo / Wer:** Händler → Gerold, Bande → Rook, Valen → Oda, Orden → Kelan, Tote → Morvath, Kette → jede Kettenwache in der Eisenfeste. Aurelion, Goblins und Seevolk haben eigene Wege (`autoRanks`, Seevolk-Clans).
- **Ablauf / Gegner (alle 40 Aufträge):**

  | Fraktion | Rang | a | b |
  |---|---|---|---|
  | Händler | Partner | 4 Banditen | 5 Salz |
  | Händler | Teilhaber | 3 Banditenschützen | 3 Werkzeugkisten |
  | Bande | Klinge | 2 Valen-Soldaten | 3 Heiltränke |
  | Bande | Hauptmann | 2 Kopfgeldjäger | 1 Bär |
  | Valen | Soldat | 4 Banditen | 2 Banditenschützen |
  | Valen | Veteran | 5 Wölfe | 3 Speerträger |
  | Valen | Ritter | 6 Skelette | 1 Hauptmann der Toten |
  | Valen | Offizier | 4 Kettenknechte | 2 Rotgardisten |
  | Orden | Akolyth | 5 Heilkraut | 5 Skelette |
  | Orden | Wächter | 4 Wiedergänger | 2 Geister |
  | Orden | Ritter | 5 Seuchenleichen | 1 Nekromant |
  | Orden | Paladin | 3 Knochenritter | 1 Todesritter |
  | Orden | Meister | 5 Kultisten | 1 Leichenkoloss |
  | Tote | Adept | 4 Banditen | 2 Valen-Soldaten |
  | Tote | Grabgebundener | 5 Wölfe | 2 Kopfgeldjäger |
  | Tote | Todesritter | 3 Kultisten | 1 Bär |
  | Tote | Kommandant | 5 Valen-Soldaten | 2 Rotgardisten |
  | Kette | Kettenknecht | 4 Goblins | 4 Banditen |
  | Kette | Grenzreiter | 3 Valen-Soldaten | 2 Kopfgeldjäger |
  | Kette | Aufseher | 4 Goblin-Krieger | 1 Automat |

- **Belohnung / Folgen:** je Auftrag **60 + (Rang − 1) × 50 Gold**, **80 + (Rang − 1) × 70 EP**, Fraktion +5; Gegenstände werden abgezogen. (Korrektur zu IST §2.12: dort stand „60 + Rang × 50“, das ist um einen Rang verschoben.) Kette Rang 4 nur über die Weihe bei Varg.
- **Bedienung:** Toast „RANGPRÜFUNG: …“, Log nennt den Geber; Kodex-Reiter „Ränge“ (`rankGuide`).
- **Geprüft:** **alle 40 live abgegeben**: Gold und EP exakt nach Formel, Ruf +5 jeweils bei der **richtigen Fraktion** (auch die Kette über eine Kettenwache), Beförderung nach dem b-Teil.
- **Fehlversuche / Lücken:** HB-33 (offen): nach dem Fall der Kette / der Goblin-Befreiung sind Ziele wie „4 Goblins“ oder „Kettenknechte“ unerfüllbar.

### 3.22 König Varon (Königsaufträge, Varonsburg)

- **Was es ist:** Auftragskette des Königs in der Varonsburg (Varonheim).
- **Wo / Wer:** Audienz mit Valen-Rang ≥ 1 oder 100 Gold für Kanzler Aldhelm; wer bei Aurelion Ruf ≥ 25 hat, wird abgewiesen (Valen −3).
- **Ablauf:**
  1. „Ich will der Krone dienen.“ → Königsvertrag (`royalStart`, Art `royal`): ein Hauptmann der Toten (Elite) vor Nordfurt. Fällt er: Bedrohung der Hauptstadt −5 (`royalTick`), zurück zum König → 150 Gold, 200 EP.
  2. Verräter unter drei Adligen finden (Spitzelmeisterin Ysmay: Siegelwachs; Adlige reagieren verschieden) → anklagen: richtig 300 Gold, Valen +10; falsch stirbt ein Unschuldiger, Valen −5. Danach geht es in beiden Fällen weiter.
  3. Ritterschlag: Titel „Ritter Varons“, Kronhelm, Valen +15 — oder verweigern, Valen −10.
  - Exil (nach Fall Varonheims): „Varonheim zurückerobern“ → 400 Gold, Valen +20 nach Befreiung.
- **Gegner:** Hauptmann der Toten (Elite), bei Rückeroberung 4 Wellen mit Statthalter.
- **Bedienung:** Dialogliste; Vertrag im Auftragsbuch mit Kartenpunkt.
- **Geprüft:** nur Code gelesen.
- **Fehlversuche / Lücken:**
  - HB-45 (offen): findet `royalStart` keinen Platz oder keine Elite, gilt Auftrag 1 still als erledigt.
  - Kronhelm geht bei vollem Gepäck verloren (`addItem` ohne Prüfung).
  - Schritt 1 gibt keinen Valen-Ruf (nur Gold/EP) — Designfrage.
  - HB-08 (Abbruch sperrt die Reihe) ist behoben.

### 3.23 Blutkult (Varonheim)

- **Was es ist:** Große Geschichte in fünf Scheiben (MECHANIKEN „Blutkult, Scheibe 1–5“). Ohne `QUESTS`-Eintrag; Fortschritt in `S.cult`.
- **Ablauf (Kurz):** Ab Tag 3 (bzw. 12) verschwinden Bürger Varonheims → drei von vier Spuren (Blutzeichen, Siegelwachs/Albin, Zeuge, Blutmaske) → Anklage bei der Königsgarde (richtig: Albin → Schlüssel zum Kanzleikeller; falsch: Valen −3, weiteres Opfer) oder Wido öffnet das Beinhaus (50 Gold) → Katakomben (Gegner Stufe 12–16: Maskierter, Blutmagier, Blutknecht, Kelchwächter; Käfige öffnen) → Hedda: beitreten („Trinken“) oder kämpfen → Rotes Siegel im Archiv → Enthüllung beim König (Valen +5, Verbündete) → Aldhelm (Stufe 16) in der Krypta.
- **Belohnung / Folgen:** Kanzlerdegen „Rotes Siegel“ (legendär), Robe des Kanzlers, Blutkult-Sense (mythisch, einmalig); zerschlagen: Valen +15, Ysmay wird Kanzlerin, Audienz kostenlos. Erpressen: 500 Gold einmal. Blutfürst: Valen +10, Orden −30, täglich 2 Blutphiolen + 30 Gold. Rote Krönung nach 20 Tagen: Varon stirbt, Aldhelm herrscht.
- **Bedienung:** Dialoge, Kamerafahrten (Regiebuch), Vermisstenliste am Platz. Debug „Blutkult: …“.
- **Geprüft:** nur Code/MECHANIKEN gelesen.
- **Fehlversuche / Lücken:** HB-31 (offen): Kultkrypta nach Tod des Spieler-Blutfürsten. HB-03 (Zeitsprünge übersprangen die Rote Krönung) ist behoben. Kein Eintrag im Auftragsbuch — die Spuren stehen nur im Log/in der Chronik ([E], ob die Geschichte einen Tracker-Eintrag bekommen soll).

### 3.24 Ahnenfeind

- **Was es ist:** Wer den Helden tötet (kein Boss, keine Wache), wird zum benannten Ahnenfeind, nimmt die Hauptwaffe und greift später die Familie an (MECHANIKEN T10).
- **Ablauf:** Der Erbe bekommt beim Antritt einen Steckbrief (`nemesisHeir`, Vertragsart `rumor`, `rk:'nemesis'`) mit wanderndem Kartenkreis. Fällt der Feind: Waffe des Vorfahren mit Geschichte, Titel „Rächer des Hauses“, Ruhm +10 in seiner Region, Steckbrief erfüllt.
- **Belohnung:** 80 + Stufe × 10 Gold, 120 EP, kein Ruf.
- **Geprüft:** nur Code gelesen.
- **Fehlversuche / Lücken:** Der Steckbrief hat `town: null`. Bricht man ihn ab, zieht `failContract` 3 Ruf bei `townFac(null)` = **Valen** ab — Strafe bei einer unbeteiligten Fraktion. Ebenso Gefährtenaufträge (Stadt = Heimatort des Gefährten) und Witwen-Zettel (E3).

---

## 4. Verträge (Anschlagbrett, Wache, Bewohner)

### 4.1 Wie Verträge funktionieren

- **Was es ist:** Wiederkehrende Aufträge aus der Welt. Jede Stadt hat ein Anschlagbrett (Dorf 3, Stadt 5 Aushänge, erneuert alle 3 Tage; angenommene oder erledigte werden täglich aufgefüllt, `S.conTop`); Arten je Gegend aus `REGION_CON` (`conKinds`, `regionAt`), Totenknoten nebenan → Verteidigung/Monsterjagd zuerst (`warHot`) und einen Verteidigungsmeister (3 militärische Aufträge). Dazu vergeben Bewohner nach Beruf je einen eigenen Auftrag (`PROF_CON`). Die Eisenfeste vergibt über Kettenwachen, Tributoffizier, Paladinmarschall und Eisenpaladine; nach dem Sklavenaufstand geben die Freien in Grubenhort, in Tickmar der Arbeiterrat Aufträge.
- **Ablauf:**
  1. Brett / Wache / Bewohner ansprechen → Auftragsbrief (Lohn in Gold, Frist) → „Annehmen“.
  2. Ziel steht wirklich in der Welt (Gegner werden außer Sicht nachgesetzt, Bosse nie).
  3. Abgabe beim Geber (Bewohner: Wegpunkt zeigt auf ihn, außer auf „Sehr schwer“), Brett oder Wache.
- **Grenzen:** höchstens 5 gleichzeitig (`CON_MAX`), Fristen (`CON_DAYS`): Patrouille 2, Eskorte 3, Vermisst 3, Lieferung 4, Jagd 4, Kräuter 4, Vorräte 5, Spur 5, Kopfgeld 5, Monster 5, Lager 6 Tage.
- **Scheitern / Abbruch:** Frist verstrichen → gescheitert, Ruf −2 (live gemessen), das Dorf redet (Vertrauen −1 → weniger Angebote). Selbst abbrechen → Ruf −3. Eskortierter stirbt → Ruf −6. Auftraggeber stirbt → hinfällig ohne Ruf. Lieferung gescheitert → Paket wird entfernt. Verträge gehen nicht aufs Erbe über.
- **Beitrag zählt:** Haben Wachen oder andere die meisten Gegner getötet (`C.kills`/`C.credit`), sinkt der Lohn: Anteil = 0,1 + eigener Anteil × 1,5 (höchstens 1). Live: 0 % eigener Anteil → 10 % Gold/EP, **kein Ruf**; 25 % → 47 %, Ruf 2 statt 4.
- **Wendungen (35 %, geheim):** Kopfgeld: Anführer ergibt sich (verschonen möglich). Vermisst: die Person ist gefangen. Jagd: ein Leitwolf (+20 Gold). Eskorte: 45 % Verrat. Nach einem Kopfgeld kommt mit 35 % ein Rächer (`S.avenge`).
- **Ignorierte Angebote:** verfallen sie unerledigt, verliert der Ort Wohlstand (Kopfgeld/Monster −3, Vorräte/Kräuter −2) oder Fleisch (Jagd).
- **Bedienung:** Dialogliste mit Auftragsbrief und Steckbrief-Gesicht, Auftragsbuch, Tracker mit Frist-Sanduhr, Warnchip „Frist endet heute“/„Angriff auf …“. Debug: „Aufträge“ (Verfolgten Auftrag abschließen, Bretter erneuern, Stadtverteidigung hier).
- **Geprüft:** live (siehe 4.2, 4.3).

### 4.2 Lohnformeln je Art (gemessen)

Grundlohn: **40 + Zonenstufe × 25 Gold**, **50 + Zonenstufe × 20 EP**, **Ruf +4** bei der Fraktion des Ortes. Gemessen in Nordfurt (Zonenstufe 0) über den Verteidigungsmeister:

| Art | Ziel | Gold (Formel) | gemessen Nordfurt | EP | Ruf |
|---|---|---|---|---|---|
| Kopfgeld (Steckbrief) | Anführer + 2–4 Leute | Grund + 60; mit Elite-Mini-Boss + 40 Gold, + 40 EP | 140 (mit Elite) | 90 | Valen +4 |
| Monsterjagd | 3–6 Bestien der Gegend | Grund | 40 | 50 | +4 |
| Jagd | 3–5 Wölfe | Grund − 10 (Leitwolf + 20) | 30 | 50 | +4 |
| Verteidigung | 4–7 Angreifer in 1–2 Std. | Grund + 40 | 80 | 50 | +4 |
| Patrouille | 3 Wegpunkte | Grund | 40 | 50 | +4 |
| Eskorte | Reisenden in Nachbarstadt bringen | Grund + 30 | 70 | 50 | +4 |
| Lieferung | Paket zum Verteidigungsmeister der Nachbarstadt (jeder Bewohner dort nimmt es) | Grund + 30 | 70 | 50 | +4 |
| Vermisst | Person finden, heimschicken | Grund | 40 | 50 | +4 |
| Vorräte | 5–10 Holz und gleich viel Stein | Anzahl × 6 | 30 (5+5 abgezogen) | 50 | +4 |
| Kräuter | 3–6 Heilkraut | Anzahl × 9 | 36 (4 abgezogen) | 50 | +4 |
| Spurensuche | 3 Spuren, dann das Lager | Grund + 70 | 110 | 50 | +4 |
| Lager ausheben | 2–3 Lager | Grund + 50 × Anzahl | 190 (3 Lager) | 50 | +4 |
| Schmuggel (Krieg) | Bündel in besetzte Stadt | Lieferung + 80, Ruf +8 | — (C) | | |
| Spuk am Brunnen | 3 Geister nachts | Monster + 40, Ruf +6 | — (C) | | |

Sonnwacht (Zonenstufe 1): Monsterjagd 65 Gold, 70 EP, Orden +4 — die Formel stimmt.
Steckbrief lebend bei einer Wache abgeliefert: Gold ×1,5 (Code).

### 4.3 Welche Fraktion bekommt den Ruf? (live, je Ort)

Gemessen mit einem Steckbrief je Ort, abgegeben beim Verteidigungsmeister (Eisenfeste: Kettenwache Jutta):

| Ort | Ruf an | Ort | Ruf an |
|---|---|---|---|
| Eren, Nordfurt, Salzhafen | Valen | Varonheim, Haselbrück, Mühlbach, Weidenau | Valen |
| Kreuzweg, Aschfurt, Rastfurt | Freie Händler | Sonnwacht, Lichtenrain | Orden |
| Aurelheim, Kupferhafen, Gelenkhall, Tickmar, Sankt Serin | Aurelion | Grauwasser, Hohlstein, Eisenried | Kette |
| **Eisenfeste (Kettenwache)** | **Kette** (Fix des Leads vom 02.10. bestätigt) | Grubenhort (Freie, nach Aufstand) | Die Freien vom Grubenhort (C) |

- Ergebnis: **Jeder Vertrag zahlt bei der Fraktion des Ortes.** Der vom Entwickler genannte Fehler (Eisenfeste → kein Ruf / Ruf an Valen) ist behoben.
- Rufzuordnung kommt aus `townFac` (game.js ≈7478): Besatzer-Kette → Kette; sonst `TOWN_PLAN.lord`, `GUARD_POSTS.faction`, LOCATIONS mit Fraktion Kette, Grubenhort nach Aufstand → „frei“, **alles andere → Valen**.
- **Lücken:**
  - Tickmar-Arbeiterrat (nach dem Streik) vergibt Aufträge, deren Ruf an **Aurelion** geht (`townFac('tickmar')`), also an die Fabrikherren, gegen die der Rat streikt ([E]).
  - Fallback „Valen“ trifft alle Verträge ohne Stadt (Ahnenfeind-Steckbrief `town:null`) beim Abbruch (siehe 3.24).
  - An Fraktionsorten ohne Stadtplan (Karak-Atar, Dünenwacht, Grubenhort vor dem Aufstand, Morrgrund) gibt es keine Vertragsgeber; die offene [E]-Frage aus OFFEN betrifft also im Moment keine echten Aushänge.
  - Die Abgabe-Meldung `claimContract` nennt „Fraktion +X“ auch dann, wenn `S.factions[f]` fehlt und nichts gebucht wird (nur bei unbekannten Schlüsseln; heute nicht ausgelöst).
  - Ruf aus Verträgen ungeklemmt (siehe 1).

### 4.4 Bewohner-Aufträge nach Beruf (`PROF_CON`)

| Beruf | Art | Beruf | Art |
|---|---|---|---|
| Bauer, Bäuerin, Jäger | Jagd | Schmied, Meisterschmiedin, Werkmeister, Holzfäller | Vorräte |
| Priester, Offizier der Sonnenlegion | Monsterjagd | Wirt, Wirtin, Händlerin, Gräfin, Edelfrau, Magitech-Ingenieurin, Gelehrter | Lieferung |
| Kaufmann, Kontorhändler | Eskorte | Heilerin, Kräuterfrau | Kräuter |
| Fischer | Vermisst | Graf, Hofbeamter, Richterin | Spurensuche |
| Edelmann, Ratsherr, Bürgermeister | Kopfgeld | | |

- Abgabe beim Bewohner („Erledigt. (Titel)“, Beziehung +5); auf „Sehr schwer“ ohne Namen und Wegpunkt. Stirbt er: hinfällig.
- **Geprüft:** Formeln live über den Verteidigungsmeister; Bewohner-Abgabe nur Code gelesen (`conChoices`).

### 4.5 Elite-Mini-Bosse für Steckbriefe (`ELITES`, 32 Einträge)

| Gruppe | Elite (Grundart, Kraft, Beute) |
|---|---|
| Banditen | Hagen der Schlitzer (Bandit, Sammeln, Langschwert) · Ruprecht Einauge (Schütze, Sammeln, Langbogen) · Wendel die Krähe (Ansturm, Doppelklinge) · Gunther Rotbart (Speer, zäh, Hellebarde) · Die Stille Mathilde (Brand, Wurfmesser) · Otmar Brandschatz (Brand, Axt) · Galgenstrick Fritz (Sammeln, Rapier) · Adelheid vom Hohlweg (Schützin, Armbrust) |
| Wüste | Karim Sandgeist (Ansturm, Kriegssichel) · Nadira die Skorpionin (Blitz, Kurzbogen) |
| Goblins | Knarz der Grubenkönig (Beschwören, Axt) · Mulch der Pilzschamane (Heilen, Trank) · Schrottfresser Grimm (zäh, Ersatzteile) · Flinkfinger Zick (Ansturm, Wurfmesser) |
| Tote | Der Knochenfürst Varsk (Beschwören, Knochenspalter) · Irmhild vom Frostgrab (Frost, Frostklinge) · Seuchenmaul (Ghul, Heilen) · Der Grabschänder Egbert (Sammeln, Grabräuber) · Die Totenglocke (Blitz, Totenglocke) · Aschenkönigin Sabeth (Brand, Kriegssense) |
| Tiere | Graumähne (Wolf) · Schwarzfell (Wolf) · Eisenhauer (Keiler) · Der Alte vom Berg (Bär) · Der Weiße Hund (Albinowolf, Frost) — Beute Fell |
| Kette | Brakk Kettenbrecher (zäh) · Veit mit der Peitsche (Blitz) |
| Kult | Aschepriester Morn (Brand, Stab) · Die Schattenseherin (Heilen, Stab) |
| See | Kapitän Seeteufel (Sammeln, Kriegssichel) · Harpunen-Hella (Ansturm, Speer) |
| Aurelion | Das Messingungetüm (Automat, Blitz) |

Leben ×1,4–2,6, Schaden ×1,1–1,45 der Grundart. Gewählt nach Gegend (`pickElite`).

---

## 5. Gerüchte, Gefährten-, Königs- und Sonderaufträge

### Gerüchte (Art `rumor`)
- **Was es ist:** Beim Plaudern („Was gibt es Neues?“) erzählt ein Bewohner mit 35 % (einmal je Person und Tag) ein Gerücht: Schatz, Bestie oder Deserteur 28–60 Felder vor dem Ort. Kartenpunkt nur ungefähr (±6 Felder). Höchstens 2 offen.
- **Ablauf / Lohn:** Schatz: vergrabene Kiste (12 % leer, manchmal Räuber), 60 EP. Bestie: Elite-Tier, 60 EP. Deserteur: verschonen (Valen −2, kein Gold), ausliefern (60 Gold, Valen +3), anwerben (kein Gold). Kein Ortsruf (`rumorDone` zahlt nur Gold/EP).
- **Geprüft:** nur Code gelesen.

### Gefährten-Aufträge (Art `comp`)
- Nach drei Abenden am Feuer nennt ein Gefährte einen Feind (Elite) mit Kartenpunkt. Fällt er, während der Gefährte dabei ist: Loyalität +25, sonst −10; ablehnen −3. Kein Gold-/Ruflohn. Nur Code gelesen.

### Sonderaushänge
- **Schmuggel** (`smuggleContract`): halten die Toten eine Nachbarstadt (< 160 Felder), Lieferung bis auf deren Platz; +80 Gold, Ruf +8.
- **Spuk am Brunnen** (`hauntContract`, Weltereignis): 3 Geister, nur nachts 22–5 Uhr; +40 Gold, Ruf +6. Ignoriert: Ort leidet.
- **Seuche**: Kräuter-Aushang „Seuche in …“. **Wolfswinter**: Jagd-Aushang. **Entführt**: Kind vom Ahnenfeind entführt (Vermisst). **Varonheim-Start**: drei billige Startaufträge (höchstens 60 Gold).
- Alle nutzen `claimContract` mit Ortsruf. Nur Code gelesen.

---

## 6. Emergente Aufträge E1–E4

### E1 Der Deserteur und sein Bruder
- **Was es ist:** Deserteure bilden eine Bande; ihr Anführer hat ein Geschwister bei der Valen-Wache der nächsten Stadt (nie Varonheim). Log: „In … fragt eine Wache nach dir.“
- **Ablauf:** Wache bittet „Bring ihn heim. Nicht tot.“ → Lager auf der Karte → Unterhändler: heimholen mit Valen-Ruf ≥ 0, Ruf der Klinge ≥ 40 oder 60 Gold Sold.
- **Belohnung / Folgen:** Bande löst sich auf, 40 Gold von der Wache, Valen −2 (Fahnenflucht ungestraft), freier Torposten wird besetzt. Erschlagen: Beziehung zur Wache −40, evtl. Rächer.
- **Geprüft:** nur Code/MECHANIKEN.

### E2 Karawanenräuber verfolgen
- **Was es ist:** Stirbt die große Karawane, waren es bestimmte Räuber; Aushang „Überlebende der Karawane“ nennt die Bande, der Kutscher zeigt das Lager („Die Ladung zurückholen“, `caravanLootQuest`).
- **Belohnung:** Ladung (≤ 20 Stück) am Lagerfeuer → zurück ans Kontor (4 Gold je Stück, Händler +4) oder behalten. Selbst überfallen: kein Auftrag, Händler −10.
- **Geprüft:** nur Code/MECHANIKEN.

### E3 Die Witwe heuert einen Mörder
- **Was es ist:** Nach einem Mord an Verheirateten (70 %) oder Hausgenossen (40 %, ohne Zeugen halbiert) kauft die Hinterbliebene einen Mörder.
- **Ablauf:** Gedungener („Nichts Persönliches.“) → kämpfen, überbieten (100 Gold) oder „Ich komme selbst“ → Zettel → Auftrag „Die Auftraggeberin“ (`rumor`, `rk:'grudge'`) → bei ihr: Wergeld (50–150), reden (Wahrnehmung 12, 40 %, Ortsruf +1), der Wache melden, töten.
- **Geprüft:** nur Code gelesen.
- **Lücke:** Nach jedem Selbsttest stehen Probe-Aufträge „Die Auftraggeberin: Probe“ im Tab-Zustand (OFFEN [P]).

### E4 Vermisstenwelle
- **Was es ist:** Ab Tag 15 (3 % am Tag, danach 20 Tage Ruhe) verschwinden in einem Dorf jede zweite Nacht um 2 Uhr Menschen (≤ 4). Täter: Ghule, Goblins oder Menschenfänger in Ruine/Wildnis/Dungeon 30–90 Felder entfernt.
- **Ablauf:** Aushang „Die Verschwundenen von …“ (Spurensuche, 3 Spuren) → Unterschlupf mit Anführer → Gefangene ≤ 5 Tage befreien („Geh heim.“): je 30 Gold, Wohlstand +3. Nichts tun: nach 4 Opfern/12 Tagen Wohlstand −8.
- **Belohnung:** Spurensuche-Lohn (Grund + 70) + je Befreitem 30 Gold, Ortsruf +4.
- **Geprüft:** nur Code gelesen.

---

## 7. Geheime Orte

- **Was es ist:** Orte, die auf keiner Karte stehen; gefunden erscheinen sie im Atlas (`secretFound`, `ensureSecrets`). Log: „Geheimnisse gefunden: x von 8“.
- **Bedienung:** Taste E an Pfählen/Zeichen/Türen, Dialog für die Wahl; Ratgeber-Tipp; Debug „Geheime Orte: …“.

| Ort | Rätsel / Auslöser | Gegner | Lohn und Wahl |
|---|---|---|---|
| Glockenmoor (Versunkene Kapelle von Moorbach) | Nachts bei Nebel/Regen läutet eine Glocke; 3 Pfähle in der Reihenfolge Taufe → Hochzeit → Tod läuten | falsche Reihenfolge: 3 Ertrunkene | Truhe: Glocke von Moorbach (+3 Rüstung), Pestkapuze, Kettenhemd, 2 Tränke; Orden +5 |
| Die Verlorenen Hundert (Hundertfeld) | Lanze mit Valen-Wimpel, E = eine Stunde graben | Feldherr der Hundert (Knochenritter) + 3 Knochenwächter | Feldkiste (Langschwert, Kettenhemd, Trank); Kriegsvorrat: Garnison +8 & Valen +5 · Kette 300 G, Kette +5, Valen −5 · Siedlung +20 Eisen, +10 Holz |
| Ausbrecherstollen (Steinbruch/Westgebirge) | 3 Kreidezeichen, lesbar ab Wahrnehmung 12 oder mit Goblin | Pferchmeister (Gewölbe) | Grubenplan: Goblins +10 · an die Kette 150 G, Kette +8, Goblins −20 |
| Brunnen der Durstigen (Sandruinen) | nur am Tag nach einem Sandsturm | 2 Verdurstete + 3 Wüstenräuber | Truhe (Dornensäbel, Wasserschlauch, Trank); Wasserrecht: Karak-Atar zollfrei & Händler +10 · Räuber 250 G, Händler −10 |
| Kammer der Namen (Seelenhügel) | Seelenphiole summt in der Nähe | 3 Schatten („Schreiber der Namen“) | Hort; Ahnen ruhen lassen (Willenskraft +1 je Ahn, max. 3, Tote −5) · Seelen ernten (3 Phiolen, Tote +10, Heerzug früher) · nichts |

- **Geprüft:** Lage aller Bezugsorte im Spiel bestätigt (seelenhuegel, sandruinen, steinbruch, marsh, hundertfeld vorhanden; Auslöser-Objekte für Glockenmoor, Stollen, Kammer, Hundert stehen in der Welt). Rätsel selbst nur Code gelesen.
- **Fehlversuche / Lücken:**
  - **„x von 8“, aber nur 5 Orte existieren** (`SECRET_N = 8`, game.js ≈14961). Uhrmacher, Leuchtfeuer, Walknocheninsel fehlen (OFFEN [B]). Der Spieler kann die Zählung nie vollenden.
  - Ohne Ahnen fehlt bei der Kammer die erste Wahl ganz (nur „ernten“ oder „nichts“) — gewollt, aber ohne Erklärung.
  - HB-40 (offen): Gewölbe-Geheimtruhe beliebig oft.

---

## 8. Zusammenfassung Fehlversuche

Nach Schwere sortiert. „live“ = im Spiel nachgestellt, „C“ = nur Code.

### Kritisch
1. **g_dod2 „Eisen für die Grubenstämme“ nie abschließbar** (live) — Ziel `item:iron`, Eisen landet als Rohstoff in `S.res.iron`, `questComplete` zählt nur das Gepäck. Blockiert g_dod3 und den Pakt des Sturms. data.js:1573, game.js `questComplete` (≈13569), `addItem` (≈210).

### Hoch
2. **Volles Gepäck verschluckt Auftragsbelohnungen** (live: Langbogen, Frostklinge) — `turnIn` prüft `addItem` nicht, kein Ablegen. game.js `turnIn` ≈13584; gleiches Muster beim Kronhelm (König Varon, Ritterschlag).
3. **q_ratssitz zahlt die 600 EP nie** (live, HB-37 offen) — game.js `corvanTalk` ≈10902.
4. **q_omega zahlt die 1000 EP nie** (live, HB-10-Rest) — game.js `omegaPerform` ≈10225.

### Mittel
5. **Angelegtes „Siegel des Ordens“ zählt nicht für q_paladin2** (live) — Umhang wird beim Anlegen aus dem Gepäck genommen, `questComplete` setzt Fortschritt auf 0. data.js:1516, game.js `questComplete`.
6. **Stirbt ein benannter Geber, ist sein fester Auftrag für immer offen** (C, Hunt-Sammelbefund) — kein Ersatzweg in `talk`/`turnIn`.
7. **Ruf ohne Grenze bei Auftragslohn** (C) — `turnIn` ≈13581, `finishLila` ≈13674, `claimContract` ≈7675, `runawayEnd`: `+=` ohne `clamp`.
8. **Abbruch-Strafe trifft Valen bei Verträgen ohne Stadt** (C) — Ahnenfeind-Steckbrief `town:null` → `townFac(null)` = Valen −3. game.js `nemesisHeir` ≈15437, `failContract` ≈7594.
9. **Abbruch von q_omega gibt beim Neustart erneut Vargs Kette** (C) — `vargRitual` → `addItem('vargs_kette')` je Start.
10. **Abbruch von q_tribut sperrt die Rückgabe** (C) — `tributeChoices` verlangt aktiven Auftrag; Tributgut bleibt im Gepäck.
11. Offene Hunt-Punkte im Auftragsbereich (C, unverändert): HB-31 Kultkrypta nach Tod des Blutfürsten, HB-32 Grisk-Rache neu annehmbar, HB-33 Rangziele nach Fall der Kette, HB-34 c_nec2-Wächter nur im Pakt, HB-35 Kills von Verbündeten bei Bossen, HB-36 Questgegenstände verkaufbar, HB-38 Gerichtsklage wiederholbar, HB-39 Entführtes Kind, HB-40 Gewölbe-Geheimtruhe, HB-41 Dodon nach Sturm-Abbruch, HB-42 Gorak einmalig (q_mine).

### Niedrig
12. **Geheime Orte zählen „von 8“, es gibt nur 5** — game.js `SECRET_N` ≈14961.
13. **Rook (`hostile:true`) zeigt Prüfungs-Abgaben nur über „Ausbilden“**, nicht im normalen Gespräch; Siegel über ihm fehlen (live) — data.js NPCS `rook`, game.js `clsTrialChoices` ≈13843.
14. `turnInStorm` (g_dod3) überspringt Beziehung +8, Ruhm +2 und Abschluss-Log — game.js ≈8544.
15. q_ratssitz-Ziel 1 zeigt bis zum Abschluss 0/1 (C) — `corvanTalk`.
16. q_intrige-Abbruch lässt `S.intrigue` stehen → kein neuer Intrigenauftrag (C).
17. kt_alchemist1 verlangt eine Seelenphiole, zieht sie nicht ab; kt_assassin1 zählt auch fast fremd erledigte Steckbriefe (C).
18. Debug „Aufträge → Abschließen“ zahlt keinen Lohn (Testfalle).
19. HB-45: Königsauftrag 1 still erledigt ohne Spawnpunkt (C).
20. Kelans Hinweistext nennt Ordensbeitritt, Bedingung ist nur Beziehung ≥ 10.

### Entscheidungen des Entwicklers nötig [E]
- Kein Fraktionsruf bei: Klassen-Questreihen (Ysra, Vhal, Mira, Ilva), Todesritter (Sael), q_pelts, q_hundred_song, Varon-Auftrag 1, Tributrückgabe, Entlaufenen laufen lassen. Soll es dort Ruf geben?
- Tickmar-Arbeiterrat: Ruf geht an Aurelion statt an die Arbeiter.
- Seevolk-Ränge 2 und 4 unerreichbar.
- Blutkult ohne Eintrag im Auftragsbuch.

### Bestätigt behoben (live)
- Eisenfeste-Aufträge geben jetzt Ruf bei der **Kette** (Entwickler-Beispiel). Alle 20 Städte + Eisenfeste zahlen bei der richtigen Fraktion.
- Doppelt abgeben bei festen Aufträgen und Verträgen nicht mehr möglich.
- Alle 40 Rangaufträge zahlen Formel-Lohn, Ruf richtig, Beförderung nach Teil b.
- Fristablauf: Vertrag scheitert, Ruf −2, Auftragsbuch „gescheitert“.


---

<!-- Teil C aus ist/C_kampf_gegner_charakter.md -->

# Ist-Zustand, Bereich C: Kampf, Gegner, Charakter

Stand: 03.10.2026, Code-Stand v24 (Dev-Server 8770). Grundlage: `src/data.js`, `src/game.js`, `src/body.js`, `src/render.js`, `src/ui.js`, `src/sky.js` sowie die alten Dokumente `docs/IST_ZUSTAND.md` und `docs/MECHANIKEN.md`.

**Hinweis zu den Zeilennummern:** `game.js` wurde während der Prüfung parallel bearbeitet. Die Zeilen können um einige Stellen verrutscht sein. Deshalb steht immer auch der Funktionsname dabei.

**Wie geprüft wurde:**
- Im Spiel: eigener Tab mit `?dev` und `RF.S._quiet = true`. Der Spielstand war vorher aus dem Backup zurückgesetzt und wurde am Ende wieder darauf gesetzt. Es wurde nie gespeichert, der Tab ist geschlossen.
- Der Tab lief im Hintergrund. Die Spielschleife wurde deshalb mit `RF.tick()` von Hand weitergedreht.
- „Live geprüft“ heißt: im Spiel ausgelöst. „Nur Code gelesen“ wird ehrlich so genannt.

---

## Inhaltsverzeichnis

1. [Grundwerte des Helden](#1-grundwerte-des-helden)
   - Attribute, Stufen, Talentpunkte, Statpunkte
   - Fertigkeiten (welche wirken wie?)
   - Schwierigkeitsgrade
2. [Nahkampf](#2-nahkampf)
   - Angriff und Kombo
   - Schwerer Hieb per Halten
   - Kampfstil nach Waffenseltenheit (Packs)
   - Deckung, Parade, Schild, Nahkampfabwehr
   - Ausweichen (Rolle)
   - Schleichangriff, Rückenstich, Wahrnehmung
3. [Fernkampf](#3-fernkampf)
4. [Schwere Angriffe der Gegner mit Ansage](#4-schwere-angriffe-der-gegner-mit-ansage)
5. [Zustände (Status)](#5-zustände-status)
6. [Körperzonen, Glieder, Bewusstlosigkeit, Verletzungen](#6-körperzonen-glieder-bewusstlosigkeit-verletzungen)
7. [Heilung](#7-heilung)
8. [Lebensbalken: Ziel, Boss, HUD, Gruppe](#8-lebensbalken)
9. [Tod, Heldentod, Erbe, Ahnenfeind](#9-tod-heldentod-erbe-ahnenfeind)
10. [Gefangennahme (Gegner nehmen und selbst gefangen werden)](#10-gefangennahme)
11. [Magie: Schulen, Zauber, Lehrer](#11-magie)
12. [Fähigkeiten (ABILITIES)](#12-fähigkeiten-abilities)
13. [Klassen, Lehrer und Klassenprüfungen](#13-klassen-lehrer-und-klassenprüfungen)
14. [Titelklassen](#14-titelklassen)
15. [Sternbild-Talente und Talentpunkte](#15-sternbild-talente-und-talentpunkte)
16. [Gefährten (Moral, Loyalität, Sternbild, Desertion)](#16-gefährten)
17. [Begleittiere und Reittiere](#17-begleittiere-und-reittiere)
18. [Bionik und Prothesen](#18-bionik-und-prothesen)
19. [Vampir und Blutkult-Fähigkeiten](#19-vampir-und-blutkult-fähigkeiten)
20. [Gegner: vollständige Tabelle (MONSTERS)](#20-gegner-vollständige-tabelle-monsters)
21. [Beutetabelle (LOOT) je Gegner](#21-beutetabelle-loot-je-gegner)
22. [Elite-Mini-Bosse (ELITES)](#22-elite-mini-bosse-elites)
23. [Bosse](#23-bosse)
24. [Zusammenfassung Fehlversuche](#zusammenfassung-fehlversuche)

---

## 1. Grundwerte des Helden

### Attribute, Stufen, Talentpunkte, Statpunkte

- **Was es ist:**
  - Sechs Attribute: Stärke, Beweglichkeit, Ausdauer, Intelligenz, Wahrnehmung, Willenskraft. Jedes startet bei 8, dazu kommen die Boni der Herkunft.
  - Aus den Attributen und der Stufe errechnen sich Leben, Ausdauer, Mana und Kritchance.
  - Mit jeder Stufe gibt es Punkte zum Verteilen.
- **Wo / Wer:** Charakterbogen (Taste C) und Sternenhimmel (Taste T). Die Herkunft wählt man bei der Charaktererstellung (`ORIGINS`, data.js:2–13).
- **Herkünfte:**

  | Herkunft | Attribute | Fertigkeiten | Startausrüstung | Gold |
  |---|---|---|---|---|
  | Feldknecht | Stärke +1, Ausdauer +2 | Überleben 5, Handwerk 4 | Axt, Hemd, Brot | 8 |
  | Jäger | Beweglichkeit +2, Wahrnehmung +1 | Bogen 8, Überleben 6, Jagd 6 | Kurzbogen, Lederwams, Dörrfleisch | 12 |
  | Lehrling | Intelligenz +2, Willenskraft +1 | Handwerk 7, Medizin 5 | Dolch, Hemd, 2 Heilkraut | 22 |
  | Ehemaliger Soldat | Stärke +2, Ausdauer +1 | Einhändig 9, Verteidigung 7 | rostiges Schwert, Holzschild, Lederwams | 10, Valen +10 |
  | Wanderer | Beweglichkeit, Wahrnehmung, Willenskraft je +1 | Überleben 4, Handel 4 | rostiges Schwert, Hemd, Brot | 30 |

- **Ablauf:**
  - Die nötige Erfahrung wächst je Stufe ×1,35, ab Stufe 10 ×1,2 und ab Stufe 20 ×1,04. Höchststufe ist 60 (`MAX_LEVEL`, game.js ~4275).
  - Jede Stufe gibt 1 Statpunkt, jede fünfte Stufe einen zusätzlichen.
  - Talentpunkte gibt es 1 zum Start und 1 auf jeder **zweiten** Stufe (`TALENT_EVERY = 2`). Dazu kommt +1 je bestandener Klassenprüfung (`talentTotal`, game.js ~4278).
  - Beim Laden wird auf dieses Soll aufgefüllt (`talentTopUp`), aber nie gekürzt.
  - Ein Aufstieg heilt voll, außer man liegt am Boden.
- **Belohnung / Folgen:** Statpunkte erhöhen die Attribute. Talentpunkte geben Sterne (siehe §15).
- **Bedienung:**
  - Charakterbogen mit Knöpfen „Stärke +1“ usw. Jeder Knopf erklärt im Tooltip, was das Attribut bewirkt (ui.js `charUI`, `ATTR_TIP`).
  - Debug: „Klassen: Talentpunkte, Prüfungen, Aufnahme“ (Punkte auffüllen, Rechnung zeigen, Stufe +2).
- **Geprüft:** Live.
  - Der Testheld auf Stufe 12 hat ein Soll von 7 Talentpunkten, aber 12 freie Punkte. Das ist so gewollt: Ältere Stände hatten mehr Punkte und behalten sie.
  - Nach der bestandenen Kriegerprüfung stieg das Soll auf 8, und es gab genau +1 Punkt.
- **Fehlversuche / Lücken:**
  - `docs/BALANCE_GUIDE.md` §7 nennt laut OFFEN.md noch „jede 3. Stufe“. Gilt seit 02.10. als überholt (nicht neu geprüft).
  - Alte Stände haben teils deutlich mehr Punkte als das Soll. Das ist Absicht („nie kürzen“), nur zur Kenntnis.

### Fertigkeiten (welche wirken wie?)

- **Was es ist:** 14 Fertigkeiten (`SKILL_NAMES`, data.js:15) von 0 bis 100. Sie wachsen durch Tun. Im Charakterbogen erklärt ein Tooltip je Fertigkeit, wie sie steigt (ui.js `SKILL_TIP`, ~1213).
- **Geprüft:** Nur Code gelesen. Für jede Fertigkeit wurde jede Stelle in `game.js`, `ui.js`, `body.js` und `economy.js` gesucht, die sie liest oder erhöht.

| Fertigkeit | Wie sie steigt | Was sie bewirkt | Urteil |
|---|---|---|---|
| Einhändig, Zweihändig, Stangenwaffen | +0,12 je Treffer mit der Waffenart (`hit`, ~3769) | mehr Schaden (`damageOf`, ~122), bis 25 % schnellere Hiebe (~3381) | wirkt |
| Bogen | +0,15 je Schuss (~4396) | Schaden und Spanntempo | wirkt |
| Verteidigung | +0,05 je eingesteckter Treffer, +0,3 je Abwehr | Abwehr von vorn: höchstens 30 % Chance, Schaden auf 35 %; ab 40 mit Gegenhieb (`hit`, ~3732) | wirkt |
| Medizin | Verbinden (+0,5) | Verband heilt mehr, Aufrichten geht schneller (~599, ~3945, ~12846). Ist auch die Fertigkeit am Kessel. | wirkt |
| Zähigkeit | +0,04 je Treffer, +1 je Aufstehen | kürzere Bewusstlosigkeit, bis −50 % (~3925) | wirkt |
| Überleben | Holzfällen, Zähmen | Zähmchance (~289), früher gewarnt vor Hinterhalten (ab 25, ~2999) | wirkt |
| **Jagd** | **nirgends** | **nirgends** | **Platzhalter.** Der Tooltip sagt selbst „Noch ohne Wirkung“ (ui.js ~1221). Die Herkunft „Jäger“ gibt Jagd 6 für nichts. |
| Handwerk | Werkbank (+0,3 bis +1,8) | Güte an der Werkbank, „Mit anpacken“ (~8335) | wirkt |
| Schmieden | Esse und Ausbessern | Güte an der Esse, Grenze der Selbstwartung von Prothesen (70 + Wert/5) (~5542) | wirkt (der Verdacht „Platzhalter“ trifft nicht mehr zu) |
| Handel | +0,3 je Kauf oder Verkauf | Preise (~14302) | wirkt |
| **Schleichen** | **nirgends** (auch keine Vorlesung) | nur in drei Würfen: Pferchschlüssel stehlen (~6246), Schmuggel in die Varonsburg (~9682), verbotene Abteilung (~14032) | **Halber Platzhalter.** Wächst nie, startet bei allen auf 0. Ein Schleichmodus fehlt. Der Tooltip gibt es zu. |
| Führung | Siege mit Gefährten, Befehle | +1 Gruppenplatz je 10 Punkte, Loyalität wächst schneller (~97, ~12860) | wirkt |

- **Fehlversuche / Lücken:**
  - **Jagd:** keine Wirkung, kein Wachstum (ui.js ~1221). Die Jäger-Herkunft verschenkt 6 Punkte.
  - **Schleichen:** kann nie steigen. Die drei Würfe rechnen darum immer mit 0.
    - Repro: `RF.S.player.skills.stealth` ist bei jeder neuen Figur `undefined`.
    - Eine Suche nach `skills.stealth =` findet nur eine Selbsttest-Zeile (~21313).
  - Der Verdacht „Schmiedekunst ist ein Platzhalter“ ist **behoben**: sie wirkt an der Esse und bei der Prothesenwartung.

### Schwierigkeitsgrade

- **Was es ist:** Drei Stufen, gewählt beim Spielstart (`DIFF`, game.js ~1891). Sie verändern über `BAL` die Werte der Gegner.

  | Stufe | Gegnerleben | Gegnerschaden | Ansagezeit | Beute | Kopfgeld verfällt | Glieder gehen verloren |
  |---|---|---|---|---|---|---|
  | Angsthase | ×0,75 | ×0,7 | ×1,3 | ×1,25 | ×2 so schnell | nie |
  | Schwer (Standard) | ×1 | ×1 | ×1 | ×1 | ×1 | ab −200 |
  | Sehr schwer | ×1,25 | ×1,3 | ×0,9 | ×0,85 | ×0,6 | ab −100 |

- **Weitere Folgen:**
  - Auf Angsthase bauen sich zerstörte Dörfer wieder auf, und große Folgen klingen nach 21 Tagen ab.
  - Auf Angsthase laufen die Rote Krönung und Morvaths Heerzug nicht.
  - Auf Sehr schwer tragen Bewohner und Ziele keine Siegel und Rauten.
- **Bedienung:** Auswahl bei der Charaktererstellung. Laut altem Dokument nicht nachträglich änderbar (nicht geprüft).
- **Geprüft:** Nur Code gelesen. Der Testspielstand läuft auf `schwer`.
- **Fehlversuche / Lücken:** keine gefunden.

---

## 2. Nahkampf

### Angriff und Kombo

- **Was es ist:** Linksklick oder Leertaste schlägt zu. Jeder Hieb läuft in Phasen ab: Ausholen, Schlag, Einschlag, Nachschwung, Erholung. Schaden, Trefferstopp und Klang kommen genau im Einschlag.
- **Ablauf:**
  - Die Kombo läuft so: Schlag 1 (Vorhand), Schlag 2 (Rückhand), dann der Wuchtschlag (Überkopf). Der Wuchtschlag macht +30 % Schaden, lässt taumeln und dauert 15 % länger (`hit`, `comboFin`, ~3697).
  - Ab Einschlag plus 40 % der Erholung bricht der nächste Kombo-Schlag die Erholung ab. Der Takt bleibt dabei gleich.
  - Jede Waffe kostet Ausdauer je Hieb (`ITEMS.stam`).
  - Das Waffengefühl (`FEEL`) bestimmt Trefferstopp (28–118 ms), Kamerawackeln und Ausfallschritt.
- **Schadensformel:**
  - Spieler: `damageOf`. Gegner: `MONSTERS.dmg × (1 + Stufe × 0,06) × 1,4 × Schwierigkeit`. Bosse teilen davon nur 60 % aus (`BOSS.dmg`).
  - Kritischer Treffer: 5 % + Wahrnehmung × 0,4 % + Talente und Affixe. Er macht ×1,8 oder den Wert der Waffe.
  - Rüstung wird zu 55 % abgezogen. Bei Gegnern zählt ihr Rüstungswert ×1,6. Panzerbrechen höchstens 90 %.
  - Ein Gegner, der nach seinem schweren Angriff offen ist, nimmt +25 %.
- **Waffeneigenschaften:**
  - Hinrichtung, „gegen Ungerüstete“, Fesseln, Blutung, Frost, Totenglocke (Einschüchtern).
  - Wucht (Kriegshammer): kein Schild hält ihn, Deckung kostet doppelt.
  - Peitsche zieht heran, Sensen mähen in die Breite (siehe `hit`, ~3755–3767).
- **Bedienung:**
  - Keine Fenster nötig. Treffer zeigen Pixelziffern in der Farbe der Schadensart, Krits groß und golden. Die Einstellung liegt unter Optionen → Schadenszahlen.
  - Debug: „Kampf-Feedback …“ und der „Combat Test Room“.
- **Geprüft:**
  - Live: Treffer mit `RF.hurt` und Gegnertode.
  - Kombo und Abbruch der Erholung: nur Code gelesen. Der Selbsttest hat dafür eigene Proben („Kampfanimation Scheibe 1“).
- **Fehlversuche / Lücken:**
  - Laut OFFEN.md noch offen: Der Dolch macht gegen Banditen +17 % Schaden je Sekunde, weil sein Ausholen nur 60 ms dauert.

### Schwerer Hieb per Halten

- **Was es ist:** Aus der Ruhe die linke Maustaste halten.
  - Ab 0,18 s hebt die Figur die Waffe, und ein Ring am Boden füllt sich.
  - Nach 0,8 s ist der Hieb voll geladen: +30 % Schaden, Taumeln, **nicht blockbar**.
- **Ablauf:**
  - Früher loslassen gibt einen normalen Schlag.
  - Rolle, Deckung oder Waffenwechsel brechen das Laden ab.
  - Technisch setzt der Hieb `UNBLOCK` (`resolveSwing`, ~3431).
- **Bedienung:** Das Log erklärt es beim ersten Laden. Debug im Test Room.
- **Geprüft:** Nur Code gelesen. Probe „Kampfanimation: schwerer Hieb“ im Selbsttest.
- **Fehlversuche / Lücken:**
  - OFFEN.md [E]: Eigener Schadensfaktor, Ladezeit je Waffe, Ausdauerkosten und Laden für Koop-Gäste sind noch nicht entschieden.

### Kampfstil nach Waffenseltenheit (Animations-Packs)

- **Was es ist:** Wie wuchtig die Hiebe aussehen, hängt von der Seltenheit der Waffe ab. Das ist reine Optik, Schaden und Takt bleiben gleich (MECHANIKEN 03.10.).
  - Gewöhnlich und ungewöhnlich: Pack A „Grounded“.
  - Selten und episch: Pack B „Heroic“, Trefferstopp ×1,4.
  - Legendär und mythisch: Pack C „Endgame“ mit Nachbildern und Druckwelle, Trefferstopp ×1,8.
  - Gegner zeigen immer Pack A.
- **Bedienung:** Im Debug-Test-Room lässt sich jedes Pack erzwingen.
- **Geprüft:** Nur Code gelesen (`atkPackFx`, `atkImpact`, ~3784).
- **Fehlversuche / Lücken:**
  - ~~Ausrollen auf Axt, Kolben, Stange, Sense, Stab steht aus.~~ **Erledigt 04.10.:** Axt, Kolben/Flegel, Stangenwaffe (inkl. Sense), Rapier, Peitsche, Stab haben eigene Profile, Körperposen und Haltungen; dazu Gewicht je Klasse (siehe Kopf der Datei). Offen bleiben Bogen/Armbrust (Zielhaltung), Magie und besondere Bosswaffen.

### Deckung, Parade, Schild, Nahkampfabwehr

- **Was es ist:** Mit gehaltener Umschalttaste geht man in Deckung.
- **Ablauf** (`guarded`, ~16501; `GUARD = { parry:180, arc:1.22 }`):
  - **Parade:** Hebt man die Deckung in den letzten 180 ms vor einem Nahkampftreffer, gibt es keinen Schaden. Der Angreifer taumelt 900 ms (Boss 450 ms). Danach ist 1,2 s lang eine Riposte mit dem Rapier möglich (×2,2). Es gibt eine Parade je gehobener Deckung.
  - **Block in Deckung:** kostet Ausdauer = Schaden × 0,8 mit Schild, × 1,2 ohne. Reicht die Ausdauer nicht, bricht die Deckung: 0,5 s Taumeln, und der Hieb trifft voll.
  - **Passiver Schildblock** ohne Deckung: Chance = Blockwert × 0,7 + Setbonus.
  - **Schildarten:**

    | Schild | Wirkung |
    |---|---|
    | Buckler | Parade-Fenster +60 % |
    | Turmschild | kaum Parade |
    | Stachelschild | 35 % des Hiebs gehen zurück |
    | Magitech-Schild | Energiefeld, 6 Energie je Block |

  - **Nahkampfabwehr** (Fertigkeit Verteidigung) ohne Deckung: siehe Tabelle der Fertigkeiten.
  - Flächenangriffe und schwere Angriffe umgehen all das (`AREA`, `UNBLOCK`).
- **Bedienung:** Zeichen statt Text: Schild = Block, gekreuzte Klingen = Parade.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine gefunden.

### Ausweichen (Rolle)

- **Was es ist:** Taste Q. Ein Sprung von 92 px in 240 ms, unverwundbar. Kostet 20 Ausdauer, Abklingzeit 850 ms (`DODGE`, ~16660).
- **Ablauf:**
  - Der Mönch-Titel macht die Rolle 25 % billiger.
  - Jedes Ausweichen ins Leere gibt dem Mönch Fokus.
  - Die Mönchsrobe (Klassenrüstung) weicht von selbst aus: 20 % bei 2 Teilen, 30 % bei 3.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine.

### Schleichangriff, Rückenstich, Wahrnehmung

- **Was es ist:**
  - Ein Angriff auf einen ahnungslosen Gegner (Team noch „neutral“) macht ×1,5, von hinten ×3 („Hinterhalt!“).
  - Ein Treffer gegen die Kette löst Alarm aus: Kette −10, Kettenalarm 2 Tage (`hit`, ~3704, ~3717).
  - Rückenstich: Dolch, Hakenmesser und Rapier kritten von hinten mit 50 %.
- **Wahrnehmung:**
  - Beim Helden erhöht sie die Kritchance.
  - Bei Gegnern bestimmt die Sichtweite (`MONSTERS.sight`, 140–420 px), wann sie angreifen.
  - Wetter verändert den Gegnerblick: Nebel −40 %, Sandsturm −30 %, Blutregen +25 %.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - Es gibt **keinen Schleichmodus**. Ob man unentdeckt ist, entscheidet nur Abstand und Sicht.
  - Die Fertigkeit Schleichen spielt dabei keine Rolle (siehe oben).

---

## 3. Fernkampf

- **Was es ist:** Bogen, Armbrust (spannen, Tempo 60 %), Zauberstab, Wurfmesser, Wurfbeil, Schleuder, Messingpistole, Donnerbüchse, Schockpistole und Magiegewehr.
- **Ablauf:**
  - Schüsse brauchen freie Sicht (`clearLine`). Pfeile prallen an Wänden ab und fliegen über Liegende hinweg.
  - Geschosse sind blockbar.
  - Der „Nahschuss“ trifft auch direkt vor dem Schützen.
  - Regen senkt den Fernkampf um 10 %, Sandsturm um 30 %.
- **Gegnerische Schützen** halten Abstand (`archerAI`): Banditenschütze, Kettenschütze, Harpunier, Netzwerferin, Knochenschütze, Kultist, Nekromant, Blutmagier, Lichtschütze, Ophan, Student.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine neuen.

---

## 4. Schwere Angriffe der Gegner mit Ansage

- **Was es ist:**
  - Manche Gegner holen lange aus. Eine rote Bodenmarke zeigt Kreis, Ring oder Linie und füllt sich bis zum Einschlag.
  - Die Angriffe sind **nicht blockbar**. Nur Rolle, Hinausgehen oder der Gegenstrom des Mönchs helfen.
  - Danach ist der Gegner 0,6 s offen (+25 % Schaden).
- **Gegner mit schwerem Angriff** (`MONSTERS.heavy`; Ansage × Schwierigkeitsfaktor `tele`):

  | Gegner | Art | Jeder n-te Angriff | Ansage (ms) | Schaden | Radius/Länge (px) |
  |---|---|---|---|---|---|
  | Kettenknecht | slam (Kreis) | 3. | 800 | ×2,2 | 70 |
  | Rotgardist | thrust (Linie) | 3. | 700 | ×2,0 | 130 |
  | Plünderer der Sturmklinge | thrust | 4. | 650 | ×1,7 | 110 |
  | Hauptmann der Toten | slam | 3. | 750 | ×1,9 | 75 |
  | Knochenritter | sweep (Bogen) | 3. | 750 | ×1,8 | 80 |
  | Todesritter | sweep | 3. | 800 | ×2,0 | 90 |
  | Dodon | slam | 2. | 900 | ×2,4 | 95 |
  | Bomben-Skelett | blast (Selbstzündung, trifft alle) | 1. | 900 | ×1,6 | 72 |
  | Großes Skelett | slam, wirft 22 px zurück | 2. | 800 | ×1,8 | 85 |
  | Dampframme | charge (Rammstoß, zerbricht Fässer und Kisten) | 1. | 1200 | ×1,4 | 180 |

- **Weitere Ansagen mit eigener Regel:** Gorak (`bossAI`), Hrodvar (Eiskreis, Eislanze), Garmadon, Omega (Sternenfall, Strahl, Nova), Aldhelm (Blutsiegel). Siehe §23.
- **Bedienung:** Rote Bodenmarke, Warnzeichen über dem Kopf. Debug: „Kampf-Feedback: schwerer Angriff jetzt“.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - MECHANIKEN §2 sagt noch „**Sieben** Gegnerarten“. Es sind inzwischen **zehn**. Nur das Dokument ist veraltet.

---

## 5. Zustände (Status)

- **Was es ist:** Effekte auf Figuren (`addStatus`). Sie zeigen sich als Zeichen am Lebensbalken und am Körper (Flammen, grüne Bläschen, Eisrand, Funken). Das Fenster X „Aktive Effekte“ listet sie.
- **Negativ:**

  | Zustand | Auslöser | Wirkung |
  |---|---|---|
  | Blutend | Treffer > 10 mit 25 % Chance (12 s), Abtrennen (30 s) | Schaden über Zeit |
  | Vergiftet | Seuchenleiche (50 % je Biss), Giftöl | Schaden über Zeit |
  | Gefesselt/Durchfroren (`chilled`) | Kettenpeitsche, Frostwaffen, Unterkühlung | −40 % Tempo |
  | Gepackt | Wiedergänger | −50 % Tempo |
  | Brennt | Feuerzauber, Elite „Brand“ | Schaden über Zeit |
  | Frost | stapelt sich bis 3 | −15 % Tempo je Stufe, bei 3 Stufen 1,5 s eingefroren |
  | Schock | Blitz | kurze Betäubung, danach 3 s immun |
  | Sonnenbrand | Vampir bei Tag | 1,2 Schaden/s, −20 % Schaden |
  | Fleckfieber | Seuche | Leben −5 am Tag, halbe Ausdauer |

- **Positiv:** Ausgeruht (+10 % EP), Raserei, Kriegslied, Segen, Omegas Zorn, Giftöl, Knochenschild, Regeneration, Elixier (immer nur eines, danach 30 s Magenpause), Gegenstrom.
- **Heilung von Zuständen:** Schlaf heilt Blutung, Gift, Unterkühlung und Griff (`SLEEP_CURES`).
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine neuen.

---

## 6. Körperzonen, Glieder, Bewusstlosigkeit, Verletzungen

- **Was es ist:** Der Held und alle menschenähnlichen Figuren haben sechs Körperteile (`body.js`).
  - Kopf 25 % und Rumpf 45 % der Grundlebenspunkte.
  - Arme und Beine haben je 100 Punkte × Körperbau.
  - Trefferwahrscheinlichkeit: Kopf 6, Rumpf 46, jedes Glied 12. Die Seite, von der man getroffen wird, zählt mehr. Abgetrennte Glieder fangen keine Treffer mehr.
- **Ablauf** (`damagePart`, body.js:73):
  - Ein Gliedtreffer gibt 40 % ab, davon die Hälfte an den Rumpf.
  - Bei 0 fällt das Glied aus. Ein Arm aus: die Waffe fällt. Ein Bein aus: Humpeln. Beide Beine aus: Kriechen.
  - Abgetrennt wird erst unter −200 (Sehr schwer: −100, Angsthase: nie).
  - Kopftreffer ohne Krit sind auf 60 % des Kopf-Maximums gedeckelt.
  - Kopf auf 0 heißt bewusstlos. Enthauptet wird nur bei einem Krit mit 50 % Überschuss.
  - **Rumpf ≤ 0 heißt „am Boden“.** Bei Gegnern ist das in der Regel der Tod.
- **Am Boden** (`downed`, ~3925):
  - Zeit bis zum Verbluten: Held 15 s allein, 30 s mit Gruppe. NPCs 11 s. Zähigkeit verkürzt die Ohnmacht.
  - Nur der Held kommt von allein zu sich. Andere brauchen jemanden, der sie aufrichtet.
  - Wachen, die selbst angegriffen werden, heben niemanden auf.
- **Verletzungen über Tage:**
  - Bruch (60 %): Das Glied heilt höchstens bis 40 %, 4 Tage lang. Schienen verdoppeln das Tempo.
  - Entzündung: 25 % (abgetrennt 60 %).
  - Narben: +1 Rüstung je Narbe, höchstens 5.
- **Bedienung:** Körperdiagramm im Charakterbogen (`bodyChart`, Wundliste) und Debug „Verletzung: …“.
- **Geprüft:** Live.
  - Bei einem Übungsfechter mit 94 Punkten (Kopf 30, Rumpf 64) sank der Rumpf mit jedem 8er-Treffer.
  - Bei Rumpf 0 starb der Fechter, obwohl Kopf und Glieder noch voll waren (siehe §8 und §13).
- **Fehlversuche / Lücken:**
  - Behoben laut Hunt-Bericht: HB-14, -15, -16, -17, -21, -22.
  - Neu: Die Lebensanzeige berücksichtigt das Ende „Rumpf auf 0“ nicht. Siehe §8.

---

## 7. Heilung

- **Was es ist:** Mehrere Wege, um Leben zurückzubekommen.

  | Weg | Wirkung |
  |---|---|
  | Heiltrank „Trank der Genesung“ | 40 Leben, stapelt 5, 55 Gold |
  | Verband | heilt ein Körperteil, stillt Blutung; Anlegen 2,5 s |
  | Heilkraut | 10, wie ein Verband |
  | Brot / Dörrfleisch | 6 / 10, dazu Nahrung |

  Dazu kommen Heilzauber (§11), Heiliges Heilen (Kleriker), Feldverband (Talent), Stilles Wasser (Mönch), Erdsegen (Druide), Lebensraub (Waffen, Affix Blutzoll, Grabhieb), Schlaf, Heilerin, Medica und Feldscher („Wunden versorgen“ 25 Gold, schient Brüche).
- **Grenzen:**
  - Medizin heilt keine Prothesen (HB-16 behoben).
  - Am Boden heilt sich niemand selbst (HB-22 behoben).
  - Für Vampire wirken Tränke, Verbände und Heilzauber nur halb.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** keine neuen.

---

## 8. Lebensbalken

- **Was es ist:** Vier Anzeigen.
  - **HUD-Balken** des Helden (ui.js:129).
  - **Gruppenleiste** (ui.js:153).
  - **Zielbalken** über einem gewählten Gegner (Rechtsklick) oder, ohne Auswahl, 5 s lang über dem zuletzt getroffenen (render.js `barTarget`/`drawTargetBar`, ~3338).
  - **Bossleiste** unten in der Mitte, sobald ein Boss näher als 520 px ist (render.js `drawBossBar`, 264). Sie trägt eine Marke bei 50 % für den Phasenwechsel.
- **Ablauf:** Alle vier zeigen `hp / maxHp`.
- **Geprüft:** Live mit einem Übungsfechter, dazu Code gelesen.
  - Der Fechter fiel bei `hp = 29–31` von `maxHp = 94` tot um. Der Balken stand in diesem Moment noch bei **31–33 %**.
- **Fehlversuche / Lücken:**
  - **[Hoch] Der Balken erreicht bei menschenähnlichen Figuren nie 0, wenn sie fallen.**
    - Für Figuren mit Körper rechnet `B.syncHp` (body.js:43–47) `hp` = Kopf + Rumpf.
    - Der Tod oder das „am Boden“ hängt aber nur am Rumpf (`vital`, body.js:49). Ist der Kopf unverletzt, bleiben rund **36 %** stehen (Kopf 25 ÷ (25 + 45)).
    - Betroffen sind alle vier Anzeigen: Ziel, Boss (Varg, Aldhelm, Garmadon, Hrodvar, Weißbart, Gorak sind menschenähnlich), HUD und Gruppe. Der Held geht bei gut einem Drittel Balken zu Boden.
    - Die 50-%-Phasenmarke der Bossleiste passt deshalb nicht zum echten Rest.
    - Repro: Debug „Gegner … vor dir“ (z. B. Bandit), mit Rechtsklick wählen, mit kleinen Hieben auf den Körper schlagen. Er fällt, während der Balken noch ein Drittel zeigt.
    - Für Tiere, Dodon und Omega ohne Körper stimmt der Balken.
  - OFFEN.md [E]: Die 5 s für „zuletzt getroffener Gegner“ sind vom Lead gesetzt, aber noch nicht bestätigt.

---

## 9. Tod, Heldentod, Erbe, Ahnenfeind

- **Was es ist:** Stirbt der Held, endet nicht das Spiel, sondern eine Generation. Das Haus lebt weiter.
- **Ablauf:**
  - **Heldentod-Moment:**
    - 3 s Zeitlupe, die Kamera rückt heran, eine Totenglocke schlägt, Name und Haus stehen im Bild.
    - Der Mörder zeigt auf den Toten. In diesen Sekunden stirbt niemand aus der Gruppe.
    - Esc oder Leertaste überspringen. Der Tod ist schon gespeichert.
  - **Erbenwahl** (`playerDeath` → `chooseSuccessor`):
    - Zuerst eigene erwachsene Kinder, dann der Ehepartner, dann Gefährten. Entfernte Verwandte nur bei freiem Platz, höchstens 3 Erben.
    - Der Erbe bekommt 70 % des Golds, 50 % jedes Rufs und den halben Ruf der Klinge.
    - Er hat sofort Talentpunkte nach seiner Stufe, aber keine gelernten Sterne und keine Prüfungen.
    - Ohne Erben erlischt das Haus.
  - **Grab:** Die Ausrüstung liegt im Ahnengrab. Dort gibt es Epitaph, Epilog und „Zwanzig Jahre später“.
  - **Bindungen (HB-20, 03.10.):** Der Ehepartner bleibt als Witwer im Haus, ist aber mit dem Erben nicht verheiratet. Gefangene kommen frei.
  - **Ahnenfeind (T10):**
    - Wer den Helden tötet (kein Boss, keine Wache), bekommt einen Namen und die Hauptwaffe samt Geschichte. Er wird bis zu 3 Stufen stärker als der Erbe. Höchstens 3 Ahnenfeinde gleichzeitig.
    - Er zieht durch Bandenlager. Frühestens nach 10 Tagen, dann alle 10–20 Tage, greift er die Stadt der Familie an. Dort brennen Häuser, und mit 30 % wird ein Kind entführt.
    - Der Erbe bekommt einen Steckbrief.
    - Tötet man ihn, liegt die Ahnenwaffe da. Dazu der Titel „Rächer des Hauses“ und Ruhm +10.
  - Stirbt man während des Goblin-Sturms, fällt Morrgrund.
- **Gegner:** der Ahnenfeind (Art des Mörders) mit zwei Gefolgsleuten.
- **Bedienung:** Todesbildschirm, Erbenwahl als Pergamentkarten. Debug „Ahnenfeind und Heldentod (T10)“.
- **Geprüft:** Nur Code gelesen. Sterben ist nur in Wegwerf-Slots erlaubt, und es gab keinen Bedarf: Der Selbsttest hat die Proben „T10 …“.
- **Fehlversuche / Lücken:**
  - HB-01 (gespeicherter Tod ohne Erbenwahl) ist laut OFFEN.md behoben.
  - Offener Fit-Befund: Der Erbe übernimmt uneinheitlich (IHF-05). „Zwanzig Jahre später“ lässt die Welt stehen (IHF-06).

---

## 10. Gefangennahme

- **Was es ist:** Zwei Richtungen.
  - **Gefangene nehmen (T08):** Ein Mensch ergibt sich („Gnade!“) oder liegt bewusstlos. Dann E → „Gefangenen nehmen“. Wahl zwischen:
    - Verhören (ruhig oder hart)
    - Fesseln (braucht einen Strick, 6 Gold)
    - Anwerben (Loyalität 20)
    - Ausrauben
    - Laufen lassen
    - Hinrichten
  - **Abliefern** bei Wachen: 8 Gold + 2 je Stufe, Fraktion +1. Steckbriefe zahlen lebend ×1,5.
  - Jede Wahl verschiebt den **Ruf der Klinge** (−100 bis +100 je Region). Er bestimmt, wie oft sich Feinde ergeben und wie viel Schutzgeld Banden verlangen.
  - **Selbst gefangen werden:** Die Wache stellt dich: zahlen, mitkommen oder wehren. Im Kerker: Kaution, Schloss knacken (Dietrich-Minispiel) oder absitzen. Dazu Schuldknechtschaft bei Kette und Aurelion (halbes Tempo, keine Waffe, ein Wächter folgt dir, sechs Wege hinaus). Das gehört zum Bereich Verbrechen und wird dort ausführlich beschrieben.
- **Bedienung:** Dialogliste, kein eigenes Fenster. Debug „Gefangene und Klinge (T08)“.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** OFFEN.md nennt „Schuldknechtschaft“ noch als reine Dialogliste ohne Fenster.

---

## 11. Magie

### Schulen, Wirken, Übung

- **Was es ist:**
  - Magie ist ein Weltsystem, keine Klasse. Wer einen Zauber lernt, hat Mana: 30 + Intelligenz × 4 + Willenskraft × 2 + Stufe × 2.
  - Acht Schulen: Feuer, Frost, Blitz, Arkan, Schatten, Glaube, Heilung, Schutz.
  - **31 Zauber** (`sp_*`). MECHANIKEN §3 sagt noch „22 Zauber in 6 Schulen“; das ist veraltet.
- **Ablauf:**
  - Die Sammelzeit beträgt 150–900 ms, sichtbar an einer Rune in der Schulfarbe. Ein Treffer bricht ab, die Hälfte des Manas kommt zurück.
  - Rang II nach 25 Einsätzen, Rang III nach 100. Stärke ×1 / ×1,25 / ×1,5.
  - Glaubenszauber wachsen mit Kettenrang und Glauben. Heilige Zauber treffen Untote ×2,1.
  - Verbotene Magie (Schatten und Blut) vor Zeugen einer Macht, die sie hasst, bringt Kopfgeld: 60 Gold, beim Orden 120. Ab der dritten Tat jagen Magierjäger mit Bann: Zauber bricht ab, Mana halbiert, 5 s Stille.
- **Lehrpreis und Bedingungen:**
  - Preis 30 / 80 / 180 Gold je Stufe, Ruf und Haltung der Macht senken ihn.
  - Intelligenz 8 / 11 / 14.
  - Beziehung 10 zum Lehrer (außer Akademie, Ilvar, Irmgard).
  - Dazu eine Regel je Lehrer (`SPELL_RULES`).
- **Bedienung:**
  - Zauberbuch (Z) mit Reitern je Schule und „Auf Leiste legen“.
  - Lehrer über „Kannst du mir Magie beibringen?“. Das ist eine **Dialogliste**, kein Fenster (OFFEN.md [B]).
  - Kodex (H) → „Magie“ zeigt bekannte Lehrer.
- **Geprüft:** Live. Für jeden der 31 Zauber wurde ermittelt, welche lebende Figur ihn lehrt (`spellsTaught` in `S.ents`). Bei Aldis, Corvinus, Serafine, Elena und Morvath wurde das Lehrmenü geöffnet.

### Alle Zauber mit Lehrer

| Zauber | Schule | Stufe | Mana / Abklingzeit | Form | Lehrer (live gefunden) | Bedingung |
|---|---|---|---|---|---|---|
| Funke | Feuer | 1 | 6 / 1,4 s | Geschoss | Morvath, Serafine, Ilvar | Bez. 10 |
| Feuerpfeil | Feuer | 1 | 10 / 2,5 s | Geschoss, Brand 35 % | Morvath, Serafine | Bez. 10 |
| Flammenstoß | Feuer | 2 | 16 / 5 s | Strahl | Morvath, Corvinus | Bez. 10 bzw. Schein |
| Flammenkreis | Feuer | 3 | 28 / 12 s | Ring | Corvinus | Bürger oder Adept |
| Feuerwand | Feuer | 3 | 26 / 15 s | Wand | Corvinus | Bürger oder Adept |
| Froststoß | Frost | 1 | 9 / 2,2 s | Geschoss, Frost | Corvinus | Schein |
| Eisspeer | Frost | 2 | 16 / 4,5 s | durchdringt | Corvinus | Schein |
| Einfrieren | Frost | 3 | 26 / 14 s | Fläche, 3 Frost | Corvinus | Bürger oder Adept |
| Eiswand | Frost | 3 | 24 / 16 s | feste Wand 8 s | Corvinus | Bürger oder Adept |
| **Schock** | Blitz | 1 | 8 / 2,4 s | Geschoss, Schock | **Corvinus** | Schein |
| Blitz | Blitz | 2 | 16 / 4,5 s | Strahl | Corvinus | Schein |
| Kettenblitz | Blitz | 3 | 24 / 9 s | 3 Sprünge | Corvinus | Bürger oder Adept |
| Energiegeschoss | Arkan | 1 | 7 / 1,6 s | Geschoss | Serafine, Corvinus, Ilvar | – |
| Magieschild | Arkan | 2 | 18 / 15 s | Schild | Corvinus, Ilvar | – |
| Kurzteleport | Arkan | 3 | 20 / 8 s | Sprung 180 px | Corvinus | Bürger oder Adept |
| Magieunterbrechung | Arkan | 2 | 14 / 10 s | bricht Zauber und schwere Angriffe | Corvinus, Ilvar | – |
| Schattenpfeil | Schatten | 1 | 9 / 2,2 s | Geschoss | Ilvar | Vertrauen 0 |
| Seelenzug | Schatten | 2 | 16 / 6 s | 50 % Lebensraub | Ilvar | Vertrauen 25 |
| Skelett erheben | Schatten | 3 | 22 / 12 s | 1 Diener, 45 s | Ilvar | Vertrauen 50 |
| Seelenbersten | Schatten | 3 | 28 / 14 s | Ring | Ilvar | Vertrauen 75 |
| Nachtglas (legendär) | Schatten | 3 | 40 / 60 s | Zeit 6 s auf 30 % | nur Ilvars Endprüfung | Vertrauen 100 + Prüfung |
| Heilige Flamme | Glaube | 1 | 10 / 2,6 s | Geschoss, heilig | Irmgard (Eisenfeste) | Kettenrang oder Glaube 20 |
| Schutzsegen | Glaube | 1 | 10 / 9 s | Schild | Irmgard | wie oben |
| Lichtstrahl | Glaube | 2 | 16 / 5 s | Strahl, heilig | Irmgard | Kettenrang 1 oder Glaube 40 |
| Inquisition | Glaube | 3 | 24 / 14 s | Fläche, deckt Verborgene auf | Irmgard | Kettenrang 2 oder Glaube 60 |
| Kleine Heilung | Heilung | 1 | 10 / 4 s | Selbst | Elena, Mutter Aldis | Bez. 10 / Orden Novize |
| **Blutung stillen** | Heilung | 2 | 12 / 6 s | Selbst | **Mutter Aldis** (Sonnwacht), gerettete Hexe (§5c) | Orden Rang Akolyth |
| **Regeneration** | Heilung | 2 | 18 / 16 s | Gruppe, 10 s | **Mutter Aldis**, gerettete Hexe | Orden Rang Akolyth |
| Starke Heilung | Heilung | 3 | 26 / 9 s | Selbst | Mutter Aldis | Orden Rang Wächter |
| Schild | Schutz | 1 | 9 / 9 s | Selbst | Serafine, Mutter Aldis | – |
| Schutzkreis | Schutz | 3 | 24 / 18 s | Gruppe | Mutter Aldis, Corvinus | Orden Wächter bzw. Bürger/Adept |

- **Gegner-Zauberer:**
  - Kultist der Asche: Feuerpfeil, Funke; heilt Untote.
  - Nekromant: Froststoß, Schild; ruft bis zu 3 Knochendiener.
  - Student: Funke, Froststoß.
  - Blutmagier: Schattengeschoss, das ihn heilt.
- **Fehlversuche / Lücken:**
  - **Behoben:** Der Verdacht „`sp_regen`, `sp_shock`, `sp_staunch` haben keinen erreichbaren Lehrer“ (vollstaendigkeit.md H7, OFFEN.md) stimmt nicht mehr.
    - Live gesehen: Mutter Aldis (Sonnwacht, 934/417) bietet „Blutung stillen — Stufe 2“ und „Regeneration — Stufe 2“ an.
    - Magister Corvinus (Akademie Aurelheim) bietet „Schock — Stufe 1, 26 Gold“ ohne fehlende Bedingung an.
    - Die Lehrtexte in data.js passen inzwischen dazu. Offen bleibt nur: Für Stufe 2 bei Aldis braucht man den Ordensrang Akolyth. Ob dieser Rang gut erreichbar ist, gehört zum Bereich Fraktionen (nicht geprüft).
  - **[Niedrig]** Der Lehrtext von Funke, Feuerpfeil und Energiegeschoss nennt noch einen „Wandermagier in Kreuzweg“. Gemeint ist Serafine. Der Text im Zauberbuch ist dadurch ungenau (data.js:741–753).
  - **[Niedrig]** Schutzkreis kostet bei Corvinus 180 Gold, bei Aldis 153 Gold. Das ist so gewollt: Liebe der Macht und Ruf senken den Preis. Nur zur Kenntnis.

---

## 12. Fähigkeiten (ABILITIES)

- **Was es ist:** 79 aktive Fähigkeiten, davon 31 Zauber.
  - Kosten: Ausdauer, Mana, Heilkraut oder Titelressource.
  - Fähigkeiten der Klasse liegen auf der Leiste (`syncHotbar`, Tasten 1–0).
  - Fähigkeitssterne ändern Schaden, Abklingzeit, Kosten und Dauer (`abMod`).
- **Geprüft:** Nur Code gelesen. Live nur Wuchtschlag: Er kommt nach der Kriegeraufnahme auf die Leiste.

**Klassenfähigkeiten**

| Fähigkeit | Klasse(n) | Kosten | Abklingzeit | Wirkung |
|---|---|---|---|---|
| Wuchtschlag | Krieger, Ritter, Berserker, Todesritter | 22 Ausdauer | 6 s | doppelter Waffenschaden, kurze Betäubung |
| Gezielter Schuss | Schütze, Waldläufer, Kettenjäger | 18 A | 7 s | weiter Schuss, hoher Krit |
| Meuchelstich | Schurke, Assassine, Folterknecht | 20 A | 8 s | ×3 von hinten |
| Heiliges Heilen | Kleriker, Paladin | 18 Mana | 9 s | heilt dich oder den nächsten Gefährten |
| Feuerball | Magier | 16 M | 5 s | Flächenfeuer |
| Segen | Ritter, Paladin | 20 A (seit 03.10.) | 20 s | Rüstung der Gruppe für 20 s |
| Heiliger Schlag | Paladin | 14 M | 7 s | schwer gegen Untote |
| Ziel markieren | Waldläufer | 10 A | 12 s | Ziel nimmt +25 % |
| Raserei | Berserker | 15 A | 18 s | 8 s Schaden +35 %, Tempo +15 %, nimmt +20 % |
| Schattenschritt | Assassine | 18 A | 10 s | hinter das Ziel; nächster Hieb ×2,5; nicht in Kette oder Platte |
| Kriegslied | Barde, Kettenbarde | 12 A | 22 s | 12 s Gruppe +15 % Schaden |
| Missklang | Barde | 14 A | 14 s | Gegner taumeln und verfehlen 3 s |
| Feuerflasche | Alchemist | 2 Kraut | 6 s | Feuer am Zielort |
| Giftöl | Alchemist | 1 Kraut | 20 s | Treffer vergiften |
| Trank brauen | Alchemist | 3 Kraut | 30 s | ein Heiltrank |
| Lebensentzug | Todesritter | 20 M | 11 s | Schaden, der heilt |
| Grabhieb | Todesritter | 20 A | 9 s | ×1,8, 30 % Lebensraub |
| Todesmahr | Eidwacht-Rüstung (2 Teile) | 18 A | 9 s | Stoß, ⅓ heilt |
| Kettenschlag, Furcht-Aura, Befehl der Kette, Blutpreis | Dunkler Hochpaladin | 10–18 A | 8–30 s | heranziehen, Furcht, Wachen folgen, Blut heilt |
| Brandmal Omegas, Kettengebet, Opferblut | Dunkler Priester | 14/20 M bzw. Leben | 9–20 s | Brandmal +25 %, Gruppenheilung, Leben → Mana |
| Fangnetz, Kettenhund | Kettenjäger | 16/12 A | 10/40 s | 3 s festhalten, ein Hund 30 s |
| Wille brechen, Henkersstreich | Folterknecht | 14/22 A | 14/12 s | Einschüchtern; ×3 gegen Geschwächte |
| Marschtrommel, Klagelied der Kette | Kettenbarde | 12/14 A | 25/16 s | Tempo; Gegner langsamer und eingeschüchtert |
| Schattenblitz | (keine Klasse) | 14 M | 4 s | Schattengeschoss. Steht in der Tabelle, ist aber keiner Klasse und keinem Titel zugeordnet (Altlast). |

**Talentfähigkeiten:** Kampfschrei (Kampf-Zweig), Blinzeln (Magie), Feldverband (Überleben), Todesgriff (Todesritter-Sternbild).

**Titelfähigkeiten:** siehe §14 und §19.

- **Fehlversuche / Lücken:**
  - **[Niedrig]** `shadow_bolt` (data.js:674) ist eine verwaiste Fähigkeit: keine Klasse, kein Titel, kein Stern.

---

## 13. Klassen, Lehrer und Klassenprüfungen

- **Was es ist:** Klassen gibt es nie im Menü. Man lernt sie bei einem Lehrer in der Welt.
- **Ablauf (seit 02.10.):**
  1. **Vertrauen:**
     - „Kannst du mich ausbilden?“ verlangt Beziehung 20 (Rook 40).
     - Fehlt sie, nennt der Lehrer eine Bewährung (z. B. Krieger: 5 Eisen) oder Lehrgeld (40 + 15 × Stufe) (`teacherTrial`).
  2. **Prüfung:**
     - 1–2 Aufträge (`QUESTS kt_*`). Meist einer draußen und eine Meisterprüfung beim Lehrer, die mit „Ich bin bereit.“ beginnt (`startClsTrial`).
     - Jeder Lehrer derselben Klasse nimmt ab. Scheitern darf man beliebig oft, und niemand soll sterben.
  3. **Aufnahme** (`classPassed`): Klasse, +1 Talentpunkt, Aufnahmeszene (`classRite`), Hinweis auf das neue Sternbild.
  - Eigene Wege ohne Prüfung (`OWN_PATH`): Paladin (Kelans drei Aufträge), Todesritter (Todesweihe ab Totenrang 3), Dunkler Hochpaladin (Ritus der Kette) und die vier dunklen Kettenklassen (Kettenrang). Ihre Freischaltung zählt als bestandene Prüfung (+1 Talentpunkt).
- **Klassen** (`CLASSES`, data.js:627):

  | Klasse | Stufe | Vorstufe | Fähigkeiten | Schwäche | Lehrer (live gefunden) |
  |---|---|---|---|---|---|
  | Krieger | 1 | Wanderer | Wuchtschlag | – | Borin der Jüngere (Eren), Hauke Eisenfaust (Nordfurt), Kaelis Vey (Aurelheim) |
  | Schütze | 1 | Wanderer | Gezielter Schuss | – | Tomas (Eren), Wenzel (Weidenau) |
  | Schurke | 1 | Wanderer | Meuchelstich | – | Rook, Kaelis Vey, Nix (Salzhafen) |
  | Kleriker | 1 | Wanderer | Heiliges Heilen | – | Elena (Eren), Schwester Adela (Lichtenrain) |
  | Magier | 1 | Wanderer | Feuerball | – | Morvath, Serafine (Kreuzweg) |
  | Barde | 1 | Wanderer | Kriegslied, Missklang | eigener Schaden −15 % | Lioba (Kreuzweg), Jasper Goldkehle (Kupferhafen) |
  | Alchemist | 1 | Wanderer | Feuerflasche, Giftöl, Trank brauen | braucht Heilkraut | Quirin (Salzhafen), Orrin (Mühlbach) |
  | Ritter | 2 | Krieger | Wuchtschlag, Segen | – | Kelan, Hauke |
  | Waldläufer | 2 | Schütze | Gezielter Schuss, Ziel markieren | – | Tomas, Wenzel |
  | Berserker | 2 | Krieger | Wuchtschlag, Raserei | +20 % Schaden genommen in Raserei | Oda (Grenzwacht), Ulfar der Narbige (Rastfurt) |
  | Assassine | 2 | Schurke | Meuchelstich, Schattenschritt | nicht in Kette oder Platte | Rook |
  | Dunkler Priester | 2 | Kleriker oder Magier, Kettenrang 1 | Brandmal, Kettengebet, Opferblut | gefürchtet | Vater Ansgar (Eisenfeste) |
  | Kettenjäger | 2 | Schütze, Kettenrang 2 | Gezielter Schuss, Fangnetz, Kettenhund | gefürchtet | Rulf Hundeführer |
  | Folterknecht | 2 | Schurke, Kettenrang 1 | Meuchelstich, Wille brechen, Henkersstreich | gefürchtet | Meister Mordek |
  | Kettenbarde | 2 | Barde, Kettenrang 0 | Kriegslied, Marschtrommel, Klagelied | gefürchtet, −15 % | Sibylla Eisentrommel |
  | Paladin | 3 | Ritter + `q_paladin3` | Heiliger Schlag, Segen, Heiliges Heilen | Orden | Kelan |
  | Todesritter | 3 | Krieger, Totenrang 3 | Lebensentzug, Wuchtschlag, Grabhieb | Tote | Sael, Ysra (Todesweihe) |
  | Dunkler Hochpaladin | 3 | Krieger, Kettenrang Aufseher | Kettenschlag, Furcht-Aura, Befehl, Blutpreis | freie Dörfer fürchten ihn | Varg / Ritus |

- **Prüfungen** (QUESTS `kt_*`, live ausgelesen):

  | Klasse | Schritt 1 (draußen) | Schritt 2 (beim Lehrer) | EP | Erreichbar? |
  |---|---|---|---|---|
  | Krieger | 4 Banditen besiegen | „Der Kreis“: Duell gegen den Übungsfechter, bis einer unter 20 % Rumpf fällt | 80 + 110 | ja (C-1 behoben; 04.10.: Schaden kommt sichtbar an, Fechter stirbt nie) |
  | Ritter | – | Platz 50 s gegen Räuberwellen halten; Duell mit Schild | 80 + 110 | ja; Duell mit demselben Fehler |
  | Berserker | 5 Feinde besiegen | Grubenkampf: gewinnen, während man selbst unter 30 % Leben ist (Gegner mit doppeltem Leben, Schaden ×1,6) | 80 + 110 | ja; gleiche Ursache möglich (Code) |
  | Schütze | 3 Wölfe erlegen + 3 Wolfsfelle (werden abgegeben) | 5 Puppen mit Fernwaffe, 40 s | 80 + 110 | ja (Code) |
  | Waldläufer | einen Bären erlegen | 10 Stunden am Stück draußen, 20–6 Uhr, außerhalb von Siedlungen | 80 + 110 | ja (Code; Schlaf zählt seit HB-03 Stunde für Stunde) |
  | Schurke | etwas aus fremdem Besitz stehlen, ohne gesehen zu werden | 3 Meuchelstiche an Puppen, 60 s | 80 + 110 | **nein** |
  | Assassine | einen Steckbrief vom Brett erfüllen und abgeben | – | 120 | ja, braucht aber Schurke (**dadurch gesperrt**) |
  | Kleriker | 5 Heilkraut (werden abgegeben) + 4 Skelette | eine Verletzte stabilisieren (Verband, Kraut oder Zauber), 60 s | 80 + 110 | ja (Code) |
  | Magier | ein Grabsiegel bergen | 5 Puppen mit Zaubern treffen, 30 s | 80 + 110 | ja, wenn vorher ein Zauber gelernt wurde (z. B. Funke bei Serafine) |
  | Barde | ein Schenkenspiel gewinnen | 5 Siege, während **dein Kriegslied** wirkt und 2 Gefährten mitkämpfen | 80 + 110 | **nein** (außer man ist Grubenhäuptling) |
  | Alchemist | 8 Heilkraut + 1 Seelenphiole | 3 Heiltränke brauen (Kessel oder „Trank brauen“) | 80 + 110 | ja über den Kessel am Lagerfeuer |

- **Belohnung / Folgen:** Je Schritt EP (80 bzw. 110, Assassine 120). Bei der Aufnahme kommen Klasse, +1 Talentpunkt, ein Chronik-Eintrag und das Sternbild dazu. Prüfungen geben **keinen Ruf** und kein Gold.
- **Bedienung:**
  - Dialoge beim Lehrer. Das Auftragsbuch (J) zeigt die Schritte, das Siegel über dem Lehrer markiert ihn.
  - Debug „Klassen: …“: Prüfung beim nächsten Lehrer, Ziele erfüllen, Meisterprüfung hier, zurücksetzen, Aufnahmeszenen.
- **Geprüft:** Live, Kriegerprüfung bei Borin dem Jüngeren mit einem Wanderer (Stufe 12):
  1. „Kannst du mich ausbilden? (Krieger)“ → Einleitung → „Ich höre.“ → Auftrag 1 angenommen.
  2. 4 Banditen getötet → Fortschritt 4/4 → „Erledigt.“ → +80 EP, Hinweis „Weiter mit … oder einem anderen Lehrer“.
  3. Auftrag 2 → „Ich bin bereit. (Das Duell im Kreis gewinnen)“ → ein Übungsfechter (94 LP, Stufe 3) erscheint.
  4. Duell gewonnen, „Erledigt.“ → **Klasse Krieger, +1 Talentpunkt, Wuchtschlag auf der Leiste**, Soll steigt von 7 auf 8.

  Die Aufnahme funktioniert also. Die Szene selbst ließ sich im Hintergrund-Tab nicht ansehen.

  Schurkenprüfung live: Ein Wanderer hat keine Fähigkeiten (`abilities: []`). Normale Hiebe auf die drei Puppen zählen 0.
- **Fehlversuche / Lücken:**
  - **[Hoch] Duell (Krieger, Ritter, Akademie) und Grube (Berserker) werden oft unverdient verloren.**
    - Repro: zwölf Duelle live, mit 8er-Treffern auf den Übungsfechter.
    - In **8 von 12** Läufen fiel der Rumpf des Fechters auf 0, während Kopf und Rumpf zusammen noch über 20 % lagen (hp 29–31 von 94). Der Fechter **starb** (trotz „Niemand stirbt“).
    - Die Prüfung lief danach mit totem Gegner bis zum Zeitende weiter und endete als **nicht bestanden**. Nur in 4 von 12 Läufen wurde rechtzeitig ein Kopftreffer gezählt und die Prüfung gewonnen.
    - Ursache: Die Siegbedingung prüft `target.hp - dmg < maxHp * 0,2` (game.js ~3799, Grube ~13863). Das `hp` von Figuren mit Körper ist Kopf + Rumpf (body.js:43), getötet wird aber über den Rumpf allein.
    - Betroffen sind auch das Akademie-Duell (Student, menschenähnlich) und die Rivalin.
  - **[Hoch] Schurkenprüfung für neue Figuren unlösbar.**
    - Schritt 2 zählt nur Treffer innerhalb von 1,5 s nach einem **Meuchelstich** (`p.stabAt`, gesetzt nur in `useAbility('backstab')`, ~15876) oder aus dem **Schattenschritt** (`shadowNext`) (`ktTrialHurt`, ~13861).
    - Beide Fähigkeiten hat man erst **als** Schurke bzw. Assassine. Ein Wanderer, der Schurke werden will, kann keinen Treffer zählen lassen.
    - Folge: Schurke, Assassine und Folterknecht sind für neue Figuren gesperrt. Nur alte Stände, die die Klasse schon haben, können „nachholen“.
    - Der Selbsttest übersieht das: Die Probe setzt die Figur vorher auf Schurke (game.js ~19470).
  - **[Hoch] Bardenprüfung für neue Figuren unlösbar.**
    - Schritt 2 zählt nur Siege mit dem Status `song` (game.js ~13600). Den setzt nur das **Kriegslied** des Barden (~16541) oder die Kriegstrommel des Grubenhäuptlings.
    - Folge: Barde und damit auch Kettenbarde sind praktisch gesperrt. Die Probe (~19513) setzt die Figur vorher auf Barde.
  - **[Niedrig]** Der Alchemist-Schritt 1 verlangt eine Seelenphiole, nimmt aber nur das Heilkraut ab (`reward.take: 'herb'`). Die Phiole bleibt in der Tasche.
  - **[Niedrig]** Der Alchemist-Schritt 2 nennt „Trank brauen“. Diese Fähigkeit hat man vor der Aufnahme nicht, möglich ist nur der Kessel. Der Text führt in die Irre.
  - **[Niedrig]** Auch beim zweiten Schritt sagt der Lehrer wieder „Zwei Aufgaben: eine draußen, eine hier vor mir.“ (`trialOffer`, ~13817). Das ist nur Text.
  - **[Niedrig, nicht nachstellbar]** Einmal öffnete `talk(Borin)` direkt nach dem Schließen eines anderen Dialogs nichts. Beim dritten Versuch ging es. Ursache unklar.
  - OFFEN.md [E]: „Ritter Platz halten 50 s“, „Grube ×2 Leben ×1,6 Schaden“ und „EP 80/110“ sind vorläufige Zahlen des Agenten.
  - OFFEN.md hatte gemeldet: Der Ritter hat Segen, aber ohne Mana. Das ist **behoben**: Segen kostet seit 03.10. Ausdauer.

---

## 14. Titelklassen

- **Was es ist:** Neben der Klasse kann man bis zu zwei Titel tragen, aktiv ist einer (`TITLE_CLASSES`, `MAX_TITLES = 2`).
  - Jeder Titel hat eine eigene Ressource, einen Makel, einen dauerhaften Preis, Ruffolgen und ein Leuchten.
  - Freigeschaltet wird er durch eine Tat in der Welt.
- **Übersicht:**

  | Titel | Ressource | Regel | Makel | Dauerpreis | Ruf | Freischaltung | Meister |
  |---|---|---|---|---|---|---|---|
  | Nekromant | Seelenessenz 0–6 | +1 je Tod in der Nähe | Waffenschaden −15 %, Heiliges Heilen halb | Leben −10 % | Tote +20, Orden −30, Valen −10 | Ahnenurne aus der Nekropole zu Ysra | Ysra |
  | Hexenmeister | Verderbnis 0–100 (Start 20) | Fähigkeiten laden auf, −4/s außerhalb des Kampfes | über 70 −1,5 Leben/s, bei 100 Ausbruch | Ausdauer −10 | Tote +15, Orden −30, Valen −10 | Urne zu Vhal | Vhal |
  | Druide | Wildkraft 0–100 (Start 40) | +5/s draußen auf Gras, Erde, Sumpf | in Ketten oder Platte halb | Stärke −1 | Orden +5 | „Ruf des Hains“ bei Mira | Mira |
  | Mönch | Fokus 0–5 | +1 je Ausweichen ins Leere, −1 je Treffer | in Ketten oder Platte kein Fokus | halbes Gold ans Kloster, Rook wird Feind | Orden +20, Bande −30 | „Probe der Stillen Hand“ bei Ilva | Ilva |
  | Grubenhäuptling | Stammesmut 0–100 (Start 30) | +2/s, +2/s je Goblin in der Nähe | ohne Goblin und ohne Kampf −1/s | Intelligenz −1 | Goblins +20, Orden −10 | „Einer von uns“ bei Grisk (Befreiung, Grubenstadt, Goblins 40) | Grisk |
  | Vampir | Blutdurst 0–100 (Start 30) | +4 je Stunde und je Fähigkeit | Sonne brennt | Heilung wirkt halb | Kelch +40, Orden −40, Valen −10 | „Der Kelch“ bei Hedda | Hedda |

- **Ausschlüsse:** Nekromant, Hexenmeister und Mönch schließen einander aus. Mönch und Vampir ebenfalls.
- **Titelgrade I–III** (`GRADE_NEED`): Grad 2 braucht 30 Taten und Stufe 8, Grad 3 braucht 90 Taten und Stufe 16. Der Meister weiht, dazu läuft die Aufnahmeszene.
- **Fähigkeiten je Grad:**

  | Titel | Grad I | Grad II | Grad III |
  |---|---|---|---|
  | Nekromant | Totenruf (2 Essenz, Diener 60 s, höchstens 2), Knochenschild (1) | Seelenernte (alles), Leichenbersten (1) | Seelenfessel (3) |
  | Hexenmeister | Fluch (+20), Chaosblitz (+15) | Schattenruf (+25), Entfesseln (ab 40), Seuchenfluch (+20) | Paktritter (20 % Leben), Obeliskentor (ab 50) |
  | Druide | Rankenfessel (25), Erdsegen (30) | Geisterwolf (40), Dornenhaut (25) | Wolfsgestalt (60, 20 s) |
  | Mönch | Handkante (1), Stilles Wasser (2) | Hundert Schritte (mind. 3), Gegenstrom (1) | Stille Hand (mind. 3) |
  | Grubenhäuptling | Goblinhorde (40), Schrottbombe (25) | Kriegstrommel (35), Tunnelsprung (20) | Dodons Echo (60) |
  | Vampir | Trinken, Blutpeitsche, Nebelschritt | Bannblick, Fledermausschwarm | Rote Ernte |

- **Klassenrüstung über Questreihen** (`c_nec1–3`, `c_war1–3`, `c_dru1–3`, `c_mon1–3`, `dk_1–3`): je 3 gebundene Teile. Ab 2 Teilen gibt es Heerruf, Dunkler Pakt, Rudelruf, Wirbel bzw. Todesmahr.
- **Bedienung:** Dialoge bei den Meistern. Ressourcenleiste im HUD. Titel aufgeben (`forsakeTitle`) sperrt die Klasse für immer.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - HB-06 (Mönch-Aufträge c_mon1–3 unerfüllbar) ist **behoben**.
  - HB-34 (c_nec2 braucht einen Wächter, den es nur im Pakt gibt) ist laut Hunt-Bericht noch offen (Code).

---

## 15. Sternbild-Talente und Talentpunkte

- **Was es ist:** Der Sternenhimmel (T) ersetzt den alten Talentbaum (`SKILL_TREE`, 221 Knoten; `SKIES`; `sky.js`).
  - In der Mitte steht der „Wanderer“ mit 29 Sternen (Kampf, Magie, Überleben, für alle).
  - Dazu kommt je Klasse ein Sternbild mit 8 Sternen: 2 Einstieg, 3 Mitte, 1 Herzstern, 2 Schlüsselsterne, die einander ausschließen.
  - Je Titel ein Sternbild mit 7 Sternen, Vampir und Grubenhäuptling inklusive.
  - Gefährten haben ein eigenes Sternbild mit 7 Sternen.
- **Ablauf:**
  - Einen Stern lernt man mit einem Punkt, wenn ein Vorstern gelernt ist.
  - **Wertesterne** wirken immer: Leben, Rüstung, Ausdauer, Mana, Krit, Abklingzeit, Zauberkraft, Tempo, Heilung, Regeneration, Packplätze, Ausweichen.
  - **Schlüssel- und Fähigkeitssterne** wirken nur, solange die Klasse oder eine Folgeklasse aktiv ist (`skyActive`). Titelsterne wirken nur mit dem getragenen Titel.
  - Einmal ist das Neuordnen kostenlos, danach kostet es 30 + 10 × Stufe Gold beim Lehrer.
- **Belohnung:** Stärkere Werte und veränderte Fähigkeiten. Eine Machtgrenze (Selbsttest-Probe) begrenzt ein volles Sternbild auf die Leistung des vollen Kampfzweigs.
- **Bedienung:** Eigenes Fenster (Himmel mit Schwenken, Zoom, Karte je Stern, „Lernen“ mit Bestätigung). Debug „Sterne: …“.
- **Geprüft:** Nur Code gelesen.
  - Jede der 14 Wirkungsarten (`fx`) wird in game.js über `tfx(c, '<art>')` gelesen.
  - Fähigkeitssterne (`ab`: mult, cd, cost, dur) gehen über `abMod` in `useAbility` ein.
  - Alle 40 Regel- und Schlüsselsterne ohne Zahlenwert werden im Code abgefragt (`node(...)`, `dkNode(...)`) oder geben eine Fähigkeit (`grants`).
  - Der Verdacht „Sterne wirken nicht“ hat sich im Code **nicht bestätigt**.
- **Fehlversuche / Lücken:**
  - OFFEN.md [E]: Sternnamen, Werte und Szenenzitate sind vorläufig.
  - OFFEN.md hatte gemeldet, Vampir und Grubenhäuptling hätten keinen Zweig. Das ist **behoben** (Scheibe 10).

---

## 16. Gefährten

- **Was es ist:** Bis zu `partyCap` Gefährten: 3 + Führung/10 + 1 mit Siedlung. Koop-Mitspieler belegen keinen Platz.
- **Ablauf:**
  - **Moral:** täglich ohne Nahrung −10, mit Nahrung +2. Jeder Tote in der Nähe −14, Mord −10, Blutbann −20. Gefährten mit grausamem Zug freuen sich über Grausamkeit.
  - **Desertion:** Unter Moral 12 gehen Gefährten mit 40 % Chance am Tag (game.js ~12551). Koop-Helden desertieren nicht.
  - **Loyalität** (0–100, Start 50): täglich +1, mit hoher Moral +1, mit niedriger −3. „Am Feuer“ gibt +5.
    - Nach 3 Abenden folgt ein persönlicher Auftrag gegen einen Elite-Mini-Boss: +25 / −10.
    - Ab 70 wird der Gefährte zum Freund fürs Leben (+2 Attribut, verrät nie).
    - Unter 15 kann er verraten (30 % am Tag): mit Gold verschwinden oder angreifen.
  - **Gefährten-Sternbild:** 1 Punkt zum Start, dann alle fünf Stufen einer. Nur Werte, Schlüsselsterne „Leibwache“ oder „Klinge der Gruppe“.
  - Rekrutierbar: Elena, Tomas, Borin, Lioba, Rook, Lila, Söldner (Handgeld 50 + Stufe × 12, Lohn 3 + Stufe am Tag) und angeworbene Gefangene.
- **Bedienung:** Gruppenfenster (G) als Tafel am rechten Rand. Gespräch „Wie geht es dir?“. Debug „Gefährten: …“.
- **Geprüft:** Nur Code gelesen. Der Testspielstand hatte keine Gefährten.
- **Fehlversuche / Lücken:** keine neuen. HB-35 (Kills von Verbündeten zählen nicht für Bosse und Aufträge) ist offen.

---

## 17. Begleittiere und Reittiere

- **Begleittiere:**
  - Ein Tier zugleich, mit +20 % Leben.
  - Zähmen durch Füttern (`TAME`):

    | Tier | Grundchance | Futter |
    |---|---|---|
    | Wolf | 20 % | Dörrfleisch, Pökelfleisch |
    | Wilder Hund | 35 % | Dörrfleisch, Pökelfleisch, Brot |
    | Wildschwein | 25 % | Brot, Weizen |
    | Bär | 8 % | Dörrfleisch, Pökelfleisch |

    Dazu kommen + Überleben/200, +12 % je Versuch, +15 % bei verwundetem Tier, −25 % bei wütendem.
  - Kauf beim Tierhändler: Hund 60, Wolfshund 180, Kampfeber 140. Der Tierhändler hat seit 03.10. ein eigenes Fenster mit vier Bereichen.
- **Reittiere:**

  | Reittier | Preis | Tempo |
  |---|---|---|
  | Pferd | 250 | 1,55 |
  | Messingross (Kupferhafen, muss geölt werden) | 900 | 1,75 |
  | Totenross (nur Tote oder Pakt, Todesritter automatisch) | 400 | 1,65 |

  - Jedes Tier hat Tempo, Ausdauer und Mut (ab 70 kommt es auch im Kampf).
  - R pfeift das Pferd herbei. Fenster „Stall“. Der Züchter Hadubrand hat 5 Pferde.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:** HB-47 (Beinschaden bremst das Pferd) ist offen (niedrig).

---

## 18. Bionik und Prothesen

- **Was es ist:** Verlorene oder gesunde Glieder lassen sich durch Messing ersetzen (`body.js` `MECH_Q`, `MECH_MOD`, `EYE_Q`).
  - **Stufen:**

    | Stufe | Wirkung |
    |---|---|
    | 1 Schrott | Arm −8 %, Bein −6 %, doppelter Verschleiß |
    | 2 Aurelionisch | gleichwertig |
    | 3 Meisterstück | +10 % / +6 % |
    | 4 Prototyp | +15 % / +10 %, halber Verschleiß |

  - **Module:** Greifhand, Klingenhand (+12 % Nahkampf, kein Schildblock), Federfuß (+8 % Tempo), Ankerfuß (kein Rückstoß).
  - **Roboterauge (Stufen 1–4):** Sichtweite 22 bis 36, Fernkampf-Krit bis +6 %, Nachtsicht, Wärmesicht. Magie stört es.
  - **Verschleiß:** nur durch Treffer am Glied. Unter 50 % halbe Wirkung, unter 30 % keine.
  - **Wartung:** Spezialöl, Selbstwartung mit Feinwerkzeug und Material (Grenze 70 + Schmieden/5), Kybernetiker, Meisterin Vell (Gelenkhall), Schwarzmarkt (Rook, Nix).
  - Der Zugang hängt am Rang in Aurelion.
- **Bedienung:** Charakterbogen (Körperfigur mit Messingrand, Abschnitt „Bionik“), Fenster X. Die Prothesen-Werkbank ist laut OFFEN.md noch eine **Dialogliste** ([B] GUI geplant).
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - Fit-Befund SHF-01: Die freigegebene T15-Wartung (Energiezelle, Kurzschluss) ist nicht gebaut.
  - IHF-09: Bionik hat keine Rolle im Weltgeschehen.
  - Prothesen-Werkbank, Kontor und Schwarzmarkt haben kein Fenster.

---

## 19. Vampir und Blutkult-Fähigkeiten

- **Was es ist:** Titelklasse „Vampir“, heilbar und beliebig oft wiederholbar.
- **Freischaltung:** in den Katakomben unter Varonheim bei Hedda trinken.
- **Fähigkeiten:**

  | Fähigkeit | Grad | Wirkung | Blutdurst |
  |---|---|---|---|
  | Trinken | I | von Wehrlosen; Blutdurst −45; ein zweites Mal am selben Tag tötet; Tierblut −10, nie unter 50 | senkt |
  | Blutpeitsche | I | Geschoss, 40 % Lebensraub | +12 |
  | Nebelschritt | I | Sprung 140 px, 0,5 s unverwundbar, Verfolger verliert dich | +10 |
  | Bannblick | II | fliehender oder ergebener Mensch kämpft 40 s für dich | +20 |
  | Fledermausschwarm | II | 4 s, Gegner treffen schlechter und sind langsamer | +15 |
  | Rote Ernte | III | nur bei Blutdurst ≤ 40: blutende Feinde nehmen Schaden, du heilst die Hälfte | +40 |

- **Ablauf:**
  - **Sonne:** 1,2 Schaden/s, Wetter und Kapuze dämpfen. Am Boden brennt es halb weiter.
  - **Nacht:** +10 % Schaden.
  - **Raserei** bei 100 Blutdurst.
  - **Stigma** bei Zeugen: Kopfgeld oder Vampirjäger.
  - **Heilung** bei Mutter Aldis (200 Gold + Nachtwache) oder an der Heilquelle (5–7 Uhr, alle Grade weg).
  - Blutfürst-Weg nach Aldhelms Fall (siehe §23).
- **Gegner des Kults:** Maskierter, Blutmagier, Blutknecht, Kelchwächter, Blutschöpfer, Aldhelm (Tabelle §20).
- **Bedienung:** Dialog bei Hedda und Aldis. Debug „Blutkult: …“.
- **Geprüft:** Nur Code gelesen.
- **Fehlversuche / Lücken:**
  - HB-02 (Raserei friert nach dem Laden ein) ist **behoben**.
  - HB-31 (Kultkrypta nach dem Tod des Spieler-Blutfürsten) ist offen (Code).

---

## 20. Gegner: vollständige Tabelle (MONSTERS)

- **Was die Spalten bedeuten:**
  - **Werte** sind Grundwerte aus data.js:489–620. Im Spiel gilt:
    - Leben = Grundleben × (1 + Stufe × 0,04) × 1,7 × Schwierigkeit, Bosse ×2.
    - Schaden = Grundschaden × (1 + Stufe × 0,06) × 1,4 × Schwierigkeit, Bosse ×0,6.
  - **Bedr.** ist die Bedrohung 0–6. Sie hebt Stufe und Beutechance.
  - **Stufe** ergibt sich aus der Zonenstufe des Ortes (`ZONE`, `REGION_TIER`): Totenland 4, Eisenmark, Gebirge, Wüste und Seuchenland 3, Aurelion 2. In Gefahr-3/4-Gebieten gibt es +2/+4 Stufen und 25/50 % Veteranen (Leben ×1,3).
  - **Varianten** (18 %, nicht bei Bossen): Vernarbter, Ausgehungerter, Rasender, Gepanzerter, Anführer.
  - **Körper** (✓) heißt: menschenähnlich mit Trefferzonen (`HUMANOID`). Für diese Gegner gilt der Balkenfehler aus §8.
- **Geprüft:**
  - Live: Lebenspunkte einiger Gegner bei fester Stufe gemessen (siehe §23). Alle LOOT- und BOSS_LOOT-Einträge gegen ITEMS geprüft: **alle Gegenstände existieren.**
  - Alle Gegner ohne Beutetabelle ermittelt: Übungspuppe, Student, Übungsfechter, die drei Engel, Pferd, Soldat Valens.
  - Vorkommen: aus `SPAWN_AREAS`, Gewölben, Heeren und Ereignissen im Code gesucht.

| Schlüssel | Name | LP | Schaden | Tempo | Reichw. | Bedr. | Fraktion | Körper | Rolle / Besonderheit | Vorkommen |
|---|---|---|---|---|---|---|---|---|---|---|
| wolf | Wolf | 30 | 7 | 1,55 | 26 | 1 | Tiere | – | Rudel; jagt Hirsche; greift Banditen an | Westwald, Wolfsschlucht, Südsumpf, Mittelland, Frostkamm, Knochenwald, Hundertfeld, um Eren; Hinterhalte; Wurzelhalle |
| boar | Wildschwein | 46 | 11 | 1,35 | 26 | 1 | Tiere | – | greift Banditen an; zähmbar | Westwald, um Eren |
| goblin | Goblin | 28 | 6 | 1,35 | 28 | 1 | Goblins | ✓ | Dolch; nach der Befreiung kein Feind mehr | Grubenpfad, Westwald, Verlassene Grube, Tiefhall-Schmiede, Grubenhort, Kasematten |
| goblin_warrior | Goblin-Krieger | 54 | 11 | 1,25 | 32 | 2 | Goblins | ✓ | Axt, Holzschild | Rote Wüste, Frostkamm, Tiefhall, Alt-Vharn, Schwarze Feste, Grube (3 bei Gorak); nach Karrak in der Wüste |
| bandit | Bandit | 48 | 10 | 1,4 | 34 | 2 | Banditen | ✓ | Seitschritt beim Ausholen des Helden | fast überall im Menschenland; Banden, Räuberhöhle, Schmugglergrotte; nach Vargs Fall in der Eisenmark |
| bandit_archer | Banditenschütze | 36 | 9 | 1,35 | 300 | 2 | Banditen | ✓ | Fernkampf | Banditengebiete, Rote Wüste, Karraks Verstärkung |
| bandit_spear | Speerträger | 50 | 12 | 1,3 | 66 | 2 | Banditen | ✓ | hält Abstand, stößt zurück | Banditengebiete, Rote Wüste |
| bounty_hunter | Kopfgeldjäger | 58 | 12 | 1,45 | 36 | 2 | Banditen | ✓ | jagt Gesuchte; als Magierjäger mit Bann | erscheint ab 150 Gold Kopfgeld, als Magierjäger, bei Rachezügen |
| chain_brute | Kettenknecht | 95 | 15 | 1,2 | 40 | 3 | Kette | ✓ | schwerer Slam | Streifen der Kette in der Eisenmark, Vargs Verstärkung; Boss im Ausbrecherstollen (dieses Gewölbe stürzt ab, siehe Fehler) |
| rotgardist | Rotgardist | 120 | 17 | 1,25 | 46 | 3 | Kette | ✓ | Stoß mit Ansage; Elite | Eisenmark, Vargs Hof (4), Uhrwerkhalle |
| kettenschuetze | Kettenschütze | 50 | 16 | 1,3 | 320 | 3 | Kette | ✓ | Armbrust | Eisenmark, Vargs Hof (2), Uhrwerkhalle, Ausbrecherstollen |
| sea_raider | Plünderer der Sturmklinge | 62 | 12 | 1,45 | 38 | 2 | Seevolk | ✓ | Enterhaken-Stoß | Gischtinseln, Entern, Tangkron |
| sea_harpooner | Harpunier | 48 | 14 | 1,3 | 290 | 2 | Seevolk | ✓ | Fernkampf | Gischtinseln, Entern |
| whitebeard | Weißbart | 560 | 26 | 1,1 | 64 | 4 | Seevolk | ✓ | **Boss** (§23) | Tangkron |
| automat | Kriegsautomat | 140 | 16 | 1,05 | 44 | 3 | Aurelion | ✓ | Hellebarde, stirbt mit Funken | Automaten-Ereignis Aurelion, Uhrwerkhalle (auch Boss „Der Regulator“), Schlund |
| chain_master | Varg, Kettenmeister | 260 (Regionalboss 360) | 18 | 1,25 | 70 | 4 | Kette | ✓ | **Boss** (§23) | Kernburg der Eisenfeste |
| skeleton | Untoter Krieger | 44 | 10 | 1,15 | 32 | 2 | Tote | ✓ | Nahkampf | Totenland, Tiefhall, Gräber, Gewölbe, Spuk in Dörfern; sehr häufig |
| skel_bomb | Bomben-Skelett | 36 | 12 | 1,55 | 28 | 2 | Tote | ✓ | Selbstzündung, trifft alle; zählt als Skelett | 8 % Abart des Skeletts |
| skel_brute | Großes Skelett | 130 | 15 | 0,85 | 44 | 3 | Tote | ✓ | Erdschlag jeder 2.; zählt als Skelett | 6 % Abart des Skeletts |
| waechterspinne | Wächterspinne | 24 | 6 | 1,8 | 24 | 1 | Aurelion | – | hängt an Werkstattwänden, Splitter beim Tod; in Städten nur gegen Unbefugte | Werkstätten und Werkhallen Aurelions |
| dampframme | Dampframme | 150 | 15 | 0,8 | 40 | 3 | Aurelion | ✓ | Rammstoß 170 px, zerbricht Kisten | 20 % Abart des Automaten; Stadtschlacht Aurelion |
| blutschoepfer | Blutschöpfer | 40 | 9 | 1,3 | 30 | 2 | Kelch | ✓ | trinkt von Liegenden, heilt Kultisten | Katakomben Varonheim |
| netzwerferin | Netzwerferin | 42 | 9 | 1,35 | 240 | 2 | Seevolk | ✓ | Netz: 3 s fest, Große taumeln | Entern, Gischtinseln |
| hofspion | Hofspion | 44 | 11 | 1,5 | 30 | 2 | Aurelion | ✓ | wirkt erst harmlos, erster Stich von hinten ×3 | Hof der Himmelsinsel |
| mutant | Verdorbener | 44 | 11 | 1,6 | 36 | 2 | Tote | – | sehr schnell, Rüstung 0 | Totenland-Rand (je 80 Zeilen ein Gebiet) |
| mutant_brute | Wucherer | 95 | 14 | 1,35 | 42 | 3 | Tote | – | Ansage vor dem Hieb | Totenland-Rand |
| crypt_warden | Wächter der Nekropole | 150 | 15 | 1,1 | 40 | 3 | Tote | ✓ | Schildwall; Hüter der Ahnenurne; kein Boss-Flag | Große Nekropole; Gruft des Versunkenen Tempels („Der Hohepriester“) |
| death_captain | Hauptmann der Toten | 170 | 16 | 1,1 | 42 | 3 | Tote | ✓ | Slam; führt Befreiungswellen | Totenland Nordost, Besatzungen, Heere |
| hrodvar | Hrodvar | 220 | 19 | 1,0 | 46 | 4 | Tote | ✓ | **Boss** (§23) | Tiefhall, Thron |
| acad_dummy | Übungspuppe | 1 | 0 | 0 | 0 | 0 | – | ✓ | Prüfungsziel | Prüfungen |
| acad_student | Student der Akademie | 60 | 6 | 1,2 | 240 | 1 | – | ✓ | zaubert Funke und Froststoß | Akademie-Duell |
| drill_fighter | Übungsfechter | 60 | 6 | 1,2 | 34 | 1 | – | ✓ | Klassen-Duell und Grube („stirbt nie“ stimmt nicht, siehe §13) | Klassenprüfungen |
| aldhelm | Aldhelm, Blutfürst | 340 | 21 | 1,3 | 40 | 4 | Kelch | ✓ | **Boss** (§23) | Krypta des Kanzlers |
| blood_mage | Blutmagier | 38 | 12 | 1,1 | 250 | 2 | Kelch | ✓ | Geschoss heilt 40 % | Katakomben |
| thrall | Blutknecht | 34 | 8 | 1,25 | 30 | 1 | Kelch | ✓ | trägt den Namen eines Verschwundenen | Katakomben |
| chalice_guard | Kelchwächter | 120 | 16 | 1,0 | 40 | 3 | Kelch | ✓ | Platte, Schild | Kelchhalle |
| blood_cultist | Maskierter | 46 | 11 | 1,35 | 32 | 2 | Kelch | ✓ | nachts verkleidet in Varonheim | Varonheim nachts, Katakomben |
| cultist | Kultist der Asche | 34 | 12 | 1,2 | 260 | 2 | Tote | ✓ | Heiler: Feuerpfeil, heilt Untote | Alt-Vharn, Aschensee, Totenland, Tempelgruft, Sternkammer |
| ghoul | Wiedergänger | 70 | 13 | 0,85 | 30 | 2 | Tote | ✓ | Griff bremst; steht einmal auf (außer bei Feuer oder Heiligem) | Hundertfeld, Alt-Vharn, Aschensee, Totenland, Überfälle, Wurzelhalle |
| wraith | Geist | 38 | 9 | 1,7 | 30 | 3 | Tote | ✓ | nach Treffer körperlos, raubt Ausdauer | Knochenwald, Tiefhall-Eiskammern, Totenland, Ilvars Prüfung; Boss der Sternkammer |
| bone_knight | Knochenritter | 120 | 14 | 0,95 | 38 | 3 | Tote | ✓ | Schild vorn (Frontalhieb nur 30 %); Bogenhieb | Totenland, Turmweg, Garmadons Hof, Knochengruft, Schlund |
| bone_archer | Knochenschütze | 36 | 9 | 1,1 | 280 | 2 | Tote | ✓ | Fernkampf | Totenland, Knochengruft |
| necromancer | Nekromant | 52 | 11 | 1,0 | 240 | 3 | Tote | ✓ | ruft 3 Knochendiener | Totenland, Turmweg, Knochengruft |
| zombie | Seuchenleiche | 80 | 9 | 0,7 | 28 | 1 | Tote | ✓ | Biss vergiftet (50 %) | Totenland, Knochengruft, Überfälle |
| ash_demon | Aschdämon | 170 | 17 | 1,05 | 40 | 4 | Tote | ✓ | feuerfest, Glutaura | Totenland Nordost, Garmadons Gruft, Heere |
| shade | Schattenwesen | 40 | 15 | 1,5 | 30 | 3 | Tote | ✓ | springt hinter das Ziel | Totenland Nordost, Knochengruft, Sternkammer |
| bone_hound | Knochenhund | 34 | 8 | 1,8 | 24 | 2 | Tote | – | Rudel flankiert | Totenland, Vorhof der Gruft, Überfälle |
| carrion_wing | Aasschwinge | 22 | 6 | 2,0 | 26 | 2 | Tote | – | fliegt über Wasser und Mauern | Totenland |
| flesh_golem | Leichenkoloss | 340 | 24 | 0,6 | 50 | 4 | Tote | ✓ | Belagerung, Stampfen trifft alle, zerschlägt Wagen | Vorhof der Gruft, Totenheere |
| death_knight | Todesritter | 230 | 20 | 1,1 | 44 | 4 | Tote | ✓ | Lebensraub 25 %, Bogenhieb | Vorhof der Gruft, Garmadons Hof, Boss der Knochengruft („Morvhal“) und des Schlunds |
| garmadon | König Garmadon | 620 | 24 | 1,05 | 52 | 5 | Tote | ✓ | **Boss** (§23) | Gruft des Toten Königs |
| omega | Omega, der Gefallene | 600 | 30 | 0,9 | 70 | 6 | Omega | – | **Boss** (§23); fliegt | Krater |
| angel_blade | Klingenengel | 90 | 16 | 1,5 | 40 | 4 | Omega | ✓ | fliegt | nur Omegas Engelwellen |
| angel_archer | Lichtschütze | 60 | 12 | 1,3 | 300 | 3 | Omega | ✓ | Lichtpfeile aus der Luft | nur Engelwellen |
| angel_ophan | Ophan | 70 | 6 | 1,1 | 220 | 3 | Omega | – | heilt Omega (4 %) und Engel (20 %) | nur Engelwellen |
| bear | Bär | 150 | 18 | 1,15 | 38 | 3 | Tiere | – | Revier; verletzt stürmt er | Westwald (Bärenrevier), Frostkamm; Boss der Wurzelhalle |
| wild_dog | Wilder Hund | 24 | 6 | 1,65 | 24 | 1 | Tiere | – | Rudel flankiert | Mittelland, Rote Wüste, Eisenmark; Westwald nach Graumähne |
| cow | Kuh | 60 | 0 | 0,9 | – | 0 | Tiere | – | Beute, flieht | Höfe |
| sheep | Schaf | 26 | 0 | 1,1 | – | 0 | Tiere | – | Beute, flieht | Höfe |
| horse | Pferd | 80 | 0 | 1,8 | – | 0 | Tiere | – | nur unter dem Reiter gemalt | Ställe |
| deer | Hirsch | 30 | 0 | 1,9 | – | 0 | Tiere | – | flieht, Wölfe jagen ihn | Westwald, Eren-Wald, südliche Ebenen |
| valen_soldier | Soldat Valens | 52 | 10 | 1,3 | 44 | 2 | Valen | ✓ | Verbündeter | Valen-Heere, Stadtschlachten |
| dodon | Dodon | 620 | 27 | 0,95 | 62 | 5 | Goblins | – | **Boss** (§23) | Morrgrund |
| gorak | Gorak, Grubenwart | 240 | 24 | 1,0 | 52 | 4 | Goblins | ✓ | **Boss** (§23) | Verlassene Grube |

- **Fehlversuche / Lücken:**
  - **[Hoch] Ausbrecherstollen stürzt beim Betreten jeder Ebene ab.**
    - Der Gegner-Pool des Gewölbes enthält `'chainhunter'` (game.js ~11229, `VAULTS.ausbrecherstollen.pool`). Das ist der Schlüssel einer **Klasse**, kein Eintrag in `MONSTERS`.
    - `spawnEnemy` liest daraufhin `m.hp` von `undefined` (game.js ~1940).
    - Live: `RF.buildVault('ausbrecherstollen', 1)` warf 6 von 6 Mal `TypeError: Cannot read properties of undefined (reading 'hp')`. Die Räuberhöhle baut fehlerfrei.
    - Folge: Der geheime Ort „Ausbrecherstollen“ (MECHANIKEN „Geheimer Ort: Der Ausbrecherstollen“) ist kaputt, sein Boss „Der Pferchmeister“ ist nie erreichbar.
  - **[Niedrig]** Die drei Engel (Klingenengel, Lichtschütze, Ophan) haben keine Beutetabelle. Sie geben nur Gold (50 %). Vielleicht gewollt (Heeresschlacht).
  - **[Niedrig]** Die alte Doku nennt falsche Werte: Hrodvar „280“ (Daten 220), Dodon „760“ (Daten 620). Wächter der Nekropole steht als Boss in der Liste, hat aber kein Boss-Flag.

---

## 21. Beutetabelle (LOOT) je Gegner

- **Regel** (`dropLoot`, game.js ~4224):
  - Verbrauchsgüter und Material fallen mit der angegebenen Chance.
  - Ausrüstung (Waffen und Rüstung) fällt bei normalen Gegnern nur mit **×0,35**, bei Elite, Veteran und Anführer mit **×1,5** der Chance.
  - Bei Bossen zählt `BOSS_LOOT` statt der Ausrüstung aus `LOOT`.
  - Alles wird mit dem Beutefaktor der Schwierigkeit multipliziert.
  - Dazu kommt mit 50 % Gold in Höhe von 1–6 + Stufe.
  - Die Seltenheit wird beim Fund gewürfelt: gewöhnlich 62 %, ungewöhnlich 24 %, selten 10 %, episch 3,5 %, legendär 0,5 %. Gefährliche Gegner heben die Chancen.
- **Lesehilfe:** Prozent = Grundchance aus data.js:431–473. Bei Ausrüstung gilt im Spiel der Faktor oben.

| Gegner | Beute (Grundchance) |
|---|---|
| Wolf | Fell 70 %, Dörrfleisch 40 %, Knochen 30 % |
| Wildschwein | Dörrfleisch 80 %, Fell 30 % |
| Goblin | Knochen 40 %, rostiges Schwert 12 %, Schrottklinge 5 %, Brot 30 %, Eisen 20 %, Verband 15 % |
| Goblin-Krieger | Schleuder 12 %, Schrottkeule 10 %, Wurfbeil 6 %, Eisen 50 %, Axt 20 %, Lederkappe 15 %, Speer 12 % |
| Bandit | Trank der Wut 3 %, Lederhandschuhe 6 %, Lederbeinlinge 5 %, Talisman Leichtfuß 2 %, Wurfmesser 8 %, Kriegssichel 5 %, Grabräuber 12 %, Rabenbeil 6 %, Plündererharnisch 6 %, rostiges Schwert 20 %, Lederwams 15 %, Brot 40 %, Dolch 20 %, Verband 35 %, Maskenkapuze 3 %, Wanderkapuze 6 %, Rabenmantel 3 %, Bärenfell 1,5 %, Mantel des Rabenfürsten 0,15 % |
| Banditenschütze | Kurzbogen 25 %, Lederkappe 20 %, Dörrfleisch 30 % |
| Speerträger | Speer 25 %, Lederwams 12 %, Brot 30 %, Verband 20 % |
| Kopfgeldjäger | Dornensäbel 15 %, Grenzläufer 10 %, Verband 60 %, Heiltrank 30 %, Kettenhemd 12 %, Armbrust 8 % |
| Kettenknecht | Brigantine 20 %, Eisenwache 20 %, Eisenhut 30 %, Flegel 10 %, Henkersaxt 6 %, Kettenbrecher 4 %, Aufsehermantel 10 %, Verband 50 %, Kettenhaube 8 %, Henkerskapuze 5 % |
| Rotgardist | Rotgardistenpanzer 20 %, Rotgardistenhelm 25 %, Rotklaue 12 %, Schwarzzahn 4 %, Mauerbrecher 3 %, Heiltrank 40 % |
| Kettenschütze | Armbrust 20 %, Eisenwache 15 %, Eisenfalke 5 %, Bergmannshelm 20 %, Verband 40 % |
| Kriegsautomat | Messingpistole 3 %, Automatenkern 80 %, Schrottarm 6 %, Schrottbein 6 %, Eisen 60 % |
| Plünderer | Entermesser 18 %, Seemantel 8 %, Dörrfleisch 30 %, Heiltrank 15 %, Ölzeugumhang 6 %, Teermantel 8 % |
| Harpunier | Harpune 15 %, Dreispitz 5 %, Heiltrank 15 % |
| Untoter Krieger | Legionärsplatte 4 %, Knochen 90 %, rostiges Schwert 20 %, Grabsiegel 5 %, Knochenumhang 2 % |
| Bomben-Skelett | Knochen 60 %, Grabsiegel 4 % |
| Großes Skelett | Knochen 100 % + 60 %, Legionärsplatte 8 %, Eisen 30 %, Grabsiegel 8 % |
| Wächterspinne | Eisen 40 %, Automatenkern 10 % |
| Dampframme | Automatenkern 60 %, Eisen 80 % + 40 %, Schrottbein 4 % |
| Blutschöpfer | Blutphiole 50 %, Dolch 8 % |
| Netzwerferin | Dörrfleisch 30 %, Heiltrank 15 %, Seemantel 5 % |
| Hofspion | Dolch 20 %, Heiltrank 20 % |
| Verdorbener | Knochen 30 %, Verband 15 %, Fetzenmantel 3 % |
| Wucherer | Knochen 50 %, Dörrfleisch 15 %, Verband 20 %, Fetzenmantel 5 % |
| Wächter der Nekropole | Kettenbeinlinge 15 %, Talisman Wächter 8 %, Knochenspalter 30 %, **Ahnenurne 100 %**, Knochen 100 %, Kettenhemd 40 % |
| Hauptmann der Toten | Elixier Stein 15 %, Elixier Wacht 20 %, Panzerhandschuhe 15 %, Beinschienen 12 %, Talisman Toten 10 %, Totenmünze 2 %, Totenglocke 30 %, Legionärsplatte 30 %, Knochen 100 %, Kettenhemd 50 %, Eisenhelm 40 %, Heiltrank 80 %, Flegel 30 % |
| Blutmagier | Blutphiole 50 %, Blutmaske 30 %, Stab 5 % |
| Blutknecht | Brot 20 %, Verband 20 % |
| Kelchwächter | Blutphiole 60 %, Drachenschild 10 %, Kettenhemd 6 % |
| Maskierter | Blutmaske 100 %, Blutphiole 30 %, Dolch 15 %, Maskenkapuze 5 % |
| Kultist der Asche | Seelenphiole 25 %, Verband 30 %, Stab 8 %, Zauberstab 5 %, Reiseumhang 10 %, Fetzenmantel 8 %, Widderkapuze 4 % |
| Wiedergänger | Knochen 60 %, Dörrfleisch 15 %, Fetzenmantel 4 % |
| Geist | Seelenhaken 5 %, Seelenphiole 40 %, Grabsiegel 8 %, Grabtuchmantel 2 % |
| Knochenritter | Drachenschild 15 %, Knochen 80 % |
| Knochenschütze | Kurzbogen 20 %, Knochen 70 % |
| Nekromant | Seelenphiole 60 %, Stab 10 % |
| Seuchenleiche | Knochen 50 % |
| Aschdämon | Seelenphiole 35 % |
| Schattenwesen | Seelenphiole 30 % |
| Knochenhund | Knochen 80 % |
| Aasschwinge | Knochen 30 % |
| Leichenkoloss | Knochen 100 %, Seelenphiole 50 % |
| Todesritter | Seelenphiole 40 %, Plattenharnisch 20 %, Schädelhelm 8 % |
| Bär | Fell 100 % + 50 %, Dörrfleisch 100 %, Knochen 40 % |
| Wilder Hund | Fell 30 %, Knochen 30 % |
| Hirsch | Dörrfleisch 100 %, Fell 60 % |
| Kuh | Fleisch 100 % + 100 %, Fell 50 % |
| Schaf | Fleisch 100 %, Tuch 80 % |
| Übungspuppe, Student, Übungsfechter, Engel (3), Pferd, Soldat Valens | keine Tabelle (nur Gold) |

Die Beute der Bosse steht in §23.

- **Geprüft:** Live. Alle Schlüssel existieren in ITEMS, und es gibt keine Tabelle ohne Gegner.
- **Fehlversuche / Lücken:** keine fehlerhaften Einträge. Gold fällt nur mit 50 %. Das ist gewollt, nur zur Kenntnis.

---

## 22. Elite-Mini-Bosse (ELITES)

- **Was es ist:** 32 benannte Anführer für Steckbriefe und persönliche Aufträge von Gefährten (data.js:1784–1816; `applyElite`, game.js ~1981).
  - Jeder hat einen Faktor auf Leben und Wucht, eine **Kraft** und eine **sichere Beute** (Seltenheit hochgewürfelt).
  - Dazu kommen eine Trophäe mit seinem Namen und Gold.
  - Ein Getöteter kehrt erst zurück, wenn alle einmal dran waren.
- **Kräfte:**

  | Kraft | Wirkung |
  |---|---|
  | burn, frost, shock | Treffer setzt Brand, Frost oder Schock (35 %) |
  | regen | heilt sich |
  | summon | ruft bei halbem Leben zwei aus dem Gefolge |
  | rally | Bande eilt herbei |
  | charge | sehr schnell |
  | tough | Panzer |

- **Boss-Intro:** nein. Bossleiste: nein (kein Boss-Flag, nur der Zielbalken).

| Name | Art (Gefolge) | Gegend | Leben × / Wucht × / Tempo × / Rüstung + | Kraft | Sichere Beute |
|---|---|---|---|---|---|
| Hagen der Schlitzer | Bandit | Banditen | 1,8 / 1,2 | rally | Langschwert |
| Ruprecht Einauge | Banditenschütze (Bandit) | Banditen | 1,6 / 1,35 | rally | Langbogen |
| Wendel die Krähe | Bandit | Banditen | 1,5 / 1,2 / 1,2 | charge | Doppelklinge |
| Gunther Rotbart | Speerträger (Bandit) | Banditen | 2,0 / 1,2 / – / +3 | tough | Hellebarde |
| Die Stille Mathilde | Bandit | Banditen | 1,5 / 1,45 | burn | Wurfmesser |
| Otmar Brandschatz | Bandit | Banditen | 1,7 / 1,25 | burn | Axt |
| Galgenstrick Fritz | Bandit | Banditen | 1,6 / 1,3 / 1,15 | rally | Rapier |
| Adelheid vom Hohlweg | Banditenschütze | Banditen | 1,5 / 1,4 | rally | Armbrust |
| Karim Sandgeist | Bandit | Wüste, Ödland | 1,7 / 1,3 / 1,2 | charge | Kriegssichel |
| Nadira die Skorpionin | Banditenschütze (Bandit) | Wüste | 1,5 / 1,45 | shock | Kurzbogen |
| Knarz der Grubenkönig | Goblin-Krieger (Goblin) | Goblins | 2,4 / 1,3 / – / +2 | summon | Axt |
| Mulch der Pilzschamane | Goblin | Goblins | 1,8 / 1,1 | regen | Heiltrank |
| Schrottfresser Grimm | Goblin-Krieger | Goblins | 2,2 / 1,2 / – / +4 | tough | Ersatzteile |
| Flinkfinger Zick | Goblin | Goblins | 1,4 / 1,2 / 1,35 | charge | Wurfmesser |
| Der Knochenfürst Varsk | Skelett | Untote | 2,2 / 1,3 / – / +2 | summon | Knochenspalter |
| Irmhild vom Frostgrab | Skelett | Untote | 1,9 / 1,25 | frost | Frostklinge |
| Seuchenmaul | Wiedergänger | Untote | 2,0 / 1,2 / 1,15 | regen | Heiltrank |
| Der Grabschänder Egbert | Wiedergänger (Skelett) | Untote | 1,8 / 1,35 | rally | Grabräuber |
| Die Totenglocke | Skelett (Wiedergänger) | Untote | 2,0 / 1,2 | shock | Totenglocke |
| Aschenkönigin Sabeth | Skelett | Untote | 2,1 / 1,35 | burn | Kriegssense |
| Graumähne (Elite) | Wolf | Wölfe | 2,4 / 1,3 / 1,15 | summon | Fell |
| Schwarzfell | Wolf | Wölfe | 2,0 / 1,4 / 1,25 | charge | Fell |
| Eisenhauer | Wildschwein | Wolf-, Banditen-, Goblingebiete | 2,6 / 1,3 / – / +3 | charge | Fell |
| Der Alte vom Berg | Bär (Wolf) | Gebirge, Eisenmark | 2,2 / 1,3 | regen | Fell |
| Der Weiße Hund | Wolf | Wölfe | 2,1 / 1,35 | frost | Fell |
| Brakk Kettenbrecher | Kettenknecht (Bandit) | Eisenmark, Gebirge | 1,8 / 1,25 / – / +2 | tough | Kriegshammer |
| Veit mit der Peitsche | Kettenknecht (Bandit) | Eisenmark, Gebirge | 1,7 / 1,3 | shock | Kettenpeitsche |
| Aschepriester Morn | Kultist (Skelett) | Totenland, Seuchenland | 1,9 / 1,3 | burn | Zauberstab |
| Die Schattenseherin | Kultist | Totenland, Seuchenland | 1,7 / 1,4 | regen | Zauberstab |
| Kapitän Seeteufel | Plünderer | Banditen | 1,9 / 1,3 | rally | Kriegssichel |
| Harpunen-Hella | Harpunier (Plünderer) | Banditen | 1,7 / 1,4 | charge | Speer |
| Das Messingungetüm | Kriegsautomat (Bandit) | Aurelion | 2,2 / 1,3 / – / +4 | shock | Ersatzteile |

- **Bedienung:** Steckbrief am Anschlagbrett mit Gesicht (Brief zeigt Lohn). Debug „Elite-Mini-Boss hier“, „Alle Elite-Mini-Bosse nebeneinander“.
- **Geprüft:** Live. Alle Arten, Gefolge und Beutegegenstände existieren (keine fehlerhaften Schlüssel).
- **Fehlversuche / Lücken:**
  - **[Niedrig]** Die Elite „Graumähne“ (Wolf) heißt genauso wie der Regionalboss Graumähne (Leitwolf der Schlucht). Es kann also zwei „Graumähnen“ geben. Verwechselbar.
  - **[Niedrig]** Die fünf Tier-Elites geben als „sichere Beute“ nur ein gewöhnliches Fell. Das ist eine schwache Belohnung für einen Mini-Boss.
  - **[Niedrig]** Kapitän Seeteufel und Harpunen-Hella erscheinen in Banditengebieten (`where: ['bandit', …]`), nicht auf See.

---

## 23. Bosse

- **Gemeinsame Regeln:**
  - Bosse haben doppeltes Leben (`BOSS.hp = 2`) und teilen 60 % aus. Omega ist ausgenommen.
  - Rückstoß ×0,25, Parade-Taumeln nur 450 ms.
  - Regionalbosse rufen unter 50 % Leben einmal Verstärkung.
  - Boss-Beute (`BOSS_LOOT`): 90 % eine Waffe aus dem Pool, 60 % ein Rüstungsteil, 25 % das Einzelstück. Gewürfelt wird **getrennt**: Man kann leer ausgehen oder das Einzelstück zweimal bekommen.
  - Die Bossleiste erscheint ab 520 px. **Boss-Intro** (Regiebuch T17, `bossIntro`): beim ersten Blickkontakt unter 340 px, einmal je Held, nur für die 7 Einträge in `BOSS_CARDS`.
- **Lebenspunkte live gemessen** (`spawnEnemy` auf einer Wegwerfkarte, Schwer). Bei menschenähnlichen Bossen ist das nur Kopf + Rumpf, also der Balken:

| Boss | Ort | Stufe | Leben im Spiel | Schaden je Hieb (ca.) | Intro | Besonderheiten | Beute | Folgen |
|---|---|---|---|---|---|---|---|---|
| **Graumähne**, Leitwolf (Regionalboss, Wolf) | Wolfsschlucht | 9 | 170 × 1,7 × 2 = **578** | Wolf | **nein** | ruft das Rudel | nur Wolfsbeute (Fell, Fleisch, Knochen), kein eigener Pool | Eren +8 Felle, Valen +3, im Westwald werden 60 % der Wölfe zu Hunden, Gegnerdeckel −30 % |
| **Karrak**, der Sandfürst (Regionalboss, Bandit) | Rote Wüste | 12 | 340 × 3,4 = **1156**, Wucht ×1,8 | Bandit × 1,8 | **nein** | ruft Schützen | nur Banditenbeute (Ausrüstung mit Faktor 1), kein eigener Pool | Händler +8, Bande −25, Goblin-Krieger ziehen ein |
| **Varg**, Kettenmeister | Kernburg der Eisenfeste | 16 | 360 × 3,4 = 1224 (Körper; live mit 260 Grundleben: 918) | ~30 | ja („VARG“) | hält Hof (ansprechbar), Hofstaat 4 Rotgardisten + 2 Kettenschützen, ruft Knechte; Goblin-Sturm | Henker/Kettenpeitsche/Kettenbrecher 90 %; Eisenfürst-, Blutketten-Set, Kettenumhang 60 %; Roter Henker 25 % (+ Trank) | Befreiung der Goblins (`liberate`), Kette zerfällt zu Räubern |
| **Gorak**, Grubenwart | Verlassene Grube | 10 | **828** | ~32 | ja („GORAK“) | Phase 1 schwerer Hieb mit Ansage; unter 50 % Brüllen, schneller | Gorak-Spalter/Mauerbrecher 90 %; Grubenkönig/Schrotthelm 60 %; Gorak-Spalter 25 % (+ 2 Eisen, Trank 60 %) | `q_mine`; HB-42 offen (q_mine bricht, wenn er vorher stirbt) |
| **Hrodvar**, König unter dem Eis | Tiefhall, Thron | 11 | **781** | ~26 | ja („HRODVAR“) | `frostKingAI`: Eiskreis, Eislanze, 2 Skelett-Wachen | Nachtfrost/Knochenspalter 90 %; Platte, Eisenhelm, Totenkrone-Teile 60 %; Nachtfrost 25 % (+ Eisen, Trank) | Omega-Fragment |
| **Weißbart**, König der Sturmklinge | Tangkron | 18 | **2702** | ~45 | ja („WEISSBART“) | redet zuerst (`whitebeardParley`), dann `whitebeardAI` | Sturmanker/Entermesser/Harpune 90 %; Dreispitz/Seemantel/Kapitänsrock 60 %; Sturmanker 25 % (+ Seekarte, 2 Tränke) | Machtvakuum auf See; HB-07 behoben |
| **Aldhelm**, Blutfürst | Krypta des Kanzlers | 16 | **1565** | ~35 | eigene Kamerafahrt (nicht `BOSS_CARDS`) | Blutfesseln (Gefangene heilen ihn), ab 60 % Nebel und Blutsiegel, Lichtschächte, unter 30 % trinkt er | Kanzlerdegen 90 % + 25 %; Kanzlerrobe 60 % (+ Blutphiole, Trank) | Kult zerschlagen / Blutfürst-Weg |
| **König Garmadon** | Gruft des Toten Königs | 18 | ca. 2400 (live bei Stufe 20: 2571) | ~44 | ja („KÖNIG GARMADON“) | spricht, lässt nicht gehen; 3 Phasen; Lebensraub 25 %/40 %; Hof aus 2 Todesrittern, 4 Knochenrittern, 4 Skeletten | Garmadons Reue/Knochenspalter/Totenglocke 90 %; Totenkrone-Set, Schädelhelm 60 %; Garmadons Reue 25 % (+ Trank, Seelenphiole) | Ende der Toten-Linie, Chronik |
| **Omega**, der Gefallene | Krater | 20 | **1836** (ohne Boss-Faktor) | ~92 (ohne Abschlag) | ja („OMEGA“) | fliegt; Sternenfall, Strahl, Nova; 3 Engelwellen (`ANGEL_WAVES`) | Sternenklinge 90 % + 25 % (+ Trank) | `omegaEnd('slain')`, Weltfolgen §5c |
| **Dodon**, Hüter von Morrgrund | Morrgrund | 20 | **3794** | ~50 | ja („DODON“) | redet zuerst; schwerer Slam jeder 2. Angriff, r 95 | Morrs Keule 90 % + 25 %; Grubenkönig 60 % (+ 2 Tränke, Talisman Wächter 50 %) | `dodonSlain`; HB-41 (nach Sturm-Abbruch nicht ansprechbar) offen |
| Wächter der Nekropole | Große Nekropole | 10 | 242 | ~34 | nein | Hüter der Ahnenurne; **kein Boss-Flag** (keine Bossleiste) | Ahnenurne 100 % u. a. (§21) | `wardenSlain`, Nekromant/Hexenmeister-Pakt |

- **Gewölbe-Wächter** (`VAULTS`): Anführer-Variante, Leben ×1,5+ (nach Gewölbestufe). Hort-Truhe nach Gewölbestufe. Kein Intro.

  | Wächter | Gewölbe | Grundart |
  |---|---|---|
  | Krummnase | Räuberhöhle | Bandit |
  | Rostzahn | Kasematten | Goblin-Krieger |
  | Der Hohepriester | Tempelgruft | Wächter der Nekropole |
  | Morvhal | Knochengruft | Todesritter |
  | Der Regulator | Uhrwerkhalle | Automat |
  | Die Schmugglerkönigin | Schmugglergrotte | Bandit |
  | Der Sternenlose | Sternkammer | Geist |
  | Die Mutter der Wurzeln | Wurzelhalle | Bär |
  | Der Pferchmeister | Ausbrecherstollen | Kettenknecht (**nie erreichbar**, Absturz) |
  | Wächter der Tiefe | Schlund | Todesritter (alle 5 Ebenen) |

- **Bedienung:** Bossleiste unten mit 50-%-Marke. Debug „Regie (T17)“ (Boss-Intro ansehen), Boss-Spawns im Debug.
- **Geprüft:** Live gemessen wurden Lebenspunkte und Boss-Flag. Die Intro-Bedingung ist im Code gelesen (sie wird vor der Boss-KI geprüft, gilt also auch für Gorak, Hrodvar, Weißbart, Garmadon, Omega). Kämpfe selbst nicht live, nur Code gelesen.
- **Fehlversuche / Lücken:**
  - **Behoben:** „Boss-Intros fehlen für Varg, Hrodvar, Garmadon, Gorak, Dodon“ (OFFEN.md, vollstaendigkeit H12). `BOSS_CARDS` (data.js:1727) deckt diese und Weißbart und Omega ab.
  - **Offen:** Kein Intro für **Graumähne, Karrak**, die Gewölbe-Wächter und Elites. Kerkerausbruch ebenfalls ohne.
  - **[Mittel]** Graumähne und Karrak haben keinen eigenen Beutepool. Als Bosse bekommen sie nur die Tabelle ihrer Grundart (Fell oder Banditenkram). Das passt nicht zur Regel „Boss ~90 % relevanter Waffen-Drop“ (Nutzerwunsch S15 P2, data.js:476).
  - **[Niedrig]** Die Boss-Beute ist nicht garantiert: 10 % ohne Waffe, 40 % ohne Rüstung. Das Einzelstück kann doppelt fallen, weil es auch im Waffenpool steht.
    - MECHANIKEN beschreibt Aldhelms Beute („Kanzlerdegen …, Robe des Kanzlers“) wie sicher.
    - Omega gibt mit 7,5 % keine Sternenklinge.
  - **[Niedrig]** Wächter der Nekropole: Er gilt in Doku und Kodex als Boss, hat aber kein Boss-Flag. Keine Bossleiste, kein doppeltes Leben.
  - **[Hoch, siehe §8]** Die Bossleiste fällt bei Varg, Gorak, Hrodvar, Weißbart, Aldhelm und Garmadon nie unter rund ein Drittel, bevor der Boss stirbt.
  - Bossgespräche (Weißbart, Garmadon) sind laut OFFEN.md reiner Text, ohne Story-Fenster.

---

## Zusammenfassung Fehlversuche

Sortiert nach Schwere. Datei:Zeile ungefähr, `game.js` war während der Prüfung in Bearbeitung.

### Hoch
1. **Duell- und Grubenprüfungen werden trotz Sieg verloren.** Bei Krieger, Ritter, Berserker und dem Akademie-Duell stirbt der Gegner über den Rumpf, bevor die 20-%-Schwelle von Kopf + Rumpf erreicht ist. Live: 8 von 12 Duellen danach „nicht bestanden“, der Übungsfechter stirbt. — game.js ~3799 (Duell), ~13863 (Grube); body.js:43–49 (`syncHp`/`vital`).
2. **Schurkenprüfung für neue Figuren unlösbar.** Gezählt werden nur Meuchelstich oder Schattenschritt, die man erst als Schurke bzw. Assassine hat. Damit sind Schurke, Assassine und Folterknecht gesperrt. — game.js ~13861 (`ktTrialHurt`), ~15876 (`backstab` setzt `stabAt`); Probe ~19470 setzt die Klasse vorher und übersieht es.
3. **Bardenprüfung für neue Figuren unlösbar.** Gefordert ist das eigene Kriegslied, das erst der Barde hat. Damit sind Barde und Kettenbarde gesperrt (außer Grubenhäuptling). — game.js ~13600 (`songkill`), ~16541 (`war_song`); Probe ~19513.
4. **Lebensbalken leeren sich bei menschenähnlichen Figuren nie.** `hp` = Kopf + Rumpf, Tod bzw. „am Boden“ hängt am Rumpf. Etwa 33–36 % bleiben stehen (Ziel, Bossleiste, HUD, Gruppe). Die 50-%-Phasenmarke der Bossleiste passt nicht. — body.js:43–49; render.js:264 (`drawBossBar`), ~3340 (`drawTargetBar`); ui.js:129, 153.
5. **Ausbrecherstollen stürzt ab.** Der Pool enthält die Klasse `'chainhunter'` statt eines Gegners. Live 6/6 TypeError. Der geheime Ort und sein Boss „Der Pferchmeister“ sind unerreichbar. — game.js ~11229 (`VAULTS.ausbrecherstollen`), ~1940 (`spawnEnemy`).

### Mittel
6. **Fertigkeit Jagd** hat keine Wirkung und kein Wachstum. Die Herkunft „Jäger“ gibt 6 Punkte umsonst. — ui.js ~1221; data.js:6.
7. **Fertigkeit Schleichen** steigt nie (startet bei 0). Sie wirkt nur in drei Würfen, einen Schleichmodus gibt es nicht. — game.js ~6246, ~9682, ~14032; ui.js ~1222.
8. **Graumähne und Karrak** haben keinen eigenen Boss-Beutepool und kein Boss-Intro. — game.js ~2017–2024 (`REGION_BOSSES`); data.js:479 (`BOSS_LOOT`), :1727 (`BOSS_CARDS`).

### Niedrig
9. Boss-Beute ist nicht garantiert (10 % ohne Waffe), und das Einzelstück kann doppelt fallen. MECHANIKEN stellt Aldhelms Beute als sicher dar. — game.js ~4224 (`dropLoot`); data.js:479–488.
10. Wächter der Nekropole gilt als Boss, hat aber kein Boss-Flag (keine Bossleiste). — data.js:549.
11. Alchemist-Prüfung 1 nimmt die verlangte Seelenphiole nicht ab. Prüfung 2 nennt „Trank brauen“, das man vor der Aufnahme nicht hat. — data.js QUESTS `kt_alchemist1/2`.
12. Der Prüfungstext sagt auch beim zweiten Schritt „Zwei Aufgaben …“. — game.js ~13817 (`trialOffer`).
13. Die verwaiste Fähigkeit „Schattenblitz“ (`shadow_bolt`) gehört zu keiner Klasse, keinem Titel und keinem Stern. — data.js:674.
14. Der Lehrtext nennt bei Funke, Feuerpfeil und Energiegeschoss einen „Wandermagier in Kreuzweg“ statt Serafine. — data.js:741–753.
15. Die Elite „Graumähne“ teilt den Namen mit dem Regionalboss. Tier-Elites geben nur ein Fell. Seeteufel und Hella erscheinen in Banditengebieten. — data.js:1805–1815.
16. Die Engel (Omega-Wellen) haben keine Beutetabelle. — data.js LOOT.
17. Veraltete Doku:
    - MECHANIKEN „sieben Gegnerarten“ mit schwerem Angriff (jetzt zehn) und „22 Zauber in 6 Schulen“ (jetzt 31 in 8).
    - IST_ZUSTAND: Hrodvar 280 statt 220, Dodon 760 statt 620.
    - OFFEN.md/vollstaendigkeit H7 (Zauberlehrer fehlen) und H12 (Boss-Intros fehlen) sind **erledigt**.
18. Nicht nachstellbar: Ein `talk(Borin)` öffnete nach dem Schließen eines anderen Dialogs einmal nichts.

### Behoben gegenüber älteren Meldungen (zur Kenntnis)
- `sp_regen` und `sp_staunch` lehrt Mutter Aldis, `sp_shock` lehrt Magister Corvinus. Live im Menü gesehen.
- Boss-Intros für Varg, Hrodvar, Garmadon, Gorak, Dodon, Weißbart und Omega sind vorhanden.
- Schmieden wirkt (Esse-Güte, Prothesenwartung). Sterne wirken: alle Wirkungsarten und Regelsterne sind im Code verdrahtet.
- Vampir und Grubenhäuptling haben ein Sternbild. Segen kostet Ausdauer.
- HB-06, -07, -14 bis -17, -21, -22 sind behoben (siehe Hunt-Bericht).
- Die Aufnahme nach der Prüfung funktioniert. Live: Krieger mit +1 Talentpunkt und Wuchtschlag.


---

<!-- Teil D aus ist/D_items_wirtschaft_menues.md -->

# Ist-Zustand D — Items, Spielerwirtschaft, Menüs (Stand 03.10.2026)

Bereich D des detaillierten Ist-Zustands. Grundlage: Code-Stand vom 03.10.2026 (Cache-Schlüssel `?v=24`), `docs/IST_ZUSTAND.md` (alter Stand, hier korrigiert und vertieft), `docs/MECHANIKEN.md`, `ROTFALL_STATE/OFFEN.md`, `ROTFALL_STATE/hunt/BERICHT.md`.

**So wurde geprüft.** Die Item-Tabelle ist aus dem Code erzeugt. Ein Skript hat jeden Schlüssel aus `ITEMS` (data.js) in allen Quelldateien gesucht und jede Fundstelle einer Quelle zugeordnet: Ladenliste, Beutetabelle, Bossbeute, Kopfgeld-Elite, Auftrag, Truhe, Rezept, Gewölbe-Truhe, Waffenständer, Geheimer Ort, Sonderbeute. Die Ladenlisten habe ich zusätzlich **im laufenden Spiel** nachgezählt, und zwar zweimal: im echten Spielstand des Entwicklers (nur gelesen) und in einem frisch begonnenen Wegwerfspiel (Platz `ztestD`, danach gelöscht). Läden, Schmiede, Tierhändler, Stall, Kutsche, Betriebe, Handwerk, Lager, Waffenständer und alle 22 Fenster habe ich im Browser bedient und dabei Gold, Gepäck und Fenstermaße gemessen. Der echte Spielstand ist danach nachweislich unverändert (Vergleich mit `rotfall.backup.s14c`: identisch).

**Wichtig:** Während der Prüfung haben andere Agenten `game.js` geändert. Zeilennummern können um einige Zeilen abweichen. Deshalb steht bei jeder Fundstelle auch der Funktionsname.

## Inhaltsverzeichnis
1. [Gegenstände: Grundregeln](#1-gegenstände-grundregeln)
   - 1.1 Ausrüstungsplätze · 1.2 Seltenheit und Affixe · 1.3 Legendäre Effekte · 1.4 Unikate und Mythisch · 1.5 Zustand und Verschleiß · 1.6 Güte (Handwerk) · 1.7 Beute-Regeln · 1.8 Sonderquellen (Gewölbe, Waffenständer, Schatzgerücht, Gräber)
2. [Vollständige Item-Tabelle (295 Einträge)](#2-vollständige-item-tabelle)
3. [Sets (ARMOR_SETS)](#3-sets-armor_sets)
4. [Rezepte und Handwerk (RECIPES)](#4-rezepte-und-handwerk)
5. [Läden und Preise](#5-läden-und-preise)
   - 5.1 Preisformel · 5.2 Sortimente je Händler · 5.3 Stadtwaren · 5.4 Schwarzmarkt · 5.5 Handelsfenster
6. [Kontor, Handelswagen, Lieferaufträge](#6-kontor-handelswagen-lieferaufträge)
7. [Betriebe (Kasse, Überfall, Besatzung)](#7-betriebe)
8. [Bank und Lager](#8-bank-und-lager)
9. [Siedlung](#9-siedlung)
10. [Schmied: Ausbessern, Verbessern, Schmieden lassen](#10-schmied)
11. [Heiler](#11-heiler)
12. [Tierhändler, Pferdehof, Stall](#12-tierhändler-pferdehof-stall)
13. [Kutsche, Schiff, Luftschiff](#13-kutsche-schiff-luftschiff)
14. [Investieren (Stadtkasse)](#14-investieren-stadtkasse)
15. [Alle Fenster und Menüs](#15-alle-fenster-und-menüs)
16. [Systeme, die noch nur eine Dialogliste haben (mit Bewertung)](#16-systeme-ohne-fenster)
17. [Koop: was Gäste können und was fehlt](#17-koop)
18. [Speichern, Laden, Plätze, Cloud-Export](#18-speichern-laden-plätze-cloud-export)
19. [Zusammenfassung Fehlversuche](#19-zusammenfassung-fehlversuche)

---

## 1. Gegenstände: Grundregeln

### 1.1 Ausrüstungsplätze
- **Was es ist:** Der Held trägt Ausrüstung an 9 Plätzen: Waffe, Nebenhand, Kopf, Rumpf, Hände, Beine, Füße, Umhang und Talisman (`GEAR`, game.js oben bei `mkItem`). Eine Zweihandwaffe leert die Nebenhand. Einige Klassen führen zwei Waffen (`DUAL_CLASSES`); ein ausgefallener linker Arm verhindert das (HB-21, behoben).
- **Bedienung:** im Gepäck-Fenster (I) über die Papierpuppe. Doppelklick legt an oder ab, man kann auch ziehen. Ein Schloss sperrt ein Teil gegen Verkauf und Ablegen.
- **Geprüft:** Fenster geöffnet, An- und Ablegen per Code-Aufruf. Die Ziehen-Bedienung habe ich nicht mit der Maus getestet.

### 1.2 Seltenheit und Affixe
- **Was es ist:** Jedes gefundene Ausrüstungsteil würfelt seine eigene Seltenheit (`rollRarity`). Die Chancen sind: Gewöhnlich 62 %, Ungewöhnlich 24 %, Selten 10 %, Episch 3,5 %, Legendär 0,5 % (`RARITY_DROP`). Mythisch würfelt nie. Ein Teil wird nie schlechter als seine Grundseltenheit. Gefährliche Gegner heben die Chancen ab „Selten“ (Bonus × 0,5 je Gefahrenstufe; Boss +1, Elite +1).
- **Wert:** Der Verkaufswert steigt mit der Seltenheit (`RARITY_VALUE`): ×1 / ×1,35 / ×1,9 / ×3 / ×5 / ×8 (Mythisch).
- **Affixe** (`AFFIXES`, 15 Stück — der alte Ist-Zustand nannte 16, gezählt sind es 15):

  | Affix | Plätze | Spanne |
  |---|---|---|
  | Schärfe | Waffe, Talisman | Schaden +6–14 % |
  | Leichtigkeit | Waffe | Schlagtempo +5–12 % |
  | Auge | Waffe, Talisman, Hände | Krit +3–7 % |
  | Durchschlag | Waffe | Panzerbrechend +10–25 % |
  | Atem | Waffe | Ausdauer je Hieb −10–25 % |
  | Härte | fast alle Rüstplätze | Rüstung +1–3 |
  | Lebenskraft | Rumpf, Kopf, Umhang, Beine, Talisman | Leben +3–7 % |
  | Leichtfuß | Füße, Umhang, Rumpf, Beine, Talisman | Tempo +2–5 % |
  | Zähigkeit | Rumpf, Kopf, Füße, Umhang, Beine, Talisman | Ausdauer +8–16 |
  | Blutzoll (major) | Waffe | 4–8 % Lebensraub |
  | Zerfetzen (major) | Waffe | +20–35 % Blutungschance |
  | Arkane Kraft | Talisman, Hände | Zauberschaden +5–12 % |
  | Totenbann | Talisman, Waffe | gegen Untote +10–20 % |
  | Schützenauge | Talisman, Hände | Fernkampf +6–14 % |
  | Dornen (major) | Rumpf, Nebenhand | 15–25 % Nahkampfschaden zurück |
- **Anzahl je Seltenheit:** Ungewöhnlich 1, Selten 2, Episch 3 (davon einer „major“), Legendär 2 plus ein Legendärer Effekt. Fernwaffen bekommen kein Blutzoll und kein Zerfetzen.
- **Geprüft:** im Spiel. Ein beim Schmied geschmiedeter Dolch kam „Meisterlich“ als „selten“ mit 2 Affixen (Schärfe 0,10, Auge 0,07). Ein Kurzschwert wurde auf „Gut“ verbessert und bekam „ungewöhnlich“ mit Totenbann 0,13. Beides stimmt mit den Regeln überein.

### 1.3 Legendäre Effekte (`LEGENDS`)
- **Blutdurst** (Waffe): Jeder Todesstoß heilt 8 % Leben.
- **Nachhall** (Waffe): Mit 20 % Chance trifft ein Hieb ein zweites Mal, mit halbem Schaden.
- **Ahnenwall** (Rumpf, Nebenhand, Kopf): unter 30 % Leben +8 Rüstung.
- **Lücke:** Für Umhang, Hände, Beine, Füße und Talisman gibt es keinen legendären Effekt. Ein legendärer Umhang hat dann nur 2 Affixe (`rollRarity`: `if (L.length)`). Das ist kein Absturz, aber der Effekt fehlt schweigend.

### 1.4 Unikate und Mythisch
- `unique:true`-Teile würfeln keine Seltenheit und keine Affixe. Sie fallen auch nie aus der Gewölbe-Truhe.
- **Mythisch** (fest): Sternenklinge (Omega), Nachtfrost (Hrodvar), Blutkult-Sense (Ende des Blutkults).
- **Feste Legendäre mit eigener Quelle:**
  - Sturmanker (Weißbart), Der Rote Henker (Varg), Goraks Hackmesser, Morrs Keule (Dodon), Garmadons Reue, Kanzlerdegen (Aldhelm);
  - Klinge des Sandfürsten und Leitwolfzahn (sichere Beute der Regionalbosse, `die`);
  - Nachtglasstab (Ilvar), Rotfall-Klinge (Rotfall-Spur, `rotfallDone`), Die letzte Wache (Relikt, `RELICS`).
- **Ohne Quelle (Fehlversuch):** **Sturmsense** und **Donnerwort** (beide `unique`, legendär, data.js:103–104). Nur der Selbsttest erwähnt sie; im Spiel sind sie nicht zu bekommen. Der Lore-Text der Sturmsense nennt Hundertfeld; dort verkauft die Sensenschmiedin Walburga aber nur `SCYTHES` ohne die Sturmsense.

### 1.5 Zustand und Verschleiß
- **Was es ist:** Jedes Ausrüstungsteil hat einen Zustand `cond` von 0 bis 1. Gekaufte und gefundene Teile kommen mit 55–100 % (`mkItem`). Die Rüstung eines Teils zählt mit `0,4 + 0,6 × Zustand` (`armorParts`), ein Teil auf 0 % gibt also noch 40 % seiner Rüstung. Treffer nutzen die Teile ab.
- **Ausbessern:**
  - beim Schmied auf 100 % (§10);
  - selbst an Esse, Amboss oder Werkbank bis 80 %;
  - an der Siedlungs-Werkbank bis 80 %, an der Siedlungsschmiede bis 100 % (§9).
- **Anzeige:** Im Gepäck zeigt ein Balken den Verschleiß rot gestreift. Ein Hammer-Symbol erscheint, wenn ein Teil unter 50 % fällt.
- **Prothesen** haben einen eigenen Zustand mit Wartung (Bereich Bionik, Werkbank-Fenster §15).

### 1.6 Güte (Handwerk, `QUAL`)
- Es gibt 5 Stufen: Grob (Zustand 60 %), Solide, Gut (hebt auf Ungewöhnlich), Meisterlich (hebt auf Selten), Meisterstück (hebt auf Episch).
- **Formel:** `q = Fertigkeit/100 × 0,75 + Zufall × 0,35 − 0,05`. Königseisen hebt das Ergebnis um eine Stufe.
- **Gekauft oder gefunden:** Ein solches Teil zählt beim Verbessern als „Solide“.

### 1.7 Beute-Regeln (`dropLoot`, `lootTier`)
- **Ausrüstung aus der Beutetabelle (`LOOT`):**
  - Normale Gegner lassen sie nur mit ×0,35 der Chance fallen, Elite, Veteran und Anführer mit ×1,5.
  - Alles wird mit dem Beute-Faktor der Schwierigkeit multipliziert.
  - In 50 % der Fälle gibt es zusätzlich 1–6 Gold plus die Stufe des Gegners.
- **Bosse:** Sie würfeln aus `BOSS_LOOT`: 90 % eine Waffe, 60 % ein Rüstungsteil, 25 % ein Einzelstück. Ausrüstung aus `LOOT[boss]` zählt dann nicht mehr. Tränke, Karten und Schlüssel fallen weiter.
- **Kopfgeld-Elite** (`eliteDrop`):
  - ihr festes Teil (mit Gefahrenbonus 2);
  - eine **Trophäe** (Name „Trophäe: …“, Wert 90);
  - 40 + 6 × Stufe Gold.
- **Gegner-Ausrüstung:** Gegner der Art `enemy` lassen ihre getragene Ausrüstung **nicht** fallen. Getötete NPCs (`kind:'npc'`) hinterlassen dagegen ein **Grab** mit ihrer ganzen Ausrüstung und ihrem Gepäck (`makeGrave`). Dadurch sind Teile erreichbar, die nur Wachen oder Hauptleute tragen — aber nur durch Mord.
- **Geprüft:** nur Code gelesen. Die Beute-Raten habe ich nicht gemessen.

### 1.8 Sonderquellen
- **Gewölbe-Truhe** (`vaultLoot`):
  - Inhalt: Trank, Verband und dazu 1–3 zufällige Ausrüstungsteile (Waffe, Rumpf, Kopf oder Nebenhand, kein Unikat).
  - Wertspanne je Stufe: 1: 20–120, 2: 60–240, 3: 120–400, 4: 200–700, 5: 260–900 Gold.
  - Viele Teile ohne eigene Quelle kommen nur hierüber (z. B. Tiefenschürfer, Turmschild, Dornenpeitsche). Hände, Beine, Füße, Umhänge und Talismane kommen **nie** aus Gewölben.
- **Waffenständer durchsuchen** (`rummage`):
  - Mit 60 % Chance eine zufällige Waffe im Wert bis 60. Gesehenes Durchsuchen fremder Möbel ist Diebstahl (40 Kopfgeld).
  - **FEHLER (live bestätigt):** Der Code hängt die gewürfelte Waffe an die gemeinsame Liste `RUMMAGE.weapon_rack` an (`pool.push`, game.js ~5540, `rummage`). Dadurch wird die Liste mit jedem Durchsuchen länger, bis die Seite neu geladen wird.
  - Messung: 40 Durchsuchungen ergaben `0,0,1,0,2,2,0,4,3,1,5,3,4,5,3,6,…,13,8,9,10,10,5` Waffen. In den ersten 10 Durchsuchungen fielen zusammen 13 Waffen, in den letzten 10 zusammen 93. Das ist eine Gegenstandsvermehrung.
- **Schatzgerücht** (`rumorTick`, Gerüchte mit Zielen): Eine „Vergrabene Kiste“ enthält Langschwert, Rapier, Kriegssichel, Langbogen oder Kettenpanzer, dazu einen Trank und eines von: Talisman der Ausdauer, Talisman des Kriegers, Elixier der Stärke, Trank. Lügt das Gerücht, ist die Kiste leer.
- **Feste Truhen der Welt** (world.js, `loot:`): Alte Truhe, Ordenskapelle, Wüstengruft, Räuberversteck, Tempelkammer, Gruft von Alt-Vharn, Grabkammer der Feste, Hort des Toten Königs (Garmadons Krone und Reue), Tiefhall-Hort (Königseisen), Schrein des Himmelssplitters, Schatzkammer der Grube und andere. Die Einträge stehen in der Tabelle.

---

## 2. Vollständige Item-Tabelle

**So liest man die Tabelle:**
- Alle 295 Einträge aus `ITEMS` stehen in der Reihenfolge von data.js, nach Platz gruppiert.
- „Werte“ sind die Grundwerte. „Wert“ ist der Grundpreis in Gold.
- „Bezugsquelle“ nennt jede gefundene Quelle.
- **„KEINE QUELLE“** heißt: Im ganzen Code gibt es keinen Weg, das Teil zu bekommen (außer Debug oder Selbsttest). Das ist ein Fehlversuch.
- **„nur durch Mord an diesem NPC“** heißt: Nur ein benannter NPC trägt das Teil. Man bekommt es nur aus seinem Grab.
- **„alte Stände: fehlt“** heißt: Die Ladenliste dieses Händlers wurde nach dem Spielbeginn erweitert. In bestehenden Spielständen verkauft er die neue Ware **nicht** (siehe §5.2, Fehler F-02).
- **Gewölbe-Truhe** und **Waffenständer** sind regelbasierte Quellen (§1.8).

#### Waffen (80)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `rusty_sword` | Rostiges Kurzschwert | Schaden 7, Reichw. 40, 520 ms | gewöhnl. | 18 | — | Startausrüstung (Herkunft); Beute: Goblin; Beute: Bandit; Beute: Untoter Krieger; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); NPC trägt es (nur über Grab nach Mord); Waffenständer durchsuchen (60 %) |
| `longsword` | Langschwert | Schaden 12, Reichw. 46, 560 ms | ungew. | 90 | — | Laden: Brann; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Hagen der Schlitzer; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Hagen (Schmied); Schatzgerücht → vergrabene Kiste; Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Feldkiste der Hundert; Truhe/Kiste: Alte Truhe; Handwerk: Esse; Gewölbe-Truhe Stufe 1/2 |
| `frostblade` | Frostklinge | Schaden 16, Reichw. 48, 560 ms | episch | 320 | — | Auftrag: Königseisen (q_kingsiron); Kopfgeld-Elite: Irmhild vom Frostgrab; Gewölbe-Truhe Stufe 3/4/5 |
| `greatsword` | Zweihänder | Schaden 22, Reichw. 56, 980 ms | selten | 220 | Zweihand | Laden: Brann; Truhe/Kiste: Wüstengruft; Gewölbe-Truhe Stufe 2/3/4 |
| `axe` | Beil | Schaden 11, Reichw. 38, 680 ms, Durchschl. 25 % | gewöhnl. | 34 | — | Startausrüstung (Herkunft); Beute: Goblin-Krieger; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Otmar Brandschatz; Kopfgeld-Elite: Knarz der Grubenkönig; Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); Handwerk: Esse; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `greataxe` | Große Axt | Schaden 25, Reichw. 52, 1080 ms, Durchschl. 35 % | selten | 260 | Zweihand | Laden: Brann; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 3/4/5 |
| `chain_whip` | Kettenpeitsche | Schaden 9, Reichw. 84, 700 ms | selten | 230 | fesselt; Waffe der Eisernen Kette: reicht weit, fesselt kurz (−40 % Tempo, 1,5 s). Wenig Schaden, viel Kontrolle. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister; Kopfgeld-Elite: Veit mit der Peitsche; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3/4 |
| `goblin_hook` | Hakenmesser | Schaden 7, Reichw. 30, 340 ms, Krit ×2.2, Blutung 30 % | ungew. | 120 | Goblinarbeit aus Grubeneisen. Der Haken reißt: 30 % Blutung. | Laden: Nibbel (Goblinhändlerin); Laden: frei_tobbe (Tobbe Ascherling); Gewölbe-Truhe Stufe 1/2/3 |
| `morgenstern` | Morgenstern | Schaden 15, Reichw. 38, 820 ms, Durchschl. 45 %, Taumeln ×1.8 | selten | 200 | — | Laden: Stadtschmiede; Gewölbe-Truhe Stufe 2/3/4 |
| `kettenkugel` | Kettenkugel | Schaden 17, Reichw. 56, 940 ms, Taumeln ×1.6 | selten | 240 | Schwung | Laden: Stadtschmiede; Gewölbe-Truhe Stufe 2/3/4 |
| `katar` | Katar | Schaden 9, Reichw. 28, 320 ms, Durchschl. 50 %, Krit ×2.4 | ungew. | 130 | — | Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 2/3 |
| `schrottkeule` | Schrottkeule | Schaden 11, Reichw. 36, 700 ms, Taumeln ×1.4 | gewöhnl. | 36 | — | Beute: Goblin-Krieger; Laden: Nibbel (Goblinhändlerin); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `schrottklinge` | Schrottklinge | Schaden 10, Reichw. 40, 540 ms, Blutung 25 % | ungew. | 70 | — | Beute: Goblin; Laden: Nibbel (Goblinhändlerin); Gewölbe-Truhe Stufe 1/2 |
| `flail` | Streitflegel | Schaden 13, Reichw. 46, 820 ms | selten | 210 | Schwung; Schwung: Treffer in rascher Folge +15 % je Stufe (bis 3); ab der dritten Stufe trifft die Kugel rundum. Wer zö… | Beute: Kettenknecht; Beute: Hauptmann der Toten; Laden: Brann; Auftrag: Die Straße nach Aschfurt (q_sandlord); NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3/4 |
| `mace` | Streitkolben | Schaden 13, Reichw. 36, 740 ms, Durchschl. 40 %, Taumeln ×1.6 | ungew. | 110 | — | Laden: Brann; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 1/2 |
| `spear` | Speer | Schaden 10, Reichw. 74, 640 ms | gewöhnl. | 48 | — | Beute: Goblin-Krieger; Beute: Speerträger; Laden: Brann; Laden: Oda; Kopfgeld-Elite: Harpunen-Hella; NPC trägt es (nur über Grab nach Mord); Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); Handwerk: Esse; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `dagger` | Dolch | Schaden 5, Reichw. 26, 300 ms, Krit ×2.6 | gewöhnl. | 22 | — | Startausrüstung (Herkunft); Beute: Bandit; Beute: Blutschöpfer; Beute: Hofspion; Beute: Maskierter; Laden: Sael; NPC trägt es (nur über Grab nach Mord); Laden: Stadtschmiede; Handwerk: Esse; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `lederpeitsche` | Lederpeitsche | Schaden 6, Reichw. 96, 480 ms | gewöhnl. | 45 | zieht heran | Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `dornenpeitsche` | Dornenpeitsche | Schaden 8, Reichw. 100, 520 ms, Blutung 25 % | selten | 260 | zieht heran | Gewölbe-Truhe Stufe 3/4/5 |
| `grassense` | Grassense | Schaden 13, Reichw. 56, 900 ms | gewöhnl. | 40 | Zweihand; trifft im Bogen | Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Handwerk: Esse (Schmieden 10); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `erntesense` | Erntesense | Schaden 17, Reichw. 60, 940 ms | ungew. | 120 | Zweihand; trifft im Bogen | Gewölbe-Truhe Stufe 1/2/3 |
| `doppelsense` | Doppelsense | Schaden 19, Reichw. 58, 980 ms, Blutung 15 % | selten | 340 | Zweihand; trifft im Bogen | Gewölbe-Truhe Stufe 3/4/5 |
| `mondsense` | Mondsense | Schaden 24, Reichw. 64, 950 ms, Durchschl. 25 % | episch | 620 | Zweihand; trifft im Bogen | Gewölbe-Truhe Stufe 4/5 |
| `kriegssense` | Kriegssense | Schaden 20, Reichw. 60, 980 ms | ungew. | 150 | Zweihand; trifft im Bogen | Kopfgeld-Elite: Aschenkönigin Sabeth; Laden: Stadtschmiede; Gewölbe-Truhe Stufe 2/3 |
| `kriegssichel` | Kriegssichel | Schaden 12, Reichw. 40, 600 ms, Durchschl. 15 % | ungew. | 80 | — | Beute: Bandit; Kopfgeld-Elite: Karim Sandgeist; Kopfgeld-Elite: Kapitän Seeteufel; Laden: Stadtschmiede; Laden: Yusuf (Basarhändler); Schatzgerücht → vergrabene Kiste; Handwerk: Esse (Schmieden 15); Gewölbe-Truhe Stufe 1/2 |
| `doppelklinge` | Doppelklinge | Schaden 17, Reichw. 52, 760 ms | selten | 240 | Zweihand; trifft im Bogen | Kopfgeld-Elite: Wendel die Krähe; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `schlagkralle` | Schlagkralle | Schaden 8, Reichw. 30, 330 ms | gewöhnl. | 40 | — | Laden: Stadtschmiede; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `wurfmesser` | Wurfmesser | Schaden 8, Reichw. 300, 680 ms | gewöhnl. | 45 | Fernkampf | Beute: Bandit; Kopfgeld-Elite: Die Stille Mathilde; Kopfgeld-Elite: Flinkfinger Zick; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `wurfbeil` | Wurfbeil | Schaden 14, Reichw. 260, 900 ms, Durchschl. 20 % | ungew. | 90 | Fernkampf | Beute: Goblin-Krieger; Laden: Stadtschmiede; Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 1/2 |
| `schleuder` | Schleuder | Schaden 7, Reichw. 340, 700 ms | gewöhnl. | 15 | Fernkampf | Beute: Goblin-Krieger; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Waffenständer durchsuchen (60 %) |
| `messingpistole` | Messingpistole | Schaden 24, Reichw. 320, 320 ms, Nachladen 2200 ms, Durchschl. 60 %, 6 Energie/Schuss | selten | 380 | Fernkampf; Magitech | Beute: Kriegsautomat; Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 3/4/5 |
| `schockpistole` | Schockpistole | Schaden 12, Reichw. 260, 320 ms, Nachladen 800 ms, 5 Energie/Schuss | ungew. | 260 | Fernkampf; Magitech | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Handwerk: Werkbank (Handwerk 30); Gewölbe-Truhe Stufe 3/4/5 |
| `magiegewehr` | Magiegewehr | Schaden 30, Reichw. 520, 360 ms, Nachladen 1200 ms, Durchschl. 60 %, 10 Energie/Schuss | selten | 560 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 2 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `runenarmbrust` | Runenarmbrust | Schaden 28, Reichw. 440, 420 ms, Nachladen 1500 ms, Durchschl. 50 %, 6 Energie/Schuss | selten | 480 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 2 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `kristallkanone` | Kristallkanone | Schaden 40, Reichw. 380, 420 ms, Nachladen 2600 ms, Durchschl. 30 %, 25 Energie/Schuss | episch | 980 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 3 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt) |
| `praezisionsgewehr` | Präzisionsgewehr | Schaden 48, Reichw. 680, 420 ms, Nachladen 3200 ms, Durchschl. 90 %, 15 Energie/Schuss | episch | 1200 | Zweihand; Fernkampf; Magitech; Rangsperre Aurelion 3 | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt) |
| `zwergenaxt` | Zwergenaxt | Schaden 17, Reichw. 40, 700 ms, Durchschl. 40 % | selten | 220 | — | Laden: Hilda Eisenfaust (Runenschmiedin); Gewölbe-Truhe Stufe 2/3/4 |
| `runenhammer` | Runenhammer | Schaden 27, Reichw. 44, 1150 ms, Durchschl. 65 %, Taumeln ×2.1 | episch | 420 | Zweihand; zertrümmert | Laden: Hilda Eisenfaust (Runenschmiedin); Gewölbe-Truhe Stufe 4/5 |
| `donnerbuechse` | Donnerbüchse | Schaden 40, Reichw. 480, 380 ms, Nachladen 3200 ms, Durchschl. 80 %, 12 Energie/Schuss | episch | 650 | Zweihand; Fernkampf; Magitech | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `sturmsense` | Sturmsense | Schaden 27, Reichw. 62, 960 ms | legendär | 700 | Zweihand; Unikat; trifft im Bogen | **KEINE QUELLE** (Fehlversuch) |
| `donnerwort` | Donnerwort | Schaden 52, Reichw. 500, 380 ms, Nachladen 3000 ms, Durchschl. 90 %, 12 Energie/Schuss | legendär | 900 | Zweihand; Fernkampf; Magitech; Unikat | **KEINE QUELLE** (Fehlversuch) |
| `shortbow` | Kurzbogen | Schaden 9, Reichw. 360, 700 ms | gewöhnl. | 55 | Fernkampf | Startausrüstung (Herkunft); Beute: Banditenschütze; Beute: Knochenschütze; Laden: Gerold; Kopfgeld-Elite: Nadira die Skorpionin; NPC trägt es (nur über Grab nach Mord); Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `longbow` | Langbogen | Schaden 18, Reichw. 460, 920 ms | selten | 190 | Zweihand; Fernkampf | Laden: Gerold; NPC trägt es (nur über Grab nach Mord); Auftrag: Graumähne (q_greymane); Kopfgeld-Elite: Ruprecht Einauge; Schatzgerücht → vergrabene Kiste; Truhe/Kiste: Räuberversteck; Handwerk: Werkbank (Handwerk 25); Gewölbe-Truhe Stufe 2/3 |
| `rapier` | Rapier | Schaden 9, Reichw. 54, 380 ms, Krit ×2.2 | ungew. | 150 | Riposte | Laden: Gerold; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Galgenstrick Fritz; Schatzgerücht → vergrabene Kiste; Gewölbe-Truhe Stufe 2/3 |
| `warhammer` | Kriegshammer | Schaden 24, Reichw. 44, 1150 ms, Durchschl. 60 %, Taumeln ×2.0 | selten | 240 | Zweihand; zertrümmert | Laden: Brann; Kopfgeld-Elite: Brakk Kettenbrecher; Gewölbe-Truhe Stufe 2/3/4 |
| `halberd` | Hellebarde | Schaden 17, Reichw. 82, 920 ms, Durchschl. 30 % | selten | 210 | Zweihand; trifft im Bogen | Laden: Brann; Laden: Oda; Kopfgeld-Elite: Gunther Rotbart; NPC trägt es (nur über Grab nach Mord); Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `crossbow` | Armbrust | Schaden 26, Reichw. 420, 420 ms, Nachladen 1900 ms, Durchschl. 50 % | ungew. | 170 | Zweihand; Fernkampf | Beute: Kopfgeldjäger; Beute: Kettenschütze; Laden: Gerold; Laden: Oda; NPC trägt es (nur über Grab nach Mord); Kopfgeld-Elite: Adelheid vom Hohlweg; Gewölbe-Truhe Stufe 2/3 |
| `wand` | Zauberstab | Schaden 7, Reichw. 320, 460 ms | ungew. | 160 | Fernkampf | Beute: Kultist der Asche; Laden: Gerold; Laden: Sael; Kopfgeld-Elite: Aschepriester Morn; Kopfgeld-Elite: Die Schattenseherin; Gewölbe-Truhe Stufe 2/3 |
| `pickaxe` | Spitzhacke | Schaden 8, Reichw. 34, 760 ms | gewöhnl. | 26 | — | Laden: Stadtschmiede; Laden: Balin Silberbart (Zwergenhändler); Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Werkzeugtruhe; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `staff` | Stab | Schaden 6, Reichw. 40, 620 ms | gewöhnl. | 40 | Zweihand | Beute: Blutmagier; Beute: Kultist der Asche; Beute: Nekromant; Laden: Sael; NPC trägt es (nur über Grab nach Mord); Truhe/Kiste: Tempelkammer; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `schrott_hellebarde` | Schrott-Hellebarde | Schaden 14, Reichw. 78, 900 ms, Durchschl. 20 % | gewöhnl. | 85 | Zweihand; trifft im Bogen | Laden: Oda; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 1/2 |
| `rabenbeil` | Rabenbeil | Schaden 12, Reichw. 34, 640 ms | ungew. | 120 | Der Kopf biegt sich nach hinten wie ein Schnabel. +35 % Schaden gegen Ungerüstete. | Beute: Bandit; Laden: Brann; Gewölbe-Truhe Stufe 1/2/3 |
| `morrs_keule` | Morrs Keule | Schaden 24, Reichw. 40, 880 ms, Durchschl. 45 %, Taumeln ×2.2 | legendär | 950 | Unikat; Dodons Keule aus einem Kettenpfahl. Wer getroffen wird, taumelt lange. | Bossbeute: Dodon, Hüter von Morrgrund |
| `sandfuerstenklinge` | Klinge des Sandfürsten | Schaden 17, Reichw. 46, 500 ms, Blutung 35 % | legendär | 900 | Unikat; Karraks Krummsäbel. Er schneidet tief, jede Wunde blutet. | Sichere Beute: Sandfürst (Regionalboss Wüste) |
| `rotfallklinge` | Rotfall | Schaden 18, Reichw. 48, 540 ms, Blutung 20 % | legendär | 950 | Unikat; Geschmiedet aus dem Eisen, auf das Omegas Blut regnete. Wer die ganze Spur des Rotfalls kennt, trägt sie. Ihre… | Belohnung Rotfall-Spur (rotfallDone, q_rotfall) |
| `leitwolfzahn` | Leitwolfzahn | Schaden 10, Reichw. 28, 300 ms, Krit ×2.8, Blutung 30 % | legendär | 700 | Unikat; Ein Reißzahn in Knochen gefasst. Von hinten tödlich, und er lässt bluten. | Sichere Beute: Leitwolf/Alpha (Regionalboss) |
| `nachtglasstab` | Nachtglasstab | Schaden 15, Reichw. 380, 420 ms | legendär | 1100 | Fernkampf; Unikat; Ilvars Stab mit einer Kugel aus schwarzem Glas. Die Blitze fliegen weiter und treffen härter. | Ilvar töten (ilvarSlain) |
| `dornensaebel` | Dornensäbel | Schaden 11, Reichw. 44, 540 ms, Blutung 20 % | ungew. | 140 | Widerhaken auf dem Rücken der Klinge. 20 % Blutung. | Beute: Kopfgeldjäger; Laden: Brann; Laden: Yusuf (Basarhändler); Truhe/Kiste: Truhe der Karawanserei; Gewölbe-Truhe Stufe 2/3 |
| `grabraeuber` | Grabräuber | Schaden 10, Reichw. 38, 460 ms | gewöhnl. | 45 | — | Beute: Bandit; Laden: Oda; Kopfgeld-Elite: Der Grabschänder Egbert; Gewölbe-Truhe Stufe 1; Waffenständer durchsuchen (60 %) |
| `kriegspicke` | Kriegspicke | Schaden 14, Reichw. 36, 780 ms, Durchschl. 60 % | ungew. | 140 | — | Laden: Brann; Gewölbe-Truhe Stufe 2/3 |
| `sensenlanze` | Sensenlanze | Schaden 15, Reichw. 90, 960 ms | ungew. | 170 | Zweihand; trifft im Bogen | Laden: Brann; Gewölbe-Truhe Stufe 2/3 |
| `knochenspalter` | Knochenspalter | Schaden 26, Reichw. 50, 1100 ms, Taumeln ×1.4 | selten | 250 | Zweihand | Beute: Wächter der Nekropole; Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Kopfgeld-Elite: Der Knochenfürst Varsk; Laden: Grimbart Knochenhand (Knochenschmied); Gewölbe-Truhe Stufe 3/4 |
| `henkersaxt` | Henkersaxt | Schaden 24, Reichw. 50, 1150 ms | selten | 300 | Zweihand; Gegen Verwundete (unter 50 % Leben) +50 % Schaden. | Beute: Kettenknecht; Gewölbe-Truhe Stufe 3/4/5 |
| `mauerbrecher` | Mauerbrecher | Schaden 28, Reichw. 48, 1300 ms, Durchschl. 70 %, Taumeln ×2.2 | episch | 480 | Zweihand; zertrümmert | Beute: Rotgardist; Bossbeute: Gorak, Grubenwart; Gewölbe-Truhe Stufe 4/5 |
| `seelenhaken` | Seelenhaken | Schaden 12, Reichw. 70, 760 ms | selten | 260 | Schwarzer Haken der Toten. Getroffene werden langsam (−40 %, 2,5 s). | Beute: Geist; Gewölbe-Truhe Stufe 3/4/5 |
| `totenglocke` | Totenglocke | Schaden 22, Reichw. 44, 1150 ms, Durchschl. 40 % | selten | 320 | Zweihand; Hohle Eisenglocke als Kopf. KLONG: Feinde um das Ziel verlieren den Mut (−20 % Schaden, 2,5 s). | Beute: Hauptmann der Toten; Bossbeute: König Garmadon; Kopfgeld-Elite: Die Totenglocke; Laden: Grimbart Knochenhand (Knochenschmied); Gewölbe-Truhe Stufe 3/4/5 |
| `rotklaue` | Rotklaue | Schaden 14, Reichw. 46, 560 ms | selten | 280 | Schwarze Klinge, rote Parierstange. Gegen Verwundete +20 % Schaden. | Beute: Rotgardist; Gewölbe-Truhe Stufe 3/4/5 |
| `schwarzzahn` | Schwarzzahn | Schaden 25, Reichw. 58, 1020 ms | episch | 520 | Zweihand; Breite schwarze Klinge mit roter Kerbe. Hinrichtung: unter 20 % Leben +50 % Schaden. | Beute: Rotgardist; Gewölbe-Truhe Stufe 4/5 |
| `kettenbrecher` | Kettenbrecher | Schaden 16, Reichw. 50, 860 ms | episch | 400 | Schwung; Drei Eisenkörper an kurzer Kette. Schwung wie der Streitflegel, breiter Bogen. | Beute: Kettenknecht; Bossbeute: Varg, Kettenmeister; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 3/4/5 |
| `eisenfalke` | Eisenfalke | Schaden 34, Reichw. 440, 460 ms, Nachladen 2600 ms, Durchschl. 70 % | episch | 420 | Zweihand; Fernkampf | Beute: Kettenschütze; Gewölbe-Truhe Stufe 4/5 |
| `roter_henker` | Der Rote Henker | Schaden 32, Reichw. 56, 1250 ms, Durchschl. 30 % | legendär | 950 | Zweihand; Unikat | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister |
| `entermesser` | Entermesser | Schaden 11, Reichw. 40, 500 ms | ungew. | 75 | — | Beute: Plünderer der Sturmklinge; Bossbeute: Weißbart, König der Sturmklinge; Auftrag: Beute für die Sturmklinge (q_klinge2); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `harpune` | Walharpune | Schaden 13, Reichw. 78, 700 ms, Durchschl. 25 % | ungew. | 90 | — | Beute: Harpunier; Bossbeute: Weißbart, König der Sturmklinge; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `sturmanker` | Der Sturmanker | Schaden 34, Reichw. 58, 1300 ms, Durchschl. 45 %, Taumeln ×2.2 | legendär | 1100 | Zweihand; Unikat; zertrümmert | Beute: Weißbart, König der Sturmklinge; Bossbeute: Weißbart, König der Sturmklinge |
| `garmadons_reue` | Garmadons Reue | Schaden 30, Reichw. 58, 1000 ms, Blutung 25 % | legendär | 1200 | Zweihand; Die Klinge des Toten Königs. Auf der Fehlschärfe: ein Name, ausgekratzt. | Bossbeute: König Garmadon; Truhe/Kiste: Hort des Toten Königs |
| `sternenklinge` | Sternenklinge | Schaden 26, Reichw. 50, 600 ms | mythisch | 2000 | Aus dem geschmiedet, was von Omegas Herz blieb. | Beute: Omega, der Gefallene; Bossbeute: Omega, der Gefallene |
| `kanzlerdegen` | Kanzlerdegen „Rotes Siegel“ | Schaden 18, Reichw. 48, 450 ms, Blutung 30 % | legendär | 1000 | Unikat; Aldhelms Degen. Wer einen Blutenden damit fällt, trinkt ein wenig von ihm: +8 % Leben. | Bossbeute: Aldhelm, Blutfürst von Varonheim |
| `blutsense` | Blutkult-Sense | Schaden 28, Reichw. 62, 960 ms, Blutung 20 % | mythisch | 1500 | Zweihand; Unikat; trifft im Bogen; Lebensraub 12 %; Lebensraub: 12 % des Schadens heilen dich (jeder Getroffene im Bogen zählt). | Ende des Blutkults, einmalig (cultEnd) |
| `nachtfrost` | Nachtfrost | Schaden 27, Reichw. 58, 1000 ms | mythisch | 900 | Zweihand; Unikat | Beute: Hrodvar, König unter dem Eis; Bossbeute: Hrodvar, König unter dem Eis |
| `gorak_cleaver` | Goraks Hackmesser | Schaden 18, Reichw. 44, 760 ms, Durchschl. 30 % | legendär | 520 | Unikat | Beute: Gorak, Grubenwart; Bossbeute: Gorak, Grubenwart |

#### Schilde (6)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `wooden_shield` | Holzschild | Rüstung 2, Block 30 % | gewöhnl. | 28 | — | Startausrüstung (Herkunft); Laden: Oda; Laden: Stadtschmiede; Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `buckler` | Eisenbuckler | Rüstung 1, Block 24 % | gewöhnl. | 36 | Klein: Parade-Fenster +60 %, hält aber nur ein Drittel eines Hiebs ab. | Laden: Brann; Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `kite_shield` | Normannenschild | Rüstung 4, Block 42 % | ungew. | 130 | — | Beute: Kelchwächter; Beute: Knochenritter; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Laden: Hagen (Schmied); Truhe/Kiste: Vergessene Nische; Truhe/Kiste: Verborgener Vorrat; Handwerk: Esse (Schmieden 15); Gewölbe-Truhe Stufe 2/3 |
| `tower_shield` | Turmschild | Rüstung 6, Block 57 %, Tempo −22 % | selten | 280 | Eine Wand: hält fast alles, kaum Parade, macht langsam. | Gewölbe-Truhe Stufe 3/4/5 |
| `stachelschild` | Stachelschild | Rüstung 3, Block 36 % | ungew. | 160 | Wer auf den Schild schlägt, verletzt sich an den Stacheln (35 % des Hiebs zurück). | Laden: Waffenhändler (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3 |
| `magitechschild` | Magitech-Schild | Rüstung 3, Block 40 %, 6 Energie/Schuss | episch | 760 | Magitech; Rangsperre Aurelion 2; Energiefeld: mit Energie hält es jeden Hieb ganz ab (6 Energie je Block, keine Ausdauer), leer wie ein Holzsch… | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 5 |

#### Rumpf (37)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `cloth_shirt` | Leinenkittel | Rüstung 1 | gewöhnl. | 8 | — | Startausrüstung (Herkunft); NPC trägt es (nur über Grab nach Mord) |
| `leather_jerkin` | Lederwams | Rüstung 4 | gewöhnl. | 45 | — | Startausrüstung (Herkunft); Beute: Bandit; Beute: Speerträger; Laden: Gerold; NPC trägt es (nur über Grab nach Mord); Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `chain_hauberk` | Kettenpanzer | Rüstung 9 | ungew. | 190 | — | Beute: Kopfgeldjäger; Beute: Wächter der Nekropole; Beute: Hauptmann der Toten; Beute: Kelchwächter; Laden: Brann; Laden: Oda; Laden: Sael; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Hilda Eisenfaust (Runenschmiedin); Laden: Hagen (Schmied); Schatzgerücht → vergrabene Kiste; Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Truhe der Kapelle; Truhe/Kiste: Feldkiste der Hundert; Truhe/Kiste: Gruft von Alt-Vharn; Handwerk: Esse (Schmieden 20); Gewölbe-Truhe Stufe 2/3 |
| `gambeson` | Steppwams | Rüstung 6 | gewöhnl. | 80 | — | Laden: Brann; Laden: Oda; Gewölbe-Truhe Stufe 1/2 |
| `brigandine` | Brigantine | Rüstung 11, Tempo −4 % | ungew. | 260 | — | Beute: Kettenknecht; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 3/4/5 |
| `scale_mail` | Schuppenpanzer | Rüstung 13, Tempo −8 % | selten | 380 | — | Laden: Oda; Gewölbe-Truhe Stufe 3/4/5 |
| `pit_leather` | Grubenlederweste | Rüstung 8 | selten | 210 | Goblinarbeit: gegerbtes Grubenleder, leicht und zäh — hemmt nicht. | Laden: Nibbel (Goblinhändlerin); Laden: frei_tobbe (Tobbe Ascherling); Gewölbe-Truhe Stufe 2/3/4 |
| `kronharnisch` | Kronharnisch | Rüstung 12, Tempo −6 % | selten | 360 | — | Laden: Brann; Laden: Hagen (Schmied); Gewölbe-Truhe Stufe 3/4/5 |
| `ordensharnisch` | Harnisch des Weißen Ordens | Rüstung 13, Tempo −8 % | selten | 420 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `sonnenharnisch` | Sonnenharnisch | Rüstung 15, Tempo −8 % | episch | 620 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 4/5 |
| `plate_cuirass` | Plattenharnisch | Rüstung 15, Tempo −12 % | selten | 460 | — | Beute: Todesritter; Beute: Hrodvar, König unter dem Eis; Bossbeute: Hrodvar, König unter dem Eis; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Truhe/Kiste: Grabkammer der Feste; Truhe/Kiste: Tiefhall-Hort; Truhe/Kiste: Schatzkammer; Handwerk: Esse (Schmieden 40); Gewölbe-Truhe Stufe 4/5 |
| `thronharnisch` | Thronharnisch | Rüstung 22, Tempo −8 % | legendär | 2600 | Blaue Magitech-Platte mit Goldkanten. Ein Kern in der Brust nimmt Stöße auf, leuchtende Adern laufen über die … | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `blutkette` | Blutkette | Rüstung 24, Tempo −13 % | legendär | 2400 | Schwarze Dornenplatte, Pelzkragen, Ketten über der Brust. Wer sie trägt, hat schon viele in Ketten gelegt. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister |
| `sternwacht` | Sternwacht | Rüstung 21, Tempo −10 % | legendär | 2300 | Rüstung der Paladinmarschälle Omegas: goldene Schultern, blutroter Umhang, der Stern auf der Brust glüht. | **nur durch Mord an diesem NPC** — NPC Paladinmarschall Konrad trägt es (eliteKit, nur Grab nach Mord) |
| `totenkrone` | Totenkrone | Rüstung 22, Tempo −10 % | legendär | 2400 | Knochenplatte mit Dornen, grüne Runen, ein Umhang aus Grabtuch. Gegossen, wo Garmadon starb. | Beute: König Garmadon; Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `grubenkoenig` | Rüstung des Grubenkönigs | Rüstung 19, Tempo −6 % | legendär | 1900 | Zusammengeschweißt aus Kettenrüstung, Loren und Wolfspelz. Eine riesige Schulter, eine kleine — so ist sie gew… | Bossbeute: Gorak, Grubenwart; Bossbeute: Dodon, Hüter von Morrgrund |
| `generalspanzer` | Generalspanzer | Rüstung 21, Tempo −9 % | legendär | 2100 | Rooks Panzer: schwere Platte, blutroter Umhang, Pelz am Hals. Brutal und zweckmäßig. | **nur durch Mord an diesem NPC** — NPC Rook/Bandenführer (eliteKit, nur Grab) |
| `hochritter` | Harnisch des Hochritters | Rüstung 21, Tempo −10 % | legendär | 2200 | Blau gelackte Platte mit silbernen Schultern und dem Winkel der Krone. Nur Hauptleute Valens tragen sie. | **nur durch Mord an diesem NPC** — NPC trägt es (nur über Grab nach Mord); NPC Oda (eliteKit, nur Grab) |
| `meisterharnisch` | Harnisch des Ordensmeisters | Rüstung 21, Tempo −10 % | legendär | 2200 | Elfenbeinfarbene Platte, weißer Umhang, das rote Kreuz. Die Toten meiden ihn. | **nur durch Mord an diesem NPC** — NPC Kelan (eliteKit, nur Grab) |
| `todesritter_harnisch` | Harnisch der Eidwacht | Rüstung 10 | episch | 0 | gebunden; Klassenrüstung deathknight | Auftrag: Die kalte Klinge (dk_2) |
| `gewand_stille_schar` | Gewand der Stillen Schar | Rüstung 7 | episch | 0 | gebunden; Klassenrüstung necromancer | Auftrag: Das Gewand der Stillen Schar (c_nec2) |
| `robe_fluesternder` | Robe des Flüsternden | Rüstung 6 | episch | 0 | gebunden; Klassenrüstung warlock | Auftrag: Fäden aus dem Flüstern (c_war2) |
| `hainfell` | Hainfell | Rüstung 6 | episch | 0 | gebunden; Klassenrüstung druid | Auftrag: Das Fell des Leitwolfs (c_dru1) |
| `robe_stille_hand` | Robe der Stillen Hand | Rüstung 5 | episch | 0 | gebunden; Klassenrüstung monk | Auftrag: Die Robe der Generationen (c_mon2) |
| `seemantel` | Seemantel | Rüstung 5 | ungew. | 90 | Geteertes Leder, salzsteif. Hält Gischt ab, keine Klingen — fast. | Beute: Plünderer der Sturmklinge; Beute: Netzwerferin; Bossbeute: Weißbart, König der Sturmklinge; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `eisenwache` | Eisenwache | Rüstung 10 | ungew. | 220 | Schwarzer Brustpanzer über Kettenhemd, rote Schärpe. Die Uniform der Kette. | Beute: Kettenknecht; Beute: Kettenschütze; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3/4 |
| `rotgardist` | Rotgardistenpanzer | Rüstung 13, Tempo −6 % | selten | 420 | Schwarze Platte, rote Schulterstücke. Standhalten: +3 Rüstung, wenn ein Verbündeter nah ist. | Beute: Rotgardist; Auftrag: Eisen für die Grubenstämme (g_dod2); Gewölbe-Truhe Stufe 4/5 |
| `aufsehermantel` | Aufsehermantel | Rüstung 7 | ungew. | 160 | Schwarzer Ledermantel mit Eisenkragen und roten Armschienen. | Beute: Kettenknecht; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 2/3 |
| `tiefenschuerfer` | Tiefenschürfer | Rüstung 8 | ungew. | 150 | Leder, Schulterbleche, dicke Handschuhe. Grubenarbeit, zur Rüstung geflickt. | Gewölbe-Truhe Stufe 2/3 |
| `kettenkoloss` | Kettenkoloss | Rüstung 15, Tempo −10 % | selten | 440 | Mehrere Lagen schwerer Kette über Leder. Kaum ein Schnitt kommt durch. | Laden: Brann; Gewölbe-Truhe Stufe 4/5 |
| `plattenmantel` | Plattenmantel | Rüstung 13, Tempo −6 % | selten | 400 | Langer Mantel aus überlappenden Eisenplatten. | Laden: Oda; Gewölbe-Truhe Stufe 3/4/5 |
| `pluendererharnisch` | Plündererharnisch | Rüstung 9 | ungew. | 150 | Alte Ritterplatte, Leder, Stoff — jedes Teil von woanders. | Beute: Bandit; Laden: Oda; Gewölbe-Truhe Stufe 2/3 |
| `grenzlaeufer` | Grenzläufer | Rüstung 5 | gewöhnl. | 90 | Lederweste, leichte Armschienen. Hemmt nicht. | Beute: Kopfgeldjäger; Laden: Oda; Gewölbe-Truhe Stufe 1/2 |
| `legionaersplatte` | Rostige Legionärsplatte | Rüstung 11, Tempo −6 % | ungew. | 180 | — | Beute: Untoter Krieger; Beute: Großes Skelett; Beute: Hauptmann der Toten; Gewölbe-Truhe Stufe 2/3 |
| `eisenfuerst` | Eisenfürst | Rüstung 18, Tempo −12 % | episch | 800 | Schwarze Platten, rote Linien, schwerer Umhang. Die Rüstung der Kettenmeister. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 5 |
| `letzte_wache` | Die letzte Wache | Rüstung 16, Tempo −5 % | legendär | 700 | Unikat | Relikt (RELICS) |
| `kanzlerrobe` | Robe des Kanzlers | Rüstung 6 | episch | 420 | Schwarzer Samt, rotes Futter. Nachts wärmer, als sie sein sollte. | Bossbeute: Aldhelm, Blutfürst von Varonheim; Gewölbe-Truhe Stufe 4/5 |

#### Kopf (36)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `kronhelm` | Kronhelm | Rüstung 7 | selten | 190 | — | Laden: Brann; Laden: Hagen (Schmied); Gewölbe-Truhe Stufe 2/3 |
| `ordenshelm` | Ordenshelm | Rüstung 8 | selten | 220 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `sonnenhelm` | Sonnenhelm | Rüstung 9 | episch | 320 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 3/4/5 |
| `leather_cap` | Lederkappe | Rüstung 2 | gewöhnl. | 20 | — | Beute: Goblin-Krieger; Beute: Banditenschütze; NPC trägt es (nur über Grab nach Mord); Laden: Weber (Marktstand); Laden: Marktstand/Kaufmann; Laden: Standardware (Händler ohne Liste); Handwerk: Werkbank; Gewölbe-Truhe Stufe 1 |
| `kettle_hat` | Eisenhut | Rüstung 4 | ungew. | 70 | — | Beute: Kettenknecht; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 1/2 |
| `great_helm` | Topfhelm | Rüstung 8 | selten | 210 | — | Laden: Oda; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Gewölbe-Truhe Stufe 2/3/4 |
| `thronhelm` | Thronhelm | Rüstung 12 | legendär | 1200 | Mechanischer Helm des Hohen Rates: Goldflossen, blaues Sehband, man hört das Uhrwerk. | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `blutkettenhelm` | Gehörnter Kettenhelm | Rüstung 12 | legendär | 1100 | Geschlossen, zwei Eisenhörner, im Sehschlitz glimmt es rot. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister |
| `sternwachthelm` | Sternkrone | Rüstung 11 | legendär | 1000 | Topfhelm mit goldener Zackenkrone. Durch den Schlitz leuchtet Omegas Licht. | **nur durch Mord an diesem NPC** — NPC Paladinmarschall Konrad (eliteKit, nur Grab) |
| `schaedelhelm` | Schädelhelm | Rüstung 12 | legendär | 1100 | Ein Totenkopf als Helm, eine Krone aus Knochenzacken. In den Höhlen brennt grünes Licht. | Beute: Todesritter; Beute: König Garmadon; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `schrotthelm` | Schrotthörner | Rüstung 10 | legendär | 800 | Ein Grubenhelm mit angenieteten Hörnern. | Bossbeute: Gorak, Grubenwart; Gewölbe-Truhe Stufe 5 |
| `generalshelm` | Visierhelm des Generals | Rüstung 11 | legendär | 950 | Schallern mit Visier. Hinter dem Spalt ist es dunkel — und dann rot. | **nur durch Mord an diesem NPC** — NPC Rook/Bandenführer (eliteKit, nur Grab) |
| `federhelm` | Federhelm | Rüstung 11 | legendär | 950 | Hoher Helm mit blauem Federbusch. | **nur durch Mord an diesem NPC** — NPC Oda (eliteKit, nur Grab) |
| `meisterhelm` | Meisterkrone | Rüstung 11 | legendär | 950 | Topfhelm mit silberner Zackenkrone und rotem Kamm. | **nur durch Mord an diesem NPC** — NPC Kelan (eliteKit, nur Grab) |
| `iron_helm` | Eisenhelm | Rüstung 5 | ungew. | 95 | — | Beute: Hauptmann der Toten; Beute: Hrodvar, König unter dem Eis; Bossbeute: Hrodvar, König unter dem Eis; Laden: Brann; Laden: Oda; NPC trägt es (nur über Grab nach Mord); Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt); Laden: Stadtschmiede; Laden: Hilda Eisenfaust (Runenschmiedin); Laden: Hagen (Schmied); Handwerk: Esse; Gewölbe-Truhe Stufe 1/2 |
| `wanderkapuze` | Wanderkapuze | Rüstung 1 | gewöhnl. | 18 | Spitzer Zipfel, grobe Wolle. Unter einer Kapuze brennt die Sonne nur halb so stark. | Beute: Bandit; Laden: Standardware (Händler ohne Liste) |
| `pilgerkapuze` | Pilgerkapuze | Rüstung 2 | gewöhnl. | 26 | Weit und tief, das Gesicht liegt ganz im Schatten. Unter einer Kapuze brennt die Sonne nur halb so stark. | Laden: Standardware (Händler ohne Liste); Gewölbe-Truhe Stufe 1 |
| `zaddelgugel` | Zaddelgugel | Rüstung 2 | ungew. | 64 | Gugel mit gezackter Schulterpelerine und langem Zipfel. Unter einer Kapuze brennt die Sonne nur halb so stark. | Laden: Hagen (Schmied); Gewölbe-Truhe Stufe 1/2 |
| `kettenhaube` | Kettenhaube | Rüstung 4 | ungew. | 96 | Ringgeflecht über Kopf und Schultern, das Gesicht bleibt frei. Hält auch die Sonne ab — zur Hälfte. | Beute: Kettenknecht; Gewölbe-Truhe Stufe 1/2 |
| `maskenkapuze` | Maskenkapuze der Stillen | Rüstung 3 | selten | 170 | Enge Kapuze mit Gesichtstuch: nur die Augen bleiben. Unter einer Kapuze brennt die Sonne nur halb so stark. | Beute: Bandit; Beute: Maskierter; Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 2/3 |
| `ordenskutte` | Ordenskutte | Rüstung 4, fest {vital:0.03} | ungew. | 90 | Tiefe elfenbeinfarbene Kutte mit rotem Saum. Das Gesicht verschwindet im Schatten. Unter einer Kapuze brennt d… | Laden: Sael; Gewölbe-Truhe Stufe 1/2 |
| `kuttenkapuze` | Tiefe Kuttenkapuze | Rüstung 2 | gewöhnl. | 28 | Grobe Mönchskutte, so tief, dass nur Dunkel bleibt. Unter einer Kapuze brennt die Sonne nur halb so stark. | Laden: Standardware (Händler ohne Liste); Gewölbe-Truhe Stufe 1 |
| `henkerskapuze` | Henkerskapuze | Rüstung 3 | ungew. | 80 | Steifer schwarzer Kegel ohne Gesicht, nur zwei Augenlöcher. Unter einer Kapuze brennt die Sonne nur halb so st… | Beute: Kettenknecht; Gewölbe-Truhe Stufe 1/2 |
| `wuestenhaube` | Wüstenhaube | Rüstung 2 | gewöhnl. | 34 | Gewickeltes Kopftuch mit Staubschleier. Das Gesicht bleibt frei bis auf die Augen. Unter einer Kapuze brennt d… | Laden: Yusuf (Basarhändler); Gewölbe-Truhe Stufe 1 |
| `widderkapuze` | Widderkapuze | Rüstung 3, fest {enduring:8} | selten | 200 | Kapuze mit zwei eingerollten Widderhörnern. Unter einer Kapuze brennt die Sonne nur halb so stark. | Beute: Kultist der Asche; Gewölbe-Truhe Stufe 2/3/4 |
| `pestkapuze` | Pestkapuze mit Schnabel | Rüstung 3, fest {vital:0.04} | selten | 210 | Lederne Schnabelmaske mit Glasaugen unter der Kapuze. Im Schnabel stecken Kräuter gegen den Seuchenhauch. Unte… | Truhe/Kiste: Truhe der Kapelle; Gewölbe-Truhe Stufe 2/3/4 |
| `todesritter_helm` | Helm der Eidwacht | Rüstung 6 | episch | 0 | gebunden; Klassenrüstung deathknight | Auftrag: Der erste Schwur (dk_1) |
| `totenrufer_kapuze` | Kapuze des Totenrufers | Rüstung 4 | episch | 0 | gebunden; Klassenrüstung necromancer | Auftrag: Die Knochen der Vergessenen (c_nec1) |
| `hoernerkrone` | Hörnerkrone des Paktes | Rüstung 4 | episch | 0 | gebunden; Klassenrüstung warlock | Auftrag: Die Krone, die wächst (c_war1) |
| `geweih_hirsch` | Geweih des Weißen Hirschs | Rüstung 3 | legendär | 0 | gebunden; Klassenrüstung druid | Auftrag: Der Weiße Hirsch (c_dru3) |
| `gebetsband` | Gebetsband der Stillen Hand | Rüstung 2 | episch | 0 | gebunden; Klassenrüstung monk | Auftrag: Neun Knoten (c_mon1) |
| `dreispitz` | Kapitänshut | Rüstung 2 | ungew. | 70 | Breite Krempe, Möwenfeder. Wer ihn trägt, gibt Befehle. | Beute: Harpunier; Beute: Weißbart, König der Sturmklinge; Bossbeute: Weißbart, König der Sturmklinge; Auftrag: Die Schwarzsegel-Kapitänin (q_wb_nebel); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Gewölbe-Truhe Stufe 1/2 |
| `garmadon_krone` | Krone des Toten Königs | Rüstung 8 | legendär | 900 | Schwarzes Eisen, rot glimmend. Kalt, auch in warmer Hand. | Truhe/Kiste: Hort des Toten Königs; Gewölbe-Truhe Stufe 5 |
| `rotgardistenhelm` | Rotgardistenhelm | Rüstung 9 | selten | 240 | Schwarzer Vollhelm mit rotem Kamm. | Beute: Rotgardist; Gewölbe-Truhe Stufe 2/3/4 |
| `bergmannshelm` | Bergmannshelm | Rüstung 4 | gewöhnl. | 60 | Eisenkappe mit Nackenleder. Aus den Gruben der Mark. | Beute: Kettenschütze; Laden: Brann; NPC trägt es (nur über Grab nach Mord); Laden: Kettenkrämerin; Gewölbe-Truhe Stufe 1/2 |
| `eisenfuersthelm` | Hörnerhelm | Rüstung 10 | episch | 400 | Geschlossen, schmaler Sehschlitz, zwei kurze Eisenhörner. | Beute: Varg, Kettenmeister; Bossbeute: Varg, Kettenmeister; NPC trägt es (nur über Grab nach Mord); Gewölbe-Truhe Stufe 3/4/5 |

#### Umhänge (21)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `traveler_cloak` | Reisemantel | Rüstung 1 | gewöhnl. | 24 | Wollmantel mit Kapuze. Wärmt in Schneenächten. | Beute: Kultist der Asche; Laden: Gerold; Laden: Sael; Laden: Weber (Marktstand); Laden: Marktstand/Kaufmann; Laden: Standardware (Händler ohne Liste) |
| `fetzenmantel` | Fetzenmantel | Rüstung 1 | gewöhnl. | 14 | Zerrissen bis zu den Knien, aber er wärmt. Mit Kapuze. | Beute: Verdorbener; Beute: Wucherer; Beute: Kultist der Asche; Beute: Wiedergänger; Laden: Standardware (Händler ohne Liste) |
| `oelzeugumhang` | Ölzeug-Pelerine | Rüstung 2 | ungew. | 72 | Kurzer, geteerter Schulterumhang mit weiter Kapuze. Gischt perlt ab. | Beute: Plünderer der Sturmklinge |
| `wolfspelzmantel` | Wolfspelzmantel | Rüstung 3 | selten | 185 | Schwerer Mantel mit grauem Wolfspelz um die Schultern. Wärmt in Schneenächten. | Laden: Hagen (Schmied) |
| `brokatmantel` | Brokat-Halbmantel | Rüstung 2 | selten | 240 | Über eine Schulter geworfen, Messingborte, Goldfutter. Aurelische Mode. | Laden: Yusuf (Basarhändler) |
| `wappenmantel_valen` | Wappenmantel von Valen | Rüstung 4 | episch | 380 | Langer Mantel mit silbernem Winkel auf dem Rücken. Wer ihn trägt, spricht für Varon. | Laden: Hagen (Schmied) |
| `grabtuchmantel` | Grabtuchmantel | Rüstung 3 | episch | 360 | Bodenlang, mit spitzer Kapuze und grün schimmernder Borte. Kalt auch in der Sonne. | Beute: Geist |
| `teermantel` | Teermantel | Rüstung 1 | gewöhnl. | 28 | Geteerte Öljacke mit langen Schößen. Hält Gischt und Schneeregen ab. | Beute: Plünderer der Sturmklinge |
| `rabenmantel` | Rabenmantel | Rüstung 2 | ungew. | 110 | Hunderte schwarze Federn auf Filz, mit Federkragen. Im Regen schimmern sie blau. | Beute: Bandit |
| `wuestenburnus` | Wüstenburnus | Rüstung 2, fest {enduring:8} | ungew. | 120 | Weiter Wollmantel mit Kopftuch. Hält Sand, Mittagssonne und Nachtkälte ab. Das Tuch zählt als Kapuze: Die Sonn… | Laden: Yusuf (Basarhändler) |
| `doppelmantel` | Doppelmantel | Rüstung 3 | ungew. | 130 | Kurze Pelerine über einem bodenlangen Mantel. Zwei Lagen Wolle, doppelt warm. | Laden: Hagen (Schmied) |
| `kettenumhang` | Kettenumhang der Kette | Rüstung 4, fest {sturdy:2} | selten | 270 | Ein Umhang aus Ringgeflecht mit zwei Schulterplatten. Schwer, laut, kaum zu durchschneiden. | Bossbeute: Varg, Kettenmeister |
| `kapitaensrock` | Kapitänsrock | Rüstung 2, fest {fleet:0.03} | selten | 240 | Langer Rock mit Messingknöpfen, hohem Kragen und Goldborte. Trägt sich leicht auf schwankendem Deck. | Bossbeute: Weißbart, König der Sturmklinge |
| `knochenumhang` | Knochenumhang | Rüstung 3, fest {enduring:10} | selten | 230 | Zerfetzter Mantel mit tiefer Kutte, Wirbeln auf dem Rücken und einem Schädel auf der Schulter. Die Kutte zählt… | Beute: Untoter Krieger |
| `baerenfell` | Bärenfell mit Kopf | Rüstung 4, fest {vital:0.04} | selten | 280 | Ein ganzes Bärenfell: Kopf im Nacken, Pranken vor der Brust verknotet. Wärmt in Schneenächten. | Beute: Bandit |
| `rabenfuerst` | Mantel des Rabenfürsten | Rüstung 4, fest {fleet:0.05,vital:0.05} | legendär | 1400 | Bodenlange Rabenfedern mit violettem Schimmer und spitzer Kapuze. Leicht wie Asche. Die Kapuze hält die Sonne … | Beute: Bandit |
| `todesritter_mantel` | Frostmantel der Eidwacht | Rüstung 4 | legendär | 0 | gebunden; Klassenrüstung deathknight | Auftrag: Der gebrochene Eid (dk_3) |
| `grabsteinkragen` | Kragen aus Grabstein | Rüstung 3 | legendär | 0 | gebunden; Klassenrüstung necromancer | Auftrag: Der Kragen aus Grabstein (c_nec3) |
| `schattenmantel` | Mantel aus Schattenfaden | Rüstung 3 | legendär | 0 | gebunden; Klassenrüstung warlock | Auftrag: Was der Obelisk nicht wollte (c_war3) |
| `fellmantel_hain` | Fellmantel des Hains | Rüstung 4 | episch | 0 | gebunden; Klassenrüstung druid | Auftrag: Der lange Winter (c_dru2) |
| `order_seal` | Siegel des Ordens | Rüstung 2 | selten | 200 | — | Auftrag: Prüfung: Das Siegel (q_paladin2); Truhe/Kiste: Ordenskapelle; Truhe/Kiste: Tempelkammer; Truhe/Kiste: Verschütteter Ordenskasten |

#### Hände, Beine, Füße (17)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `iron_boots` | Eisenschuhe | Rüstung 3 | ungew. | 60 | — | Laden: Brann |
| `leather_boots` | Lederstiefel | Rüstung 1 | gewöhnl. | 16 | — | **KEINE QUELLE** (Fehlversuch) |
| `wickel_stille_hand` | Wickel der Stillen Hand | Rüstung 2 | legendär | 0 | gebunden; Klassenrüstung monk | Auftrag: Ilvas Wickel (c_mon3) |
| `thron_handschuhe` | Handschuhe des Throns | Rüstung 4 | episch | 420 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `thron_beinschienen` | Beinschienen des Throns | Rüstung 5 | episch | 480 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `blut_handschuhe` | Blutkettenhandschuhe | Rüstung 5 | episch | 420 | — | Bossbeute: Varg, Kettenmeister |
| `blut_beinschienen` | Blutkettenbeinschienen | Rüstung 5 | episch | 480 | — | Bossbeute: Varg, Kettenmeister |
| `toten_handschuhe` | Knochenhandschuhe der Krone | Rüstung 4 | episch | 420 | — | Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `toten_beinschienen` | Beinschienen der Totenkrone | Rüstung 5 | episch | 480 | — | Bossbeute: Hrodvar, König unter dem Eis; Bossbeute: König Garmadon; Laden: Grimbart Knochenhand (Knochenschmied) |
| `hochritter_handschuhe` | Hochritterhandschuhe | Rüstung 4 | episch | 400 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `hochritter_beinschienen` | Hochritterbeinschienen | Rüstung 5 | episch | 460 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `lederhandschuhe` | Lederhandschuhe | Rüstung 1 | gewöhnl. | 18 | — | Beute: Bandit |
| `kettenhandschuhe` | Kettenhandschuhe | Rüstung 2 | ungew. | 60 | — | Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `panzerhandschuhe` | Panzerhandschuhe | Rüstung 4 | selten | 160 | — | Beute: Hauptmann der Toten; Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `lederbeinlinge` | Lederbeinlinge | Rüstung 2 | gewöhnl. | 24 | — | Beute: Bandit |
| `kettenbeinlinge` | Kettenbeinlinge | Rüstung 3 | ungew. | 80 | — | Beute: Wächter der Nekropole; Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |
| `beinschienen` | Beinschienen mit Kniebuckeln | Rüstung 5, Tempo −2 % | selten | 190 | — | Beute: Hauptmann der Toten; Laden: Rüstmeisterin (Aurelheim, alte Stände: fehlt) |

#### Talismane (14)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `glocke_moorbach` | Glocke von Moorbach | fest {sturdy:3} | selten | 260 | — | Truhe/Kiste: Truhe der Kapelle |
| `talisman_ausdauer` | Talisman der Ausdauer | fest {enduring:12} | ungew. | 90 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt); Schatzgerücht → vergrabene Kiste |
| `talisman_leichtfuss` | Talisman der Beweglichkeit | fest {fleet:0.05} | ungew. | 90 | — | Beute: Bandit; Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `talisman_krieger` | Talisman des Kriegers | fest {sharp:0.08} | selten | 160 | — | Auftrag: Eisen für die Grubenstämme (g_dod2); Laden: Juwelier (Aurelheim, alte Stände: fehlt); Schatzgerücht → vergrabene Kiste |
| `talisman_waechter` | Talisman des Wächters | fest {sturdy:3} | selten | 160 | — | Beute: Dodon, Hüter von Morrgrund; Beute: Wächter der Nekropole; Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `talisman_jaeger` | Talisman des Jägers | fest {marks:0.1} | selten | 160 | — | **KEINE QUELLE** (Fehlversuch) |
| `talisman_toten` | Talisman der Toten | fest {slayer:0.18} | selten | 180 | — | Beute: Hauptmann der Toten |
| `talisman_magie` | Talisman der Magie | fest {spellp:0.1} | selten | 180 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `talisman_leben` | Talisman des Lebens | fest {vital:0.06} | selten | 170 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `magiekern` | Aurelioner Magiekern | fest {spellp:0.15} | episch | 400 | — | Weltereignis Magiekern (coreTaken) |
| `splitter_rotfall` | Splitter des Rotfalls | fest {spellp:0.18,vital:-0.08} | episch | 320 | — | **KEINE QUELLE** (Fehlversuch) |
| `blutstein` | Blutstein | fest {sharp:0.14,enduring:-10} | episch | 320 | — | **KEINE QUELLE** (Fehlversuch) |
| `eulenauge` | Eulenauge | fest {keen:0.08,fleet:-0.04} | episch | 300 | — | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `totenmuenze` | Münze des Fährmanns | fest {slayer:0.3,vital:-0.05} | legendär | 500 | — | Beute: Hauptmann der Toten |

#### Verbrauchsgüter, Elixiere, Prothesen (37)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `energiezelle` | Energiezelle | — | gewöhnl. | 30 | use:cell | Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Laden: Yusuf (Basarhändler); Handwerk: Werkbank |
| `elixier_staerke` | Elixier der Stärke | Wirkung {dmg:0.15}, 180 s | ungew. | 60 | use:elixir | Schatzgerücht → vergrabene Kiste — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_ausdauer` | Elixier der Ausdauer | Wirkung {vigor:0.3}, 180 s | ungew. | 50 | use:elixir | **KEINE QUELLE** (Fehlversuch) — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_eile` | Elixier der Eile | Wirkung {speed:0.12}, 120 s | ungew. | 55 | use:elixir | **KEINE QUELLE** (Fehlversuch) — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_stein` | Steinhaut | Wirkung {armor:6}, 150 s | selten | 80 | use:elixir | Beute: Hauptmann der Toten |
| `elixier_wut` | Trank der Wut | Wirkung {dmg:0.1,speed:0.05,armor:-2}, 90 s | selten | 85 | use:elixir | Beute: Bandit |
| `elixier_arkan` | Arkaner Trank | Wirkung {spell:0.2}, 150 s | selten | 90 | use:elixir | **KEINE QUELLE** (Fehlversuch) |
| `elixier_auge` | Scharfes Auge | Wirkung {marks:0.2,keen:0.05}, 150 s | ungew. | 60 | use:elixir | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `elixier_wacht` | Wachtrank | Wirkung {slayer:0.2}, 180 s | ungew. | 55 | use:elixir | Beute: Hauptmann der Toten |
| `elixier_regen` | Trank der Erneuerung | Wirkung {regen:1.5}, 60 s | selten | 95 | use:elixir | **KEINE QUELLE** (Fehlversuch) — steht in der Liste des Gewürzhändlers (Aurelheim), der verkauft aber nur die Marktstand-Ware (Liste wird überschrieben) |
| `elixier_lehre` | Trank der Lehre | Wirkung {xp:0.1}, 600 s | selten | 120 | use:elixir | Laden: Juwelier (Aurelheim, alte Stände: fehlt) |
| `schrottarm` | Schrottarm | Prothese arm Stufe 1 | ungew. | 220 | use:prosthesis; Gelenke aus Wagenteilen, Zugseile, eine Klaue. Ersetzt einen verlorenen Arm — besser als nichts. | Beute: Kriegsautomat; Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `schrottbein` | Schrottbein | Prothese leg Stufe 1 | ungew. | 200 | use:prosthesis; Ein Stelzfuß mit Federgelenk. Ersetzt ein verlorenes Bein. | Beute: Kriegsautomat; Beute: Dampframme; Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `aurelarm` | Aurelionischer Arm | Prothese arm Stufe 2 | selten | 900 | use:prosthesis; Messingknochen, Federzug, Lederpolster. Werkstatt Gelenkhall. Voll beweglich. | Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `aurelbein` | Aurelionisches Bein | Prothese leg Stufe 2 | selten | 850 | use:prosthesis; Kniegelenk mit Dämpfer, Sohle aus Gummi und Stahl. Voll belastbar. | Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `meisterarm` | Meisterarm von Gelenkhall | Prothese arm Stufe 3 | episch | 2400 | use:prosthesis; Feinwerk der Kybernetiker. Stärker als Fleisch: Hiebe mit diesem Arm treffen härter (+10 %). | Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall) |
| `meisterbein` | Meisterbein von Gelenkhall | Prothese leg Stufe 3 | episch | 2200 | use:prosthesis; Feinwerk der Kybernetiker. Schneller als Fleisch (+6 % Tempo). | Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall) |
| `protoarm` | Prototyp-Arm | Prothese arm Stufe 4 | legendär | 5200 | use:prosthesis; Aus der Versuchswerkstatt der Akademie. Hiebe +15 %, nutzt sich nur halb so schnell ab. | Schwarzmarkt (Bionik) |
| `protobein` | Prototyp-Bein | Prothese leg Stufe 4 | legendär | 4800 | use:prosthesis; Aus der Versuchswerkstatt der Akademie. +10 % Tempo, nutzt sich nur halb so schnell ab. | Schwarzmarkt (Bionik) |
| `greifhand` | Greifhand | — | selten | 480 | use:mechmod; Modul für einen Prothesenarm. Schwere Rüstung und Schild bremsen 30 % weniger; selbst ausbessern bis 90 %. | Laden: Kybernetiker; Schwarzmarkt (Bionik) |
| `klingenhand` | Klingenhand | — | episch | 900 | use:mechmod; Modul für einen Prothesenarm. +12 % Nahkampf, aber kein Schildblock mehr. | Laden: Kybernetiker; Schwarzmarkt (Bionik) |
| `federfuss` | Federfuß | — | selten | 520 | use:mechmod; Modul für ein Prothesenbein. +8 % Tempo. | Laden: Kybernetiker; Schwarzmarkt (Bionik) |
| `ankerfuss` | Ankerfuß | — | selten | 560 | use:mechmod; Modul für ein Prothesenbein. Treffer stoßen dich nicht mehr zurück, −5 % Tempo. | Laden: Kybernetiker |
| `spezialoel` | Spezialöl | — | ungew. | 70 | use:mechkit; Ein Fläschchen Kristallöl. Bringt die am stärksten abgenutzte Prothese (oder das Auge) um 25 Punkte hoch, höch… | Laden: Prothesenhändlerin; Laden: Kybernetiker; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Laden: Yusuf (Basarhändler); Schwarzmarkt (Bionik) |
| `auge_schrott` | Schrottauge | — | ungew. | 180 | use:eye; Ein Glas in einer Blechfassung. Sieht etwas weiter (Sichtweite 22), nutzt sich doppelt so schnell ab. | Laden: Prothesenhändlerin; Schwarzmarkt (Bionik) |
| `auge_aurel` | Aurelionisches Auge | — | selten | 750 | use:eye; Messingiris mit Schleifglas. Sichtweite 28, Fernkampf-Krit +2 %. | Laden: Prothesenhändlerin; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `auge_meister` | Meisterauge von Gelenkhall | — | episch | 2000 | use:eye; Kristalllinse mit Restlichtverstärker. Sichtweite 32, Fernkampf-Krit +4 %, Nachtsicht +40 %. | Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall) |
| `auge_proto` | Prototyp-Auge | — | legendär | 4200 | use:eye; Aus der Akademie, nicht zu kaufen. Sichtweite 36, Fernkampf-Krit +6 %, Nachtsicht +50 %, Wärmesicht. | Schwarzmarkt (Bionik) |
| `bread` | Brotlaib | heilt 6 | gewöhnl. | 4 | use:food | Startausrüstung (Herkunft); Beute: Goblin; Beute: Bandit; Beute: Speerträger; Beute: Blutknecht; Laden: Gerold; Laden: Oda; Auftrag: Brot für Morrgrund (g_dod1); Laden: Bäcker (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Schenke; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Leyla (Wasserhändlerin); Laden: Balin Silberbart (Zwergenhändler); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Vorrat; Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); NPC trägt es (nur über Grab nach Mord); Truhe/Kiste: ? |
| `dried_meat` | Dörrfleisch | heilt 10 | gewöhnl. | 9 | use:food | Startausrüstung (Herkunft); Beute: Wolf; Beute: Wildschwein; Beute: Banditenschütze; Beute: Plünderer der Sturmklinge; Beute: Netzwerferin; Beute: Wucherer; Beute: Wiedergänger; Beute: Bär; Beute: Hirsch; Laden: Gerold; Laden: Oda; Laden: Sael; Laden: Bäcker (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Kettenkrämerin; Laden: Nibbel (Goblinhändlerin); Laden: Schenke; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Leyla (Wasserhändlerin); Laden: Balin Silberbart (Zwergenhändler); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Vorratskiste der Wacht; Truhe/Kiste: Proviantkiste |
| `herb` | Heilkraut | heilt 10 | gewöhnl. | 12 | use:bandage | Startausrüstung (Herkunft); Laden: Quirin; Laden: Sael; Auftrag: Elenas Kräuter (q_herbs); Auftrag: Prüfung des Klerikers: Die Kranken (kt_cleric1); Auftrag: Prüfung des Alchemisten: Für den Kessel (kt_alchemist1); Auftrag: Der lange Winter (c_dru2); Auftrag: Der Ruf des Hains (q_grove); Laden: Bauer (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Nibbel (Goblinhändlerin); Laden: Schenke; Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste) |
| `wasserschlauch` | Wasserschlauch | — | gewöhnl. | 12 | use:water; Kühles Brunnenwasser aus Karak-Atar. Füllt die Ausdauer und schützt eine Stunde vor der Wüstenhitze. | Laden: Leyla (Wasserhändlerin); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Truhe der Karawanserei |
| `koederpfeife` | Köderpfeife | — | ungew. | 45 | use:lure | Laden: Standardware (Händler ohne Liste) |
| `blutphiole` | Blutphiole | — | ungew. | 40 | use:blood | Beute: Blutschöpfer; Beute: Aldhelm, Blutfürst von Varonheim; Beute: Blutmagier; Beute: Kelchwächter; Beute: Maskierter |
| `potion` | Trank der Genesung | heilt 40 | ungew. | 55 | use:heal | Beute: Kopfgeldjäger; Beute: Rotgardist; Beute: Plünderer der Sturmklinge; Beute: Harpunier; Beute: Weißbart, König der Sturmklinge; Beute: Varg, Kettenmeister; Beute: Netzwerferin; Beute: Hofspion; Beute: Dodon, Hüter von Morrgrund; Beute: Gorak, Grubenwart; Beute: Hauptmann der Toten; Beute: Aldhelm, Blutfürst von Varonheim; Beute: König Garmadon; Beute: Omega, der Gefallene; Beute: Hrodvar, König unter dem Eis; Laden: Gerold; Laden: Oda; Laden: Quirin; Auftrag: Prüfung des Alchemisten: Drei Tränke (kt_alchemist2); Auftrag: Felle für den Hafen (q_pelts); Kopfgeld-Elite: Mulch der Pilzschamane; Kopfgeld-Elite: Seuchenmaul; Laden: Magitech-Ingenieurin (Aurelheim, alte Stände: fehlt); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Yusuf (Basarhändler); Laden: Ossara (Seelenhändlerin); Laden: Balin Silberbart (Zwergenhändler); Laden: Orm (Braumeister); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Vorrat; Schatzgerücht → vergrabene Kiste; Laden: Standardware (Händler ohne Liste); Truhe/Kiste: Truhe der Kapelle; Truhe/Kiste: Feldkiste der Hundert; Truhe/Kiste: Truhe der Karawanserei; Truhe/Kiste: Aufgebrochene Kiste; Truhe/Kiste: Alte Truhe; Truhe/Kiste: Ordenskapelle; Truhe/Kiste: Wüstengruft; Truhe/Kiste: Räuberversteck; Truhe/Kiste: Tempelkammer; Truhe/Kiste: Grabkammer der Feste; Truhe/Kiste: Vorrat eines Grabräubers; Truhe/Kiste: Truhe der Nekromanten; Truhe/Kiste: Hort des Toten Königs; Truhe/Kiste: Verbotene Schriften; Truhe/Kiste: Tiefhall-Hort; Truhe/Kiste: Vergessene Nische; Truhe/Kiste: Schatzkammer; Handwerk: Kessel |
| `bandage` | Verband | — | gewöhnl. | 9 | use:bandage | Beute: Goblin; Beute: Bandit; Beute: Kopfgeldjäger; Beute: Kettenknecht; Beute: Kettenschütze; Beute: Speerträger; Beute: Verdorbener; Beute: Wucherer; Beute: Blutknecht; Beute: Kultist der Asche; Laden: Gerold; Laden: Oda; Laden: Quirin; Laden: Sael; Laden: Juwelier (Aurelheim, alte Stände: fehlt); Laden: Weber (Marktstand); Laden: Marktstand/Kaufmann; Laden: Hausierer; Laden: Kettenkrämerin; Laden: Nibbel (Goblinhändlerin); Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Laden: Schenke; Laden: Ysolde Kielmark (Handelsherrin des Salzbunds); Laden: Yusuf (Basarhändler); Laden: Balin Silberbart (Zwergenhändler); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Truhe/Kiste: Vorrat; Laden: frei_tobbe (Tobbe Ascherling); Laden: Standardware (Händler ohne Liste); NPC trägt es (nur über Grab nach Mord); Truhe/Kiste: Aufgebrochene Kiste; Truhe/Kiste: Vorratskiste der Wacht; Truhe/Kiste: Tasche des Spähers; Truhe/Kiste: Vorrat eines Grabräubers; Truhe/Kiste: Truhe der Nekromanten; Truhe/Kiste: Proviantkiste; Truhe/Kiste: ?; Handwerk: Kessel / Tuch |
| `soul_vial` | Seelenphiole | — | ungew. | 40 | use:soul | Beute: Kultist der Asche; Beute: Geist; Beute: Nekromant; Beute: Aschdämon; Beute: Schattenwesen; Beute: Leichenkoloss; Beute: Todesritter; Beute: König Garmadon; Laden: Quirin; Laden: Sael; Auftrag: Prüfung des Alchemisten: Für den Kessel (kt_alchemist1); Auftrag: Die kalte Klinge (dk_2); Auftrag: Das Gewand der Stillen Schar (c_nec2); Auftrag: Die Krone, die wächst (c_war1); Laden: Ossara (Seelenhändlerin); Geheimer Ort (secretNames); Geheimer Ort (secretTick3); Truhe/Kiste: Truhe der Nekromanten; Truhe/Kiste: Verbotene Schriften |

#### Material, Waren, Schlüssel- und Questgegenstände (41)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `koenigseisen` | Königseisen | — | selten | 120 | — | Laden: Stadtschmiede; Laden: Hilda Eisenfaust (Runenschmiedin) |
| `trophaee` | Trophäe | — | selten | 90 | — | Jede Kopfgeld-Elite (eliteDrop) |
| `meteorsplitter` | Meteorsplitter | — | selten | 150 | — | Weltereignis Meteor (evMeteor) |
| `wassereimer` | Wassereimer | — | — | 0 | Voll bis zum Rand. Läuft über, wenn man rennt. | Brand löschen: Eimer holen (doInteract) |
| `salzsiegel` | Salzsiegel des Bundes | — | — | 40 | Wachs, Salz, das Zeichen des Salzbunds. Öffnet Kontore — und manchen Mund. | Auftrag: Salz für den Bund (q_salz2); Laden: Ysolde Kielmark (Handelsherrin des Salzbunds) |
| `seekarte` | Weißbarts Seekarte | — | — | 0 | Riffe, Strömungen, ein Kreuz vor der Nebelbank. Quer darüber in Rot: „Nicht verkaufen.“ | Beute: Weißbart, König der Sturmklinge |
| `feinwerkzeug` | Feinwerkzeug | — | selten | 320 | — | Laden: Kybernetiker; Laden: Meisterin Vell (Prothesenmacherin, Gelenkhall); Schwarzmarkt (Bionik) |
| `ersatzteile` | Ersatzteile | — | gewöhnl. | 30 | — | Kopfgeld-Elite: Schrottfresser Grimm; Kopfgeld-Elite: Das Messingungetüm; Laden: Prothesenhändlerin; Laden: Kybernetiker; Laden: Balin Silberbart (Zwergenhändler); Schwarzmarkt (Bionik) |
| `dietrich` | Dietrich der Diebesgilde | — | selten | 40 | — | Auftrag q_gilde bei Mo (jailChoices) |
| `auftragspaket` | Versiegeltes Paket | — | gewöhnl. | 0 | — | Botenauftrag (acceptContract) |
| `vargs_kette` | Vargs Kette | — | legendär | 0 | — | Truhe/Kiste: Vargs Truhe unter dem Banner |
| `vargs_tagebuch` | Vargs Tagebuch | — | selten | 0 | — | Truhe/Kiste: Vargs Truhe unter dem Banner |
| `himmelssplitter` | Splitter vom Himmel | — | legendär | 0 | — | Truhe/Kiste: Schrein des Himmelssplitters |
| `pferchschluessel` | Pferchschlüssel | — | selten | 0 | — | Auftrag: Die Pferche öffnen (q_pferch) |
| `tributgut` | Tributgut | — | gewöhnl. | 10 | — | Tributzug der Eisenmark überfallen (tribTick) |
| `automatenkern` | Automatenkern | — | ungew. | 60 | — | Beute: Kriegsautomat; Beute: Wächterspinne; Beute: Dampframme |
| `strick` | Strick | — | gewöhnl. | 6 | — | Laden: Marktstand/Kaufmann |
| `rotes_siegel` | Rotes Siegel | — | selten | 0 | — | Blutkult-Weg (cultSealRite) |
| `blutmaske` | Blutmaske | — | ungew. | 15 | — | Beute: Blutmagier; Beute: Maskierter |
| `stiefelscheide` | Stiefelscheide | — | ungew. | 160 | — | Laden: Yusuf (Basarhändler) |
| `wood` | Bauholz | Rohstoff (wood) | gewöhnl. | 2 | — | Laden: Böttcher (Marktstand) |
| `stone` | Bruchstein | Rohstoff (stone) | gewöhnl. | 2 | — | Laden: Handwerker (Marktstand) |
| `iron` | Eisenerz | Rohstoff (iron) | gewöhnl. | 6 | — | Beute: Goblin; Beute: Goblin-Krieger; Beute: Kriegsautomat; Beute: Großes Skelett; Beute: Wächterspinne; Beute: Dampframme; Beute: Gorak, Grubenwart; Beute: Hrodvar, König unter dem Eis; Auftrag: Eisen für die Grubenstämme (g_dod2); Laden: Nibbel (Goblinhändlerin); Laden: Hofmar (Hoflieferant); Laden: Wendel (Händler); Laden: frei_tobbe (Tobbe Ascherling); Truhe/Kiste: Wüstengruft; Truhe/Kiste: Werkzeugtruhe; Truhe/Kiste: Tiefhall-Hort; Truhe/Kiste: Verborgener Vorrat |
| `pelt` | Wolfsfell | Handelsware | gewöhnl. | 14 | — | Beute: Wolf; Beute: Wildschwein; Beute: Bär; Beute: Wilder Hund; Beute: Hirsch; Beute: Kuh; Auftrag: Prüfung des Schützen: Wölfe an der Hürde (kt_archer1); Auftrag: Das Fell des Leitwolfs (c_dru1); Auftrag: Felle für den Hafen (q_pelts); Kopfgeld-Elite: Graumähne; Kopfgeld-Elite: Schwarzfell; Kopfgeld-Elite: Eisenhauer; Kopfgeld-Elite: Der Alte vom Berg; Kopfgeld-Elite: Der Weiße Hund; Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `bone` | Alter Knochen | — | gewöhnl. | 3 | — | Beute: Wolf; Beute: Goblin; Beute: Untoter Krieger; Beute: Bomben-Skelett; Beute: Großes Skelett; Beute: Verdorbener; Beute: Wucherer; Beute: Wächter der Nekropole; Beute: Hauptmann der Toten; Beute: Wiedergänger; Beute: Bär; Beute: Wilder Hund; Beute: Knochenritter; Beute: Knochenschütze; Beute: Seuchenleiche; Beute: Knochenhund; Beute: Aasschwinge; Beute: Leichenkoloss; Laden: Sael; Auftrag: Der erste Schwur (dk_1); Auftrag: Die Knochen der Vergessenen (c_nec1); Laden: Nibbel (Goblinhändlerin); Truhe/Kiste: Lager der Grabräuber |
| `grain` | Weizensack | Handelsware | gewöhnl. | 6 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `salt` | Salzsack | Handelsware | gewöhnl. | 8 | — | Auftrag: Salz für den Bund (q_salz2); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `cloth` | Tuchballen | Handelsware | gewöhnl. | 12 | — | Beute: Schaf; Auftrag: Beute für die Sturmklinge (q_klinge2); Kopfgeld-Elite: Karim Sandgeist; Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `meat` | Pökelfleisch | Handelsware | gewöhnl. | 9 | — | Beute: Kuh; Beute: Schaf; Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `timber` | Stammholz | Handelsware | gewöhnl. | 4 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `woodware` | Holzwaren | Handelsware | gewöhnl. | 10 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `stoneware` | Behauene Steine | Handelsware | gewöhnl. | 8 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `ore` | Erzfuhre | Handelsware | gewöhnl. | 8 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `ingot` | Eisenbarren | Handelsware | gewöhnl. | 18 | — | Laden: Hilda Eisenfaust (Runenschmiedin); Laden: Balin Silberbart (Zwergenhändler); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `tools` | Werkzeugkiste | Handelsware | gewöhnl. | 24 | — | Laden: Balin Silberbart (Zwergenhändler); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `arms` | Waffenkiste | Handelsware | ungew. | 45 | — | Laden: Standardware (Händler ohne Liste); Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `magitech` | Magitech-Teile | Handelsware | ungew. | 60 | — | Markthändler/Kontor: Ware aus dem Stadtlager (shopStock) |
| `grave_seal` | Grabsiegel | — | selten | 0 | — | Beute: Untoter Krieger; Beute: Bomben-Skelett; Beute: Großes Skelett; Beute: Geist; Auftrag: Prüfung des Magiers: Das Grabsiegel (kt_mage1); Auftrag: Das Grabsiegel (q_undead); Auftrag: Der Kragen aus Grabstein (c_nec3); Laden: Ossara (Seelenhändlerin); Truhe/Kiste: Versunkener Stein; Truhe/Kiste: Gruft von Alt-Vharn; Truhe/Kiste: Grabkammer der Feste; Truhe/Kiste: Lager der Grabräuber |
| `scout_report` | Späherbericht | — | ungew. | 0 | — | Auftrag: Die Zahl der Toten (q_frontier); Truhe/Kiste: Tasche des Spähers |
| `kings_iron` | Königseisen | — | selten | 0 | — | Auftrag: Königseisen (q_kingsiron); Truhe/Kiste: Tiefhall-Hort |
| `ancestor_urn` | Ahnenurne | — | episch | 0 | — | Beute: Wächter der Nekropole; Auftrag: Der Pakt der Stillen Schar (q_pact) |

#### Werkzeuge der Bewohner (6)

| Schlüssel | Name | Werte | Seltenheit | Wert | Besonderheit | Bezugsquelle |
|---|---|---|---|---|---|---|
| `tool_hammer` | Schmiedehammer | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_hoe` | Hacke | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_saw` | Säge | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_spoon` | Kochlöffel | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_rod` | Angel | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |
| `tool_fork` | Heugabel | — | gewöhnl. | 0 | — | Nur Bewohner-Werkzeug (CYCLE), für Spieler nicht vorgesehen |

**Zählung:**
- 80 Waffen, 6 Schilde, 37 Rumpfteile, 36 Kopfteile, 21 Umhänge, 17 Teile für Hände, Beine und Füße, 14 Talismane.
- 37 Verbrauchsgüter (Elixiere, Tränke, Prothesen, Module), 41 Materialien, Waren und Auftragsstücke, 6 Bewohner-Werkzeuge.
- Der alte Ist-Zustand nannte 216 Gegenstände. Das ist veraltet: Es sind **295**.

**Ergebnis der Quellenprüfung:**
- **10 Teile ohne jede Quelle:** Sturmsense, Donnerwort, Lederstiefel, Talisman des Jägers, Splitter des Rotfalls, Blutstein, Elixier der Ausdauer, Elixier der Eile, Arkaner Trank, Trank der Erneuerung.
- **8 legendäre Setteile nur durch Mord:** Sternwacht und Sternkrone (Paladinmarschall Konrad), Generalspanzer und Visierhelm (Rook), Harnisch des Hochritters und Federhelm (Oda), Harnisch und Krone des Ordensmeisters (Kelan). Die Sets Sternwacht, Rooks General und Ordensmeister lassen sich auf keinem friedlichen Weg vervollständigen.
- **51 Zeilen tragen „alte Stände: fehlt“** (Juwelier, Waffenhändler, Rüstmeisterin, Magitech-Ingenieurin in Aurelheim; §5.2).


---

## 3. Sets (ARMOR_SETS)

### Sets — Überblick
- **Was es ist:** Wer alle Grundteile eines Sets trägt (Harnisch und Helm), bekommt einen Bonus (`setOf`, game.js ~101). Vier Sets haben zusätzlich Handschuhe und Beinschienen: mit 3 Teilen gibt es mehr, mit 4 Teilen noch mehr.
- **Bedienung:** Die Bildkarte im Gepäck zeigt alle Teile eines Sets; getragene leuchten hell. Wer ein getragenes Set durch Ablegen bricht, sieht das rot. Debug: Grafik → „Rüstungsset anlegen“.
- **Geprüft:** Bezugsquellen per Code und Ladenzählung. Die Boni selbst habe ich nicht im Kampf gemessen. Der Selbsttest hat eine Probe dafür.

| Set | Teile | Bonus (2 Teile) | 3 / 4 Teile | Woher |
|---|---|---|---|---|
| Rotgarde | Rotgardistenpanzer, Rotgardistenhelm | +10 % Schaden | — | Beute Rotgardist (20 % / 25 %) |
| Eisenfürst | Eisenfürst, Hörnerhelm | +4 Rüstung, +15 Ausdauer | — | Varg (Bossbeute) |
| Kronwache Valens | Kronharnisch, Kronhelm | +3 Rüstung, +5 % Schaden | — | Laden Brann (Nordfurt), Schmied Hagen (Varonheim). Kronhelm auch beim Ritterschlag durch Varon |
| Weißer Orden | Harnisch des Weißen Ordens, Ordenshelm | +2 Rüstung, +20 % gegen Untote | — | Rüstmeisterin Aurelheim (alte Stände: fehlt), Gewölbe 3–5 |
| Sonnenlegion | Sonnenharnisch, Sonnenhelm | +3 Rüstung, +10 Ausdauer | — | Rüstmeisterin (alte Stände: fehlt), Gewölbe |
| Thron des Hochreichs | Thronharnisch, Thronhelm (+ Handschuhe, Beinschienen) | +5 Rüstung, +25 Ausdauer, +8 % Schaden | +3 Rüstung / +15 % Blocken, +8 % Leben | **nur** Rüstmeisterin — in alten Ständen **gar nicht** |
| Blutkette | Blutkette, Gehörnter Kettenhelm (+ Handschuhe, Beinschienen) | +6 Rüstung, +10 % Schaden | +5 % Schaden / 3 % Lebensraub | Varg (Beute und Bossbeute) |
| Sternwacht | Sternwacht, Sternkrone | +4 Rüstung, +10 % Schaden, +10 Ausdauer | — | **nur Grab von Paladinmarschall Konrad** |
| Totenkrone | Totenkrone, Schädelhelm (+ Handschuhe, Beinschienen) | +5 Rüstung, +12 % Schaden | +2 Rüstung, +10 Ausdauer / 2 % Lebensraub, +6 % Leben | Garmadon, Hrodvar, Todesritter (Schädelhelm 8 %), Laden Grimbart Knochenhand (Schwarze Feste) |
| Grubenkönig | Rüstung des Grubenkönigs, Schrotthörner | +4 Rüstung, +30 Ausdauer | — | Gorak, Dodon (Bossbeute) |
| Rooks General | Generalspanzer, Visierhelm | +4 Rüstung, +12 % Schaden | — | **nur Grab von Rook** |
| Hochritter Valens | Harnisch des Hochritters, Federhelm (+ Handschuhe, Beinschienen) | +6 Rüstung, +15 Ausdauer | +3 Rüstung / +20 % Blocken | Harnisch und Helm **nur Grab von Oda**; Handschuhe und Beinschienen bei der Rüstmeisterin |
| Ordensmeister | Harnisch des Ordensmeisters, Meisterkrone | +4 Rüstung, +35 % gegen Untote | — | **nur Grab von Kelan** |

**Fehlversuche / Lücken:**
- Vier Sets (Sternwacht, Rooks General, Ordensmeister und die Grundteile Hochritter) bekommt man nur, wenn man einen wichtigen NPC ermordet (`ELITE_KIT`, game.js ~2844; `eliteKit` legt sie an). Ob das gewollt ist, steht nirgends. Für den Spieler gibt es keinen Hinweis.
- Im neuen Spiel trug Konrad die Sternwacht noch nicht: Er erscheint erst mit den Paladinen (`ensurePaladins`). Kelan, Rook und Oda trugen ihre Sets sofort (live geprüft).
- Die Handschuhe und Beinschienen des Hochritters gibt es zu kaufen, Harnisch und Helm nicht. Das Set ist also halb käuflich.

---

## 4. Rezepte und Handwerk

### Handwerk an Esse, Werkbank und Kessel
- **Was es ist:** An einer Esse oder einem Amboss (Schmieden), an einer Werkbank (Handwerk) und an jedem Lagerfeuer als Kessel (Medizin) stellt man Gegenstände aus Material her (`RECIPES`, `craftItem`). Die Güte hängt an der Fertigkeit (§1.6). Jede Arbeit übt die Fertigkeit. Eine Schmiedearbeit dauert 45 Minuten, eine Arbeit am Kessel 20 Minuten.
- **Wo:** Esse, Amboss und Werkbank in Städten (Möbel mit E), Lagerfeuer, Siedlungs-Werkbank. **Nicht** in der Siedlungsschmiede (siehe Lücken).
- **Rezepte (20):**

  | Station | Ergebnis | Material | Mindest-Fertigkeit |
  |---|---|---|---|
  | Esse | Dolch | 2 Eisen | — |
  | Esse | Langschwert | 4 Eisen, 1 Holz | — |
  | Esse | Beil | 3 Eisen, 2 Holz | — |
  | Esse | Speer | 2 Eisen, 3 Holz | — |
  | Esse | Kriegssichel | 4 Eisen, 1 Holz | Schmieden 15 |
  | Esse | Grassense | 3 Eisen, 2 Holz | Schmieden 10 |
  | Esse | Eisenhelm | 4 Eisen | — |
  | Esse | Normannenschild | 4 Eisen, 2 Holz | Schmieden 15 |
  | Esse | Kettenpanzer | 7 Eisen | Schmieden 20 |
  | Esse | Plattenharnisch | 10 Eisen, 2 Eisenbarren | Schmieden 40 |
  | Werkbank | Holzschild | 4 Holz | — |
  | Werkbank | Eisenbuckler | 2 Holz, 1 Eisen | — |
  | Werkbank | Kurzbogen | 4 Holz | — |
  | Werkbank | Langbogen | 6 Holz | Handwerk 25 |
  | Werkbank | Lederkappe | 1 Fell | — |
  | Werkbank | Lederwams | 3 Fell | — |
  | Werkbank | Schockpistole | 4 Ersatzteile, 1 Automatenkern, 2 Eisen | Handwerk 30 |
  | Werkbank | Energiezelle ×2 | 1 Ersatzteile, 1 Automatenkern | — |
  | Kessel | Trank der Genesung | 3 Heilkraut | — |
  | Kessel | Verband ×3 | 1 Tuch | — |

- **Dazu:**
  - Verbände aus Tuchballen (3) oder Leinenkittel (2) im Gepäck (`craftBandage`);
  - die Fähigkeit „Trank brauen“ (3 Heilkraut);
  - Selbstausbessern bis 80 % (`mendAt`).
- **Bedienung:** GUI. Die Handwerk-Tafel dockt rechts an: Rezeptkarten mit Bild und Material (rot, wenn es fehlt), ein Schloss für die Fertigkeit, Güte-Balken mit den echten Chancen, Knöpfe „Herstellen“, „Mit Königseisen“ und „Ausbessern“. Ein Hinweis steht beim ersten Mal im Log (`craftHint`). Debug: „Handwerk: Esse/Werkbank/Kessel hier öffnen“.
- **Geprüft (live):** Werkbank-Tafel geöffnet. Bei 20 Holz zeigte sie Holzschild (4), Eisenbuckler, Kurzbogen, Langbogen (Schloss 25), Lederkappe, Lederwams, Schockpistole (Schloss 30) und Energiezelle ×2. „Herstellen“ ergab einen Holzschild „Solide“ (Hersteller „Testo“), Holz 20 → 16, das Gepäck +1. Das stimmt.
- **Fehlversuche / Lücken:**
  - **Siedlungsschmiede:** Die Beschreibung sagt „Waffen aus Eisen, Reparatur ohne Meister“ (data.js:1405). `useBuilding` (game.js ~12229) bietet aber nur Ausbessern bis 100 %. Herstellen geht dort nicht, weil die Siedlungsschmiede kein Esse-Möbel ist. Das ist seit S15 offen (alter Ist-Zustand Nr. 5).
  - Es gibt keine Rezepte für Hände, Beine, Füße, Umhänge oder Talismane, und keines für die 10 Teile ohne Quelle (z. B. Lederstiefel, Elixiere). Ein Rezept wäre der naheliegende Weg, sie erreichbar zu machen.
  - Elixiere können nicht gebraut werden. Der Kessel kennt nur Trank und Verband.

---

## 5. Läden und Preise

### 5.1 Preisformel (`price`, `rawPrice`, `repPrice`; game.js ~14300)
- **Ausrüstung und Verbrauch:**
  - Kaufen: Wert × Lagerfaktor der Stadt (`baseMul`, höchstens ×9) × (1,35 − Handel × 0,3) × Ruf-Faktor.
  - Verkaufen: Wert × Lagerfaktor (höchstens ×1,3) × Seltenheitsfaktor des Exemplars × (0,45 + Handel × 0,25) × Ruf-Faktor.
  - Der Verkaufspreis ist immer höchstens Kaufpreis − 1. Damit lohnt kein Kauf-und-Verkauf-Kreislauf.
- **Stadtwaren** (13 Waren, `GOODS`): Der Preis kommt aus `SIM.townPrice`, abhängig von Vorrat und Bedarf. Handel ±20 %.
- **Ruf-Faktor** (`repPrice`):
  - Rufstufe der Händlerfraktion;
  - Angst (beim Kauf +20 % je Stufe);
  - Rang −3 % je Rang (bis −35 %, mit Legende −25 % dazu);
  - Stigma (Blutkult);
  - Omega-Glaube;
  - Ruhm „Berühmt“ −5 %.
- **Jeder Kauf** zieht 0,5 Einheit aus dem Stadtlager der passenden Grundware (z. B. „Waffen“). Deshalb steigt der Preis verwandter Ware während des Einkaufs.
- **Geprüft (live, Wegwerfspiel, Schmied Kuno in Nordfurt):**
  - Kurzschwert: Preisschild 24, bezahlt 24.
  - Dolch: Schild 29, bezahlt **32**. Das Schild war vor dem ersten Kauf gemalt; der Kauf hat das Waffenlager gesenkt. Das neu gemalte Schild stimmt wieder, es ist also kein Betrug. Bei schnellem Doppelklick sieht man aber kurz einen alten Preis.
  - Beil: 47 / 47.
  - Verkauf: 3 Teile, Schild 2/3/3, erhalten 2/3/3. Das Gepäck ging korrekt herunter, Gekauftes kam an.
  - Der Schmied hatte an diesem Tag nur 3 Teile: höchstens 2 Grundteile plus 5 Würfe, gedeckelt durch „Waffenkisten“ im Stadtlager (`armsCap`). Danach stand „Heute nichts mehr. Morgen kommt neue Ware.“

### 5.2 Sortimente je Händler (live gezählt im neuen Spiel; Quelle in Klammern)

| Händler (Beruf) | Wo | Sortiment |
|---|---|---|
| Stadtschmied (`SMITH_POOL`) | jede Stadt mit Schmiede (14 im Spiel) | Königseisen, Morgenstern, Kettenkugel, Rostiges Kurzschwert, Langschwert, Beil, Speer, Dolch, Holzschild, Eisenhelm, Spitzhacke, Kettenpanzer, Kriegssichel, Kriegssense, Schlagkralle, Wurfbeil |
| Brann, Meisterschmiedin (`NPCS`) | Nordfurt | Langschwert, Zweihänder, Streitkolben, Streitflegel, Kriegshammer, Hellebarde, Beil, Große Axt, Speer, Kettenpanzer, Eisenhelm, Normannenschild, Buckler, Steppwams, Brigantine, Eisenhut, Eisenschuhe, Rabenbeil, Dornensäbel, Sensenlanze, Kronharnisch, Kronhelm, Kriegspicke, Kettenkoloss, Bergmannshelm |
| Oda, Grenzwacht | Grenzposten | Verbände, Trank, Dörrfleisch, Brot, Speer, Armbrust, Hellebarde, Kettenpanzer, Holzschild, Eisenhelm, Schuppenpanzer, Topfhelm, Steppwams, Schrott-Hellebarde, Grabräuber, Plündererharnisch, Grenzläufer, Plattenmantel |
| Gerold, Kontorhändler | Nordfurt | Brot, Dörrfleisch, Trank, Verband, Rapier, Armbrust, Langbogen, Kurzbogen, Reisemantel, Lederwams, Zauberstab |
| Quirin, Alchemist | — | Trank, Verband, Heilkraut, Seelenphiole |
| Sael, Totenschreiber | Vharnholm | Seelenphiole, Knochen, Verband, Heilkraut, Dörrfleisch, Kettenpanzer, Stab, Zauberstab, Dolch, Reisemantel, Ordenskutte |
| Mara (Händlerin, ohne Liste) | Eren | Standardware: Brot, Dörrfleisch, Heilkraut, Trank, Verband, Köderpfeife, Wanderkapuze, Fetzenmantel, Pilgerkapuze, Kuttenkapuze, Kurzschwert, Langschwert, Beil, Speer, Kurzbogen, Holzschild, Lederwams, Lederkappe, Kettenpanzer, Spitzhacke, Reisemantel (+ Stadtwaren) |
| Kaufmann/Kaufherr, Marktstand (`STALL_POOL`) | alle Städte | Brot, Dörrfleisch, Heilkraut, Verband, Reisemantel, Lederkappe, Trank, Strick (+ Stadtwaren) |
| Bäcker / Weber / Böttcher / Bauer / Magd / Handwerker (`STALL_SELL`) | freie Marktstände | eigene Ware (Brot, Mäntel, Holz, Stein, Kräuter …) |
| Wirt / Schankmagd / Koch | Schenken | Brot, Dörrfleisch, Heilkraut (+ Verband) |
| Juwelier (`MARKET_POOL`) | Markthalle Aurelheim | Trank, Verband, 6 Talismane (Ausdauer, Beweglichkeit, Krieger, Wächter, Magie, Leben), Eulenauge, Scharfes Auge, Trank der Lehre — **im Stand des Entwicklers nur Trank, Trank, Verband** |
| Waffenhändler | Markthalle Aurelheim | Langschwert, Speer, Kurzbogen, Hellebarde, Kurzschwert, Doppelklinge, Wurfmesser, Schleuder, Buckler, Stachelschild, Lederpeitsche, Grassense — **im Stand des Entwicklers nur die ersten 5** |
| Rüstmeisterin | Markthalle Aurelheim | Kettenpanzer, Plattenharnisch, Normannenschild, Eisenhelm, Topfhelm, Sonnen-, Ordens- und Thron-Harnisch und -Helm, Ketten- und Panzerhandschuhe, Kettenbeinlinge, Beinschienen, Thron- und Hochritter-Handschuhe und -Beinschienen — **im Stand des Entwicklers nur die ersten 5** |
| Magitech-Ingenieurin | Aurelheim | Messingpistole, Donnerbüchse, Trank, Schockpistole, Magiegewehr, Runenarmbrust, Kristallkanone, Präzisionsgewehr, Magitech-Schild, Energiezellen — **im Stand des Entwicklers kein Laden (`shop:false`)** |
| Gewürzhändler | Markthalle Aurelheim | **soll:** Kräuter, Brot, Dörrfleisch, Trank, 4 Elixiere (Stärke, Ausdauer, Eile, Erneuerung). **Ist:** nur die Marktstand-Ware (Liste wird überschrieben, F-03) |
| Tuchhändlerin | Markthalle Aurelheim | soll Reisemantel, Lederwams, Lederkappe; ist ebenfalls die Marktstand-Ware |
| Prothesenhändlerin (12×) | Aurelheim | Schrottarm, Schrottbein, Aurelionischer Arm und Bein, Schrott- und Aurelionisches Auge, Spezialöl, Ersatzteile (Bionik mit Rangsperre) |
| Kybernetiker (19×) | Aurelheim | Spezialöl, Ersatzteile, Feinwerkzeug, Greifhand, Federfuß, Ankerfuß, Klingenhand |
| Meisterin Vell, Prothesenmacherin | Gelenkhall | Schrott-, Aurelionische und Meister-Glieder, Trank, Verband, Spezialöl, Feinwerkzeug, Aurelionisches und Meisterauge |
| Fabrikvogt Kessler | Fabrikstadt | Ersatzteile, Energiezellen, Automatenkern, Werkzeugkiste, Eisenbarren |
| Kettenkrämerin Wiltrud, Waffenschmied Gerlach, Marketenderin, Quartiermeister | Eisenfeste | Kettenpeitsche, Eisenhut, Eisenwache, Bergmannshelm, Brigantine, Streitflegel, Aufsehermantel, Schrott-Hellebarde, Armbrust … |
| Sensenschmiedin Walburga | Hundertfeld/Weidenau | Gras-, Ernte-, Doppel-, Mond- und Kriegssense, Sensenlanze |
| Yusuf, Basarhändler | Karak-Atar | Katar, Kriegssichel, Wurfbeil, Wurfmesser, Kurzbogen, Dornensäbel, Schockpistole, Energiezelle, Spezialöl, Trank, Verband, Stiefelscheide, Brokat-Halbmantel, Maskenkapuze, Wüstenburnus, Wüstenhaube |
| Leyla, Wasserhändlerin | Karak-Atar | Wasserschlauch, Brot, Dörrfleisch |
| Ossara, Seelenhändlerin / Grimbart Knochenhand | Schwarze Feste | Seelenphiolen, Grabsiegel, Trank / Knochenspalter, Totenglocke, Schädelhelm, Totenkrone, Totenkrone-Handschuhe und -Beinschienen |
| Hagen, Schmied; Hofmar | Varonheim/Varonsburg | Langschwert, Normannenschild, Kettenpanzer, Eisenhelm, Kronharnisch, Kronhelm, Zaddelgugel, Wolfspelzmantel, Wappenmantel Valens, Doppelmantel / Proviant, Eisen |
| Hilda, Balin, Orm | Tiefhall (Zwerge) | Königseisen, Zwergenaxt, Runenhammer, Eisenhelm, Kettenpanzer, Barren / Proviant, Werkzeug, Spitzhacke, Ersatzteile / Pilzbier-Proviant |
| Nibbel (Goblinhändlerin), Tobbe Ascherling | Goblindorf nach der Befreiung, Freie | Hakenmesser, Schrottklinge, Schrottkeule, Grubenlederweste, Kräuter, Eisen, Knochen … |
| Ysolde Kielmark | Tangkron (Gischtinseln) | Entermesser, Walharpune, Seemantel, Kapitänshut, Salzsiegel, Proviant |
| Hehlerin Hedda (Blutkult) | nur nach Beitritt | 3 Blutphiolen am Tag (fester Bestand) |

- **Bedienung:** GUI (Handels-Dock). Man öffnet es über das Gespräch („Zeig mir deine Waren.“), über E am Marktstand (`tradeAt`) oder per Rechtsklick → Handeln.
- **Geprüft:** Die Liste ist live erhoben (134 Läden im Stand des Entwicklers, alle Läden des neuen Spiels). Zwerge, Goblins und Gischtinseln sind nur aus dem Code, weil ihre Karten erst beim Betreten entstehen.

**F-02 (hoch) — Ladenlisten werden in bestehenden Spielständen nie erneuert.**
- Die Markthallen-Händler bekommen ihre Liste einmal beim Anlegen (`spawnResidents`, game.js:1020: `pool: MARKET_POOL[prof]`). Danach wird die Liste mitgespeichert. Eine Erweiterung von `MARKET_POOL` kommt deshalb nie in alten Ständen an.
- Nur Prothesenhändlerin und Kybernetiker werden nachgezogen (`continueGame`, game.js:2406), und auch das nur, wenn sie noch gar keinen Laden haben.
- **Im echten Spielstand des Entwicklers (live gelesen):**
  - Juwelier: 3 Teile statt 12, also **keine Talismane**.
  - Waffenhändler: 5 statt 12.
  - Rüstmeisterin: 5 statt 19, also **kein Thron-, Sonnen- oder Ordensset** und keine Handschuhe oder Beinschienen.
  - Magitech-Ingenieurin Gerlind: **kein Laden** — keine Magitech-Waffe, kein Magitech-Schild, keine Energiezelle in Aurelheim.
- **Folge:** Thron-Set, Hochritter-Handschuhe und -Beinschienen, alle Magitech-Gewehre außer Schockpistole (bei Yusuf) und alle Talismane außer Beute sind in seinem Spiel **nicht erhältlich**.
- **Repro:** echten Stand laden, `RF.S.ents.world.filter(e=>e.prof==='Rüstmeisterin').map(e=>e.pool)`.

**F-03 (hoch) — Gewürzhändler und Tuchhändlerin verkaufen nur Marktstand-Ware.**
- `spawnResidents` setzt erst `MARKET_POOL[prof]` (game.js:1020). Dann überschreibt `planDays` die Liste mit `STALL_POOL`, wenn der Arbeitsplatz ein Stand ist (`if (J.stall) …`, game.js:1252).
- Live in einem neuen Spiel: beide Händler haben `bread, dried_meat, herb, bandage, traveler_cloak, leather_cap, potion, strick`.
- **Folge:** Elixier der Ausdauer, Elixier der Eile und Trank der Erneuerung gibt es nirgends. Elixier der Stärke gibt es nur aus Schatzgerüchten.

**Weitere Lücken:**
- HB-28 (offen): Rechtsklick → „Handeln“ (`ctx-trade`, ui.js:493) öffnet das Handelsfenster direkt mit `openModal('trade', target)`. Damit fallen die Prüfungen aus `openShop` weg: Öffnungszeit, besetzte Stadt, Kettensperre, „Verhasst“. Nur Code gelesen.
- HB-29 (offen): `buy()` (game.js ~14351) prüft nicht, ob die Ware im Tagesbestand liegt. Eine Prüfung gibt es nur im Fenster. Nur Code.

### 5.3 Stadtwaren
- **Was es ist:**
  - 13 Handelswaren (Weizen, Salz, Tuch, Fleisch, Fell, Stammholz, Holzwaren, Steine, Erz, Barren, Werkzeug, Waffen, Magitech).
  - Markthändler mit Beruf aus `MARKET_PROFS` (Händlerin, Kontorhändler, Kaufmann, Kaufherr, Lagerknecht, Tuchhändlerin, Gewürzhändler) verkaufen sie aus dem Stadtlager.
  - Im Handelsfenster stehen sie auf einer Kreidetafel mit Bestand, Preis und ▲/▼ gegen andere Städte.
- **Lager:**
  - Grenze 60 + 40 je Lagerhaus, Markthalle oder Kontor, höchstens 400.
  - Ein Verkauf füllt das Lager, ein Kauf leert es. Ausrüstung bucht 0,5 Einheit ihrer Grundware.
- **Geprüft:** Fenster offen, Kreidetafel vorhanden. Mengenkauf nicht einzeln gemessen.

### 5.4 Schwarzmarkt (`blackMarket`, `blackOffers`)
- **Was es ist:** Bionik ohne Aurelion-Rang. Der Preis ist +50 %, und mit 40 % Chance ist ein Teil gebraucht (setzt nur mit 60 % Zustand ein).
- **Wer:** Rook und Nix.
- **Angebot:** Täglich 4 Teile aus `BLACK_POOL` (Schrott- und Aurelion-Glieder und -Augen, Öl, Ersatzteile, Feinwerkzeug, Federfuß, Greifhand). Mit 25 % Chance kommt ein Prototyp dazu (Prototyp-Arm, -Bein, -Auge, Klingenhand). Die drei **Prototypen** gibt es **nur hier**.
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code.

### 5.5 Handelsfenster (Dock)
- **Inhalt:**
  - Porträt, Ladenart, Schließzeit, Gold mit Münzklang.
  - Raster mit Preisschild (rot = zu teuer), Kreidetafel der Stadtwaren.
  - Eigenes Gepäck mit Verkaufspreis, „Mehrere wählen“, Mengenschieber, Rückfrage beim Verkauf ab Selten.
  - Händlersprüche je Ladenart.
- **Größe:** bei 1024 px 580 px breit; bei 760 px reicht es von x=176 bis 756.
- **Geprüft:** live (Kaufen und Verkaufen per Doppelklick, siehe 5.1). Der Schließen-Knopf ist bei 1024 und 760 sichtbar.

---

## 6. Kontor, Handelswagen, Lieferaufträge

### Handelskontor (`ecoMenu`, game.js ~14485)
- **Was es ist:** Am Markthändler einer Stadt („Handelskontor (Markt, Wagen, Betriebe, Lieferungen)“) sieht man knappe und reichliche Waren, Händlerzüge, die unterwegs hierher sind, und ob die Stadt hungert.
- **Ablauf:** Untermenüs
  - Waren kaufen und verkaufen (öffnet das Handels-Dock nur mit Stadtwaren);
  - Preisvergleich der Städte, die man kennt;
  - Handelswagen;
  - Betriebe;
  - Lieferaufträge.
- **Handelswagen:**
  - Kauf 250 Gold, 60 Ladungen.
  - Laden: je 5 Stück der 5 billigsten Waren.
  - Losschicken in eine Stadt, deren Preise man kennt, mit 0–4 Wachen zu je 20 Gold.
  - Risiko je Fahrt (`riskOf`): 6 % Grundwert, +12 % je Untotenheer an Start oder Ziel, +5 % Karak-Atar, −2 % bei Wegzoll-Gesetz; −22 % je Wache.
  - Bei einem Überfall gehen 40–90 % der Ladung verloren. Ab 3 Wachen werden die Räuber mit 50 % zurückgeschlagen.
  - Am Ziel verkauft der Fuhrmann alles zum Marktpreis.
- **Lieferaufträge** (`ordersDay`, `deliver`):
  - Höchstens 8 gleichzeitig. Eine Stadt mit Mangel verlangt 4–15 Stück und zahlt Wert × Menge × 1,6. Frist 7 Tage.
  - Abliefern geht nur im Kontor der Zielstadt. Belohnung: **Händlergilde +2** (`S.factions.merch`), unabhängig davon, wem die Stadt gehört.
- **Bedienung:** **nur Dialogliste** (Kontor, Wagen, Senden, Betriebe, Lieferungen). Nur „Waren kaufen und verkaufen“ öffnet das Dock.
- **Geprüft (live):** Über das Kontor von Gerold (Nordfurt): „Betriebe in Nordfurt (10)“, dann „Schmiede Nordfurt kaufen (580 Gold)“. Gold ging 3000 → 2420. „Ausbauen (200 Gold)“: 2420 → 2220. „Arbeiter anwerben (30 Gold)“: 2220 → 2190. Alle Abzüge stimmen. Wagen und Lieferaufträge nur Code.
- **Fehlversuche / Lücken:**
  - Lieferaufträge geben immer Ruf bei der Händlergilde, auch für Aurelion- oder Kettenstädte. Wer für die Eisenfeste liefert, bekommt keinen Ruf bei der Kette. Das passt zur Sorge des Entwicklers („Mission für die Eisenfeste, kein Ruf dafür“) — eine Designfrage.
  - Ein eigener Wagen kann nur in Städte fahren, deren Preise man schon kennt. Das wird erklärt — gut.

---

## 7. Betriebe

### Betriebe kaufen, ausbauen, Kasse (`bizMenu`, `bizView`, `bizCollect`; economy.js `ecoDay`, `buyBiz`, `upgradeBiz`, `hireHand`)
- **Was es ist:** 14 Gewerbe (Hof, Jägerhütte, Fischerei, Stall, Holzfällerei, Werkstatt, Steinbruch, Saline, Mine, Schmelze, Schmiede, Weberei, Feinmechanik, Magitech-Werk). Die Arbeiter sind echte Bewohner. Wer tot ist, am Boden liegt oder in der Heldengruppe mitläuft, arbeitet nicht. Warenketten: Erz → Barren → Werkzeug, Waffen, Magitech.
- **Ablauf:**
  - Kaufpreis 120 + max(20, gestrige Ware) × 14 + 60 je Arbeiter.
  - Ausbau 200 × Stufe, bis Stufe 3; jede Stufe +50 % Leistung.
  - Hand anwerben: 30 Gold, 3 Gold Lohn am Tag, höchstens 3.
  - Tagesgewinn = 35 % des Warenwerts − Lohn. Er geht **in die Kasse des Betriebs**. Verlust zahlt zuerst die Kasse, den Rest der Beutel (HB-18 behoben; auch der Fall, dass sich die Summe aufhebt, ist inzwischen behoben, economy.js:283).
  - Abholen nur vor Ort (Reiter „Betriebe“) oder im Kontor der Stadt.
  - Hunger halbiert die Leistung, Jahreszeit wirkt auf Höfe, ein Unfall legt den Betrieb still.
- **Überfall, Besatzung, Zerstörung:**
  - Fällt die Stadt an die Toten oder wird sie zerstört, ist die **ganze Kasse verloren** (vorläufige Regel des Leads).
  - Ein Überfall nimmt die Hälfte der Kasse (OFFEN: „Überfall nimmt die Hälfte der Betriebskasse“, 03.10.).
  - Der Betrieb steht still, solange die Stadt besetzt ist.
- **Bedienung:** GUI-Reiter „Betriebe“ unter Siedlung (B): Hausbild, Ertrag gestern und im Schnitt, Arbeiter, Vorprodukte, Kasse, „Abholen“. Kaufen, Ausbauen und Anwerben gehen **nur über die Dialogliste im Kontor**.
- **Geprüft (live):** Kauf, Ausbau und Anwerben siehe §6. Danach ein Wirtschaftstag (`ECO.ecoDay`): Schmiede Nordfurt, Stufe 2, 1 angeworbene Hand, Ware 62 Gold, Gewinn **19** = 62 × 0,35 − 3. Kasse 19, Beutel unverändert. Das stimmt.
- **Fehlversuche / Lücken:**
  - Kaufen, Ausbauen und Anwerben fehlen im Reiter „Betriebe“. Man muss zum Kontor.
  - SHF-06: Betriebe in besetzten Städten stehen ohne Meldung still. Nur die verlorene Kasse wird gemeldet.
  - Rechenbeispiel: 810 Gold Einsatz bringen 19 Gold am Tag, also gut 40 Tage bis zum Rückfluss. Das ist eine Balance-Frage, keine Entscheidung von mir.

---

## 8. Bank und Lager

### Bank
- **Was es ist:** In Aurelheim gibt es ein Bankgebäude mit „Bankier“ und „Geldwechsler“ (`HALL_TYPES`, game.js:904). **Eine Bankfunktion gibt es nicht**: kein Einzahlen, keine Zinsen, kein Kredit (Suche nach Bankier, Zins, Kredit: keine Fundstelle außer der Berufsliste). Die beiden sind Statisten.

### Lager (Siedlung)
- **Was es ist:** Mit einem fertigen Lagergebäude (14 Holz) gibt es den gemeinsamen Vorrat `S.stash`. Er wird im Gepäck-Fenster als „Lagerbestand“ angezeigt (24 Felder). Man legt Dinge mit „Ins Lager“ ab oder zieht sie hinein. Seltenheit, Affixe und Zustand bleiben erhalten (AUDIT H-04).
- **Bedienung:** GUI (Gepäck). Ohne Lagergebäude steht dort „Ohne Lagergebäude gibt es keinen gemeinsamen Vorrat.“
- **Geprüft:** live, nur die Anzeige ohne Lagergebäude. Das Lager selbst nur Code.
- **Fehlversuche / Lücken:**
  - **F-08 (mittel):** `toStash` (game.js ~22147) hat keine Obergrenze, das Raster zeigt aber fest 24 Felder (`sg.childElementCount !== 24`, ui.js:994). Ab dem 25. Teil liegt alles unsichtbar im Lager und ist nur wieder erreichbar, wenn vorne etwas entnommen wird. Nur Code gelesen.
  - Das Lager ist von überall erreichbar, sobald es gebaut ist. Man muss nicht im Lager stehen: `toStash` prüft keine Entfernung. Es wirkt also wie eine Fernbank. Ob das gewollt ist, ist offen.

---

## 9. Siedlung

### Gründung und Bau
- **Was es ist:** Ein eigenes Lager. Es wächst zur Siedlung mit Siedlern, Moral, Hof, Wachen und Überfällen. Nach dem Tod übernimmt der Erbe die Siedlung (Moral −10).
- **Ablauf:**
  - Gründen kostet 5 Holz (`foundCamp`); nicht im Ortsgebiet einer Stadt oder näher als sechs Felder (`townAt(tx, ty, 6)`). Name „Haus + heim“, Moral 60, ein Lagerfeuer entsteht.
  - Auflösen (`dissolveSettlement`, Knopf im Fenster B, zweimal klicken, nur vor Ort, nicht im Überfall): Gebäude, Siedler, Lagerwachen, eigenes Vieh verschwinden, das Lager wird zur Kiste „Aufgegebene Siedlung: …“.
  - Bauen mit B (Baumodus, `startPlacing`).
  - Fehlendes Material kaufen Fuhrleute für Gold zu („Gold-Sog“: Holz 4, Stein 5, Eisen 12, Nahrung 3 je Einheit).
- **Bauten (14):**

  | Bau | Kosten | Wirkung |
  |---|---|---|
  | Lagerfeuer | 5 Holz | Rasten 1 Std: volle Ausdauer, +15 % Leben |
  | Zelt | 8 Holz | 2 Plätze |
  | Hütte | 20 Holz, 8 Stein | 4 Plätze |
  | Lager | 14 Holz | gemeinsamer Vorrat (§8) |
  | Werkbank | 12 Holz, 4 Stein | Ausbessern bis 80 % (1 Eisen je 2 Teile, 30 min) |
  | Schmiede | 20 Holz, 15 Stein, 10 Eisen | Ausbessern bis 100 %. **Kein Herstellen** (§4) |
  | Ackerfläche | 10 Holz | 12 Nahrung am Tag |
  | Weide mit Stall | 16 Holz, 4 Stein | 6 Tiere (Kuh 70, Schaf 40 Gold beim Tierhändler), Hofvorrat |
  | Heilerhütte | 18 Holz, 6 Stein | Pflegen: 2 Std, 1 Kraut je Person, +35 % Leben, schient, reinigt |
  | Brunnen | 18 Stein | Moral +2 am Tag, volle Ausdauer |
  | Palisade | 6 Holz | Wehrzaun |
  | Tor | 12 Holz, 4 Eisen | Durchlass |
  | Wohnzone | 4 Holz | Siedler bauen selbst bis zu 4 Hütten (je 20 Holz und 8 Stein, eine am Tag) |
  | Wachturm | 24 Holz, 12 Stein | warnt, nennt die größte Gefahr |

- **Siedler:** Je freiem Platz zieht ein Siedler zu. Er arbeitet nach Prioritäten (Verwundete, Nahrung, Verteidigung, Holz, Handwerk, Ruhe).
- **Moral (M1):** Brunnen +2, Ruhe +1 je Kopf, Held in der Nähe +1, Hunger −6, Überbelegung −3, Toter −4. Stufen: Zuversichtlich ×1,25, Mürrisch ×0,75, Verzweifelt ×0,5 und täglicher Weggang.
- **Überfälle (M2):**
  - Reichtum (4 je Bau, 3 je Siedler, 2 je Tier, 1 je 25 Vorrat) lockt nahe Quellen an: Bande, Tote, Kette, Goblins, sonst Wölfe.
  - Gefahr 6 % + Reichtum/300, höchstens 45 %. Angreifer: 2 + Reichtum/15, höchstens 9.
  - Plünderung: Vorrat −30 %, ein Bau beschädigt, Moral −10.
- **Schutzlos (M4):** Lagerwachen wirbt man beim Wirt an (80 Gold, dann 5 Gold am Tag).
- **Bedienung:** GUI. „Lager & Siedlung“ (B) dockt rechts an; der Reiter „Betriebe“ ist daneben. Der Baumodus ist visuell. Debug-Einträge „Siedlung: …“ sind vorhanden.
- **Geprüft:** Fenster geöffnet (bei 1024 px x=398–1018; bei 760 px x=136–756; Schließen sichtbar). Bauen, Moral und Überfälle nur Code und MECHANIKEN.
- **Fehlversuche / Lücken:** Siedlungsschmiede ohne Herstellen (F-05). IHF-02 (Bericht): Die Siedlung ist eine Insel — kein Markt, kein Krieg, keine Bandenwirkung über die Überfälle hinaus.

---

## 10. Schmied

### Schmiede-Dock: Ausbessern, Verbessern, Schmieden lassen (`smithUI`, `smithRepair`, `smithUpgrade`, `smithCommission`; game.js ~14590–14640)
- **Was es ist:** Beim Schmied (jeder Stadtschmied, Brann, Hagen, Gerlach) öffnet „Kannst du das ausbessern?“ oder Rechtsklick → Reparieren eine Tafel am rechten Rand.
- **Ablauf:**
  - **Ausbessern:**
    - Alle abgenutzten Teile werden angezeigt, angelegte mit Punkt. Ein Klick wählt ein Teil ab oder wieder an.
    - Preis: Summe von (1 − Zustand) × Wert × 0,5, zusammen mindestens 5 Gold. Danach 100 %, Beziehung +3.
  - **Verbessern:**
    - Eine Gütestufe höher, bis „Meisterlich“. Ein Gekauftes Teil zählt als „Solide“.
    - Preis: Wert × 0,5 × (Stufe + 1), mindestens 20 Gold, dazu Eisen = Stufe + 1.
    - Ab „Gut“ hebt die Güte die Seltenheit und würfelt Affixe. Unikate und Stapelware gehen nicht.
  - **Schmieden lassen:**
    - Jedes Esse-Rezept aus eigenem Material. Lohn 30 % des Werts, mindestens 10 Gold.
    - Der Schmied arbeitet mit Schmiedekunst 60 (oder deiner, wenn höher). Deine Fertigkeit steigt dabei nicht.
  - Dazu „Waren ansehen“ (Handel) und „An der Esse selbst schmieden“, wenn eine Esse nahe steht.
- **Belohnung:** Beziehung +3 beim Ausbessern.
- **Bedienung:** GUI. Debug: „UI: Schmiede-Dock (nächster Schmied)“.
- **Geprüft (live, Schmied Kuno, Nordfurt):**
  - 5 Teile auf 50 %, angezeigt „Preis 19 Gold“, bezahlt 1000 → 981, alle auf 1,00.
  - „Verbessern“ Kurzschwert „Solide → Gut · 20 Gold · 2 Eisen“: Gold −20, Eisen 10 → 8. Ergebnis: Güte „Gut“, Seltenheit „ungewöhnlich“, 1 Affix.
  - „Schmieden lassen“ Dolch „2 Eisenerz · Lohn 10 Gold“: Gold −10, Eisen −2, Gepäck +1. Ergebnis: Dolch „Meisterlich“, „selten“, Hersteller Kuno.
  - Alle angezeigten Preise stimmen mit dem Abzug überein.
- **Fehlversuche / Lücken:**
  - Balance: Mit Schmiedekunst 60 liefert „Schmieden lassen“ etwa 14 % Solide, 71 % Gut und 14 % Meisterlich. Ein Kettenpanzer (7 Eisen + 57 Gold) ist damit meist „ungewöhnlich“, ein Plattenharnisch (10 Eisen, 2 Barren + 138 Gold) öfter „selten“. Das ist billiger als jede Ladenware gleicher Güte. Die Regel stammt vom Lead (OFFEN UI-Frage 5); der Entwickler hat sie nicht bestätigt.
  - Die Tafel benennt Eisen als „Eisenerz“, im Text heißt es „Eisen“. Eine kleine Unstimmigkeit.
  - Die Gesprächsfassung (`repairAll`, alles oder nichts) bleibt als Rückfall für Koop-Gäste.

---

## 11. Heiler

### Heiler in der Stadt (`healerTreat`, `woundCare`; game.js ~12830–12850)
- **Was es ist:** Heilerin, Heiler, Medica, Feldscher und Elena behandeln dich und deine Gruppe (im Umkreis von 200 px).
- **Ablauf:**
  - **Behandeln:** Preis (fehlendes Leben × 0,5) + 8 je Schlafkrankheit, mindestens 5 Gold. Die Behandlung dauert 3,5 s; danach volle Heilung. Seit HB-13 zählen auch verletzte Glieder (behoben).
  - **Wunden versorgen:** 25 Gold. Alle Brüche werden geschient (heilen doppelt so schnell), Entzündungen gereinigt.
  - Siedlungs-Pfleger und Heilerhütte, siehe §9.
- **Bedienung:** **Fenster seit 04.10.** (`healerUI`): jede Person der Gruppe mit Leben, sechs Gliedern (grün/rot/gelb/grau) und Zuständen; Knöpfe Wunden versorgen und Brüche schienen. Prothesen zählen nicht als Wunde (Werkbank).
- **Geprüft:** Fenster im Spiel geöffnet, Heilen und Schienen ausgeführt (04.10.); HB-13-Probe im Selbsttest.
- **Fehlversuche / Lücken:**
  - Wer nur ein verletztes Glied hat (Leben voll), zahlt den Mindestpreis von 5 Gold. Das ist sehr billig für eine volle Gliedheilung. Balance-Frage.
  - ~~Kein Fenster mit Körperbild.~~ Erledigt 04.10.

---

## 12. Tierhändler, Pferdehof, Stall

### Tierhändler (`beastsUI`, `buyBeast`, `beastMenu`)
- **Was es ist:** Begleittiere (Hund 60, Wolfshund 180, Kampfeber 140 Gold), Reittiere (Stall-Fenster), Hoftiere für die Weide (Kuh 70, Schaf 40) und die Wartung des Messingrosses (1 Automatenkern).
- **Wo:** Kreuzweg, Nordfurt, Kupferhafen (`ensureBeastTraders`).
- **Ablauf:** Ein Tier gleichzeitig; „freilassen“ gibt das Tier frei.
- **Bedienung:** GUI („Tierhändler“). Koop-Gäste bekommen die Dialogliste.
- **Geprüft (live, Hartwig):**
  - Angebot „Hund 60 / Wolfshund 180 / Kampfeber 140“.
  - Hund gekauft: Gold 2000 → 1940, ein Begleiter „Grau“ (`wild_dog`) entstand. Das Fenster schloss sich nach dem Kauf.

### Stall / Pferdehof (`stableUI`, `stableOffers`, `buyHorse`)
- **Was es ist:** Wochenangebot je Händler (aus einem Hash, also ohne Zufall).
  - Der Pferdezüchter Wendel hat 5 Pferde, Tierhändler haben 3.
  - Das Messingross (900) gibt es nur in Kupferhafen, das Totenross (400) nur mit Totenrang oder Pakt.
  - Jedes Pferd hat Tempo, Ausdauer, Mut und Fellfarbe. Ein vorhandenes Pferd wird für 40 % seines Werts eingetauscht.
- **Bedienung:** GUI („Stall“).
- **Geprüft (live, Wendel):**
  - 5 Angebote (372/414/387/322/273 Gold). Gekauft: 1940 → 1568 = 372, Pferd „Schatten“, Tempo 1,13.
  - Zweites Pferd „Eintauschen — 265 Gold“: 1568 → 1303. Das stimmt.
- **Fehlversuche / Lücken:**
  - **F-10 (niedrig):** Die Logzeile beim Tausch sagt „(… bleibt im Stall, … Gold angerechnet)“ (game.js:384). Tatsächlich ist das alte Pferd weg: `S.mount` wird ersetzt, eine Stall-Liste gibt es nicht. Der Text ist irreführend.
  - HB-47 (offen): Beinschaden bremst das Pferd.

---

## 13. Kutsche, Schiff, Luftschiff

### Kutsche und Fähre (`travelUI`, `coachTalk`, `journey`)
- **Was es ist:** Fahrten gegen Gold. Die Zeit vergeht unterwegs. Auf unsicheren Strecken wird man auf halber Strecke überfallen (3–4 Gegner, der Kutscher flieht). Nicht möglich, wenn Feinde nahe sind. Ohne Aufenthaltsschein sind Ziele im Hochreich gesperrt.
- **Bedienung:** GUI (Kutsche-Dock mit Karte und gestrichelten Strecken).
- **Geprüft (live, Wernher in Eren):**
  - Ziele: Nordfurt 30 Gold/~4 Std, Kreuzweg 102/~15, Aschfurt 119/~17, Salzhafen 148/~22, Sonnwacht 167/~25.
  - Nordfurt gewählt: Gold −30, der Held wurde versetzt, die Uhr lief 262 Minuten. Das stimmt.
  - Nach der Ankunft blieb die Ziel-Liste der alten Kutsche sichtbar (Knopf „Verstanden.“ und Ziele). Das ist harmlos.

### Seefahrt zu den Gischtinseln (`seaTalk`, `seaVoyage`, `shipChoices`, `cargoMenu`)
- **Was es ist:**
  - Überfahrt Salzhafen/Kupferhafen ↔ Tangkron, 60 Gold, ~6 Std.
  - An Deck: Enterkampf, Sturm oder ruhige See. Wer an Deck fällt, wacht im Abfahrtshafen auf.
  - Eigenes Schiff: 900 Gold, Laderaum 20.
  - Frachthandel mit 4 Waren je Hafen (Preise in `PORT_PRICE`, Verkauf × 0,9).
- **Bedienung:** **nur Dialogliste** (Kapitän, Schiffskauf, Fracht).
- **Geprüft:** nur Code.

### Luftschiffe (`harborTalk`, `airVoyage`, `airRepairMenu`, `airUpgradeMenu`)
- **Was es ist:** Die Flotte der Krone (2 Handelsschiffe, 1 Patrouille).
  - Passage: Fahrpreis = Entfernung × 0,12, mindestens 30 Gold. Ab Aurelion-Rang 1.
  - Reparatur: Barren für die Hülle, Werkzeug für den Motor, Magitech für die Steuerung. Dazu Ausbau.
  - Fallen Handelsschiffe aus, bekommt Aurelion weniger Nahrung (`airSupply`).
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code.

---

## 14. Investieren (Stadtkasse)

### Investieren (`investMenu`, game.js ~7741)
- **Was es ist:** Am Anschlagbrett einer wachsenden Stadt („In die Stadt investieren“) zahlt man für:
  - ein Wohnhaus (120 Gold + 20 Holz);
  - eine Werkstatt (220 Gold + 30 Holz + 15 Stein);
  - „Handel fördern“ (100 Gold, Wohlstand +25);
  - „Wache verstärken“ (150 Gold + 10 Eisen).
- **Belohnung:** **+3 Ruf bei der Fraktion der Stadt** (`townFac`). Das ist die richtige Fraktion.
- **Bedienung:** **nur Dialogliste.**
- **Geprüft:** nur Code. Der Abzug geschieht erst nach erfolgreichem Bau (`pay`: `fn()`, dann `S.gold -= gold`). Bei „Kein Bauplatz mehr frei“ geht also nichts verloren — gut.


---

## 15. Alle Fenster und Menüs

### Kopfleiste und HUD (`index.html`, ui.js `NAV`, `refreshHUD`)
- **Oben:**
  - Uhr, Wetter, Gold.
  - Menüleiste mit 9 Gruppen: Charakter (C), Gepäck (I), Gruppe (G), Lager & Siedlung (B), Karte (M), Aufträge (J), Mächte (F), Kodex (H), Optionen (Esc).
  - Eine Gruppe mit mehreren Fenstern zeigt Reiter: Charakter → Werte, Talente (T), Zauber (Z), Effekte (X) und Ausbildung; Siedlung → Lager, Betriebe; Mächte → Fraktionen, Chronik (K); Gruppe → Gruppe, Stall.
- **Links:** Porträt, Klasse, Rang, Balken, Zustände, Körper, Gruppe, Rohstoffe.
- **Rechts:** Kontextfeld zum gewählten Ziel (mit „Handeln“ und „Reparieren“).
- **Unten:** Log mit Filtern und Schnellleiste (1–0).
- **Dazu:** Toasts, Fund-Karte ab Legendär, Warnchip, Auftrags-Tracker.

### Tasten (`bindInput`)
- **E** benutzen/sprechen, **Q** ausweichen, **R** auf- und absitzen, **N** Minikarte.
- **I** Gepäck, **C** Charakter, **G** Gruppe, **B** Siedlung, **F** Fraktionen, **K** Chronik, **M** Karte, **J** Aufträge, **T** Talente, **X** Effekte, **H** Kodex, **Z** Zauberbuch.
- **Esc** schließt der Reihe nach: Bauen, Dialog, Fenster, Auswahl; sonst öffnet es die Optionen.
- **Strg+Umschalt+D** Debug.
- **Leertaste/Esc** überspringen Kamerafahrt und Heldentod.

### Fensterliste (`openModal`, ui.js ~825) — 22 Fenster, alle im Browser geöffnet

| Fenster | Öffnen | Art | Inhalt |
|---|---|---|---|
| Inventar | I | Vollbild | Papierpuppe mit Figur, Raster, Filter, Ordnen, Lager, Bildkarte, Vergleich, Sperre |
| Charakter | C | Vollbild | Attribute mit Statpunkten, Körperdiagramm, Titel, Klassenkette |
| Gruppe | G | Dock rechts | Gefährten, Befehle, Moral |
| Lager & Siedlung | B | Dock | Bauten, Siedler, Prioritäten, Moral, Bedrohung |
| Betriebe | Reiter unter B | Dock | eigene Betriebe, Kasse, Abholen |
| Fraktionen | F | Vollbild | Ruf, Ränge, Banner |
| Chronik | K | Pergament | große Taten mit Jahr und Ort |
| Weltkarte | M | Vollbild | Ortsbild, Ereignis-Pins, Grenzen, Kriegskarte |
| Handel | Gespräch/E am Stand/Rechtsklick | Dock | siehe §5.5 |
| Einstellungen | Esc | Vollbild | Optionen, Speicherplätze, Cloud-Export |
| Ausbildung | Reiter | Vollbild | Klassen und Lehrer |
| Aufträge | J | Pergament-Doppelseite | Liste mit Siegeln, Brief, Verfolgen/Abbrechen |
| Talente | T | Vollbild | Sternbild-Talentbaum |
| Aktive Effekte | X | Vollbild | Zustände, Elixier |
| Kodex | H | Pergament | Handbuch, Lehrer, Magie, Ränge, Zustände, Gegner; Code NACHTGLAS |
| Zauberbuch | Z | Vollbild | gelernte Zauber |
| Stall | Tierhändler/Wendel | Vollbild | Pferdekarten mit Werten |
| Tierhändler | Tierhändler | Vollbild | Begleittiere, Reittiere, Hoftiere |
| Prothesen-Werkbank | Vell/Kybernetiker/Medica/Werkbank | Vollbild | Körperbild, Wartung, Tausch (neu seit 03.10.) |
| Handwerk | Esse/Werkbank/Lagerfeuer | Dock | Rezeptkarten, Güte-Balken |
| Schmiede | Schmied | Dock | Ausbessern, Verbessern, Schmieden lassen |
| Kutsche | Kutscher/Fährmann | Dock | Karte mit Strecken, Zielkarten |

**Geprüft (live):** Jedes der 22 Fenster habe ich per `openModal` geöffnet, bei 1024×700 und 760×600.
- Alle öffnen ohne Fehler und haben einen sichtbaren Schließen-Knopf (×, `#modal-close`).
- Vollbild-Fenster bei 1024: Rahmen bis x=1024, × bei x=948. Bei 760: × bei x=692.
- **Docks** brauchen etwa 0,5 s zum Hereingleiten. Danach liegen sie bei 1024 px zwischen x=378–438 und 1018, bei 760 px zwischen x=116–176 und 756. Das × liegt innerhalb.
- Schmiede (Inhalt 1188 px hoch) und Kutsche (636 px) scrollen innerhalb der Tafel. Es gibt keinen waagerechten Überlauf.
- **Befund:** Bei 760 px Breite bleiben neben einem Dock nur 116–176 px Welt sichtbar. Das deckt sich mit OFFEN „bei 1280 px bleibt links nur ein schmaler Streifen“ und ist bei 760 px noch deutlicher.
- Ganz kleine Fenster (406×310, eingeklapptes Panel): Nur die Einstellungen liefen waagerecht über.

### Debug-Menü (Strg+Umschalt+D, `debugSections`)
- **Was es ist:** Gruppen mit Karten, wie im alten Ist-Zustand §2.29 beschrieben. Neu für Bereich D sind:
  - Gegenstände & Handel: „Items: …“ (Beute regnen lassen, Gepäck füllen, Marken löschen), „Handel: nächsten Händler öffnen (Dock)“, Händlerspruch, +500 Gold.
  - UI: Schmiede-Dock, Kutsche-Dock, Betriebe-Reiter, Fund-Karte Legendär/Mythisch, Pergament.
  - Handwerk: Esse, Werkbank, Kessel hier öffnen.
  - Siedlung: Gold-Sog, Moral ±20, Heilerhütte, Überfall, Lagerwache, Schutz-Status.
  - Grafik: Rüstungsset anlegen.
- **Lücke:** Es gibt keinen Debug-Knopf „Kontor öffnen“, „Schwarzmarkt“, „Stall öffnen“ oder „Tierhändler öffnen“. Der Tierhändler hat eine Probe im Selbsttest.

---

## 16. Systeme ohne Fenster

Wunsch des Entwicklers: „die Schmiede etc. soll ein GUI haben“.

**Seit dem letzten Stand ein Fenster bekommen haben:** Schmiede (inkl. Verbessern, Schmieden lassen), Kutsche/Fähre, Tierhändler, Prothesen-Werkbank, Zauber lernen (04.10.), Heiler (04.10.), Handwerk, Betriebe-Reiter, Handel.

**Noch reine Dialogliste (`UI.dialogue`), mit Bewertung:**

| System | Funktion | Bedienaufwand heute | Bewertung |
|---|---|---|---|
| Handelskontor (Wagen, Senden, Betriebe kaufen, Lieferaufträge, Preisvergleich) | `ecoMenu`, `wagonMenu`, `sendMenu`, `bizMenu`, `ordersMenu`, `ecoPrices` | 5 verschachtelte Listen, Zahlen im Fließtext | **sehr hoch** — Zahlen, Karte und Vergleich schreien nach Tabelle und Karte. Betriebe-Kauf gehört in den Reiter „Betriebe“. |
| Schwarzmarkt | `blackMarket` | Liste mit 4–5 Teilen | **hoch** — einfach: Handels-Dock mit Zuschlag wiederverwenden (OFFEN: „Schwarzmarkt als Raster“). |
| Seefahrt, eigenes Schiff, Fracht | `seaTalk`, `shipChoices`, `cargoMenu` | Preistabelle als Text | **mittel–hoch** — Frachthandel braucht ein Raster wie die Kreidetafel. |
| Luftschiff-Hafen (Passage, Reparatur, Ausbau) | `harborTalk`, `airRepairMenu`, `airUpgradeMenu` | 3 Listen | **mittel** — Flottenzustand als Balken. |
| Investieren | `investMenu` | 4 Knöpfe | **mittel** — passt als Reiter ans Anschlagbrett. |
| Anschlagbrett / Kopfgelder | `boardMenu`, `conList` | Liste, Brief als Pergament | **mittel** — Brief vorhanden; eine Brett-Ansicht mit Zetteln fehlt. |
| Schuldknechtschaft / Fesseln | `bondMenu`, `captiveMenu` | Liste | niedrig–mittel |
| Kerker | `jailChoices` | Liste | niedrig (Szene, kein Handel) |
| Schenke (Spiele, Unterkunft) | `tavernChoices` | Liste | niedrig |
| Heiliges Gericht (Ablass, Klage) | `holyCourt` | Liste | niedrig |
| Ratgeber, Gerüchte, Gespräch | `talk`, `rumorChoices`, `askMenu` | Liste | bleibt Dialog (gewollt) |

**Koop-Gäste** sehen auch Schmiede, Kutsche und Tierhändler nur als Liste. Der Handel ist für sie ebenfalls eine Liste (§17).

---

## 17. Koop

### Netzwerk-Koop (coop.js)
- **Was es ist:**
  - Der Host rechnet die ganze Welt und speichert. Gäste schicken nur Eingaben und bekommen die Welt im Umkreis von 1400 px zurück.
  - Ein Gast spielt einen eigenen Helden (neu, gespeichert, Erbe) oder steuert einen Gefährten.
  - Verbindung über PeerJS/WebRTC. Mit `?coopLocal` geht es auch über zwei Fenster im selben Browser.
- **Was Gäste können:**
  - Laufen, kämpfen, ausweichen, Schnellleiste (1–0), E (aufheben, sprechen, Anschlagbrett), Chat (Enter).
  - Fenster: Gepäck (I), Tausch (U), Charakter und Gruppe (C/G), Aufträge (J), Karte (M).
  - Ausrüstung an- und ablegen, benutzen, fallen lassen, dem Helden geben, Statpunkte vergeben, Klasse/Titel/Talent setzen.
  - Dialoge laufen auf dem Host so, als wäre die Gastfigur der Held (`runAs`). Der Ruf ist gemeinsam, die Ränge sind je Figur.
  - Nimmt ein Gast einen Auftrag an, fragt ein Fenster den Host (Ja/Nein).
  - Eingänge benutzt nur die ganze Gruppe gemeinsam, auf Zustimmung des Hosts.
  - Beute: Wer zuerst aufhebt, hat sie. Auftragsgold wird geteilt (`questGold`). Erfahrung wird geteilt.
- **Was Gäste nicht können:**
  - B, F, K, T, X, H, Z, R, N zeigen „Im Koop nur der Host.“
  - Kein Lager („Das Lager gehört dem Host.“), kein Speichern.
- **Handel für Gäste** (`sendShop`, `guestShopDeal`, `guestShop`):
  - eine **Dialogliste** mit bis zu 16 Waren. Bezahlt wird aus dem eigenen Beutel (`coopGold`).
  - **Fehlversuche (F-07, mittel — HB-30 weiter offen):**
    - Gastkäufe von Ausrüstung buchen das Stadtlager nicht (der Host-Kauf zieht 0,5).
    - Gastverkäufe füllen es nur bei Stadtwaren.
    - Die Handel-Fertigkeit steigt nicht.
    - Es fehlen `onItemGained` (Auftragsauslöser) und die Prüfung `slot.lock`: Ein Gast kann ein gesperrtes Teil verkaufen.
    - Die Rückfrage beim Verkauf ab Selten fehlt.
  - Das Dock für Gäste ist BLOCKIERT. Dafür braucht es einen Adapter, siehe OFFEN.
- **Tausch:** Der Gast sieht nur die ersten 14 Teile (coop.js:509), der Host im Tauschmenü nur die ersten 16 (coop.js:522). Mehr ist nicht erreichbar.
- **Geprüft:** nur Code. Live habe ich Koop nicht getestet; dafür braucht es zwei Fenster.

---

## 18. Speichern, Laden, Plätze, Cloud-Export

### Speichern und Laden (state.js)
- **Was es ist:**
  - Gespeichert wird bei jedem Tagesbeginn und beim Schließen (`beforeunload` → `saveSync`), komprimiert, wenn der Browser es kann.
  - **Mehrere Plätze:** Jeder neue Held bekommt einen eigenen Platz (`newSlot`). Der alte Stand bleibt unter `rotfall.legacy.save`. Die Übersicht `rotfall.slots` steht im Titelbildschirm mit Löschen (mit Rückfrage).
  - Einzelspieler und Koop sind getrennt.
  - Nie gespeichert wird bei: Testkarten, `S._quiet`, Kamerafahrt, fehlendem Helden, Koop-Gast.
- **Cloud-Export** (`cloudsave.js`):
  - Datei `.rfsave`, AES-GCM-256, Passwort ab 8 Zeichen (PBKDF2 600 000 Runden).
  - Der Import bewahrt den alten Stand. Er geht nur über https oder localhost.
- **Migration:** `continueGame` und die `ensure*`-Funktionen bauen flüchtige NPC-Gruppen neu auf (HB-01–HB-04 behoben laut OFFEN). **Ladenlisten werden dabei nicht erneuert (F-02).**
- **Geprüft (live):**
  - Ein Wegwerf-Platz (`ztestD`) wurde angelegt, darin ein neues Spiel begonnen, dann zurück auf `legacy`, der Wegwerf-Platz gelöscht und die Seite verlassen.
  - Der echte Stand ist danach byte-gleich mit `rotfall.backup.s14c`.
  - `S._quiet` hat das Speichern beim Verlassen verhindert.

---

## 19. Zusammenfassung Fehlversuche

Nach Schwere sortiert. „live“ = im Spiel nachgestellt, „Code“ = nur gelesen. Die Zeilen sind ungefähr, weil `game.js` während der Prüfung geändert wurde.

**Hoch**
- **F-01 — Waffenständer vermehrt Waffen (live).** `rummage` hängt die gewürfelte Waffe an die gemeinsame Liste `RUMMAGE.weapon_rack` (`pool.push`). Jede weitere Durchsuchung wirft mehr Waffen aus (gemessen: bis zu 13 Waffen auf einmal, 93 Waffen in 10 Durchsuchungen). Das gilt bis zum Neuladen. — game.js:5540 (`rummage`), 5528 (`RUMMAGE`).
- **F-02 — Ladenlisten veralten in alten Spielständen (live im Stand des Entwicklers).**
  - Juwelier 3/12, Waffenhändler 5/12, Rüstmeisterin 5/19, Magitech-Ingenieurin ohne Laden.
  - Folge: Thron-Set, Talismane, Magitech-Gewehre und Hochritter-Handschuhe und -Beinschienen sind im Spiel des Entwicklers nicht erhältlich.
  - game.js:1020 (`spawnResidents`, Liste nur beim Anlegen); game.js:2406 (Nachzug nur für Bionik-Händler).
- **F-03 — Gewürzhändler und Tuchhändlerin verkaufen nur Marktstand-Ware (live im neuen Spiel).** `planDays` überschreibt die Liste aus `MARKET_POOL` mit `STALL_POOL`. Dadurch fehlen 4 Elixiere im Handel. — game.js:1252 (`if (J.stall) …`) gegen 1020.

**Mittel**
- **F-04 — 10 Gegenstände ohne jede Quelle (Code, Skript über alle Dateien):**
  - Sturmsense (data.js:103), Donnerwort (data.js:104), Lederstiefel (data.js:164);
  - Talisman des Jägers (data.js:292), Splitter des Rotfalls (data.js:298), Blutstein (data.js:299);
  - Elixier der Ausdauer, Elixier der Eile, Trank der Erneuerung (nur Gewürzhändler, F-03), Arkaner Trank (data.js:267, nirgends).
- **F-05 — Siedlungsschmiede kann nicht schmieden (Code).** Die Beschreibung sagt „Waffen aus Eisen“, `useBuilding` bietet nur Ausbessern. — data.js:1405, game.js:12229.
- **F-06 — 4 legendäre Sets nur durch Mord (Code und live).**
  - Sternwacht (Konrad), Rooks General (Rook), Ordensmeister (Kelan), Grundteile Hochritter (Oda) gibt es nur aus dem Grab ihres Trägers.
  - Für den Spieler gibt es keinen Hinweis. Ob das gewollt ist, muss der Entwickler entscheiden. — game.js:2844 (`ELITE_KIT`, `eliteKit`).
- **F-07 — Koop-Gast-Handel unvollständig (Code; HB-30).**
  - Keine Lagerbuchung für Ausrüstung, kein `onItemGained`, kein Fertigkeitszuwachs.
  - Gesperrte Teile sind verkäuflich, keine Rückfrage ab Selten.
  - Gepäck/Tausch zeigt nur 14 bzw. 16 Teile. — coop.js:313 (`guestShopDeal`), 509, 522.
- **F-08 — Lager ohne Grenze, Anzeige fest 24 Felder (Code).** Ab dem 25. Teil ist es unsichtbar. Dazu ist das Lager ohne Entfernungsprüfung von überall nutzbar. — game.js ~22147 (`toStash`), ui.js:994.
- **F-11 — „Handeln“ im Kontextfeld umgeht Ladensperren (Code; HB-28 offen).** Öffnungszeit, Besatzung, „Verhasst“ und Kettensperre gelten dort nicht. — ui.js:493.
- **F-12 — Lieferaufträge geben immer Ruf bei der Händlergilde (+2), nie bei der Fraktion der Zielstadt (Code).** Das ist eine Designfrage im Sinne von „Mission für die Eisenfeste, kein Ruf dafür“. — economy.js `deliver`.

**Niedrig**
- **F-09 — Legendäre Umhänge, Hände, Beine, Füße und Talismane bekommen keinen Legendären Effekt (Code).** `LEGENDS` deckt nur Waffe, Rumpf, Nebenhand und Kopf ab; die Teile haben dann nur 2 Affixe. — data.js `LEGENDS`, game.js `rollRarity`.
- **F-10 — Pferdetausch-Text „bleibt im Stall“ ist falsch (Code und live).** Das alte Pferd ist weg, eine Stall-Liste gibt es nicht. — game.js:384.
- **F-13 — Preisschild im Handels-Dock kurz veraltet nach einem Kauf (live).** Schild 29, bezahlt 32, weil der vorige Kauf das Waffenlager gesenkt hat. Das neu gemalte Schild stimmt. Nur bei schnellen Doppelklicks sichtbar. — ui.js `tradeUI`/`trPaint`.
- **F-14 — Dock bei 760 px: nur 116–176 px Welt sichtbar (live).** Bei 1024 px bleiben 378–438 px. — ui.js `DOCKED`.
- **F-15 — Kein Bankgeschäft.** Bankier und Geldwechsler sind nur Statisten. — game.js:904.
- **F-16 — Hinweis- und Bedienlücken:**
  - Kein Debug-Knopf für Kontor, Schwarzmarkt, Stall, Tierhändler.
  - Betriebe kauft man nur im Kontor-Dialog, nicht im Reiter.
- **Balance-Fragen (keine Fehler, Entscheidung des Entwicklers):**
  - „Schmieden lassen“ liefert mit Fertigkeit 60 zu 85 % „Gut“ oder besser, also billige seltene Rüstung.
  - Ein Heiler heilt verletzte Glieder bei vollem Leben für 5 Gold.
  - Ein Betrieb braucht gut 40 Tage bis zum Rückfluss.

**Behoben (früher gemeldet, hier geprüft oder im Code bestätigt):**
- HB-13: Heiler sieht verletzte Glieder.
- HB-18 und HB2-10: Betriebsverlust wird abgezogen, auch wenn sich die Summe aufhebt.
- Tierhändler-„Zurück“.
- Umhänge in Läden und Beute.
- Schmiede-, Kutsche-, Tierhändler- und Werkbank-Fenster sind gebaut.

---

## Nachtrag 03.10.2026 (abends): Fraktions-Starts, Rassen, Anwerben bei Fraktionen

- **Was es ist:** Höchster Rang einer Fraktion mit eigenem Gebiet → dauerhaft freigeschalteter Start (`rotfall.starts`, über alle Spielstände). Startpaket mit Ort, Mitgliedschaft, Ausrüstung, Aussehen, Haus (Siedlung mit Hütte) und Rasse. Regeln: `docs/MECHANIKEN.md`, Runde „Fraktions-Starts“.
- **Code:** `data.js` `RACES`, `FAC_STARTS`, `STIGMA.skeleton`; `state.js` `startUnlocks`, `unlockStart`; `game.js` `startUnlockCheck` (in `checkRankUp`, `promote`), `applyRace`, `raceOf`, `eatsFood`, `facStartAt`, `startHouse`, `joinEffects`, `facStartSetup`, `newGame` (`cfg.facStart`), Erstellung `buildCreation` (Reihe `#cr-fac`), `facMember`, `enlist`, `facRecruitChoices`, `campGuardDay` (`st.facGuards`), `boneTick`/`boneSeen`, `stigmaOf` (beide Arten); `sprites.js` Rassen-Schicht in `humanSpec` (`race` in `HS_ENT`); `render.js` Goblin-Held verkleinert.
- **Geändert an Bestehendem:** `autoRanks` (Grubenstamm-Rang auch beim Goblin-Start), `teamOf` (Goblins friedlich bei jedem Grubenstamm-Rang, wie `RANK_PERKS` es sagt), `raidSources` (Tote überfallen kein Haus eines Totenmitglieds; Häuser außerhalb der Oberwelt nur Wölfe), Tagesproviant (Untote essen nicht), `adoptSuccessor` (Erbe behält Rasse), `joinFaction` (Folgen über `joinEffects`).
- **Geprüft:** live in Wegwerf-Plätzen alle zehn Starts (Ort, Karte, Rang, Ansehen, Haus mit fertigem Feuer und Hütte, Ausrüstung, Rasse), Speichern und Laden (Rasse, Start, Haus bleiben), Anwerben bei einem Sandreiter (Ansehen 45: Gefährte mit Söldnerlohn), Freischaltung über den Stundentakt (Zwerge Rang 2 → Start frei), Figuren Skelett/Goblin/Zwerg im Bild, Selbsttest 479/479. Danach Plätze gelöscht, `rotfall.starts` auf den Vorher-Wert (leer) gesetzt.
- **Fehlversuch beim Test (behoben):** An der Tiefhall standen Goblin-Krieger der Stufe 8 fünf Kacheln neben dem Startpunkt; im ersten Wurf lag das Haus der Kette innerhalb der Eisenfeste. Jetzt: Start und Haus nur, wo in 22 Kacheln kein Feind steht, Haus außerhalb des Fraktionsorts.
- **Offen:** siehe `ROTFALL_STATE/PROPOSALS/fraktions_starts.md` (Rang ab Start, Rassenwerte, Heilung beim Skelett, Reaktion auf Goblins/Zwerge in Menschenstädten, Kinder eines Skeletts, Koop-Gäste, Rabatt beim Anwerben, Zwergenstart oben statt in der Königsstadt).
