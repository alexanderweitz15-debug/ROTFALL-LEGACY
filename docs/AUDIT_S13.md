# Audit Session 13 — kompletter Durchlauf aller Mechaniken

Auftrag des Nutzers: „Jedes System in Grund und Boden abarbeiten“, alle Mechaniken (Begleiter, Heilen, …), erst Durchlauf mit Bugliste, dann nach Schwere fixen.

Vorgehen: Code lesen, Laufzeit-Proben im Spiel (`?dev`), Screenshots in `docs/screenshots/audit_*.png`. Der echte Spielstand ist vor dem Durchlauf gesichert (`rotfall.backup.audit`) und wird danach zurückgespielt.

Schwere: **H** = falsch oder kaputt · **M** = fehlt oder wirkt unfertig · **N** = Kleinigkeit.

Stil: Auf Wunsch des Nutzers ist Stil F (Referenz 5) vorerst abgeschaltet; Standard ist wieder „Klassisch“, F bleibt in den Optionen wählbar.

---

## 1. Welt und NPC-Alltag
| # | S | Befund | Beleg |
|---|---|---|---|
| A-01 | M | Alle Arbeiter machen dieselbe Hammer-Bewegung vor ihrem Haus (Weber, Bauer, Wirt gleich). Kein Arbeitsplatz je Beruf, kein Material, keine Ware (Nutzer). | 47 von 51 Bewohnern Kreuzwegs um 10 Uhr, `act: work`; `audit_arbeiter_kreuzweg.png` |
| A-02 | N | Morgens laufen viele Bewohner in einer langen Reihe über den Platz (alle auf derselben Linie). | `audit_arbeiter_kreuzweg.png` |
| A-03 | M | Bewohner sehen fast gleich aus (in Stil F besonders); wichtige Figuren heben sich nicht ab (Nutzer). | Screenshot |
| A-04 | N | 38 Rohstoffknoten (Fels, Erz) stehen auf Felskacheln und sind nicht erreichbar. | Scan |
| A-05 | N | Drei Flüchtlinge sind Bewohner ohne Heimatort und ohne Tagesplan. | Scan |
| A-06 | N | Weltscan ohne Fund: keine NPCs in Wänden, keine Klumpen (≥ 4 auf 24 px), keine Gegner in Städten. | Scan |

## 2. Begleiter
| # | S | Befund | Beleg |
|---|---|---|---|
| B-01 | M | Liegt der Held, laufen Begleiter nicht gezielt zu ihm; sie kämpfen weiter. Aufrichten geschieht nur zufällig (< 50 px) und sofort, ohne Knien oder Verbinden. | Code `partyAI`, `tickCombatant`; Probe: Aufrichten nach 0 ms, weil der Begleiter daneben stand |
| B-02 | M | Liegende Begleiter richtet niemand gezielt auf (nur wer zufällig < 40 px steht). | Code |
| B-03 | M | Begleiter nutzen außer „Heiliges Licht“ keine Fähigkeiten, keine Verbände oder Tränke, auch nicht für sich selbst. | Code `partyAI` |
| B-04 | M | Nur 5 anwerbbare Begleiter in der ganzen Welt (Elena, Tomas, Rook, Lioba, Lila). | Scan |

## 3. Heilung
| # | S | Befund | Beleg |
|---|---|---|---|
| H-01 | H | Schlafen soll Blutung, Brand und Gift entfernen, filtert aber die falschen Namen (`bleed`, `poison` statt `bleeding`, `poisoned`). Blutung läuft nach dem Aufwachen weiter. | `sleepIn` |
| H-02 | M | Beim Schlafen heilt nur der Held, nicht die Gruppe. | `sleepIn` |
| H-03 | M | Heilerinnen in den Städten bieten keine Behandlung gegen Gold an. | kein Gesprächspunkt |
| H-04 | H | Holt man etwas aus dem Lager (B), entsteht ein neues Exemplar: Seltenheit, Affixe und Zustand gehen verloren (eine legendäre Klinge kommt gewöhnlich zurück). | `takeFromStash` nutzt `addItem` statt `giveItem` |
| H-05 | H | Dasselbe beim Bergen der Habe aus dem Grab des Vorfahren: Erbstücke verlieren Seltenheit und Affixe. | game.js Grab-Bergung (`addItem(p, it.key, …)`) |
| H-06 | N | Stapel können über die Stapelgrenze wachsen (`addItem` addiert ohne Deckel). | `addItem` |

## 4. Begleiter (Fortsetzung)
| # | S | Befund | Beleg |
|---|---|---|---|
| B-05 | M | Befehl „Anführer schützen“ steht im Gruppenfenster, ist aber nicht umgesetzt (wirkt wie „Folgen“). | `partyAI` kennt `protect` nicht |
| B-06 | N | Entlassene Begleiter bleiben, wo sie entlassen wurden (auch in einem Dungeon), statt heimzugehen. | `dismiss` |
| B-07 | N | „Ausrüstung geben“ gibt automatisch das stärkste Stück; keine Auswahl, keine Klassenprüfung. | `giveGear` |

## 5. Kampf, Fähigkeiten, Gegenstände, Quests
| # | S | Befund | Beleg |
|---|---|---|---|
| K-01 | – | Standduell (ohne Ausweichen): normale Gegner 2–4 s, Elite (Todesritter, Bär) tötet einen Helden der Stufe 8–12. Passt zur Vorgabe „schwerer“. | `RF.duel` |
| K-02 | – | Jede Fähigkeit (Klasse, Talent, Titel) lässt sich ohne Fehler wirken — neuer Dauertest. | Selbsttest 176/176 |
| K-03 | – | Alle 88 anlegbaren oder nutzbaren Gegenstände funktionieren. Insgesamt nur 116 Gegenstände (Nutzer: mehr Waffen). | Probe |
| K-04 | N | Rooks Auftrag „Rivalen“ zählt jeden getöteten Banditen, nicht nur Rivalen. | `onKill` |

