// Wirtschaft (S13, Nutzer: "Tief"): Betriebe mit echten Arbeitern, Lager, Produktionsketten, Preise nach Angebot und
// Nachfrage je Stadt, Händlerzüge mit Zweck, Überfälle und Zerstörung wirken auf das Angebot. Dazu die Spielerseite:
// Handel in jeder Stadt, eigene Karawane, Betriebe kaufen und ausbauen, Lieferaufträge.
// Läuft einmal am Tag (ecoDay). Arbeiter sind die NPCs der Welt: wer tot, am Boden oder in der Gruppe des Helden ist, arbeitet nicht.
import { S, log, chronicle, chance, ri, clamp, uid, seasonOf, SEASON_FARM } from './state.js?v=15';
import { ITEMS, GOODS, TOWNS } from './data.js?v=15';
import { LOCATIONS, HOUSES, TS, TOWN_PLAN } from './world.js?v=15';

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
  for (const l of TOWN_LOCS) C[l.key] = { heads: 0, noble: 0, soldier: 0, work: {} };
  for (const e of S.ents.world) {
    if (e.kind !== 'npc' || !e.alive || /Automat/.test(e.prof || '') && !tradeOf(e, null)) continue;
    const k = townKeyOf(e); if (!k || !C[k]) continue;
    const c = C[k]; c.heads++;
    if (NOBLE.test(e.prof || '')) c.noble++;
    if (SOLDIER.test(e.prof || '')) c.soldier++;
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
  return u;
}
export const target = (t, g) => (t.use[g] || 0) * 6 + 4;
export const capOf = town => Math.min(400, 60 + 40 * siteCount(town, ['store', 'markethall', 'kontor']));

