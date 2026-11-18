import type { Exercise } from '~/data/exercises';

export type MovementPhase = 'up' | 'hold' | 'down';

export function useBpmEngine(bpm: Ref<number>) {
  const isPlaying = ref(false);
  const currentPhase = ref<MovementPhase>('up');
  const beatInPhase = ref(1);
  const totalBeatsInPhase = ref(4);
  const currentCycle = ref(1);
  const phaseProgress = ref(0); // 0 à 1 pour l'animation fluide de l'anneau

  let timer: ReturnType<typeof setInterval> | null = null;
  let activeExercise: Exercise | null = null;
  let onExerciseComplete: (() => void) | null = null;

  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const phaseLabel = computed(() => {
    if (currentPhase.value === 'up') return 'Monter / Inspirer';
    if (currentPhase.value === 'hold') return 'Tenir';
    return 'Relâcher / Expirer';
  });

  const startExercise = (exercise: Exercise, onComplete: () => void) => {
    activeExercise = exercise;
    onExerciseComplete = onComplete;
    currentCycle.value = 1;
    currentPhase.value = 'up';
    beatInPhase.value = 1;
    totalBeatsInPhase.value = exercise.pattern.upBeats;
    phaseProgress.value = 0;
    isPlaying.value = true;
    runTicker();
  };

  const runTicker = () => {
    if (timer) clearInterval(timer);
    const tickMs = 50; // Rafraîchissement fluide à 20 fps

    timer = setInterval(() => {
      if (!isPlaying.value || !activeExercise) return;

      const beatDurationMs = 60000 / Math.max(55, Math.min(140, bpm.value));
      const phaseDurationMs = beatDurationMs * totalBeatsInPhase.value;

      phaseProgress.value += tickMs / phaseDurationMs;
      beatInPhase.value = Math.min(
        totalBeatsInPhase.value,
        Math.floor(phaseProgress.value * totalBeatsInPhase.value) + 1
      );

      if (phaseProgress.value >= 1) {
        phaseProgress.value = 0;
        advancePhase();
      }
    }, tickMs);
  };

  const advancePhase = () => {
    if (!activeExercise) return;

    if (currentPhase.value === 'up') {
      if (activeExercise.pattern.holdBeats > 0) {
        currentPhase.value = 'hold';
        totalBeatsInPhase.value = activeExercise.pattern.holdBeats;
        vibrate(25);
      } else {
        currentPhase.value = 'down';
        totalBeatsInPhase.value = activeExercise.pattern.downBeats;
        vibrate([25, 40, 25]);
      }
    } else if (currentPhase.value === 'hold') {
      currentPhase.value = 'down';
      totalBeatsInPhase.value = activeExercise.pattern.downBeats;
      vibrate([25, 40, 25]);
    } else {
      // Fin d'un cycle complet
      if (currentCycle.value >= activeExercise.cycles) {
        vibrate(80);
        onExerciseComplete?.();
        return;
      }
      currentCycle.value += 1;
      currentPhase.value = 'up';
      totalBeatsInPhase.value = activeExercise.pattern.upBeats;
      vibrate(40);
    }

    beatInPhase.value = 1;
  };

  const togglePause = () => {
    isPlaying.value = !isPlaying.value;
  };

  const stop = () => {
    isPlaying.value = false;
    if (timer) clearInterval(timer);
  };

  onUnmounted(stop);

  return {
    isPlaying,
    currentPhase,
    phaseLabel,
    beatInPhase,
    totalBeatsInPhase,
    currentCycle,
    phaseProgress,
    startExercise,
    togglePause,
    stop,
  };
}