// Wirtschaft (S13, Nutzer: "Tief"): Betriebe mit echten Arbeitern, Lager, Produktionsketten, Preise nach Angebot und
// Nachfrage je Stadt, Händlerzüge mit Zweck, Überfälle und Zerstörung wirken auf das Angebot. Dazu die Spielerseite:
// Handel in jeder Stadt, eigene Karawane, Betriebe kaufen und ausbauen, Lieferaufträge.
// Läuft einmal am Tag (ecoDay). Arbeiter sind die NPCs der Welt: wer tot, am Boden oder in der Gruppe des Helden ist, arbeitet nicht.
import { S, log, chronicle, chance, ri, rnd, clamp, uid, seasonOf, SEASON_FARM } from './state.js?v=25';
import { ITEMS, GOODS, TOWNS } from './data.js?v=25';
import { LOCATIONS, HOUSES, TS, TOWN_PLAN, MAPS } from './world.js?v=25';

// Waren, die in Städten gehandelt werden. GOODS (data.js) ist die volle Liste.
export const FOOD = ['grain', 'meat'];
// Gewerbe: profs = Berufe der Arbeiter, site = nötiges Gebäude in der Stadt, in/out = je Arbeiter und Tag
export const TRADES = {
  farm:     { name: 'Hof', profs: ['Bauer', 'Magd', 'Goblin-Feldarbeiter (versklavt)'], out: { grain: 1.2 } },
  hunt:     { name: 'Jägerhütte', profs: ['Jäger', 'Jägerbursche'], out: { meat: 0.6, pelt: 0.5 } },
  fish:     { name: 'Fischerei', profs: ['Fischer', 'Netzflickerin'], out: { meat: 0.9 } },
  stable:   { name: 'Stall', site: ['stable'], profs: ['Stallknecht', 'Goblin-Stallknecht (versklavt)', 'Treiber'], out: { meat: 0.4, pelt: 0.3 } },
  lumber:   { name: 'Holzfällerei', profs: ['Holzfäller', 'Goblin-Holzfäller (versklavt)'], out: { timber: 2 } },
  wood:     { name: 'Werkstatt', profs: ['Böttcher', 'Handwerker'], in: { timber: 0.8 }, out: { woodware: 1 } },
  quarry:   { name: 'Steinbruch', profs: ['Tagelöhner'], out: { stoneware: 0.8 } },
  salt:     { name: 'Saline', profs: [], out: { salt: 1.4 } },
  mine:     { name: 'Mine', profs: ['Goblin-Bergmann (versklavt)', 'Aschegräber'], out: { ore: 1.5 } },
  smelter:  { name: 'Schmelze', profs: ['Kesselflicker', 'Goblin-Träger (versklavt)'], in: { ore: 1.2, timber: 0.4 }, out: { ingot: 0.8 } },
  smithy:   { name: 'Schmiede', site: ['smithy'], profs: ['Schmied', 'Meisterschmiedin', 'Goblin-Schmied (versklavt)', 'Rüstmeisterin'], in: { ingot: 0.8 }, out: { tools: 0.4, arms: 0.2 } },
  weaver:   { name: 'Weberei', profs: ['Weber'], out: { cloth: 0.7 } },
  mech:     { name: 'Feinmechanik', profs: ['Feinmechaniker'], in: { ingot: 0.5 }, out: { tools: 0.6 } },
  magitech: { name: 'Magitech-Werk', site: ['magitech', 'factoryhall'], profs: ['Kybernetiker', 'Magitech-Ingenieurin', 'Kristallschleifer', 'Fabrikarbeiter', 'Arbeitsautomat', 'Werkmeister'],
    in: { ingot: 0.5, tools: 0.2 }, out: { magitech: 0.5 } },
  store:    { name: 'Lagerhaus', site: ['store'], profs: ['Lagerknecht'], out: {} },
};
// Tagelöhner nehmen die Arbeit, die ihre Stadt hat
const LABOR = { saltport: 'salt', northcity: 'salt', kettenfeste: 'mine' };
const PROF_TRADE = {};
for (const [k, t] of Object.entries(TRADES)) for (const p of t.profs) PROF_TRADE[p] = k;
// Wer mit Waren handelt (sonst übernimmt der erste Einwohner der Liste den Markt)
export const MARKET_PROFS = new Set(['Händlerin', 'Kontorhändler', 'Kaufmann', 'Kaufherr', 'Lagerknecht', 'Tuchhändlerin', 'Gewürzhändler']);
const MARKET_ORDER = ['Kaufmann', 'Kaufherr', 'Händlerin', 'Kontorhändler', 'Lagerknecht', 'Wirt', 'Dorfvorsteher', 'Bauer', 'Handwerker', 'Böttcher', 'Weber', 'Jäger'];
// Verbrauch je Kopf und Tag
const USE = { grain: 0.18, meat: 0.08, salt: 0.03, cloth: 0.03, woodware: 0.03, stoneware: 0.02, tools: 0.015, timber: 0.05 };
const NOBLE = /Edel|Graf|Gräfin|Fürst|Kaufherr|Ratsherr|Bankier|Kanzler/, SOLDIER = /wache|Wache|Paladin|legion|Kettenkrieger|schütze|Söldner|Offizier|Kriegsmeister|Inquisitor/;
// Hausbezeichnungen der Karte → Stadt
const HTOWN = { aurel_vorstadt: 'aurelheim', aurelheim_land: 'aurelheim', tickmar_werk: 'tickmar', karak: 'karak_atar' };

export const TOWN_LOCS = LOCATIONS.filter(l => l.kind === 'village' || l.kind === 'city');
const LOC = Object.fromEntries(TOWN_LOCS.map(l => [l.key, l]));
const isAurel = k => LOC[k]?.faction === 'aurel';
const occupied = k => S.war?.nodes?.[k]?.owner === 'undead' && LOC[k]?.faction !== 'undead';
const razed = k => !!S.razed?.[k];
/* E40.5 (Entwickler 09.10.2026, Zahlen vorläufig ⚖): Seelen, Knochen und Grabgut sind echte Marktgüter. Totenorte (Fraktion undead: Vharnholm,
   Schwarze Feste) gewinnen Knochen und Seelenphiolen aus ihren Toten und kaufen Grabgut zurück; Grabräuber bei Kreuzweg und Aschfurt graben es aus
   (Nekropole, Knochenwald). Bei den Lebenden kaufen nur Totenkundige (Alchemisten, Apotheker, Gelehrte, Hexen) Knochen und Seelen — anderswo
   gibt es dafür kaum etwas. Händlerzüge zwischen Toten und Lebenden fahren nur mit diesen Waren (Schmuggel, gefährlicher). */
