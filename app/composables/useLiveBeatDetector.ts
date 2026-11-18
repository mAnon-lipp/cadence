export function useLiveBeatDetector() {
  const isListening = ref(false);
  const micError = ref<string | null>(null);
  const detectedBpm = ref<number>(84); // Tempo doux par défaut
  const bassEnergy = ref<number>(0); // 0 à 1 pour faire pulser le halo visuel
  const isLocked = ref(false);

  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let stream: MediaStream | null = null;
  let rafId: number | null = null;

  const beatTimestamps: number[] = [];
  let lastBeatTime = 0;
  let energyHistory: number[] = [];

  const startListening = async () => {
    if (import.meta.server || isListening.value) return;
    micError.value = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      isListening.value = true;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyzeLoop = () => {
        if (!analyser || !isListening.value) return;
        analyser.getByteFrequencyData(dataArray);

        // Isolation des basses (bins 1 à 6 ≈ 40Hz - 250Hz)
        let bassSum = 0;
        for (let i = 1; i <= 6; i++) {
          bassSum += dataArray[i] || 0;
        }
        const instantEnergy = bassSum / (6 * 255);
        bassEnergy.value = instantEnergy;

        // Moyenne glissante pour détecter les pics de kick/basse
        energyHistory.push(instantEnergy);
        if (energyHistory.length > 40) energyHistory.shift();
        const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;

        const now = performance.now();
        // Seuil de détection d'un temps fort (minimum 330ms entre 2 beats ≈ max 180 BPM)
        if (instantEnergy > avgEnergy * 1.35 && instantEnergy > 0.18 && now - lastBeatTime > 330) {
          lastBeatTime = now;
          beatTimestamps.push(now);
          if (beatTimestamps.length > 8) beatTimestamps.shift();

          if (beatTimestamps.length >= 4) {
            const intervals: number[] = [];
            for (let i = 1; i < beatTimestamps.length; i++) {
              intervals.push(beatTimestamps[i]! - beatTimestamps[i - 1]!);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            let rawBpm = Math.round(60000 / avgInterval);

            // Ramène les tempos trop rapides/lents dans une plage musicale naturelle
            while (rawBpm > 135) rawBpm = Math.round(rawBpm / 2);
            while (rawBpm < 60) rawBpm = Math.round(rawBpm * 2);

            detectedBpm.value = rawBpm;
            isLocked.value = true;
          }
        }

        rafId = requestAnimationFrame(analyzeLoop);
      };

      analyzeLoop();
    } catch {
      micError.value = 'Micro indisponible — rythme libre activé';
      isListening.value = false;
    }
  };

  const stopListening = () => {
    isListening.value = false;
    if (rafId) cancelAnimationFrame(rafId);
    stream?.getTracks().forEach((t) => t.stop());
    audioCtx?.close();
    audioCtx = null;
    analyser = null;
    stream = null;
  };

  onUnmounted(stopListening);

  return {
    isListening,
    micError,
    detectedBpm,
    bassEnergy,
    isLocked,
    startListening,
    stopListening,
  };
}