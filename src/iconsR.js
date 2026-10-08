// S14 Stil R: handgezeichnete 16×16-Symbole für Verbrauchsgüter und Material (Nutzer: „restliche Sprites“).
// Zeichen → Farbe je Symbol; '.' leer, 'o' Kontur. Waffen und Rüstung kommen weiter aus den echten Sprites (render.js iconR).
const O = '#1c1512';
/* Fischen (08.10.2026): ein Fischumriss, je Art eigene Farben (B Rücken, b Bauch, w Auge, T Schwanz) */
const FISH_ROWS = ['................', '................', '................', '................', '.....oooooo...oo', '...ooBBBBBBo.oTo',
  '..oBBBBBBBBBooTo', '.oBwoBBBBBBBBTTo', 'oBBBBBBBBBBBBTTo', 'obbbbbbbbbbbbTTo', '.obbbbbbbbbbooTo', '..oobbbbbbbo.oTo',
  '....ooooooo...oo', '................', '................', '................'];
const fishIcon = (B, b, T) => [{ B, b, T, w: '#f0ece0' }, FISH_ROWS];
export const ICON_R = {
  forelle: fishIcon('#6a7a5a', '#d8c8a8', '#4a5a3e'), lachs: fishIcon('#7a8a98', '#e0a088', '#5a6a78'), hecht: fishIcon('#4a6a3a', '#c8c890', '#2e4a26'),
  karpfen: fishIcon('#8a7a3a', '#d8c070', '#6a5a2a'), barsch: fishIcon('#5a7a4a', '#d8b878', '#c06a3a'), wels: fishIcon('#4a4440', '#9a9080', '#2e2a26'),
  hering: fishIcon('#6a8aa0', '#e8eef0', '#4a6a80'), kabeljau: fishIcon('#8a8a70', '#e0dccc', '#6a6a56'), rotbarsch: fishIcon('#b84a3a', '#e8a088', '#8a2e22'),
  schlammbeisser: fishIcon('#5a4a32', '#9a8a60', '#3e3222'), giftbarbe: fishIcon('#5a7a3a', '#c8d060', '#7a3a7a'), moorhecht: fishIcon('#3a4a32', '#8a9a6a', '#22301e'),
  any_fish: fishIcon('#7a7a7a', '#c8c8c8', '#5a5a5a'),
  angel: [{ s: '#8a5a2a', l: '#d8d0c0', h: '#9aa0a8' }, ['..............oo', '.............oso', '............oso.', '...........oso..', '..........oso.l.', '.........oso..l.',
    '........oso...l.', '.......oso....l.', '......oso.....l.', '.....oso......l.', '....oso.......l.', '...oso........l.', '..oso.........h.', '.oso.........hh.', 'oso.............', 'oo..............']],
  fischsuppe: [{ f: '#d8d8d0', s: '#c8a060', S: '#a8783a', B: '#6a4a2a' }, ['................', '................', '....f...f.......', '.....f...f......', '....f...f.......', '..oooooooooooo..',
    '.osssssssssssso.', '.oSSSsSSSsSSSSo.', '..oBBBBBBBBBBo..', '...oBBBBBBBBo...', '....oooooooo....', '................', '................', '................', '................', '................']],
  potion: [{ c: '#8a6a42', g: '#a9c4bc', w: '#eef4ee', r: '#b8322a', R: '#e0685a', d: '#7a1c18' }, [
    '................', '......oooo......', '.....occcco.....', '......oggo......', '......oggo......', '.....oggggo.....',
    '....oggwgggo....', '...ogrrrrrrgo...', '...orRrrrrrro...', '..orRrrrrrrrro..', '..orRrrrrrrrro..', '..orrrrrrrrdro..',
    '..orrrrrrrddro..', '...orrrrrddro...', '....oddddddo....', '.....oooooo.....']],
  soul_vial: [{ c: '#4a4450', g: '#8aa0a8', w: '#e8fff8', r: '#5ad0b0', R: '#b8fff0', d: '#2a7a6a' }, [
    '................', '......oooo......', '.....occcco.....', '......oggo......', '......oggo......', '.....oggggo.....',
    '....oggwgggo....', '...ogrrRrrrgo...', '...orRRrrRrro...', '..orrRrrrRrrro..', '..orRrrRrrrRro..', '..orrrRrrrrdro..',
    '..orrrrrRrddro..', '...orrrrrddro...', '....oddddddo....', '.....oooooo.....']],
  herb: [{ L: '#6aa04a', l: '#3e7a32', d: '#2a5222', s: '#8a6a3a' }, [
    '................', '.......oo.......', '......oLLo......', '..oo..oLlo..oo..', '.oLLo.oLlo.oLLo.', '.oLlLooLlooLlLo.',
    '..oLlLoLloLlLo..', '...oLlLLlLlLo...', '....ooLlLloo....', '.......oso......', '..oo...oso...oo.', '.oLLo..oso..oLLo',
    '..oLloooso.oLlo.', '...oolLsLlloo...', '.....oosoo......', '.......oo.......']],
  bread: [{ b: '#c08a48', B: '#e0b070', d: '#8a5a2a', c: '#f0d8a0' }, [
    '................', '................', '................', '.....oooooo.....', '...ooBBBBBBoo...', '..oBBcBBBcBBBo..',
    '.oBBBBcBBBcBBBo.', '.oBbBBBcBBBcBbo.', 'obbBbBBBcBBBbbbo', 'obbbbbBBBBbbbbdo', 'odbbbbbbbbbbbddo', '.oddbbbbbbbbddo.',
    '..oodddddddddo..', '....oooooooo....', '................', '................']],
  dried_meat: [{ m: '#8a3a2a', M: '#b85a44', f: '#e0c0a0', d: '#5a2018' }, [
    '................', '................', '....ooo.........', '...oMMMoo.......', '..oMMmMMMoo.....', '..oMmmfmMMMoo...',
    '...omMmmfmMMMo..', '...oommMmmfmMMo.', '.....oommMmmfmo.', '.......oommmmdo.', '.........oomddo.', '...........ooo..',
    '................', '................', '................', '................']],
  bandage: [{ w: '#e8e0cc', W: '#fffaf0', s: '#b8ac90', r: '#a83a2a' }, [
    '................', '................', '.....oooooo.....', '....oWWWWWWo....', '...oWwwwwwwWo...', '..oWwsssssswWo..',
    '..oWwsooooswWo..', '..oWwso..oswWo..', '..oWwso..oswWo..', '..oWwsooooswWo..', '..oWwsssssswWo..', '...oWwwwwwwWoooo',
    '....oWWWWWWowwWo', '.....oooooo.orro', '.............oo.', '................']],
  iron: [{ s: '#6a6660', S: '#8a857c', d: '#44403a', r: '#9a5a3a', R: '#c07a4a' }, [
    '................', '................', '......ooo.......', '....ooSSSoo.....', '...oSSsSrSSo....', '..oSsRssssSso...',
    '..oSssssRsssoo..', '.oSsrssssssSSo..', '.osssssRsssssso.', '.ossRsssssrssso.', '.odssssssssssdo.', '..oddsssRssddo..',
    '...ooddddddoo...', '.....oooooo.....', '................', '................']],
  pelt: [{ p: '#8a7050', P: '#a88a64', d: '#5a4632', l: '#c8b08a' }, [
    '................', '..oo........oo..', '.oPPo......oPPo.', '.oPpPooooooPpPo.', '..oPpPPPPPPpPo..', '...oPpPPlPPpPo..',
    '...oPPPlPlPPPo..', '..oPPpPPlPPpPPo.', '.oPPppPPPPPppPPo', '.oPpppPPPPPpppPo', '..oppPPPPPPPppo.', '...ooPPPPPPPoo..',
    '....oPpPddPpPo..', '...oPpo.oo.opPo.', '...ooo......ooo.', '................']],
  bone: [{ b: '#d8d0bc', B: '#f4eee0', d: '#a89c84' }, [
    '................', '................', '..oo........oo..', '.oBBo......oBBo.', '.oBbBo....oBbBo.', '..oBbBooooBbBo..',
    '...obBBBBBBbo...', '....obbbbbbo....', '....obbbbbbo....', '...obddddddbo...', '..oBbdoooodbBo..', '.oBbdo....odbBo.',
    '.oBdo......odBo.', '..oo........oo..', '................', '................']],
  dietrich: [{ m: '#8a8680', M: '#c8c4bc', d: '#4a4640', r: '#a0302a' }, [
    '................', '.....oooo.......', '....oMMMMo......', '...oMmoomMo.....', '...oMo..oMo.....', '...oMmoomMo.....',
    '....oMMMMo......', '.....oMmo.......', '.....oMmo.......', '.....oMmo.......', '.....oMmoooo....', '.....oMmMMMo....',
    '.....oMmoooo....', '.....oMmo.......', '.....oddo.......', '......oo........']],
  ingot: [{ s: '#8a8a90', S: '#c0c0c8', W: '#e8e8f0', d: '#5a5a62' }, [
    '................', '................', '................', '................', '......oooooo....', '....ooSWWWWSoo..',
    '...oSSSSSSSSSSo.', '..oSSSSSSSSSSdo.', '.oSSSSSSSSSSddo.', '.osssssssssddo..', '.osssssssssdo...', '.odddddddddoo...',
    '..ooooooooooo...', '................', '................', '................']],
  grain: [{ s: '#c8a868', S: '#e0c888', d: '#8a6a3a', g: '#d8b04a', G: '#f0d070' }, [
    '................', '.......oGo......', '......oGgGo.....', '.......ogo......', '.....oosSsoo....', '....oSSSSSSSo...',
    '...oSSsSSSsSSo..', '...oSSSSSSSSSo..', '..oSsSSSSSSSsSo.', '..oSSSSsSSSSSSo.', '..oSSSSSSSsSSdo.', '..odSSsSSSSSddo.',
    '...oddSSSSSddo..', '....ooddddoo....', '......oooo......', '................']],
};
/* Sammeln, Werkzeuge und Kochen (08.10.2026): neue Symbole, meist umgefärbte vorhandene Umrisse; Stamm und Schriftrolle neu gezeichnet */
const LOG_ROWS = ['................', '................', '................', '................', '..oooooooooooo..', '.obbbbbbbbbbbbro',
  '.oBbBbbBbbBbbrRo', '.obbbbbbbbbbbbro', '.oBbbBbbbBbbbrRo', '.obbbbbbbbbbbbro', '..oooooooooooo..', '................', '................', '................', '................', '................'];