export const DEAD_GOODS = ['bone', 'soul_vial', 'grabgut'];
export const DEAD_OUT = { bone: 0.12, soul_vial: 0.03 };            /* je Kopf und Tag in Totenorten */
export const GRAVE_DIG = { kreuzweg: 0.6, ashford: 0.4 };            /* Grabgut je Tag (Grabräuber) */
const LORE = /Alchem|Apothek|Kräuter|Nekro|Totenrufer|Gelehrt|Professor|Hexe/;
const isDead = k => LOC[k]?.faction === 'undead';
const deadNoUse = (town, g) => DEAD_GOODS.includes(g) && !isDead(town) && !((S.towns[town]?.use?.[g] || 0) > 0);   /* kein Abnehmer hier */
export const townName = k => S.towns?.[k]?.name || LOC[k]?.name || k;

// Stadt eines NPCs: Heimatort, Marktort oder der nächste Ort in Reichweite
export function townKeyOf(e) {
  if (!e) return null;
  const k = e.homeTown || e.town;
  if (k && LOC[k]) return k;
  if (e.map && e.map !== 'world') return null;
  const tx = e.x / TS, ty = e.y / TS;
  let best = null, bd = Infinity;
  for (const l of TOWN_LOCS) { const d = Math.hypot(l.x - tx, l.y - ty); if (d < (l.r || 10) + 8 && d < bd) { bd = d; best = l.key; } }
  return best;
}
const works = e => e.alive && !e.downed && !S.party?.includes(e.id);
export function tradeOf(e, town) {
  if (e.prof === 'Tagelöhner') return LABOR[town] || 'quarry';
  return PROF_TRADE[e.prof] || null;
}

// Volkszählung: Köpfe, Arbeiter je Gewerbe, Adel, Soldaten. Einmal am Tag (und beim Öffnen der Menüs) — ~700 NPCs.
export function census() {
  const C = {};
  for (const l of TOWN_LOCS) C[l.key] = { heads: 0, noble: 0, soldier: 0, lore: 0, work: {} };
  for (const e of S.ents.world) {
    if (e.kind !== 'npc' || !e.alive || e.child || /Automat/.test(e.prof || '') && !tradeOf(e, null)) continue;   /* Kinder (08.10.) zählen nicht als Arbeitskraft */
    const k = townKeyOf(e); if (!k || !C[k]) continue;
    const c = C[k]; c.heads++;
    if (NOBLE.test(e.prof || '')) c.noble++;
    if (SOLDIER.test(e.prof || '')) c.soldier++;
    if (LORE.test(e.prof || '')) c.lore++;   /* E40.5: Abnehmer für Knochen und Seelen */
    const tr = tradeOf(e, k);
    if (tr && works(e)) c.work[tr] = (c.work[tr] || 0) + (e.ate != null && S.day * 1440 + S.minute - e.ate > 1200 ? 0.5 : 1);   // hungrig: halbe Arbeit
  }
  return C;
}
const sites = {};
function siteCount(town, types) {
  const key = town + ':' + types.join(',');
  if (sites[key] == null) sites[key] = HOUSES.filter(h => (HTOWN[h.town] || h.town) === town && types.includes(h.type)).length;
  return sites[key];
}

// Tagesbedarf je Stadt
function useOf(town, c) {
  const u = {};
  for (const [g, v] of Object.entries(USE)) u[g] = v * c.heads;
  u.cloth += 0.08 * c.noble; u.meat += 0.05 * c.noble;
  if (LOC[town]?.faction === 'undead') u.grain = u.meat = 0;   // die Toten von Vharnholm essen nicht
  u.magitech = 0.02 * c.noble + (isAurel(town) ? 0.01 * c.heads : 0);
  u.arms = 0.02 * c.soldier + 0.3 * siteCount(town, ['barracks', 'legion']);
  u.bone = 0.15 * (c.lore || 0); u.soul_vial = 0.05 * (c.lore || 0); u.grabgut = isDead(town) ? 0.04 * c.heads : 0;   /* E40.5 */
  return u;
}
export const target = (t, g) => (t.use[g] || 0) * 6 + 4;
/* E40.5: Startlager der Totenwaren (auch für alte Stände, idempotent) — nur wo sie entstehen oder gebraucht werden, sonst 0 */
function deadStock(town, t) {
  for (const g of DEAD_GOODS) if (t.stock[g] == null) t.stock[g] = isDead(town) || (g === 'grabgut' && GRAVE_DIG[town]) || (t.use[g] || 0) > 0 ? Math.round(target(t, g) * 0.8) : 0;
}
export const capOf = town => Math.min(400, 60 + 40 * siteCount(town, ['store', 'markethall', 'kontor']));

// ---------------- Start / Altstände ----------------
export function initEco() {
  S.towns ||= structuredClone(TOWNS);
  const fresh = !S.eco;                                               /* RB-042: neues Spiel (alte Stände behalten ihr Lager) */
  S.eco ||= { biz: [], caravans: [], orders: [], my: null, income: 0 };
  const C = census();
  for (const l of TOWN_LOCS) {
    const t = (S.towns[l.key] ||= { name: l.name, pop: Math.max(8, C[l.key].heads * 2), stock: {}, prod: {}, use: {} });
    t.use = useOf(l.key, C[l.key]);
    deadStock(l.key, t);
    for (const g of GOODS) if (t.stock[g] == null) t.stock[g] = Math.round(target(t, g) * 0.8);
    if (fresh) for (const g of GOODS) if (!(l.key === 'northcity' && g === 'grain')) t.stock[g] = Math.max(t.stock[g], Math.round(target(t, g) * 0.8));   /* RB-042: die festen Startwerte aus TOWNS (Eren: Tuch 5, Leder 8) lagen weit unter dem Bedarf → Höchstpreis am ersten Tag; Nordfurts Kornmangel bleibt gewollt (Heeresversorgung) */
  }
  syncBiz(C);
}
// Betriebe: einer je Stadt und Gewerbe, sobald dort jemand arbeitet (und das nötige Gebäude steht)
function syncBiz(C) {
  for (const [town, c] of Object.entries(C)) for (const tr of Object.keys(c.work)) {
    const T = TRADES[tr]; if (T.site && !siteCount(town, T.site)) continue;
    if (!S.eco.biz.some(b => b.town === town && b.trade === tr)) S.eco.biz.push({ id: uid(), town, trade: tr, level: 1, owner: null, hired: 0, made: 0 });
  }
}
export const bizName = b => `${TRADES[b.trade].name} ${townName(b.town)}`;
export const bizWorkers = (b, C) => (C[b.town]?.work[b.trade] || 0) + b.hired * 0.8;

