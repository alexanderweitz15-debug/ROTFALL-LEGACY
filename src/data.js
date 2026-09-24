// Statische Spieldaten: Items, Gegner, NPCs, Quests, Klassen, Fraktionen, Gebäude.
export const ORIGINS = {
  farmhand:  { name:'Feldknecht', desc:'Du hast mehr Erde gesehen als Gold. Deine Hände sind hart, dein Rücken hält.',
               attrs:{strength:1,endurance:2}, skills:{survival:5,crafting:4}, gear:['axe','cloth_shirt','bread'], gold:8 },
  hunter:    { name:'Jäger', desc:'Der Wald hat dich ernährt. Du weißt, wann etwas dich beobachtet.',
               attrs:{agility:2,perception:1}, skills:{archery:8,survival:6,hunting:6}, gear:['shortbow','leather_jerkin','dried_meat'], gold:12 },
  apprentice:{ name:'Lehrling', desc:'Du hast Zeichen gelernt, die andere nicht lesen. Der Meister ist tot.',
               attrs:{intelligence:2,willpower:1}, skills:{crafting:7,medicine:5}, gear:['dagger','cloth_shirt','herb','herb'], gold:22 },
  soldier:   { name:'Ehemaliger Soldat', desc:'Du hast für Valen gestanden. Du hast aufgehört, es zu erklären.',
               attrs:{strength:2,endurance:1}, skills:{onehanded:9,defense:7}, gear:['rusty_sword','wooden_shield','leather_jerkin'], gold:10, rep:{valen:10} },
  wanderer:  { name:'Wanderer', desc:'Kein Heim, kein Herr, keine Schulden. Noch nicht.',
               attrs:{agility:1,perception:1,willpower:1}, skills:{survival:4,trading:4}, gear:['rusty_sword','cloth_shirt','bread'], gold:30 },
};

export const SKILL_NAMES = { onehanded:'Einhändig', twohanded:'Zweihändig', polearms:'Stangenwaffen', archery:'Bogen', defense:'Verteidigung',
  medicine:'Medizin', survival:'Überleben', hunting:'Jagd', crafting:'Handwerk', smithing:'Schmieden', trading:'Handel', stealth:'Schleichen', leadership:'Führung' };

export const RARITY = { common:'Gewöhnlich', uncommon:'Ungewöhnlich', rare:'Selten', epic:'Episch', legendary:'Legendär' };

