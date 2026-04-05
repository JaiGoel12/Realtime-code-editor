const STORAGE_KEY = 'codesync-sounds-enabled';

export function getSoundsEnabled() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export function setSoundsEnabled(enabled) {
    try {
        window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
        /* ignore */
    }
}

let audioCtx = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    try {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audioCtx = new AC();
        }
        return audioCtx;
    } catch {
        return null;
    }
}

function playTone(frequency, durationSec, volume = 0.055) {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec + 0.04);
}

/** Soft two-note up — someone arrived */
export function playJoinChime() {
    if (!getSoundsEnabled()) return;
    playTone(784, 0.07, 0.048);
    window.setTimeout(() => {
        if (!getSoundsEnabled()) return;
        playTone(1046.5, 0.09, 0.04);
    }, 65);
}

/** Soft down — someone left */
export function playLeaveChime() {
    if (!getSoundsEnabled()) return;
    playTone(523.25, 0.11, 0.05);
}