// ---------------- Preise ----------------
export function ecoPrice(town, g, buy) {
  const t = S.towns[town]; if (!t) return ITEMS[g].value;
  let f = clamp(target(t, g) / ((t.stock[g] || 0) + 1), 0.4, 3);
  if (deadNoUse(town, g)) f = 0.4;   /* E40.5: Totenware ohne Abnehmer am Ort — fast nichts wert */
  if (isAurel(town)) f *= 1.15 * (S.tollMul || 1);   /* T09: Aurelions Zölle (Gesetz, Kaiserin, Spaltung) */
  if (occupied(town) && buy) f *= 1.5;   // S15: Besatzung macht Kaufen teuer, nicht Verkaufen
  else if (buy && (S.schutz?.[town]?.stage || 0) === 3) f *= 1.25;   /* Stadt ohne Schutz S2: gesetzlos — Kaufen ein Viertel teurer */
  else if (buy && S.schutz?.[town]?.taker?.by === 'band') f *= 1.5;   /* S2: Bandenherrschaft */
  if (town === 'varonheim' && buy && (S.war?.capThreat || 0) >= 10 && ['grain', 'meat', 'salt', 'arms'].includes(g)) f *= 1 + Math.min(0.3, (S.war.capThreat - 9) * 0.02);   /* Scout R5: Hamsterkäufe, wenn Morvath droht (bis +30 %) */
  f *= (S.after?.pmul?.[g] || 1) * (S.after?.tmul?.[town] || 1);   /* Folgen §5c: Aufstand/Streik verteuern Waren, Flüchtlinge die Zielstadt */
  const p = ITEMS[g].value * f;
  return Math.max(1, Math.round(buy ? p * 1.12 : p * 0.88));
}
export function notePrices(town) {
  if (!S.towns[town]) return;
  (S.priceSeen ||= {})[town] = { day: S.day | 0, p: Object.fromEntries(GOODS.map(g => [g, ecoPrice(town, g, true)])) };
}

// ---------------- Nutztiere (S14, Master-Prompt §4.2) ----------------
// Jede Stadt mit Feldern hält eine Herde (Zahl im Stand; am Hof stehen davon einige als Figuren). Kühe geben Fleisch, Schafe Wolle
// (Tuch), beide etwas Fell. Nachwuchs, solange Platz ist und niemand hungert; Wölfe und Räuber im Umland reißen Tiere (die Meldung
// geht an game.js, das eine sichtbare Kuh am Hof sterben lässt); wer hungert, schlachtet notfalls.
export const HERD_OUT = { cow: { meat: 0.25, pelt: 0.04 }, sheep: { cloth: 0.15, pelt: 0.06, meat: 0.05 } };
export const herdCap = town => (TOWN_PLAN[town]?.fields?.length || 0) * 6;
const predatorsNear = town => { const l = LOC[town]; if (!l) return 0; let n = 0;
  for (const e of S.ents.world) if (e.kind === 'enemy' && e.alive && (e.mtype === 'wolf' || e.mtype === 'wild_dog' || /^bandit/.test(e.mtype)) && Math.hypot(e.x / TS - l.x, e.y / TS - l.y) < (l.r || 10) + 45) n++;
  return n; };
export function herdOf(town) {
  const t = S.towns?.[town]; if (!t || !herdCap(town)) return null;
  return (t.herd ||= { cow: 2 + (town.length % 3), sheep: 3 + (town.charCodeAt(0) % 3) });   // Anfangsherde aus dem Namen (kein Zufall)
}
export function herdDay(town, t) {
  const H = herdOf(town); if (!H) return;
  for (const [a, out] of Object.entries(HERD_OUT)) for (const [g, n] of Object.entries(out)) { const q = n * H[a]; t.stock[g] = (t.stock[g] || 0) + q; t.prod[g] = (t.prod[g] || 0) + q; }
  const tot = H.cow + H.sheep, pred = predatorsNear(town), sn = seasonOf();
  if (tot >= 2 && tot < herdCap(town) && !t.hunger && sn !== 3 && chance(sn === 0 ? 0.4 : 0.2)) H[chance(0.45) ? 'cow' : 'sheep']++;   // Frühling: Kälber und Lämmer; Winter: keine
  if (tot && chance(Math.min(0.6, pred * 0.08 * (sn === 3 ? 1.8 : 1)))) { const a = H.sheep && (chance(0.6) || !H.cow) ? 'sheep' : 'cow'; H[a]--; (S.herdLoss ||= []).push({ town, a, why: pred ? 'wolf' : 'thief' }); }
  if (t.hunger && tot > 2 && chance(0.3)) { const a = H.cow ? 'cow' : 'sheep'; H[a]--; t.stock.meat = (t.stock.meat || 0) + (a === 'cow' ? 3 : 1); }   // Notschlachtung
}