// wtype steuert Angriffsverhalten: reach(px), arc(rad), speed(ms), stam
export const ITEMS = {
  rusty_sword:  { name:'Rostiges Kurzschwert', slot:'weapon', wtype:'sword', dmg:7, reach:40, arc:1.5, speed:520, stam:7, rarity:'common', value:18, skill:'onehanded' },
  longsword:    { name:'Langschwert', slot:'weapon', wtype:'sword', dmg:12, reach:46, arc:1.6, speed:560, stam:9, rarity:'uncommon', value:90, skill:'onehanded' },
  greatsword:   { name:'Zweihänder', slot:'weapon', wtype:'great', dmg:22, reach:56, arc:2.5, speed:980, stam:18, rarity:'rare', value:220, skill:'twohanded', twohand:true },
  axe:          { name:'Beil', slot:'weapon', wtype:'axe', dmg:11, reach:38, arc:1.2, speed:680, stam:10, ap:0.25, rarity:'common', value:34, skill:'onehanded', tool:'chop' },
  greataxe:     { name:'Große Axt', slot:'weapon', wtype:'great', dmg:25, reach:52, arc:2.2, speed:1080, stam:20, ap:0.35, rarity:'rare', value:260, skill:'twohanded', twohand:true, tool:'chop' },
  mace:         { name:'Streitkolben', slot:'weapon', wtype:'mace', dmg:13, reach:36, arc:1.3, speed:740, stam:11, ap:0.4, stagger:1.6, rarity:'uncommon', value:110, skill:'onehanded' },
  spear:        { name:'Speer', slot:'weapon', wtype:'spear', dmg:10, reach:74, arc:0.5, speed:640, stam:8, rarity:'common', value:48, skill:'polearms' },
  dagger:       { name:'Dolch', slot:'weapon', wtype:'dagger', dmg:5, reach:26, arc:1.1, speed:300, stam:4, crit:2.6, rarity:'common', value:22, skill:'onehanded' },
  shortbow:     { name:'Kurzbogen', slot:'weapon', wtype:'bow', dmg:9, reach:360, speed:820, stam:8, rarity:'common', value:55, skill:'archery', ranged:true },
  longbow:      { name:'Langbogen', slot:'weapon', wtype:'bow', dmg:15, reach:460, speed:1080, stam:11, rarity:'rare', value:190, skill:'archery', ranged:true, twohand:true },
  pickaxe:      { name:'Spitzhacke', slot:'weapon', wtype:'axe', dmg:8, reach:34, arc:1.1, speed:760, stam:9, rarity:'common', value:26, skill:'onehanded', tool:'mine' },
  staff:        { name:'Stab', slot:'weapon', wtype:'staff', dmg:6, reach:40, arc:1.4, speed:620, stam:6, rarity:'common', value:40, skill:'unarmed', mana:12, twohand:true },

  wooden_shield:{ name:'Holzschild', slot:'offhand', block:0.30, armor:2, rarity:'common', value:28 },
  buckler:      { name:'Eisenbuckler', slot:'offhand', block:0.24, armor:1, rarity:'common', value:36 },
  kite_shield:  { name:'Normannenschild', slot:'offhand', block:0.42, armor:4, weight:2, rarity:'uncommon', value:130 },
  tower_shield: { name:'Turmschild', slot:'offhand', block:0.58, armor:6, weight:5, slow:0.22, rarity:'rare', value:280 },

  cloth_shirt:  { name:'Leinenkittel', slot:'chest', armor:1, rarity:'common', value:8 },
  leather_jerkin:{name:'Lederwams', slot:'chest', armor:4, rarity:'common', value:45 },
  chain_hauberk:{ name:'Kettenpanzer', slot:'chest', armor:9, weight:3, rarity:'uncommon', value:190 },
  plate_cuirass:{ name:'Plattenharnisch', slot:'chest', armor:15, weight:6, slow:0.12, rarity:'rare', value:460 },
  leather_cap:  { name:'Lederkappe', slot:'head', armor:2, rarity:'common', value:20 },
  iron_helm:    { name:'Eisenhelm', slot:'head', armor:5, weight:1, rarity:'uncommon', value:95 },
  leather_boots:{ name:'Lederstiefel', slot:'feet', armor:1, rarity:'common', value:16 },
  traveler_cloak:{name:'Reisemantel', slot:'cloak', armor:1, cold:1, rarity:'common', value:24 },

  bread:      { name:'Brotlaib', slot:'consumable', use:'food', heal:6, food:1, stack:9, rarity:'common', value:4 },
  dried_meat: { name:'Dörrfleisch', slot:'consumable', use:'food', heal:10, food:2, stack:9, rarity:'common', value:9 },
  herb:       { name:'Heilkraut', slot:'consumable', use:'bandage', heal:10, stack:9, rarity:'common', value:12, lore:'Als Umschlag auf eine Wunde gelegt.' },
  potion:     { name:'Trank der Genesung', slot:'consumable', use:'heal', heal:40, stack:5, rarity:'uncommon', value:55 },
  bandage:    { name:'Verband', slot:'consumable', use:'bandage', stack:10, rarity:'common', value:9, lore:'Heilt ein Körperteil und stillt Blutungen. Anlegen dauert.' },

  wood:  { name:'Bauholz', slot:'material', res:'wood', stack:99, rarity:'common', value:2 },
  stone: { name:'Bruchstein', slot:'material', res:'stone', stack:99, rarity:'common', value:2 },
  iron:  { name:'Eisenerz', slot:'material', res:'iron', stack:99, rarity:'common', value:6 },
  pelt:  { name:'Wolfsfell', slot:'material', good:true, stack:20, rarity:'common', value:14 },
  bone:  { name:'Alter Knochen', slot:'material', stack:20, rarity:'common', value:3 },
  grain: { name:'Weizensack', slot:'material', good:true, stack:20, rarity:'common', value:6 },
  salt:  { name:'Salzsack', slot:'material', good:true, stack:20, rarity:'common', value:8 },
  cloth: { name:'Tuchballen', slot:'material', good:true, stack:20, rarity:'common', value:12 },

  gorak_cleaver:{ name:'Goraks Hackmesser', slot:'weapon', wtype:'axe', dmg:18, reach:44, arc:1.5, speed:760, stam:13, ap:0.3,
                  rarity:'epic', value:340, skill:'onehanded', lore:'Aus Grubenwerkzeug geschmiedet. Das Blatt ist nie gereinigt worden.' },
  order_seal:   { name:'Siegel des Ordens', slot:'cloak', armor:2, holy:0.2, rarity:'rare', value:200, lore:'Elfenbein und altes Rot. Es wiegt mehr, als es sollte.' },
  grave_seal:   { name:'Grabsiegel', slot:'material', stack:1, rarity:'rare', value:0, lore:'Kalt, auch in der Sonne.' },
};