## 6. Gespräche und Oberfläche
| # | S | Befund | Beleg |
|---|---|---|---|
| U-01 | H | Gespräch mit Figuren ohne Heimatort (Flüchtlinge) stürzte ab (`townDanger`, von heute). **Sofort behoben.** | Probe über alle 925 NPCs |
| U-02 | N | 70 Figuren (Automaten, einige Kettenwachen) bieten nur „Gehen“ an. Vermutlich gewollt; prüfen. | Probe |
| U-03 | – | Alle Fenster (Inventar, Charakter, Gruppe, Lager, Fraktion, Chronik, Karte, Einstellungen, Aufträge, Talente, Ausbildung, Handel) öffnen ohne Fehler. | Probe |
| U-04 | M | Keine Anzeige aktiver Effekte (Clan, Fraktion, Rang, Glaube, Pakt, Hunger) — Nutzerwunsch. | — |

## 7. Siedlung
| # | S | Befund | Beleg |
|---|---|---|---|
| S-01 | M | Werkbank, Wachturm, Lager, Schmiede und Tor der eigenen Siedlung haben keine Wirkung, obwohl die Beschreibung Reparatur, Frühwarnung und Vorrat verspricht (Regel „keine Fake-Features“). | kein Code außer Bau |
| S-02 | M | Siedler gibt es nur als Zahl, nicht als Figuren. | `population`, `dayTick` |

## 8. Schenke, Städte, Bild
| # | S | Befund | Beleg |
|---|---|---|---|
| V-01 | M | Abends stehen die Gäste in der Schenke, statt an Tischen und Bänken zu sitzen; nur 3–4 Gäste. | `audit_schenke_abend.png` |
| V-02 | N | Grabsteine stehen direkt vor der Schenkentür (Tote werden dort begraben, wo sie starben). | ebenda |
| V-03 | M | Aurelheims Hauptplatz ist mittags fast leer; eine Figur steht halb in einer Säule. | `audit_aurelheim_mittag.png` |

## 9. Speichern und Leistung
| # | S | Befund | Beleg |
|---|---|---|---|
| P-01 | – | Speichern → Laden: Wirtschaft, Betriebe, Städte, Held, Stil, Bewohner stimmen überein. | Probe |
| P-02 | M | Spielstand 2 MB (früher 0,5 MB); 1,5 MB davon 848 NPCs (~1,8 KB je Figur, u. a. Tagesplan, der beim Laden ohnehin neu entsteht). Grenze im Browser ~5 MB. | Größenmessung |
| P-03 | H | Leistung weit über Budget: Zeichnen 6–9 ms (Budget 2), Spiellogik 8–12 ms (Budget 3) in Städten. `think` 7 ms: nahe Figuren bis 0,4 ms je Stück, 876 ferne Figuren zusammen 2,5 ms; Wegsuche der Reisenden 1,5 ms, Karawane 1,2 ms. (BUG-108 verschärft) | Messung Eren, Kreuzweg, Aurelheim, Wald |
| P-04 | M | Der Selbsttest dauert ~50 s; 30 s davon der Gebäudetest (über 1000 Hausbilder ohne Cache). | Messung |
| P-05 | M | Die Sandbox setzt `S._quiet` am Ende auf `false` statt auf den vorigen Wert — Probe-Zustand kann danach gespeichert werden. | `sandbox` |

## 10. Nicht geprüft, weil schon durch Tests abgedeckt
Kerker, Kopfgeld, Schuldknechtschaft, Rat, Glaube, Kamerafahrten, Garmadon, Omega, Raids, Befreiung, Tribut, Feldzüge, Eisenfeste, Aurelion-Pass, Dungeons, Übergänge, Wegfindung, Ausweichen, Parade, Wirtschaft, Reisende (176 Tests, alle grün).

## Offene Fragen an den Nutzer
- Schnellreise: Es gibt keine (nur Kartenwechsel). Gewollt oder fehlt sie?
- Automaten und Kettenwachen sagen nur „Gehen“: gewollt?

## Stand nach den Fixes (Session 13)
Behoben mit Test: H-01, H-02, H-03, H-04, H-05, H-06, B-01, B-02, B-03, B-05, B-06, U-01, S-01, S-02, V-01, P-05, A-01 (feste Arbeitsplätze; Arbeitskreislauf und Animationen je Beruf folgen), Hinterhalte sichtbar (neu vom Nutzer).
Teilweise: P-03 (Leistung; Nutzer: nicht weiter suchen, das Spiel läuft flüssig).
Danach behoben: A-01 vollständig (Arbeitskreislauf, Werkzeuge, eigene Bewegung je Beruf), V-03 (Hauptplatz Aurelheim belebt).
Offen: A-02, A-03, A-04, A-05, B-04, B-07, K-04, U-02, U-04, V-02, P-02, P-04.

## Vorschlag: Reihenfolge der Fixes
1. **H:** H-01, H-04, H-05 (Datenverlust), P-03 (Leistung), P-05.
2. **M, Kernspiel:** B-01…B-05 (Begleiter heilen, aufrichten, schützen), H-02, H-03 (Heiler gegen Gold), S-01, S-02, V-01, V-03, P-02, P-04.
3. **Wünsche:** A-01 (Arbeitskreislauf), U-04 (Effekt-Anzeige), A-03 (Aussehen), dann Aurelion-Reise, Waffen, Animation.
4. **N:** Rest.