// ---------------- Luftschiffe (Roadmap P6/P7) ----------------
// Aurelions Flotte fliegt abstrakt: airDay (einmal am Tag, aus game.js dayTick) schickt Schiffe zwischen festen Punkten hin und her.
// Handelsschiffe holen Nahrung aus dem Süden (außerhalb der Karte, Punkt „sued“); Aurelions Import richtet sich nach dem Anteil
// einsatzbereiter Handelsschiffe (airSupply). Jeder Flugtag kann eine Havarie bringen (Hülle, Steuerung); Hülle 0 = Absturz, den
// game.js über airH.crash als Wrack in die Welt legt. Im Heimathafen Kupferhafen bessert die Werft mit Barren aus dem Lager aus,
// ein Wrack wird nach einigen Tagen aus Barren und Bauholz neu gebaut. Werte: hull/motor/helm 0–100, up.* Ausbaustufe 0–2.
export const AIR_HOME = 'kupferhafen';
export const AIR_KIND = { handel: 'Handelsschiff', patrouille: 'Patrouille' };
const AIR_ROUTE = { handel: ['kupferhafen', 'sued'], patrouille: ['kupferhafen', 'aurelheim', 'tickmar'] };
export const airH = {};                                              // Rückrufe aus game.js: crash(ship, [x, y])
export function airPt(k) {                                           // Ankerpunkt in Kacheln (über dem Platz, im Süden am Kartenrand)
  if (k === 'sued') { const q = TOWN_PLAN.sanktserin?.square || [820, 1110]; return [q[0] + 60, Math.min((MAPS.world?.h || 1216) - 4, q[1] + 100)]; }
  const P = TOWN_PLAN[k]; return P ? [P.square[0] + 6, P.square[1] - 5] : [600, 795];
}
export const airPtName = k => k === 'sued' ? 'den Kornländern im Süden' : townName(k);
const newShip = (name, kind) => ({ id: uid(), name, kind, home: AIR_HOME, hull: 100, motor: 100, helm: 100, state: 'hafen', at: AIR_HOME, to: null, dep: 0, eta: 0, trips: 0, up: { hull: 0, motor: 0, cargo: 0 } });
export function airDefaults() {                                      // idempotent: alte Stände ohne S.air bekommen die drei Schiffe einmal (S.flags.air1)
  S.air ??= { v: 1, fleet: [], my: null }; S.air.fleet ||= []; S.flags ||= {};
  if (!S.flags.air1) { S.flags.air1 = true; if (!S.air.fleet.length) S.air.fleet.push(newShip('Kupferwind', 'handel'), newShip('Goldmöwe', 'handel'), newShip('Wacht von Aurel', 'patrouille')); }
  for (const s of S.air.fleet) { s.up ||= {}; for (const k of ['hull', 'motor', 'cargo']) s.up[k] ??= 0; for (const k of ['hull', 'motor', 'helm']) s[k] ??= 100; s.state ||= 'hafen'; s.home ||= AIR_HOME; s.at ||= s.home; }
  return S.air;
}
export const dayF = () => (S.day | 0) + (S.minute || 0) / 1440;
export const airReady = s => s.state !== 'wrack' && s.hull >= 25;
export function airSupply() {                                        // 1 = alle Handelsschiffe fliegen; Laderaum-Ausbau +25 % je Stufe; nie unter 0,2 (Karren über Land)
  const T = (S.air?.fleet || []).filter(s => s.kind === 'handel'); if (!T.length) return 1;
  return clamp(T.filter(airReady).reduce((n, s) => n + 1 + 0.25 * (s.up?.cargo || 0), 0) / T.length, 0.2, 1.5);
}
export const airSpeed = s => (0.5 + (s.motor ?? 100) / 200) * (1 + 0.15 * (s.up?.motor || 0));   // Motor 100 = 1, Motor 40 = 0,7
export const airDays = (s, a, b) => { const A = airPt(a), B = airPt(b); return Math.max(0.3, Math.hypot(A[0] - B[0], A[1] - B[1]) / 250 / airSpeed(s)); };
export const airDur = s => Math.round(22000 / airSpeed(s));          // Roadmap P7: Dauer der Passage an Deck (ms Echtzeit)
export function airPos(s, t = dayF()) {                              // Lage in Kacheln (fliegend: zwischen Abflug und Ziel), Wrack: null
  if (s.state === 'wrack') return null;
  const A = airPt(s.at); if (s.state !== 'flug' || !s.to) return A;
  const B = airPt(s.to), k = clamp((t - s.dep) / Math.max(0.01, s.eta - s.dep), 0, 1);
  return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k];
}
export function riskAir(s) { return clamp(0.06 + (100 - (s.motor ?? 100)) / 500 + (100 - (s.helm ?? 100)) / 600, 0.03, 0.4); }
function nextStop(s) { const R = AIR_ROUTE[s.kind] || AIR_ROUTE.handel, i = R.indexOf(s.at); return i < 0 ? s.home || AIR_HOME : R[(i + 1) % R.length]; }
export function airDepart(s, to, t = dayF()) { Object.assign(s, { state: 'flug', to, dep: t, eta: t + airDays(s, s.at, to) }); }
export function airCrash(s) {                                        // Absturz: Wrack, Neubau in 5 Tagen; game.js legt das Wrack in die Welt
  const pos = airPos(s) || airPt(s.at); Object.assign(s, { hull: 0, state: 'wrack', to: null, back: (S.day | 0) + 5 });
  log(`Die „${s.name}“ ist abgestürzt.`, 'economy'); airH.crash?.(s, pos);
}
export function airDay(skipId) {                                     // skipId: Schiff mit dem Helden an Bord (P7) — sein Flug läuft an Deck
  const A = airDefaults(), d = dayF(), home = S.towns?.[AIR_HOME];
  for (const s of A.fleet) {
    if (s.id === skipId) continue;
    if (s.state === 'wrack') {
      if ((S.day | 0) < (s.back || 0)) continue;
      if (home && ((home.stock.ingot || 0) < 6 || (home.stock.timber || 0) < 6)) { s.back = (S.day | 0) + 1; continue; }   // Werft wartet auf Barren und Holz
      if (home) { home.stock.ingot -= 6; home.stock.timber -= 6; }
      Object.assign(s, { state: 'hafen', at: s.home || AIR_HOME, to: null, hull: 100, motor: 100, helm: 100 }); log(`In Kupferhafen läuft die neue „${s.name}“ vom Stapel.`, 'economy'); continue;
    }
    if (s.state === 'flug') {
      s.motor = Math.max(10, s.motor - ri(1, 3));
      if (chance(riskAir(s))) { const dmg = Math.round(ri(15, 55) * (1 - 0.2 * (s.up?.hull || 0))); s.hull = Math.max(0, s.hull - dmg); if (s.hull > 0 && chance(0.4)) s.helm = Math.max(10, s.helm - ri(10, 30));
        if (s.hull > 0) log(`Die „${s.name}“ meldet Sturmschaden (Hülle ${Math.round(s.hull)} %).`, 'economy'); }
      if (s.hull <= 0) { airCrash(s); continue; }
      if (d >= s.eta) Object.assign(s, { at: s.to, to: null, state: 'hafen', trips: (s.trips || 0) + 1 });
      continue;
    }
    if (s.at === (s.home || AIR_HOME) && home && (s.hull < 90 || s.motor < 90 || s.helm < 90)) {   // Werft: je Barren +10 Hülle, +8 Motor, +8 Steuerung (höchstens 3 am Tag)
      const n = Math.min(3, Math.floor(home.stock.ingot || 0)); home.stock.ingot -= n;
      s.hull = Math.min(100, s.hull + n * 10); s.motor = Math.min(100, s.motor + n * 8); s.helm = Math.min(100, s.helm + n * 8);
    }
    if (s.hull < 50) { if (s.at !== (s.home || AIR_HOME)) airDepart(s, s.home || AIR_HOME, d); continue; }   // angeschlagen: heim zur Werft, dort bleibt es am Mast
    if (A.fleet.some(o => o !== s && o.kind === s.kind && o.state === 'flug' && o.at === s.at && d - (o.dep || 0) < 0.9)) continue;   // gleiche Art startet nicht am selben Tag vom selben Mast (versetzt fliegen)
    airDepart(s, nextStop(s), d);
  }
}

// ---------------- Tageslauf ----------------
/* Gold-Senke (Audit 04.10. Phase 5, 09.10.2026 — vorläufig ⚖): Betriebssteuer — vom Tagesgewinn eines eigenen Betriebs gehen BIZ_TAX an die Stadt
   (nur bei Gewinn, abgerundet; Verluste bleiben unbesteuert). Messung vorher: Tagesgewinn je Betrieb Median 5, Schnitt 12, beste 126 Gold;
   Kaufpreis ÷ Tagesgewinn (Amortisation) der besten Betriebe 52–68 Tage — mit Steuer gut 10 % länger. */
export const BIZ_TAX = 0.1;
/* E43b/c (Entwickler 09.10.2026; Sätze vorläufig ⚖): Betriebssteuer und Einzahlgebühr je Gebiet und Stadt statt fest 10 %/3 % — maßgeblich ist,
   wer den Ort gerade hält (townFac aus game.js, Besetzung zählt). [Steuer, Gebühr]. Aurelion teuer, Valen mittel (= bisher), freie Orte und Wüste billig. */