export const LOOT = {
  wolf:      [['pelt',0.7],['dried_meat',0.4],['bone',0.3]],
  boar:      [['dried_meat',0.8],['pelt',0.3]],
  goblin:    [['bone',0.4],['rusty_sword',0.12],['bread',0.3],['iron',0.2],['bandage',0.15]],
  goblin_warrior:[['iron',0.5],['axe',0.2],['leather_cap',0.15],['spear',0.12]],
  bandit:    [['rusty_sword',0.2],['leather_jerkin',0.15],['bread',0.4],['dagger',0.2],['bandage',0.35]],
  bandit_archer:[['shortbow',0.25],['leather_cap',0.2],['dried_meat',0.3]],
  skeleton:  [['bone',0.9],['rusty_sword',0.2],['grave_seal',0.05]],
  gorak:     [['gorak_cleaver',1],['iron',1],['iron',1],['potion',0.6]],
};

// interiors: folgt dem Spieler durch Eingänge (Grube, Dungeons). Tiere nicht — sie lauern draußen (GDD §Übergänge).
export const MONSTERS = {
  wolf:      { name:'Wolf', hp:30, dmg:7, speed:1.55, reach:26, atk:900, xp:12, sight:220, r:11, threat:1, faction:'beast', interiors:false, pal:{body:'#5b5145',dark:'#3a332b',eye:'#c8a545'} },
  boar:      { name:'Wildschwein', hp:46, dmg:11, speed:1.35, reach:26, atk:1200, xp:16, sight:170, r:13, threat:1, faction:'beast', interiors:false, pal:{body:'#4b3f34',dark:'#2f271f',eye:'#b8503a'} },
  goblin:    { name:'Goblin', hp:28, dmg:6, speed:1.35, reach:28, atk:820, xp:12, sight:210, r:10, threat:1, faction:'goblin', interiors:true, pal:{skin:'#6d7a45',cloth:'#4a3a28',metal:'#6b6156'} },
  goblin_warrior:{ name:'Goblin-Krieger', hp:54, dmg:11, speed:1.25, reach:32, atk:1000, xp:26, sight:230, r:12, threat:2, faction:'goblin', interiors:true, pal:{skin:'#5f6e3c',cloth:'#3d2f20',metal:'#8a7f6d'} },
  bandit:    { name:'Bandit', hp:48, dmg:10, speed:1.4, reach:34, atk:880, xp:22, sight:250, r:11, threat:2, faction:'bandit', interiors:true, pal:{skin:'#b2926f',cloth:'#4a3226',metal:'#7d7364'} },
  bandit_archer:{ name:'Banditenschütze', hp:36, dmg:9, speed:1.35, reach:300, atk:1500, ranged:true, xp:24, sight:320, r:11, threat:2, faction:'bandit', interiors:true, pal:{skin:'#b2926f',cloth:'#3f4a2e',metal:'#7d7364'} },
  skeleton:  { name:'Untoter Krieger', hp:44, dmg:10, speed:1.15, reach:32, atk:1000, telegraph:380, xp:28, sight:240, r:11, threat:2, faction:'undead', interiors:true, pal:{skin:'#cfc8b4',cloth:'#22252a',metal:'#3f4b46',glow:'#4e8f7a'} },
  valen_soldier:{ name:'Soldat Valens', hp:52, dmg:10, speed:1.3, reach:44, atk:950, xp:0, sight:260, r:11, threat:2, faction:'valen', interiors:true, pal:{skin:'#c9a582',cloth:'#2f4260',metal:'#9aa3b0'} },
  gorak:     { name:'Gorak, Grubenwart', hp:240, dmg:24, speed:1.0, reach:52, atk:2000, telegraph:800, xp:180, sight:300, r:20, boss:true, threat:4, faction:'goblin', interiors:false, pal:{skin:'#556b34',cloth:'#33261a',metal:'#9a8e78'} },
};