// ---------------- Start / Altstände ----------------
export function initEco() {
  S.towns ||= structuredClone(TOWNS);
  S.eco ||= { biz: [], caravans: [], orders: [], my: null, income: 0 };
  const C = census();
  for (const l of TOWN_LOCS) {
    const t = (S.towns[l.key] ||= { name: l.name, pop: Math.max(8, C[l.key].heads * 2), stock: {}, prod: {}, use: {} });
    t.use = useOf(l.key, C[l.key]);
    for (const g of GOODS) if (t.stock[g] == null) t.stock[g] = Math.round(target(t, g) * 0.8);
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
  if (isAurel(town)) f *= 1.15;
  if (occupied(town)) f *= 1.5;
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

// ---------------- Tageslauf ----------------
export function ecoDay() {
  if (!S.eco) initEco();
  const C = census(); syncBiz(C);
  let income = 0;
  for (const [town, t] of Object.entries(S.towns)) {
    if (!C[town]) continue;
    t.use = useOf(town, C[town]); t.prod = {};
    const food = FOOD.reduce((n, g) => n + (t.stock[g] || 0), 0);
    t.hunger = food < 1;
    if (occupied(town) || razed(town)) continue;
    // Umland: Aurelion bezieht Nahrung per Luftschiff aus dem Süden (außerhalb der Karte)
    if (isAurel(town)) { for (const g of FOOD) t.stock[g] += t.use[g] * 0.9; t.stock.ingot += 0.4 * ((C[town].work.mech || 0) + (C[town].work.magitech || 0)); }   // dazu Barren für die Werkstätten
    herdDay(town, t);
  }
  // Produktion mit Vorprodukten
  for (const b of S.eco.biz) {
    const t = S.towns[b.town], T = TRADES[b.trade];
    if (!t || occupied(b.town) || razed(b.town) || (S.halt?.[b.town + ':' + b.trade] || 0) > S.day) { b.made = 0; continue; }   // S14: Unfall legt still
    const e = bizWorkers(b, C) * (1 + 0.5 * (b.level - 1)) * (t.hunger ? 0.5 : 1) * (b.trade === 'farm' ? SEASON_FARM[seasonOf()] : 1);   // S14: Ernte nach Jahreszeit
    if (e <= 0) { b.made = 0; continue; }
    let frac = 1;
    for (const [g, n] of Object.entries(T.in || {})) frac = Math.min(frac, (t.stock[g] || 0) / (n * e));
    for (const [g, n] of Object.entries(T.in || {})) t.stock[g] -= n * e * frac;
    let val = 0;
    for (const [g, n] of Object.entries(T.out)) { const q = n * e * frac; t.stock[g] = (t.stock[g] || 0) + q; t.prod[g] = (t.prod[g] || 0) + q; val += q * ecoPrice(b.town, g, false); }
    b.made = Math.round(val);
    if (b.owner === 'player') { const pr = Math.round(val * 0.35 - b.hired * 3); income += pr; }
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
  if (income) { S.gold += Math.max(0, income); S.eco.income = income; log(`Deine Betriebe: ${income >= 0 ? '+' : ''}${income} Gold heute.`, 'economy'); }
  caravanDay(); myCaravanDay(); ordersDay();
}

// ---------------- Händlerzüge (abstrakt, fern vom Helden) ----------------
const tradeTowns = () => Object.keys(S.towns).filter(k => LOC[k] && !occupied(k) && !razed(k) && LOC[k].faction !== 'undead');
const tripDays = (a, b) => Math.max(1, Math.ceil(Math.hypot(LOC[a].x - LOC[b].x, LOC[a].y - LOC[b].y) / 260));
export function riskOf(a, b, guards) {
  let r = 0.06;
  for (const k of [a, b]) if (S.war?.armies?.some(x => x.faction === 'undead' && x.at === k)) r += 0.12;
  if ([a, b].includes('karak_atar')) r += 0.05;
  if (S.laws?.toll) r -= 0.02;
  return clamp(r * (1 - 0.22 * guards), 0.01, 0.5);
}
function caravanDay() {
  const E = S.eco;
  for (const c of [...E.caravans]) {
    if (!c.raided && chance(riskOf(c.from, c.to, c.guards))) {
      c.raided = true; const lost = Math.ceil(c.n * (0.5 + Math.random() * 0.5)); c.n -= lost;
      log(`Räuber überfielen einen Händlerzug nach ${townName(c.to)}: ${lost} ${ITEMS[c.good].name} verloren.`, 'economy');
      if (chance(0.3)) chronicle(`Ein Händlerzug nach ${townName(c.to)} wurde überfallen`, 'news');
    }
    if (S.day >= c.eta) { if (S.towns[c.to] && c.n > 0) S.towns[c.to].stock[c.good] += c.n; E.caravans.splice(E.caravans.indexOf(c), 1); }
  }
  // Neue Züge: vom Überschuss zur größten Not, bis zu sechs am Tag, höchstens sechzehn unterwegs
  const T = tradeTowns();
  for (let k = 0; k < 6 && E.caravans.length < 16; k++) {
    let best = null;
    for (const g of GOODS) for (const a of T) {
      const ta = S.towns[a], sur = ta.stock[g] - target(ta, g) * 1.3; if (sur < 6) continue;
      for (const b of T) {
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
export function sendWagon(to, guards) {
  const my = S.eco.my; if (!my || my.to || to === my.at) return 'Der Wagen ist nicht bereit.';
  const cost = guards * GUARD_COST; if (S.gold < cost) return 'Zu wenig Gold für die Wachen.';
  S.gold -= cost; Object.assign(my, { to, guards, eta: (S.day | 0) + tripDays(my.at, to), raided: false });
  log(`Dein Wagen fährt nach ${townName(to)} (${guards} Wachen, ${tripDays(my.at, to)} Tage).`, 'economy'); return null;
}
function myCaravanDay() {
  const my = S.eco.my; if (!my?.to) return;
  if (!my.raided && cargoOf(my) && chance(riskOf(my.at, my.to, my.guards))) {
    my.raided = true;
    if (my.guards >= 3 && chance(0.5)) log('Räuber griffen deinen Wagen an. Deine Wachen schlugen sie zurück.', 'economy');
    else {
      let lost = 0; for (const g of Object.keys(my.cargo)) { const l = Math.ceil(my.cargo[g] * (0.4 + Math.random() * 0.5)); my.cargo[g] -= l; lost += l; }
      log(`Dein Wagen wurde überfallen: ${lost} Ladungen verloren.`, 'economy'); chronicle(`Räuber plünderten den Wagen von ${S.player?.name || 'dir'}`, 'news');
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
      E.orders.push({ id: uid(), town, good: g, n, reward: Math.round(ITEMS[g].value * n * 1.6), until: (S.day | 0) + 7 });
      if (E.orders.length >= 8) return;
    }
  }
}
export function deliver(o, have, take) {
  if (have < o.n) return `Du brauchst ${o.n} ${ITEMS[o.good].name} (du hast ${have}).`;
  take(o.good, o.n); S.gold += o.reward; S.towns[o.town].stock[o.good] += o.n;
  S.eco.orders.splice(S.eco.orders.indexOf(o), 1);
  S.factions.merch = clamp((S.factions.merch || 0) + 2, -100, 100);
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
