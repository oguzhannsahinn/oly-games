let audio = null, muted = false, noiseBuf = null;
function ensureAudio() {
  if (audio) { if (audio.state === 'suspended') audio.resume().catch(() => {}); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { audio = new AC(); } catch (e) { audio = null; return; }
  noiseBuf = audio.createBuffer(1, audio.sampleRate / 2, audio.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function tone(f0, f1, dur, vol, type, delay = 0) {
  const now = audio.currentTime + delay, g = audio.createGain(), o = audio.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  o.frequency.exponentialRampToValueAtTime(f1, now + dur);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(.0005, now + dur);
  o.connect(g).connect(audio.destination);
  o.start(now); o.stop(now + dur + .02);
}
function hiss(dur, freq, q, vol, delay = 0) {
  const now = audio.currentTime + delay, src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
  src.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(.0005, now);
  g.gain.linearRampToValueAtTime(vol, now + dur * .25);
  g.gain.exponentialRampToValueAtTime(.0005, now + dur);
  src.connect(f).connect(g).connect(audio.destination);
  src.start(now); src.stop(now + dur + .02);
}
