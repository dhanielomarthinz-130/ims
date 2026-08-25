/**
 * Sound Effects Engine using Web Audio API
 * Generates authentic Zebra / Honeywell handheld barcode scanner sound effects
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SoundEngine = {
  /**
   * High-pitch crisp beep indicating successful barcode / QR scan (like Zebra TC26/TC57)
   */
  playScanSuccess: function () {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, ctx.currentTime); // 2.4 kHz crisp beep
      osc.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  },

  /**
   * Low double buzzer indicating invalid scan, mismatch, or error
   */
  playErrorBuzzer: function () {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now + offset);

        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  },

  /**
   * Pleasant chime for Putaway completion
   */
  playPutawayComplete: function () {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [1318.51, 1567.98, 2093.0]; // E6, G6, C7
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const time = ctx.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.18);
      });
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }
};
