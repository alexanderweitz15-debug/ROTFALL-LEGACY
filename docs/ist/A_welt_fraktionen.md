# Ist-Zustand Bereich A — Welt, Orte, Fraktionen, Simulation

## Audit 04.10.2026 — Phase 1 (Code ist die Wahrheit)

- **Fraktionen `wuest` (Der Wüstenbund) und `zwerge` (Die Zwerge der Tiefhall)** existieren in `FACTIONS` (13 Fraktionen) mit je drei Rängen und Rangreihen in `RANK_LINES` (8 Fraktionen × 3 Ränge × 2 = 48 Rangquests). A-34 bleibt behoben. §2.2/§13.2 („Lücke“, „keine Aufträge, kein Ruf“) sind **Doku-Fehler**; `LOCATIONS.faction` ist für Karak-Atar `wuest`, Dünenwacht `wuest`, Tiefhall `zwerge` gesetzt (03.10.).
- **A-10** teilweise behoben: `crimeFaction` nimmt Opferfraktion → Herr des Heimatorts → auf der Oberwelt den Herrn des Ortes im Umkreis, sonst **null** (kein Kopfgeld in der Wildnis); nur Innenkarten und heimatlose Reisende fallen noch an Valen.
- **1.1 Rang-Lohn:** `60 + (Rang − 1) × 50` Gold, `80 + (Rang − 1) × 70` EP (`game.js` RANK_LINES-Schleife, `i` = Rang − 1). IST_alt war falsch.
- **1.10 Pferdezüchter:** NPC-Schlüssel `wendel`, Anzeigename **Hadubrand** (`data.js:1434`). In Texten heißt er Hadubrand; `wendel` ist nur der Code-Schlüssel.
- **1.14 Namensdopplungen:** Torwache der Burg heißt jetzt **Gernot** (war Gerold wie der Kontorhändler); Elite „Irmgard vom Frostgrab“ heißt jetzt **Irmhild vom Frostgrab**. Der **Nekromanten-Turm** (Vhals Schattenkreis, Kachel 392/350) steht jetzt in `LOCATIONS` (`necrotower`, Ruine, Gefahr 4, Tote, Streuort).
- **1.15 EVENTS:** `evTaxman` und `evFailedHarvest` stehen nur noch einmal in der Liste (`game.js:11875`, war schon vor dem Audit bereinigt).
- **1.13 Erbenreihenfolge** (`makeSuccessorCandidates`): erst eigene erwachsene Kinder und Ehepartner (`familyHeirs`), dann bis zu drei Gefährten, dann gewürfelte Verwandte (Sohn/Tochter/Eltern/Geschwister/Vetter) mit Glück `1 − (Generation − 1) × 0,12` (min 0,35). Beide Darstellungen waren je zur Hälfte richtig.


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
| Karak-Atar | niemand | — | **Lücke:** keine Aufträge, kein Ruf, keine Fraktion „Sandfürsten“ |
| Dünenwacht | niemand (nur Lagerort mit Gegnern) | — | **Lücke:** kein Inhalt |
| Vharnholm | absichtlich niemand (`conKinds` gibt eine leere Liste, `game.js:7474`) | — | gewollt |
| Steinbruch | niemand | (wäre Kette) | — |
| Grenzwacht | nur Oda (Rangaufträge Valen) | Valen | ja |
| Tangkron (Gischtinseln) | nur Clan-Aufträge `q_salz1–3`, `q_klinge1–2` | Seevolk | ja |
| Tiefhall (Zwerge) | niemand | — | Lücke: Zwerge haben keine Fraktion |
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
- **Befreiung in Wellen:** 2–4 Wellen (Schwarze Feste und Varonheim 4), die letzte mit einem Hauptmann der Toten; geht man weiter als 30 Felder weg, verfällt die halbe Welle. Wer befreit, bekommt den Titel „Befreier von …“ und senkt die Bedrohung der Hauptstadt um 10.
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
| Dünenwacht | nur Requisiten und Gegner | – | – |
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

- **Lücken:** Karak-Atar, Dünenwacht und die Zwerge haben keine eigene Fraktion und keine Aufträge; Verbrechen dort gehen an Valen (2.4).

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
| A-10 | Verbrechen an Leuten ohne Fraktion (Karak-Atar, Zwerge, Reisende) → Kopfgeld bei Valen, überall. | `game.js:5822`, `game.js:8866`, `game.js:9215` |
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
