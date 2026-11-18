<script setup lang="ts">
import { X, Pause, Play, SkipForward, CheckCircle2 } from '@lucide/vue';
import type { BackFeeling } from '~/composables/useCadenceStore';

definePageMeta({ layout: false });

const router = useRouter();
const { currentSessionPlan, buildSession, addActivity } = useCadenceStore();

// Si accès direct à /session sans plan, génère une routine douce par défaut
const plan = computed(() => currentSessionPlan.value || buildSession('survie', 'sensible'));

const currentIndex = ref(0);
const completedNames = ref<string[]>([]);
const isFinished = ref(false);
const isSaving = ref(false);
const feelingAfter = ref<BackFeeling>('soulage');
const startTime = Date.now();

const currentExercise = computed(() => plan.value.exercises[currentIndex.value]);

// Audio & Moteur BPM
const { isListening, isLocked, detectedBpm, bassEnergy, micError, startListening, stopListening } =
  useLiveBeatDetector();
const engine = useBpmEngine(detectedBpm);

const launchCurrentExercise = () => {
  if (!currentExercise.value) {
    finishSession();
    return;
  }
  engine.startExercise(currentExercise.value, () => {
    completedNames.value.push(currentExercise.value!.name);
    goNextExercise();
  });
};

const goNextExercise = () => {
  if (currentIndex.value + 1 < plan.value.exercises.length) {
    currentIndex.value += 1;
    launchCurrentExercise();
  } else {
    finishSession();
  }
};

const finishSession = () => {
  engine.stop();
  stopListening();
  isFinished.value = true;
};

onMounted(() => {
  startListening();
  launchCurrentExercise();
});

const toggleMic = () => {
  if (isListening.value) stopListening();
  else startListening();
};

const feelingOptions = [
  { value: 'soulage', label: 'Soulagé', sublabel: 'Plus léger' },
  { value: 'ras', label: 'RAS', sublabel: 'Stable' },
  { value: 'raide', label: 'Encore raide', sublabel: 'À surveiller' },
];

const handleSaveAndExit = async () => {
  isSaving.value = true;
  try {
    const elapsedMinutes = Math.max(2, Math.round((Date.now() - startTime) / 60000));
    await addActivity({
      source: 'guided',
      mode: plan.value.mode,
      avgBpm: detectedBpm.value,
      exercisesDone: completedNames.value,
      durationMinutes: elapsedMinutes,
      backFeelingAfter: feelingAfter.value,
    });
    router.push('/');
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between max-w-md mx-auto px-5 py-6">
    <!-- Top Bar : Quitter + Radar Audio -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <button
          @click="router.push('/')"
          class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <X class="w-4 h-4" />
          <span>Quitter</span>
        </button>

        <span v-if="!isFinished && currentExercise" class="text-xs font-medium text-slate-400">
          Mouvement {{ currentIndex + 1 }} / {{ plan.exercises.length }} • Rép. {{ engine.currentCycle.value }}/{{ currentExercise.cycles }}
        </span>
      </div>

      <SessionAudioRadarBadge
        v-if="!isFinished"
        :is-listening="isListening"
        :is-locked="isLocked"
        :bpm="detectedBpm"
        :mic-error="micError"
        @toggle-mic="toggleMic"
      />
    </div>

    <!-- État 1 : Séance en cours -->
    <template v-if="!isFinished && currentExercise">
      <SessionBreathingRing
        :phase="engine.currentPhase.value"
        :phase-label="engine.phaseLabel.value"
        :phase-progress="engine.phaseProgress.value"
        :beat-in-phase="engine.beatInPhase.value"
        :total-beats-in-phase="engine.totalBeatsInPhase.value"
        :bass-energy="bassEnergy"
      />

      <!-- Consignes Dos & Contrôles au pouce -->
      <div class="space-y-4">
        <UiAppCard class="space-y-1.5 text-center">
          <h1 class="text-lg font-bold text-white">{{ currentExercise.name }}</h1>
          <p class="text-xs text-slate-300 leading-relaxed">{{ currentExercise.cue }}</p>
        </UiAppCard>

        <div class="grid grid-cols-2 gap-3">
          <UiAppButton variant="secondary" @click="engine.togglePause()">
            <Pause v-if="engine.isPlaying.value" class="w-4 h-4" />
            <Play v-else class="w-4 h-4" />
            <span>{{ engine.isPlaying.value ? 'Pause' : 'Reprendre' }}</span>
          </UiAppButton>

          <UiAppButton variant="ghost" @click="goNextExercise()">
            <SkipForward class="w-4 h-4" />
            <span>Passer (trop dur)</span>
          </UiAppButton>
        </div>
      </div>
    </template>

    <!-- État 2 : Fin de séance bienveillante -->
    <template v-else>
      <div class="space-y-6 my-auto">
        <div class="text-center space-y-2">
          <CheckCircle2 class="w-12 h-12 text-[var(--accent-soft)] mx-auto" />
          <h1 class="text-2xl font-bold text-white">Moment pris pour toi</h1>
          <p class="text-xs text-slate-400">
            {{ completedNames.length }} mouvement(s) complété(s) au rythme de ta playlist.
          </p>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-300 block text-center">
            Comment se sent ton dos maintenant ?
          </label>
          <UiPillSelector v-model="feelingAfter" :options="feelingOptions" />
        </div>

        <UiAppButton variant="primary" block :disabled="isSaving" @click="handleSaveAndExit">
          {{ isSaving ? 'Enregistrement...' : 'Enregistrer dans mon Diary' }}
        </UiAppButton>
      </div>
    </template>
  </div>
</template>