// Klassenbaum: parent = Voraussetzung
export const CLASSES = {
  wanderer:  { name:'Wanderer', tier:0 },
  warrior:   { name:'Krieger', tier:1, parent:'wanderer', abilities:['power_strike'], desc:'Stahl und Standhaftigkeit.' },
  archer:    { name:'Schütze', tier:1, parent:'wanderer', abilities:['aimed_shot'], desc:'Abstand ist eine Waffe.' },
  rogue:     { name:'Schurke', tier:1, parent:'wanderer', abilities:['backstab'], desc:'Der erste Schlag zählt doppelt.' },
  cleric:    { name:'Kleriker', tier:1, parent:'wanderer', abilities:['holy_heal'], desc:'Licht als Handwerk.' },
  mage:      { name:'Magier', tier:1, parent:'wanderer', abilities:['fireball'], desc:'Feuer gehorcht, kurz.' },
  knight:    { name:'Ritter', tier:2, parent:'warrior', abilities:['power_strike','blessing'], desc:'Ein Eid mit Rüstung.' },
  paladin:   { name:'Paladin', tier:3, parent:'knight', abilities:['holy_strike','blessing','holy_heal'], faction:'order',
               desc:'Ein Schwert macht dich nicht zum Ritter. Was du beschützt, tut es.' },
  warlock:   { name:'Hexenmeister', tier:2, parent:'mage', abilities:['shadow_bolt','life_drain'], desc:'Verbotene Wege, verlässliche Kosten.' },
  ranger:    { name:'Waldläufer', tier:2, parent:'archer', abilities:['aimed_shot','mark_target'], desc:'Der Wald ist eine Karte, die nur du liest.' },
  deathknight:{name:'Todesritter', tier:3, parent:'warrior', abilities:['life_drain','power_strike'], faction:'undead', desc:'Treue über den Tod hinaus.' },
};

export const ABILITIES = {
  power_strike:{ name:'Wuchtschlag', cd:6000, stam:22, icon:'strike', desc:'Doppelter Waffenschaden, kurze Betäubung.' },
  aimed_shot:  { name:'Gezielter Schuss', cd:7000, stam:18, icon:'arrow', desc:'Weit reichender Schuss, hoher kritischer Anteil.' },
  backstab:    { name:'Meuchelstich', cd:8000, stam:20, icon:'dagger', desc:'Dreifacher Schaden von hinten.' },
  holy_heal:   { name:'Heiliges Heilen', cd:9000, mana:18, icon:'heal', desc:'Heilt dich oder den nächsten Gefährten.' },
  fireball:    { name:'Feuerball', cd:5000, mana:16, icon:'fire', desc:'Fliegendes Feuer, Flächenschaden beim Einschlag.' },
  shadow_bolt: { name:'Schattenblitz', cd:4000, mana:14, icon:'shadow', desc:'Schattenschaden auf Distanz.' },
  life_drain:  { name:'Lebensentzug', cd:11000, mana:20, icon:'drain', desc:'Schaden, der dich heilt.' },
  holy_strike: { name:'Heiliger Schlag', cd:7000, mana:14, icon:'holy', desc:'Schwerer Schaden gegen Untote und Verfluchte.' },
  blessing:    { name:'Segen', cd:20000, mana:16, icon:'bless', desc:'Rüstung der Gruppe steigt für 20 Sekunden.' },
  mark_target: { name:'Ziel markieren', cd:12000, stam:10, icon:'mark', desc:'Markiertes Ziel nimmt 25% mehr Schaden.' },
};

export const FACTIONS = {
  valen: { name:'Königreich Valen', colors:['#2f4260','#b9c3d2'], desc:'Ordnung, Steuern, Garnisonen. Was davon übrig ist.',
           ranks:['Rekrut','Soldat','Veteran','Ritter','Offizier'] },
  order: { name:'Der Orden', colors:['#d9d2c0','#9b2e26'], desc:'Elfenbein und Eisen gegen das, was nicht sterben will.',
           ranks:['Novize','Akolyth','Wächter','Ritter','Paladin','Meister'] },
  undead:{ name:'Die Untoten', colors:['#1d2422','#4e8f7a'], desc:'Eine Zivilisation, keine Monsterschar. Sie haben Städte und Geduld.',
           ranks:['Diener','Adept','Grabgebundener','Todesritter','Kommandant'] },
  merch: { name:'Freie Händler', colors:['#3c3324','#bd9433'], desc:'Wo Krieg ist, ist Nachfrage.' , ranks:['Kunde','Partner','Teilhaber']},
  bandit:{ name:'Rooks Bande', colors:['#2a231a','#8c3b2a'], desc:'Kein Banner, keine Steuern, kurze Leben.', ranks:['Handlanger','Klinge','Hauptmann'] },
};

