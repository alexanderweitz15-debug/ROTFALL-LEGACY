// S14 Stil R: handgezeichnete 16×16-Symbole für Verbrauchsgüter und Material (Nutzer: „restliche Sprites“).
// Zeichen → Farbe je Symbol; '.' leer, 'o' Kontur. Waffen und Rüstung kommen weiter aus den echten Sprites (render.js iconR).
const O = '#1c1512';
export const ICON_R = {
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