const SCROLL_ROWS = ['................', '................', '...oooooooooo...', '..oppppppppppo..', '..opllllllllpo..', '..oppppppppppo..',
  '..opllllllpppo..', '..oppppppppppo..', '..opllllllllpo..', '..oppppppppppo..', '..opllllpppppo..', '..oppppppppppo..', '...oooooooooo...', '................', '................', '................'];
Object.assign(ICON_R, {
  hartholz: [{ b: '#6a4a2a', B: '#4a3220', r: '#c8a070', R: '#8a6a40' }, LOG_ROWS], schwarzholz: [{ b: '#2a2420', B: '#14100e', r: '#6a5a4a', R: '#3e342a' }, LOG_ROWS],
  harz: [{ c: '#8a6a2a', g: '#c89a3a', w: '#f0d890', r: '#d8a040', R: '#f0c060', d: '#8a5a1a' }, ICON_R.potion[1]],
  kohle: [{ s: '#2a2826', S: '#3e3a36', d: '#141210', r: '#4a4440', R: '#6a6460' }, ICON_R.iron[1]], silbererz: [{ s: '#6a6a70', S: '#9a9aa4', d: '#3e3e44', r: '#c8ccd8', R: '#eef0f8' }, ICON_R.iron[1]],
  bergminze: [{ L: '#8ad0a0', l: '#4a9a6a', d: '#2a6a4a', s: '#7a6a4a' }, ICON_R.herb[1]], nachtschatten: [{ L: '#8a6aa0', l: '#5a3a7a', d: '#3a2250', s: '#5a4a3a' }, ICON_R.herb[1]],
  angel_gut: [{ s: '#a06a32', l: '#e8e0d0', h: '#b0b8c0' }, ICON_R.angel[1]], angel_stahl: [{ s: '#5a5a62', l: '#e8e0d0', h: '#d8e0e8' }, ICON_R.angel[1]],
  bratfisch: [{ B: '#a0602a', b: '#d8a060', T: '#7a4420', w: '#f0e0c0' }, ICON_R.forelle[1]],
  jaegertopf: [{ f: '#d8d8d0', s: '#8a4a2a', S: '#6a3220', B: '#4a3420' }, ICON_R.fischsuppe[1]], bergminztee: [{ f: '#d8d8d0', s: '#8ad0a0', S: '#5aa070', B: '#6a5a4a' }, ICON_R.fischsuppe[1]],
  kraeuterbrot: [{ b: '#a08a48', B: '#c8b070', d: '#6a5a2a', c: '#8ab060' }, ICON_R.bread[1]],
  alter_wels: fishIcon('#3a3430', '#c8a860', '#d8b040'), buch_erzkunde: [{ p: '#7a6a5a', l: '#c8ccd8' }, SCROLL_ROWS], buch_kraeuter: [{ p: '#6a7a4a', l: '#d8e8a0' }, SCROLL_ROWS],
  rezept_jaegertopf: [{ p: '#e8dcc0', l: '#8a6a4a' }, SCROLL_ROWS], rezept_bergminztee: [{ p: '#e8dcc0', l: '#4a8a6a' }, SCROLL_ROWS], kochbuch: [{ p: '#c8a878', l: '#6a3a2a' }, SCROLL_ROWS],
});