export const NPCS = [
  { key:'havel', name:'Havel', prof:'Dorfvorsteher', faction:'valen', age:54, home:'village', x:0, y:0,
    traits:['diszipliniert','vorsichtig'], attrs:{intelligence:11,willpower:10}, cls:'wanderer', recruit:false,
    greet:'„Fremde bringen entweder Arbeit oder Ärger. Welches von beidem bist du?“' },
  { key:'elena', name:'Elena', prof:'Heilerin', faction:'order', age:27, home:'village',
    traits:['gütig','loyal','vorsichtig'], attrs:{intelligence:12,agility:8}, cls:'cleric', recruit:true, recruitRel:25,
    greet:'„Du siehst nicht aus wie jemand, der viel Gold besitzt.“', teaches:'cleric' },
  { key:'tomas', name:'Tomas', prof:'Jägerbursche', faction:null, age:18, home:'village',
    traits:['ehrgeizig','neugierig'], attrs:{agility:12,perception:11}, cls:'archer', recruit:true, recruitRel:15,
    greet:'„Ich treffe alles unter dreißig Schritt. Fast alles.“', teaches:'archer', kin:'son' },
  { key:'borin', name:'Borin', prof:'Ehemaliger Söldner', faction:null, age:42, home:'tavern',
    traits:['diszipliniert','misstrauisch'], attrs:{strength:14,endurance:13}, cls:'warrior', recruit:true, recruitRel:35,
    greet:'„Ich arbeite für Leute, die wissen, wohin sie gehen. Weißt du es?“', teaches:'warrior' },
  { key:'mara', name:'Mara', prof:'Händlerin', faction:'merch', age:36, home:'market',
    traits:['klug','praktisch'], attrs:{intelligence:12,perception:10}, cls:'wanderer', recruit:false,
    greet:'„Kaufen, verkaufen, oder im Weg stehen. Such dir eins aus.“', shop:true, town:'eren' },
  { key:'gerold', name:'Gerold', prof:'Kontorhändler', faction:'merch', age:51, home:'northcity',
    traits:['gierig','praktisch'], attrs:{intelligence:12}, cls:'wanderer', recruit:false,
    greet:'„Nordfurt zahlt für Weizen. Eren zahlt für Salz. Der Rest ist Straße.“', shop:true, town:'northcity' },
  { key:'aldric', name:'Aldric', prof:'Schmied', faction:null, age:48, home:'smithy',
    traits:['diszipliniert','mürrisch'], attrs:{strength:12,crafting:14}, cls:'warrior', recruit:false,
    greet:'„Bring mir Eisen, dann reden wir über Stahl.“', smith:true },
  { key:'jorun', name:'Jorun', prof:'Bauer', faction:null, age:45, home:'farm',
    traits:['furchtsam','gütig'], attrs:{endurance:11}, cls:'wanderer', recruit:false,
    greet:'„Bitte. Meine Tochter ist seit zwei Tagen fort.“' },
  { key:'kelan', name:'Kelan der Graue', prof:'Alter Paladin', faction:'order', age:61, home:'shrine',
    traits:['diszipliniert','gütig'], attrs:{strength:13,willpower:15}, cls:'paladin', recruit:false,
    greet:'„Ein Schwert macht dich nicht zum Ritter. Was du beschützt, tut es.“', teaches:'paladin' },
  { key:'rook', name:'Rook', prof:'Bandenführer', faction:'bandit', age:38, home:'banditcamp',
    traits:['grausam','ehrgeizig'], attrs:{strength:13,agility:12}, cls:'rogue', recruit:true, recruitRel:60, hostile:true,
    greet:'„Du bist weit von der Straße abgekommen.“', teaches:'rogue' },
  { key:'morvath', name:'Morvath', prof:'Grabgebundener', faction:'undead', age:0, home:'graveyard',
    traits:['geduldig','kalt'], attrs:{intelligence:14,willpower:14}, cls:'warlock', recruit:false, undead:true,
    greet:'„Die Lebenden sind laut. Du bist leiser als die meisten.“', teaches:'warlock' },
  { key:'lila', name:'Lila', prof:'Jorans Tochter', faction:null, age:17, home:'banditcamp',
    traits:['neugierig','ehrgeizig'], attrs:{agility:11}, cls:'wanderer', recruit:true, recruitRel:20, kin:'daughter',
    greet:'„Bitte sag ihm nicht, wo ich bin.“' },
];

