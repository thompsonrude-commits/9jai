// Local audio mock provider: generates a deterministic short WAV tone and returns base64 audio.
// This is intended as a local, deterministic provider for testing and offline pipelines.

export async function generateAudio(prompt: string | undefined, opts?: { lyrics?: string, genre?: string }): Promise<{ audioBase64: string; contentType: string; model: string; }> {
  // Synthesize a short WAV: 1 second sine wave at 440Hz, 16-bit PCM, 22050Hz sample rate
  const sampleRate = 22050;
  const durationSeconds = 1.0;
  const freq = 440.0; // A4
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const maxAmp = 0.5; // amplitude

  // Generate PCM samples (Float -> 16-bit signed)
  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const v = Math.sin(2 * Math.PI * freq * t) * maxAmp;
    samples[i] = Math.max(-1, Math.min(1, v)) * 0x7fff;
  }

  // WAV file header
  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 1; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format PCM
  view.setUint16(22, 1, true); // num channels
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  // Convert to base64
  // Node Buffer compatibility: create Buffer from ArrayBuffer
  const nodeBuffer = Buffer.from(buffer);
  const base64 = nodeBuffer.toString('base64');

  return { audioBase64: base64, contentType: 'audio/wav', model: 'local-mock' };
}
