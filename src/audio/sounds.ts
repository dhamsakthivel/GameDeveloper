let context: AudioContext | null = null;

export function unlockAudio(): void {
  const AudioCtx = window.AudioContext;
  context ??= new AudioCtx();
  if (context.state === "suspended") {
    void context.resume();
  }
}

export function blip(): void {
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523, start);
  oscillator.frequency.exponentialRampToValueAtTime(784, start + 0.09);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.2);
}

export function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
