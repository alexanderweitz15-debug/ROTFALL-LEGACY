// Klangsynthese (WebAudio, keine Dateien). Jeder Klang stützt einen sichtbaren Effekt:
// Schwung = gefilterter Rauschsweep (schwer = tiefer/länger), Treffer = Tonabfall + Rauschstoß, Metall = Bandpass-Klirren.
import { S } from './state.js?v=25';

let ac = null, noiseBuf = null, master = null, wind = null;
function ctx() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') ac.resume();
  master.gain.value = S.settings.volume ?? 0.7;
  return ac;
}
function env(g, t, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
function noise(t, dur, type, f0, f1, peak, q = 1) {
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, peak, dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function tone(t, dur, type, f0, f1, peak) {
  const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ac.createGain(); env(g, t, peak, dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
const clampW = w => Math.max(0, Math.min(1, +w || 0));

// weight: 0 (Dolch) … 1 (Zweihänder). vol: 0..1 (Entfernung)
// mat (Treffer): 'blade' schneidet (heller Zisch), 'blunt' dröhnt (tiefer Schlag + Knacken), 'pierce' sticht (kurz, trocken);
// armored: Rüstung am Ziel → zusätzliches Scheppern. So klingen Axt, Kolben und Dolch verschieden, nicht nur tiefer/höher.
export function sfx(name, weight = 0.4, vol = 1, mat = null, armored = false) {
  if ((S.settings.volume ?? 0.7) <= 0 || vol <= 0.02) return;
  try {
    ctx(); const t = ac.currentTime, v = vol;
    switch (name) {
      case 'swing': noise(t, 0.09 + weight * 0.2, 'bandpass', 2600 - weight * 1400, 500 - weight * 250, 0.22 * v, 1.2); break;
      case 'hit':   tone(t, 0.12 + weight * 0.1, 'sine', 150 - weight * 60, 45, 0.5 * v); noise(t, 0.07 + weight * 0.05, 'lowpass', 2200, 300, 0.35 * v);
        if (mat === 'blade') noise(t, 0.05 + weight * 0.04, 'bandpass', 4200 - weight * 1200, 2600, 0.16 * v, 2.5);
        else if (mat === 'blunt') { tone(t, 0.18, 'sine', 85, 40, 0.35 * v); noise(t + 0.01, 0.04, 'bandpass', 1200, 900, 0.22 * v, 4); }
        else if (mat === 'pierce') noise(t, 0.035, 'highpass', 2600, 3200, 0.14 * v);
        if (armored) { noise(t, 0.12, 'bandpass', 3000, 2200, 0.16 * v, 10); tone(t, 0.1, 'square', 640 + weight * 120, 540, 0.025 * v); }
        break;
      case 'crit':  tone(t, 0.22, 'sine', 120, 38, 0.6 * v); noise(t, 0.14, 'lowpass', 3200, 250, 0.45 * v); noise(t + 0.02, 0.2, 'bandpass', 5200, 2500, 0.12 * v, 6);
        if (mat === 'blunt') tone(t, 0.25, 'sine', 70, 35, 0.4 * v); if (armored) noise(t, 0.16, 'bandpass', 3000, 2200, 0.18 * v, 10); break;
      case 'break': tone(t, 0.14, 'triangle', 260, 90, 0.18 * v); noise(t, 0.1, 'bandpass', 900, 500, 0.25 * v, 2); break;   // Angriff unterbrochen
      case 'bone':  noise(t, 0.06, 'bandpass', 1800, 900, 0.35 * v, 3); noise(t + 0.03, 0.05, 'bandpass', 1300, 700, 0.25 * v, 3); tone(t, 0.08, 'triangle', 220, 120, 0.15 * v); break;
      case 'metal': noise(t, 0.18, 'bandpass', 3400, 2600, 0.35 * v, 12); tone(t, 0.16, 'square', 880, 760, 0.05 * v); break;
      case 'dodge': noise(t, 0.2, 'lowpass', 900, 200, 0.2 * v, 0.7); break;
      case 'step':  noise(t, 0.04, 'lowpass', 500 + Math.random() * 200, 150, 0.08 * v); break;
      case 'death': tone(t, 0.45, 'sawtooth', 180, 50, 0.12 * v); noise(t, 0.3, 'lowpass', 900, 120, 0.2 * v); break;
      case 'bell':   tone(t, 2.6, 'sine', 196, 194, 0.16 * v); tone(t, 2.0, 'sine', 392.5, 390, 0.06 * v); tone(t + 0.01, 1.4, 'triangle', 588, 584, 0.03 * v); break;   /* T10: Totenglocke beim Heldentod */
      case 'bow':   tone(t, 0.12, 'triangle', 330, 180, 0.2 * v); noise(t, 0.08, 'highpass', 3000, 5000, 0.08 * v); break;
      case 'magic': tone(t, 0.3, 'sine', 300, 900, 0.14 * v); tone(t + 0.04, 0.26, 'triangle', 600, 1500, 0.06 * v); break;
      case 'fire':  noise(t, 0.35, 'lowpass', 1800, 200, 0.35 * v, 0.8); break;
      case 'heal':  tone(t, 0.25, 'sine', 660, 660, 0.1 * v); tone(t + 0.1, 0.35, 'sine', 990, 990, 0.08 * v); break;
      case 'ui':    tone(t, 0.035, 'square', 1400, 900, 0.03 * v); break;
      case 'whistle': tone(t, 0.16, 'sine', 1500, 2300, 0.09 * v); tone(t + 0.22, 0.32, 'sine', 1700, 2700, 0.09 * v); break;   // S15: nach dem Pferd pfeifen
      // Rufe beim Entdecken (Phase 11: Geräusche je Art)
      case 'growl':  noise(t, 0.5, 'lowpass', 420, 180, 0.28 * v, 1.5); tone(t, 0.45, 'sawtooth', 95, 70, 0.05 * v); break;
      case 'rattle': for (let i = 0; i < 4; i++) noise(t + i * 0.06, 0.04, 'bandpass', 1600 + i * 200, 900, 0.22 * v, 3); break;
      case 'moan':   tone(t, 0.8, 'sine', 140, 95, 0.14 * v); tone(t + 0.1, 0.7, 'triangle', 210, 150, 0.05 * v); break;
      case 'shriek': tone(t, 0.5, 'sine', 900, 1900, 0.07 * v); tone(t + 0.05, 0.45, 'sine', 1350, 2600, 0.04 * v); break;
      case 'horn':   tone(t, 1.1, 'sawtooth', 110, 98, 0.08 * v); tone(t, 1.1, 'sine', 55, 49, 0.12 * v); tone(t + 1.3, 1.0, 'sawtooth', 104, 92, 0.07 * v); tone(t + 1.3, 1.0, 'sine', 52, 46, 0.1 * v); break;   /* T17: Knochenhorn */
      case 'chains': for (let i = 0; i < 4; i++) { noise(t + i * 0.09, 0.12, 'bandpass', 2400 - i * 250, 1800, 0.2 * v, 10); tone(t + i * 0.09, 0.1, 'square', 520 - i * 40, 440, 0.025 * v); } break;
      case 'drum':   tone(t, 0.5, 'sine', 70, 40, 0.5 * v); noise(t, 0.08, 'lowpass', 600, 120, 0.3 * v); break;
      case 'heartbeat': tone(t, 0.18, 'sine', 55, 40, 0.55 * v); tone(t + 0.16, 0.2, 'sine', 50, 36, 0.45 * v); break;
      case 'crack':  noise(t, 0.12, 'bandpass', 2600, 1400, 0.35 * v, 4); tone(t, 0.1, 'triangle', 420, 160, 0.12 * v); noise(t + 0.06, 0.18, 'lowpass', 900, 150, 0.2 * v); break;
      case 'shout':  noise(t, 0.22, 'bandpass', 700, 400, 0.3 * v, 1.2); tone(t, 0.2, 'sawtooth', 190, 150, 0.05 * v); break;
      /* Visueller Umbau P5/P7 (IMPL-ITEMS): Münzen (weight 0..1 = Betrag) und Beute-Landung (weight = Seltenheitsstufe 0..5) */
      case 'coin': { const n = 1 + Math.round(clampW(weight) * 3); for (let i = 0; i < n; i++) { tone(t + i * 0.055, 0.09, 'triangle', 2350 + i * 140, 2200, 0.05 * v); tone(t + i * 0.055, 0.12, 'sine', 3520 + i * 90, 3400, 0.025 * v); } noise(t, 0.05, 'highpass', 5200, 6000, 0.05 * v); break; }
      case 'loot': { const lv = Math.round(weight) || 0; noise(t, 0.07, 'lowpass', 700, 180, 0.22 * v, 0.8); tone(t, 0.08, 'sine', 120, 70, 0.18 * v);
        if (lv >= 2) { const f = 520 * Math.pow(1.26, lv - 2); tone(t + 0.04, 0.5 + lv * 0.15, 'sine', f, f, 0.05 * v); tone(t + 0.1, 0.45 + lv * 0.15, 'sine', f * 1.5, f * 1.5, 0.03 * v); }
        if (lv >= 4) tone(t + 0.18, 1.4, 'sine', 196, 194, 0.08 * v); break; }   /* Legendär/Mythisch: tiefe Glocke dazu */
    }
  } catch (e) { /* Audio optional (z. B. ohne Nutzergeste) */ }
}

// T10: alles leiser (Heldentod), danach wieder zurück. level 0…1 relativ zur eingestellten Lautstärke.
export function duck(level, ms = 500) { if (!ac || !master) return; const t = ac.currentTime, v = (S.settings.volume ?? 0.7) * level;
  try { master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(v, t + ms / 1000); } catch (e) { /* Audio optional */ } }
// Umgebung: leiser Wind (gefiltertes Rauschen, langsam schwankend)
export function ambience(on) {
  if ((S.settings.volume ?? 0.7) <= 0) on = false;
  if (ac) master.gain.value = S.settings.volume ?? 0.7;          // auch die Grundstimmung folgt der Lautstärke
  try {
    if (on && !wind) {
      ctx();
      const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
      const g = ac.createGain(); g.gain.value = 0.035;
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.025;
      lfo.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); g.connect(master); s.start(); lfo.start();
      wind = { s, lfo };
    } else if (!on && wind) { wind.s.stop(); wind.lfo.stop(); wind = null; }
  } catch (e) { /* Audio optional */ }
}

// Grundstimmung: leiser Zweiklang je Region (Quinte = Weite, kleine Sekunde = Bedrohung), weich überblendet.
const MOOD = { greenmark: [110, 164.8], plains: [110, 164.8], forest: [98, 146.8], marsh: [87.3, 130.8], mountain: [123.5, 185],
  desert: [103.8, 155.6], badland: [92.5, 98], blight: [73.4, 77.8],
  /* Audit C4: eigene Stimmung statt Grünland-Rückfall */
  deadland: [69.3, 73.4], aurel: [130.8, 196], eisen: [98, 103.8], frozen: [116.5, 174.6], coast: [110, 146.8], under: [65.4, 69.3] };
let pad = null, lastRegion = null;
function setMood(region) {
  const f = MOOD[region] || MOOD.greenmark, t = ac.currentTime;
  if (!pad) {
    const g = ac.createGain(); g.gain.value = 0; g.connect(master);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(g);
    const o = f.map(fr => { const x = ac.createOscillator(); x.type = 'triangle'; x.frequency.value = fr; x.connect(lp); x.start(); return x; });
    pad = { g, o }; g.gain.linearRampToValueAtTime(0.012, t + 4);
  }
  pad.o.forEach((x, i) => x.frequency.linearRampToValueAtTime(f[i], t + 6));
}

// Regionale Einzelgeräusche, etwa einmal pro Sekunde gewürfelt. Selten und leise: Atmosphäre, kein Lärm.
// region: regionAt(); day: Tageslicht; town: in einer Siedlung.
// under: geschlossene Karte unter Tage (Audit C4: Tropfen und Hall statt Vogelgezwitscher).
export function ambienceTick(region, day, town, under) {
  if ((S.settings.volume ?? 0.7) <= 0 || !ac || !wind) return;
  try {
    const t = ac.currentTime, key = under ? 'under' : region;
    if (key !== lastRegion) { lastRegion = key; setMood(key); }
    const r = Math.random();
    if (under) {
      if (r < 0.16) { const f = 1500 + Math.random() * 900; tone(t, 0.06, 'sine', f, f * 0.6, 0.02); tone(t + 0.28, 0.06, 'sine', f, f * 0.6, 0.007); }   /* Tropfen mit Hall */
      else if (r < 0.2) noise(t, 2.2, 'lowpass', 140, 90, 0.035);                                                                                      /* fernes Grollen im Fels */
      if (region === 'blight' && r > 0.94) for (let i = 0; i < 4; i++) noise(t + i * 0.07, 0.03, 'bandpass', 1600, 900, 0.02, 4);                     /* Knochen */
      return;
    }
    if (town) {
      if (r < 0.10) { noise(t, 0.05, 'bandpass', 3000, 2400, 0.05, 10); noise(t + 0.4, 0.05, 'bandpass', 3000, 2400, 0.04, 10); }   // Schmiedehammer
      else if (r < 0.22) noise(t, 0.5, 'bandpass', 420, 380, 0.025, 2);                                                          // Stimmengemurmel
      else if (r < 0.26) { tone(t, 0.18, 'sawtooth', 320, 260, 0.02); tone(t + 0.22, 0.25, 'sawtooth', 300, 240, 0.02); }      // Tier (Ziege)
      return;
    }
    if (region === 'aurel') {                                                          /* Audit C4: Dampf, Messing, Zahnräder */
      if (r < 0.12) noise(t, 0.7, 'highpass', 2500, 4000, 0.018);
      else if (r < 0.2) { tone(t, 0.08, 'square', 620, 600, 0.012); tone(t + 0.09, 0.1, 'square', 930, 900, 0.01); }
      else if (r < 0.28) for (let i = 0; i < 6; i++) noise(t + i * 0.09, 0.02, 'bandpass', 2600, 2600, 0.012, 8);
      return;
    }
    if (region === 'eisen') {                                                          /* Audit C4: Hämmer und Ketten */
      if (r < 0.12) for (let i = 0; i < 3; i++) noise(t + i * 0.55, 0.05, 'bandpass', 2400, 1900, 0.04, 9);
      else if (r < 0.2) for (let i = 0; i < 5; i++) noise(t + i * 0.05, 0.03, 'bandpass', 1900 + i * 150, 1200, 0.025, 4);
      else if (r < 0.26) noise(t, 1.6, 'bandpass', 600, 280, 0.03, 1);
      return;
    }
    if (region === 'deadland') {                                                       /* Audit C4: Knochenwind */
      if (r < 0.14) noise(t, 2.4, 'bandpass', 520, 260, 0.045, 3);
      else if (r < 0.2) tone(t, 1.8, 'sine', 180, 120, 0.012);
      else if (r < 0.24) for (let i = 0; i < 3; i++) noise(t + i * 0.09, 0.03, 'bandpass', 1500, 900, 0.025, 4);
      return;
    }
    if (region === 'frozen') { if (r < 0.14) noise(t, 2, 'bandpass', 1300, 700, 0.03, 4); else if (r < 0.2) noise(t, 0.05, 'highpass', 5000, 3000, 0.02); return; }   /* Eiswind, Knacken */
    if (region === 'coast') {                                                          /* Audit C4: Brandung und Möwen */
      if (r < 0.2) noise(t, 2.6, 'lowpass', 500, 900, 0.05);
      else if (r < 0.3) { tone(t, 0.25, 'sine', 1500, 1000, 0.016); tone(t + 0.3, 0.3, 'sine', 1400, 900, 0.014); }
      return;
    }
    if (region === 'blight') {
      if (r < 0.08) { tone(t, 1.6, 'sawtooth', 92, 61, 0.022); noise(t, 1.4, 'lowpass', 300, 120, 0.03); }   // fernes Stöhnen
      else if (r < 0.13) for (let i = 0; i < 4; i++) noise(t + i * 0.07, 0.03, 'bandpass', 1600, 900, 0.03, 4);   // Knochenklappern
      return;
    }
    if (region === 'marsh') { if (r < 0.12) { tone(t, 0.12, 'square', 190, 120, 0.02); tone(t + 0.18, 0.12, 'square', 180, 115, 0.02); } return; }   // Frösche
    if (region === 'desert' || region === 'badland' || region === 'mountain') { if (r < 0.1) noise(t, 1.8, 'bandpass', 700, 300, 0.04, 1); return; }   // Böe
    if (day) {                                                                         // Wald/Wiese am Tag: Vögel, Blätter
      if (r < (region === 'forest' ? 0.22 : 0.14)) { const f = 2200 + Math.random() * 1400; for (let i = 0; i < 3; i++) tone(t + i * 0.11, 0.07, 'sine', f, f * 1.3, 0.018); }
      else if (r < 0.3) noise(t, 0.4, 'highpass', 3500, 5000, 0.012);
    } else if (r < 0.3) for (let i = 0; i < 3; i++) tone(t + i * 0.08, 0.03, 'triangle', 4200, 4100, 0.008);   // Grillen
  } catch (e) { /* Audio optional */ }
}