export const BUILDINGS = {
  campfire:  { name:'Lagerfeuer', cat:'Grundlage', cost:{wood:5}, time:6, w:1, h:1, desc:'Rasten, kochen, heilen. Der Anfang jeder Siedlung.', pop:0 },
  tent:      { name:'Zelt', cat:'Unterkunft', cost:{wood:8}, time:10, w:2, h:2, desc:'Schlafplatz für zwei. Hält kaum Regen ab.', pop:2 },
  hut:       { name:'Hütte', cat:'Unterkunft', cost:{wood:20,stone:8}, time:22, w:3, h:3, desc:'Festes Dach. Zieht Siedler an.', pop:4 },
  storage:   { name:'Lager', cat:'Produktion', cost:{wood:14}, time:14, w:2, h:2, desc:'Gemeinsamer Vorrat der Siedlung.', pop:0 },
  workbench: { name:'Werkbank', cat:'Produktion', cost:{wood:12,stone:4}, time:12, w:2, h:1, desc:'Einfaches Handwerk und Reparatur.', pop:0 },
  smithy:    { name:'Schmiede', cat:'Produktion', cost:{wood:20,stone:15,iron:10}, time:30, w:3, h:2, desc:'Waffen aus Eisen, Reparatur ohne Meister.', pop:0 },
  farm:      { name:'Ackerfläche', cat:'Versorgung', cost:{wood:10}, time:16, w:3, h:3, desc:'Erzeugt täglich Nahrung.', pop:0 },
  well:      { name:'Brunnen', cat:'Versorgung', cost:{stone:18}, time:18, w:1, h:1, desc:'Moral der Siedlung steigt.', pop:0 },
  palisade:  { name:'Palisade', cat:'Verteidigung', cost:{wood:6}, time:5, w:1, h:1, desc:'Ein Abschnitt Wehrzaun. Blockiert Bewegung.', pop:0 },
  gate:      { name:'Tor', cat:'Verteidigung', cost:{wood:12,iron:4}, time:12, w:2, h:1, desc:'Durchlass in der Palisade.', pop:0 },
  watchtower:{ name:'Wachturm', cat:'Verteidigung', cost:{wood:24,stone:12}, time:26, w:2, h:2, desc:'Warnt früher vor Angriffen.', pop:0 },
};

export const QUESTS = {
  q_wolves: { name:'Wölfe an der Hürde', giver:'havel', desc:'Havel zahlt für drei tote Wölfe am Waldrand.',
    objectives:[{type:'kill',target:'wolf',count:3,text:'Wölfe töten'}],
    reward:{gold:60,rep:{valen:5},xp:40}, turnin:'havel' },
  q_herbs: { name:'Elenas Kräuter', giver:'elena', desc:'Elena braucht drei Heilkräuter für einen Fiebernden.',
    objectives:[{type:'item',target:'herb',count:3,text:'Heilkraut sammeln'}],
    reward:{gold:15,rep:{order:6},xp:30,rel:{elena:20}}, turnin:'elena' },
  q_lila: { name:'Die vermisste Tochter', giver:'jorun', desc:'Joruns Tochter Lila ist seit zwei Tagen fort.',
    objectives:[{type:'find',target:'lila',text:'Lila finden'}],
    reward:{xp:60}, turnin:'jorun', branching:true },
  q_mine: { name:'Was in der Grube haust', giver:'mara', desc:'Die alte Grube ist verloren, seit etwas Großes darin wohnt.',
    objectives:[{type:'kill',target:'gorak',count:1,text:'Gorak töten'}],
    reward:{gold:140,rep:{merch:10,valen:4},xp:150}, turnin:'mara' },
  q_paladin1:{ name:'Prüfung: Wachsamkeit', giver:'kelan', desc:'Kelan verlangt Beweise, nicht Absichten. Tote Untote zählen als Beweis.',
    objectives:[{type:'kill',target:'skeleton',count:4,text:'Untote vernichten'}],
    reward:{xp:80,rep:{order:10}}, turnin:'kelan' },
  q_paladin2:{ name:'Prüfung: Das Siegel', giver:'kelan', desc:'Ein Ordenssiegel blieb in der Grube zurück. Hol es.',
    objectives:[{type:'item',target:'order_seal',count:1,text:'Siegel des Ordens bergen'}],
    reward:{xp:110,rep:{order:12}}, turnin:'kelan' },
  q_paladin3:{ name:'Prüfung: Der Schrein', giver:'kelan', desc:'Halte den Schrein, bis die Toten aufhören zu kommen.',
    objectives:[{type:'hold',target:'shrine',count:1,text:'Den Schrein halten'}],
    reward:{xp:200,rep:{order:20},unlock:'paladin'}, turnin:'kelan' },
  q_undead: { name:'Das Grabsiegel', giver:'morvath', desc:'Morvath will ein Siegel aus dem Moor. Was danach kommt, sagt er nicht.',
    objectives:[{type:'item',target:'grave_seal',count:1,text:'Grabsiegel bergen'}],
    reward:{xp:120,rep:{undead:25,order:-15},unlock:'warlock'}, turnin:'morvath' },
  q_rook: { name:'Rooks Angebot', giver:'rook', desc:'Rook will die Straße nach Norden unsicher machen. Er braucht Klingen.',
    objectives:[{type:'kill',target:'bandit_rival',count:2,text:'Rooks Rivalen töten'}],
    reward:{gold:120,rep:{bandit:25,valen:-20},xp:90}, turnin:'rook' },
};