export const TAX_FAC = { aurel: [0.15, 0.05], valen: [0.10, 0.03], order: [0.08, 0.03], chain: [0.12, 0.04], undead: [0.12, 0.04], zwerge: [0.08, 0.03],
  merch: [0.06, 0.02], sea: [0.06, 0.02], frei: [0.05, 0.02], wuest: [0.05, 0.02], goblin: [0.05, 0.02] };
export const TAX_TOWN = { aurelheim: [0.18, 0.06], varonheim: [0.12, 0.03], kreuzweg: [0.04, 0.02] };   /* Hauptstädte teurer, Kreuzweg als freier Marktknoten billig */
export const taxH = {};                                              /* von game.js: townFac(town) */
export function taxOf(town) {
  const k = HTOWN[town] || town, f = taxH.townFac?.(k), T = TAX_TOWN[k] || TAX_FAC[f] || [BIZ_TAX, 0.03];
  return { tax: T[0], fee: T[1], fac: f || null, own: !!TAX_TOWN[k] };
}
export const bizTax = (pr, town) => (pr > 0 ? Math.floor(pr * (town ? taxOf(town).tax : BIZ_TAX)) : 0);
/* Unterhalt (09.10.2026 — vorläufig ⚖): je Arbeitstag 2 Gold × Ausbaustufe (Pacht, Werkzeug, Ausbesserung); vor der Steuer abgezogen, ruhende Betriebe
   zahlen nichts. Messung (30 Tage, Magitech Aurelheim + Hof Nordfurt, je 1 Hand): Einnahmen 2902 Gold, Steuer 296; Unterhalt dazu 120. */
export const BIZ_UPKEEP = 2;
export const bizUpkeep = b => BIZ_UPKEEP * (b.level || 1);
export function ecoDay() {
  if (!S.eco) initEco();
  const C = census(); syncBiz(C);
  let income = 0, loss = 0;
  /* Betriebe-Kasse (Entwickler 02.10.2026): der Tagesgewinn eigener Betriebe sammelt sich in b.kasse (abholen vor Ort); Verlust zahlt zuerst
     die Kasse, den Rest das Gold (HB-18 bleibt). Besetzung oder Zerstörung der Stadt: die ganze Kasse ist verloren (vorläufig, Lead). */
  const idle = b => { if (b.owner !== 'player') return; b.lastPr = 0; b.daysPr = (b.daysPr || 0) + 1;
    if ((occupied(b.town) || razed(b.town)) && (b.kasse || 0) > 0) { log(`${bizName(b)}: ${razed(b.town) ? 'Die Stadt liegt in Trümmern' : 'Die Toten halten die Stadt'} — die Kasse (${Math.floor(b.kasse)} Gold) ist verloren.`, 'economy'); b.kasse = 0; } };
  for (const [town, t] of Object.entries(S.towns)) {
    if (!C[town]) continue;
    t.use = useOf(town, C[town]); t.prod = {}; deadStock(town, t);
    const food = FOOD.reduce((n, g) => n + (t.stock[g] || 0), 0);
    t.hunger = food < 1;
    if (occupied(town) || razed(town)) continue;
    // Umland: Aurelion bezieht Nahrung per Luftschiff aus dem Süden (außerhalb der Karte); Roadmap P6: so viel, wie Handelsschiffe fliegen (airSupply)
    if (isAurel(town)) { const sup = airSupply(); for (const g of FOOD) t.stock[g] += t.use[g] * 0.9 * sup; t.stock.ingot += 0.4 * ((C[town].work.mech || 0) + (C[town].work.magitech || 0)); }   // dazu Barren für die Werkstätten
    herdDay(town, t);
    if (isDead(town)) for (const [g, n] of Object.entries(DEAD_OUT)) { const q = n * C[town].heads; t.stock[g] += q; t.prod[g] = (t.prod[g] || 0) + q; }   /* E40.5 */
    if (GRAVE_DIG[town]) { t.stock.grabgut += GRAVE_DIG[town]; t.prod.grabgut = (t.prod.grabgut || 0) + GRAVE_DIG[town]; }
  }
  // Produktion mit Vorprodukten
  for (const b of S.eco.biz) {
    b.lastTax = 0; b.lastUp = 0;
    const t = S.towns[b.town], T = TRADES[b.trade];
    if (!t || occupied(b.town) || razed(b.town) || (S.halt?.[b.town + ':' + b.trade] || 0) > S.day) { b.made = 0; idle(b); continue; }   // S14: Unfall legt still
    const e = bizWorkers(b, C) * (1 + 0.5 * (b.level - 1)) * (t.hunger ? 0.5 : 1) * (b.trade === 'farm' ? SEASON_FARM[seasonOf()] : 1);   // S14: Ernte nach Jahreszeit
    if (e <= 0) { b.made = 0; idle(b); continue; }
    let frac = 1;
    for (const [g, n] of Object.entries(T.in || {})) frac = Math.min(frac, (t.stock[g] || 0) / (n * e));
    for (const [g, n] of Object.entries(T.in || {})) t.stock[g] -= n * e * frac;
    let val = 0;
    for (const [g, n] of Object.entries(T.out)) { const q = n * e * frac; t.stock[g] = (t.stock[g] || 0) + q; t.prod[g] = (t.prod[g] || 0) + q; val += q * ecoPrice(b.town, g, false); }
    b.made = Math.round(val);
    if (b.owner === 'player') { const up = bizUpkeep(b), pr0 = Math.round(val * 0.35 - b.hired * 3) - up, tax = bizTax(pr0, b.town), pr = pr0 - tax; b.lastTax = tax; b.lastUp = up; S.eco.upkeepPaid = (S.eco.upkeepPaid || 0) + up; S.eco.taxPaid = (S.eco.taxPaid || 0) + tax; income += pr;   /* Gold-Senke 09.10.: Betriebssteuer am Ort */ b.lastPr = pr; b.sumPr = (b.sumPr || 0) + pr; b.daysPr = (b.daysPr || 0) + 1;
      b.kasse = (b.kasse || 0) + pr; if (b.kasse < 0) { loss -= b.kasse; b.kasse = 0; } }
  }
  // Verbrauch, Lagergrenze, Hunger
  for (const [town, t] of Object.entries(S.towns)) {
    if (!C[town] || occupied(town)) continue;
    const cap = capOf(town);
    for (const g of GOODS) {
      t.stock[g] = Math.max(0, (t.stock[g] || 0) - Math.max(0, (t.use[g] || 0) - (t.bought?.[g] || 0)));   // Markteinkäufe sind schon abgezogen
      t.stock[g] = Math.min(t.stock[g], cap);
    }
    t.bought = {};
    if (t.hunger && t.pop > 5) { t.pop -= 1; if (chance(0.3)) log(`${t.name} hungert. Menschen wandern ab.`, 'economy'); }
  }
  if (income || loss) { if (loss) S.gold = Math.max(0, S.gold - loss);   /* HB2-10: auch wenn sich die Tagessumme genau aufhebt */ S.eco.income = income; log(`Deine Betriebe: ${income >= 0 ? '+' : ''}${income} Gold heute${income > 0 ? ' — in den Kassen der Betriebe' : ''}${loss ? `, ${loss} Gold Lohn aus deinem Beutel` : ''}${(([tx, up]) => tx || up ? ` (abgezogen: Unterhalt ${up}, Betriebssteuer ${tx} Gold — ${[...new Set(S.eco.biz.filter(b => b.owner === 'player' && b.lastTax).map(b => b.town))].map(t => `${townName(t)} ${Math.round(taxOf(t).tax * 100)} %`).join(', ') || 'keine Steuer'})` : '')(S.eco.biz.reduce((s, b) => b.owner === 'player' ? [s[0] + (b.lastTax || 0), s[1] + (b.lastUp || 0)] : s, [0, 0]))}.`, 'economy');
    if (!S.flags?.kasseHint && S.eco.biz.some(b => b.owner === 'player' && b.kasse > 0)) { (S.flags ||= {}).kasseHint = 1; log('Betriebe: Der Gewinn sammelt sich in der Kasse des Betriebs. Abholen kannst du ihn vor Ort in der Stadt (Siedlung → Reiter Betriebe). Fällt die Stadt an die Toten oder wird zerstört, ist die Kasse verloren.', 'quest'); } }   /* Behoben HB-18: Verlust wurde angezeigt, aber Math.max(0, income) hat ihn nie abgezogen */
  caravanDay(); myCaravanDay(); ordersDay();
}

