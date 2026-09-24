// Klangsynthese (WebAudio, keine Dateien). Jeder Klang stützt einen sichtbaren Effekt:
// Schwung = gefilterter Rauschsweep (schwer = tiefer/länger), Treffer = Tonabfall + Rauschstoß, Metall = Bandpass-Klirren.
import { S } from './state.js';

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

// weight: 0 (Dolch) … 1 (Zweihänder). vol: 0..1 (Entfernung)
export function sfx(name, weight = 0.4, vol = 1) {
  if ((S.settings.volume ?? 0.7) <= 0 || vol <= 0.02) return;
  try {
    ctx(); const t = ac.currentTime, v = vol;
    switch (name) {
      case 'swing': noise(t, 0.09 + weight * 0.2, 'bandpass', 2600 - weight * 1400, 500 - weight * 250, 0.22 * v, 1.2); break;
      case 'hit':   tone(t, 0.12 + weight * 0.1, 'sine', 150 - weight * 60, 45, 0.5 * v); noise(t, 0.07 + weight * 0.05, 'lowpass', 2200, 300, 0.35 * v); break;
      case 'crit':  tone(t, 0.22, 'sine', 120, 38, 0.6 * v); noise(t, 0.14, 'lowpass', 3200, 250, 0.45 * v); noise(t + 0.02, 0.2, 'bandpass', 5200, 2500, 0.12 * v, 6); break;
      case 'bone':  noise(t, 0.06, 'bandpass', 1800, 900, 0.35 * v, 3); noise(t + 0.03, 0.05, 'bandpass', 1300, 700, 0.25 * v, 3); tone(t, 0.08, 'triangle', 220, 120, 0.15 * v); break;
      case 'metal': noise(t, 0.18, 'bandpass', 3400, 2600, 0.35 * v, 12); tone(t, 0.16, 'square', 880, 760, 0.05 * v); break;
      case 'dodge': noise(t, 0.2, 'lowpass', 900, 200, 0.2 * v, 0.7); break;
      case 'step':  noise(t, 0.04, 'lowpass', 500 + Math.random() * 200, 150, 0.08 * v); break;
      case 'death': tone(t, 0.45, 'sawtooth', 180, 50, 0.12 * v); noise(t, 0.3, 'lowpass', 900, 120, 0.2 * v); break;
      case 'bow':   tone(t, 0.12, 'triangle', 330, 180, 0.2 * v); noise(t, 0.08, 'highpass', 3000, 5000, 0.08 * v); break;
      case 'magic': tone(t, 0.3, 'sine', 300, 900, 0.14 * v); tone(t + 0.04, 0.26, 'triangle', 600, 1500, 0.06 * v); break;
      case 'fire':  noise(t, 0.35, 'lowpass', 1800, 200, 0.35 * v, 0.8); break;
      case 'heal':  tone(t, 0.25, 'sine', 660, 660, 0.1 * v); tone(t + 0.1, 0.35, 'sine', 990, 990, 0.08 * v); break;
      case 'ui':    tone(t, 0.035, 'square', 1400, 900, 0.03 * v); break;
    }
  } catch (e) { /* Audio optional (z. B. ohne Nutzergeste) */ }
}

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
  desert: [103.8, 155.6], badland: [92.5, 98], blight: [73.4, 77.8] };
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
export function ambienceTick(region, day, town) {
  if ((S.settings.volume ?? 0.7) <= 0 || !ac || !wind) return;
  try {
    const t = ac.currentTime;
    if (region !== lastRegion) { lastRegion = region; setMood(region); }
    const r = Math.random();
    if (town) {
      if (r < 0.10) { noise(t, 0.05, 'bandpass', 3000, 2400, 0.05, 10); noise(t + 0.4, 0.05, 'bandpass', 3000, 2400, 0.04, 10); }   // Schmiedehammer
      else if (r < 0.22) noise(t, 0.5, 'bandpass', 420, 380, 0.025, 2);                                                          // Stimmengemurmel
      else if (r < 0.26) { tone(t, 0.18, 'sawtooth', 320, 260, 0.02); tone(t + 0.22, 0.25, 'sawtooth', 300, 240, 0.02); }      // Tier (Ziege)
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
