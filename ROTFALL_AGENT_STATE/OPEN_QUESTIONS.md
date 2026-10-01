# Offene Fragen an den Entwickler

Die vier Director-Fragen vom 01.10.2026 sind beantwortet (siehe `DESIGN_DECISIONS.md`).

## T23 Fraktionsressourcen (Welt-/Fraktionsspezialist, 01.10.2026 — `proposals/t23_fraktionsressourcen.md` §18)

**F1 — Aurelions Ressource**
- (A, empfohlen) Versorgung in Tagen Nahrung: Aurelion ist reich und hungrig; der Gesandte kauft Nordfurts Korn, Luftschiffe werden lebenswichtig, die Kette zu Valen entsteht von selbst.
- (B) Magitech-Vorrat: passt zur Identität, ist aber schon Ware im Markt und hat keinen Gegenspieler.
- (C) Index „Versorgung = min(Nahrungstage, Magitechtage)“: wahrer, im Kodex schwer zu erklären.

**F2 — Seelen und Morvaths Heerzug (Varonheim S1)**
- (A, empfohlen) Der Heerzug kostet 40 Seelen, braucht sie aber nicht als Bedingung: S1-Balance bleibt.
- (B) Der Heerzug braucht zusätzlich Seelen ≥ 60: verhinderbar über Seelen, aber die S1-Nachbildung muss neu gemessen werden.
- (C) Seelen und Heerzug bleiben getrennt.

**F3 — Tribut-Migration (`T.vorrat`)**
- (A, empfohlen) Einmalig `stock.grain += vorrat × 0,5`, dann löschen; Tribut nimmt Korn (Rest Fleisch); Ernte +5 entfällt.
- (B) `T.vorrat` bleibt Speicher, Markt wird nur gespiegelt — zwei Wahrheiten bleiben.
- (C) Tribut nimmt Korn und Fleisch zu gleichen Teilen — härter, mehr Aufstände.

**F4 — Die Kette holt sich neue Hände**
- (A, empfohlen) Neuer Feldzugstyp „Sklavenjagd“ gegen Grubenhort bei Arbeitskraft < 6: Hort −10, +4 Köpfe bei Sieg, vor Ort verteidigbar; die Freien bleiben eigene Fraktion.
- (B) Keine Sklavenjagd — die Kette schrumpft dauerhaft, wenn der Spieler die Pferche öffnet.
- (C) Sklavenjagd auch gegen die eigenen Tributdörfer — grausamer, Dörfer könnten sich entvölkern.

Bis zur Antwort: Scheibe S1 (nur Anzeige, Kodex „Mächte“) kann nach der Belagerung S1 geplant werden; S2–S5 warten.

## 01.10.2026 — T17 Regiebuch (Darstellung, Fable; Details `proposals/t17_regiebuch.md` §6)
Bis zur Antwort gelten die Empfehlungen.
1. **Überspringen:** Jede Schnittszene immer mit ESC überspringbar, oder erst nach dem ersten Ansehen? — EMPFEHLUNG: immer, Folgen laufen nach; Boss-Intros (live ≤ 3 s) brauchen keinen Skip. Alternativen: erst nach erstem Ansehen (`S.flags.sceneSeen`); ESC 600 ms halten.
2. **Boss-Intro-Länge:** Wie lang, und greift der Boss währenddessen an? — EMPFEHLUNG: 2,0–3,0 s (Deckel 3,5 s), live ohne Teleport, Boss greift an. Alternativen: 5 s Schnittszene mit eingefrorenem Boss; nur Namenskarte 1,2 s.
3. **Sprechblasen statt Fenster:** Ersetzen Blasen in Szenen und Boss-Phasen die Großbuchstaben-Toasts; bekommt `afterSay` („X ist gefallen“) eine 4-s-Kamera, wenn der Spieler nahe ist? — EMPFEHLUNG: ja für Szenen/Boss-Phasen, Toast bleibt für Systemmeldungen, Gespräche mit Wahl bleiben Fenster; `afterSay` mit Kamera nur < 900 px. Alternativen: Blasen nur zusätzlich; Blasen überall.
