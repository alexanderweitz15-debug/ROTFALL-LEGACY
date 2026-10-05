# Ist-Zustand B — Aufträge aller Art (Stand 03.10.2026)

## Audit 04.10.2026 — Phase 1 (Code ist die Wahrheit)

- **1.7 EP-Auszahlung:** `q_omega` 1000 EP (`game.js:10459`) und `q_ratssitz` 600 EP (`game.js:11129`) werden ausgezahlt — **B-3/B-4 behoben 03.10.**; HB-10/HB-37 damit erledigt.
- **1.5 Zählung:** `QUESTS` enthält 78 feste Einträge in `data.js` (davon 12 `c_*` Titelreihen, 20 `kt_*` Klassenprüfungen, 3 `dk_*`), dazu **48 Rangquests** aus `RANK_LINES` (8 Fraktionen × 3 Ränge × 2). „55 fest / 36 Rangquests“ (IST_alt) und „40“ (B) waren falsch.
- **1.14:** Elite „Irmgard vom Frostgrab“ heißt jetzt „Irmhild vom Frostgrab“.


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

- **Was es ist:** Wiederkehrende Aufträge aus der Welt. Jede Stadt hat ein Anschlagbrett (Dorf 3, Stadt 5 Aushänge, erneuert alle 3 Tage) und einen Verteidigungsmeister (3 militärische Aufträge). Dazu vergeben Bewohner nach Beruf je einen eigenen Auftrag (`PROF_CON`). Die Eisenfeste vergibt über Kettenwachen, Tributoffizier, Paladinmarschall und Eisenpaladine; nach dem Sklavenaufstand geben die Freien in Grubenhort, in Tickmar der Arbeiterrat Aufträge.
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