export const MEMORY_TEXT = {
  saved_life:'hat mir das Leben gerettet', gave_weapon:'hat mir meine erste Waffe gegeben',
  recruited:'hat mich aufgenommen', fought_together:'hat neben mir gekämpft',
  friend_died:'war dabei, als ein Freund starb', starved:'hat mich hungern lassen',
  paid:'hat gezahlt, was versprochen war', led_to_victory:'hat uns zum Sieg geführt',
  left_to_die:'hat mich liegen lassen', killed_kin:'hat einen der Meinen getötet',
};

// ---- Phase 18–20: Städte, Märkte, Krieg ----
// prod/use pro Tag. Preis steigt, wenn der Vorrat unter den Bedarf fällt.
export const GOODS = ['grain', 'salt', 'cloth', 'pelt'];
export const TOWNS = {
  eren:      { name:'Eren', pop:40, stock:{ grain:40, salt:6, cloth:5, pelt:8 }, prod:{ grain:7, pelt:2 }, use:{ grain:3, salt:2, cloth:1 } },
  northcity: { name:'Nordfurt', pop:90, stock:{ grain:12, salt:30, cloth:25, pelt:3 }, prod:{ salt:5, cloth:4 }, use:{ grain:8, pelt:2, salt:1 } },
};
// Kriegsknoten = Orte aus world.LOCATIONS. garrison = Verteidiger ohne Heer.
export const WAR_NODES = {
  graveyard: { owner:'undead', garrison:10 }, marsh: { owner:null, garrison:0 }, fortress: { owner:null, garrison:0 },
  ruins: { owner:null, garrison:0 }, eren: { owner:'valen', garrison:14 }, road: { owner:'valen', garrison:4 },
  northcity: { owner:'valen', garrison:40 },
  // Südost-Front: das Totenreich gegen Ostmark und Mittelland
  blackkeep: { owner:'undead', garrison:40 }, necropolis: { owner:'undead', garrison:22 },
  altvharn: { owner:'undead', garrison:16 }, sonnwacht: { owner:'order', garrison:20 },
  kreuzweg: { owner:null, garrison:0 }, ashford: { owner:'valen', garrison:8 },
  saltport: { owner:'valen', garrison:14 }, oldbridge: { owner:null, garrison:0 },
};
export const WAR_EDGES = [['graveyard','marsh'], ['graveyard','fortress'], ['marsh','eren'], ['fortress','eren'],
  ['fortress','ruins'], ['ruins','eren'], ['eren','road'], ['road','northcity'],
  // Süd-/Ostfront
  ['blackkeep','necropolis'], ['necropolis','altvharn'], ['altvharn','sonnwacht'], ['altvharn','oldbridge'],
  ['sonnwacht','ashford'], ['ashford','northcity'], ['kreuzweg','oldbridge'], ['kreuzweg','ashford'],
  ['kreuzweg','eren'], ['oldbridge','saltport'], ['oldbridge','eren']];