// ---------------- Händlerzüge (abstrakt, fern vom Helden) ----------------
const tradeTowns = () => Object.keys(S.towns).filter(k => LOC[k] && !occupied(k) && !razed(k) && LOC[k].faction !== 'undead' && !S.after?.quar?.[k]);   /* Folgen §5c: Quarantäne = kein Handel */
const tripDays = (a, b) => Math.max(1, Math.ceil(Math.hypot(LOC[a].x - LOC[b].x, LOC[a].y - LOC[b].y) / 260));
/* T12 B1 „Straßen haben Herren“ (APPROVED 01.10., E37 09.10.): jede Gefahr hat einen Grund mit Namen. riskWhy liefert die Gründe,
   riskOf summiert sie — eine Quelle für Würfel und Kontor-Anzeige. Banden in Lagernähe, Totenknoten am Weg, Streifen, Aurelions Zoll.
   Der eigene Wagen zählt eine Bande nicht, solange ihr Schutzgeld bezahlt ist; der Umweg meidet alle Banden (+1 Tag). */
export const ROAD = { base: 0.06, band: 0.08, bandR: 30, node: 0.05, nodeR: 30, patrol: 0.03, patrolR: 20, toll: 0.02,
  startLoot: 5, small: 1, upkeep: 0.4, grow: 20, starveDays: 3, minMen: 2, maxMen: 9,
  tax: 0.04, taxShare: 0.25, unitGold: 5, patrolHit: 0.35 };   /* B3: Melken, Streifen */   /* B2: Beute, Unterhalt, Wachstum, Hunger (Spec T12 §5) */
const LOCK = Object.fromEntries(LOCATIONS.map(l => [l.key, l]));
export function segDist(px, py, A, B) {
  const dx = B.x - A.x, dy = B.y - A.y, L = dx * dx + dy * dy, t = L ? clamp(((px - A.x) * dx + (py - A.y) * dy) / L, 0, 1) : 0;
  return Math.hypot(px - A.x - t * dx, py - A.y - t * dy);
}
/* ponytail: Streifen-Suche filtert die ganze Weltliste (~17 000) je Aufruf; höchstens ~30 Aufrufe am Tag — Cache erst, wenn es misst */
const patrolsNear = (A, B) => S.ents.world.filter(e => e.traveler?.kind === 'patrol' && e.alive !== false && segDist(e.x / TS, e.y / TS, A, B) < ROAD.patrolR);
export function riskWhy(a, b, o = {}) {
  const A = LOC[a] || LOCK[a], B = LOC[b] || LOCK[b], out = [], day = S.day | 0;
  for (const k of [a, b]) if (S.war?.armies?.some(x => x.faction === 'undead' && x.at === k)) out.push({ add: 0.12, txt: `Totenheer vor ${townName(k)}` });
  if ([a, b].includes('karak_atar')) out.push({ add: 0.05, txt: 'Bergpfade nach Karak-Atar' });
  if (isDead(a) !== isDead(b)) out.push({ add: 0.08, txt: 'Schmuggel zwischen Toten und Lebenden' });   /* E40.5 */
  if (!A || !B) return out;
  if (!o.detour) for (const bd of S.bands || []) {
    if (bd.gone || !(bd.men > 0) || (o.mine && bd.paid >= day) || segDist(bd.tx, bd.ty, A, B) >= ROAD.bandR) continue;
    out.push({ add: ROAD.band * Math.min(9, bd.men) / 9 + (bd.tax ? ROAD.tax : 0), txt: `${bd.name} bei ${bd.where} (${bd.men} Mann${bd.tax ? ', melken die Straße' : ''})`, band: bd.id });
  }
  for (const [k, n] of Object.entries(S.war?.nodes || {})) {
    const L = LOCK[k]; if (n.owner !== 'undead' || k === a || k === b || !L || segDist(L.x, L.y, A, B) >= ROAD.nodeR) continue;
    out.push({ add: ROAD.node, txt: `Die Toten halten ${L.name}` });
  }
  const pt = patrolsNear(A, B)[0]; if (pt) out.push({ add: -ROAD.patrol, txt: `Streife ${({ valen: 'der Krone', order: 'des Ordens', merch: 'der Gilde', chain: 'der Kette', aurel: 'Aurelions' })[pt.patrol] || ''} unterwegs`.replace('  ', ' ') });
  if ((isAurel(a) || isAurel(b)) && (S.tollMul || 1) >= 1.05) out.push({ add: -ROAD.toll, txt: 'Zölle bezahlen Legionsstreifen' });   /* ersetzt das tote S.laws.toll (RB-010) */
  return out;
}
export function riskOf(a, b, guards, o = {}) {
  const r = riskWhy(a, b, o).reduce((s, w) => s + w.add, ROAD.base);
  return clamp(r * (1 - 0.22 * guards), 0.01, 0.5);
}
/* T12 B2: Wer hat überfallen? Mit Wahrscheinlichkeit Bandenanteil / Gesamtgefahr eine Bande (gewichtet), sonst namenlose Räuber.
   Die Bande bekommt die verlorenen Ladungen als Beute (b.loot) — davon wächst sie in bandDay (game.js). */
export function raidBand(a, b, o = {}) {
  const why = riskWhy(a, b, o), tot = why.reduce((s, w) => s + Math.max(0, w.add), ROAD.base);
  let r = rnd() * tot;
  for (const w of why) if (w.band && w.add > 0) { if (r < w.add) return (S.bands || []).find(x => x.id === w.band) || null; r -= w.add; }
  return null;
}
export function onBandRaid(bd, lost, good, what) {
  bd.loot = (bd.loot ?? 5) + lost; bd.lastLoot = S.day | 0; if (good && ITEMS[good]) bd.good = good;
  if (bd.tax && what !== 'deinen Wagen') { bd.taxGold = (bd.taxGold || 0) + lost * ROAD.unitGold * ROAD.taxShare; S.factions.merch = clamp((S.factions.merch || 0) - 1, -100, 100); }   /* B3: Melken — dein Viertel, die Gilde merkt es */
  log(`${bd.name} überfielen bei ${bd.where} ${what}${good && ITEMS[good] ? ` (${lost} ${ITEMS[good].name})` : ` (${lost} Ladungen)`}.`, 'economy');
  if (!S.flags?.hintRoadRaid) { (S.flags ||= {}).hintRoadRaid = 1; log(`Banden leben von Beute: Ungestört wachsen ${bd.name}, ohne Züge auf der Straße hungern sie und zerfallen. Der Kontor zeigt jede Strecke mit ihrer Gefahr.`, 'quest'); }
}
/* Kontor-Anzeige: alle Handelsziele bis 3 Tagesreisen, gefährlichste zuerst, Prozent mit 1 Wache. Rein (kein Würfel, kein Zustand) — Koop-Gäste sehen dasselbe. */
export function routeLines(town, o = {}) {
  return tradeTowns().filter(k => k !== town && LOC[town] && tripDays(town, k) <= 3)
    .map(k => { const why = riskWhy(town, k, o), p = riskOf(town, k, 1, o); return { to: k, p, days: tripDays(town, k), why, txt: `Nach ${townName(k)} (${tripDays(town, k)} ${tripDays(town, k) > 1 ? 'Tage' : 'Tag'}): ${why.filter(w => w.add > 0).length ? `${Math.round(p * 100)} % — ${why.map(w => w.txt).join('; ')}` : `ruhig (${Math.round(p * 100)} %)${why.length ? ' — ' + why.map(w => w.txt).join('; ') : ''}`}` }; })
    .sort((x, y) => y.p - x.p);
}
function caravanDay() {
  const E = S.eco;
  for (const c of [...E.caravans]) {
    if (!c.raided && chance(riskOf(c.from, c.to, c.guards))) {
      c.raided = true; const lost = Math.ceil(c.n * (0.5 + rnd() * 0.5)); c.n -= lost;
      const bd = raidBand(c.from, c.to);   /* T12 B2: war es eine Bande, bekommt sie die Beute */
      if (bd) onBandRaid(bd, lost, c.good, `einen Zug nach ${townName(c.to)}`);
      else log(`Räuber überfielen einen Händlerzug nach ${townName(c.to)}: ${lost} ${ITEMS[c.good].name} verloren.`, 'economy');
      if (chance(0.3)) chronicle(bd ? `${bd.name} überfielen einen Händlerzug nach ${townName(c.to)}` : `Ein Händlerzug nach ${townName(c.to)} wurde überfallen`, 'news');
    }
    if (S.day >= c.eta) { if (S.towns[c.to] && c.n > 0) S.towns[c.to].stock[c.good] += c.n; E.caravans.splice(E.caravans.indexOf(c), 1);
      if (c.n > 0 && DEAD_GOODS.includes(c.good) && !S.flags?.deadGoodsHint) { (S.flags ||= {}).deadGoodsHint = 1; log(`Schmuggler bringen ${c.n} ${ITEMS[c.good].name} nach ${townName(c.to)}. Totenware hat ihren Markt: Vharnholm und die Schwarze Feste geben Knochen und Seelen her und kaufen Grabgut zurück; bei den Lebenden zahlen nur Alchemisten, Apotheker und Gelehrte etwas dafür.`, 'quest'); } }
  }
  // Neue Züge: vom Überschuss zur größten Not, bis zu sechs am Tag, höchstens sechzehn unterwegs
  const T = tradeTowns(), TD = [...T, ...Object.keys(S.towns).filter(k => isDead(k) && LOC[k] && !razed(k))];   /* E40.5: Totenorte handeln nur Totenwaren */
  for (let k = 0; k < 6 && E.caravans.length < 16; k++) {
    let best = null;
    for (const g of GOODS) for (const a of (DEAD_GOODS.includes(g) ? TD : T)) {
      const ta = S.towns[a], sur = ta.stock[g] - target(ta, g) * 1.3; if (sur < 6) continue;
      for (const b of (DEAD_GOODS.includes(g) ? TD : T)) {
        if (a === b || E.caravans.some(c => c.to === b && c.good === g)) continue;
        const tb = S.towns[b], need = target(tb, g) * 0.6 - tb.stock[g]; if (need < 3) continue;
        const gain = ecoPrice(b, g, false) - ecoPrice(a, g, true);
        const score = gain * Math.min(sur, need) / tripDays(a, b);
        if (!best || score > best.score) best = { score, g, a, b, n: Math.min(20, Math.floor(sur), Math.ceil(need) + 4) };
      }
    }
    if (!best || best.score <= 0) break;
    S.towns[best.a].stock[best.g] -= best.n;
    E.caravans.push({ id: uid(), from: best.a, to: best.b, good: best.g, n: best.n, guards: ri(0, 2), eta: (S.day | 0) + tripDays(best.a, best.b) });
  }
}

// ---------------- Eigene Karawane ----------------
export const MY_CAP = 60, WAGON_COST = 250, GUARD_COST = 20;
export const cargoOf = my => Object.values(my.cargo).reduce((a, b) => a + b, 0);
export function buyWagon(town) {
  if (S.eco.my) return 'Du hast schon einen Wagen.';
  if (S.gold < WAGON_COST) return 'Zu wenig Gold.';
  S.gold -= WAGON_COST; S.eco.my = { at: town, to: null, eta: 0, cargo: {}, guards: 0, trips: 0 };
  log(`Du kaufst einen Handelswagen in ${townName(town)}.`, 'economy'); return null;
}
export function loadGood(g, n, price) {
  const my = S.eco.my, t = S.towns[my.at];
  n = Math.min(n, Math.floor(t.stock[g] || 0), MY_CAP - cargoOf(my));
  let paid = 0, got = 0;
  for (let i = 0; i < n; i++) { const c = price(g); if (S.gold < c) break; S.gold -= c; paid += c; got++; t.stock[g] -= 1; }
  if (got) my.cargo[g] = (my.cargo[g] || 0) + got;
  return { got, paid };
}
export function sellCargo(town, price) {
  const my = S.eco.my, t = S.towns[town]; let sum = 0;
  for (const [g, n] of Object.entries(my.cargo)) for (let i = 0; i < n; i++) { sum += price(g); t.stock[g] = (t.stock[g] || 0) + 1; }
  my.cargo = {}; S.gold += sum; return sum;
}
export function sendWagon(to, guards, detour = false) {
  const my = S.eco.my; if (!my || my.to || to === my.at) return 'Der Wagen ist nicht bereit.';
  const cost = guards * GUARD_COST; if (S.gold < cost) return 'Zu wenig Gold für die Wachen.';
  const days = tripDays(my.at, to) + (detour ? 1 : 0);   /* T12: Umweg +1 Tag, Banden gemieden */
  S.gold -= cost; Object.assign(my, { to, guards, detour: !!detour, eta: (S.day | 0) + days, raided: false });
  log(`Dein Wagen fährt nach ${townName(to)} (${guards} Wachen, ${days} Tage${detour ? ', auf Umwegen' : ''}).`, 'economy'); return null;
}
export const myRiskOpt = my => ({ mine: true, detour: !!my?.detour });   /* T12: Schutzgeld deckt den eigenen Wagen, Umweg meidet Banden */
function myCaravanDay() {
  const my = S.eco.my; if (!my?.to) return;
  if (!my.raided && cargoOf(my) && chance(riskOf(my.at, my.to, my.guards, myRiskOpt(my)))) {
    my.raided = true;
    if (my.guards >= 3 && chance(0.5)) log('Räuber griffen deinen Wagen an. Deine Wachen schlugen sie zurück.', 'economy');
    else {
      let lost = 0, top = null; for (const g of Object.keys(my.cargo)) { const l = Math.ceil(my.cargo[g] * (0.4 + rnd() * 0.5)); my.cargo[g] -= l; lost += l; if (!top || l > top[1]) top = [g, l]; }
      log(`Dein Wagen wurde überfallen: ${lost} Ladungen verloren.`, 'economy');
      const bd = raidBand(my.at, my.to, myRiskOpt(my)); if (bd) onBandRaid(bd, lost, top?.[0], 'deinen Wagen');   /* T12 B2 */ chronicle(`Räuber plünderten den Wagen von ${S.player?.name || 'dir'}`, 'news');
    }
  }
  if (S.day >= my.eta) {
    my.at = my.to; my.to = null; my.trips++;
    const sum = cargoOf(my) ? sellCargo(my.at, g => ecoPrice(my.at, g, false)) : 0;
    notePrices(my.at);
    log(`Dein Wagen ist in ${townName(my.at)}${sum ? ` und verkauft die Ladung für ${sum} Gold` : ''}.`, 'economy');
  }
}

// ---------------- Betriebe kaufen ----------------
export const bizPrice = (b, C) => Math.round(120 + Math.max(20, b.made) * 14 + 60 * bizWorkers(b, C));
export const upgradeCost = b => 200 * b.level;
export function buyBiz(b, C) {
  if (b.owner) return 'Der Betrieb gehört schon jemandem.';
  const c = bizPrice(b, C); if (S.gold < c) return 'Zu wenig Gold.';
  S.gold -= c; b.owner = 'player'; log(`Du kaufst: ${bizName(b)} (${c} Gold).`, 'economy'); chronicle(`${S.player?.name || 'Der Held'} kauft ${bizName(b)}`, 'news'); return null;
}
export function upgradeBiz(b) {
  if (b.owner !== 'player' || b.level >= 3) return 'Nicht möglich.';
  const c = upgradeCost(b); if (S.gold < c) return 'Zu wenig Gold.';
  S.gold -= c; b.level++; log(`${bizName(b)} ausgebaut (Stufe ${b.level}).`, 'economy'); return null;
}
// ponytail: angeworbene Hände sind gezählt, nicht als Figuren in der Welt; echte NPCs, wenn der Nutzer sie sehen will
export function hireHand(b) {
  if (b.owner !== 'player' || b.hired >= 3) return 'Nicht möglich.';
  if (S.gold < 30) return 'Zu wenig Gold (30 Handgeld).';
  S.gold -= 30; b.hired++; return null;
}

// ---------------- Lieferaufträge ----------------
function ordersDay() {
  const E = S.eco;
  for (const o of [...E.orders]) if (S.day > o.until) { E.orders.splice(E.orders.indexOf(o), 1); log(`Lieferauftrag verfallen: ${o.n} ${ITEMS[o.good].name} für ${townName(o.town)}.`, 'economy'); }
  if (E.orders.length >= 8) return;
  for (const town of tradeTowns()) {
    const t = S.towns[town];
    for (const g of GOODS) {
      if ((t.use[g] || 0) < 0.2 || t.stock[g] > target(t, g) * 0.35 || E.orders.some(o => o.town === town && o.good === g) || !chance(0.3)) continue;
      const n = clamp(Math.round(target(t, g) - t.stock[g]), 4, 15);
      E.orders.push({ id: uid(), town, good: g, n, reward: orderPay(town, g, n), until: (S.day | 0) + 7 });   /* Audit 3.2: Marktpreis der Zielstadt × 1,15 statt Wert × 1,6 (war ~3,5× mit Überschuss-Einkauf) */
      if (E.orders.length >= 8) return;
    }
  }
}
/* Audit 3.2: Lohn eines Lieferauftrags = was die Zielstadt gerade für die Ware zahlt × 1,15 (Aufschlag fürs Bringen); beim Anlegen geschätzt, bei der Abgabe neu gerechnet */
export const orderPay = (town, g, n) => Math.max(n, Math.round(ecoPrice(town, g, false) * n * 1.15));
export function deliver(o, have, take, fac = 'merch') {
  if (have < o.n) return `Du brauchst ${o.n} ${ITEMS[o.good].name} (du hast ${have}).`;
  o.reward = orderPay(o.town, o.good, o.n); take(o.good, o.n); S.gold += o.reward; S.towns[o.town].stock[o.good] += o.n;
  S.eco.orders.splice(S.eco.orders.indexOf(o), 1);
  if (S.factions[fac] != null) S.factions[fac] = clamp(S.factions[fac] + 2, -100, 100);   /* Entwickler 03.10.: Ruf bei der Macht der Zielstadt (vorher immer Händlergilde) */
  log(`Lieferung nach ${townName(o.town)}: ${o.n} ${ITEMS[o.good].name}, ${o.reward} Gold.`, 'economy'); return null;
}

// Wer in dieser Stadt den Markt hält
export function marketNpc(town) {
  let best = null, bi = 99;
  for (const e of S.ents.world) {
    if (e.kind !== 'npc' || !e.alive || e.hostile) continue;
    const i = MARKET_ORDER.indexOf(e.prof); if (i < 0 || i >= bi || townKeyOf(e) !== town) continue;
    best = e; bi = i;
  }
  return best;
}
