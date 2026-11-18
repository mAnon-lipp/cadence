<script setup lang="ts">
import { Sparkles, Play, Plus, Footprints, HeartHandshake } from '@lucide/vue';
import type { EnergyMode, BackState, BackFeeling } from '~/composables/useCadenceStore';

const router = useRouter();
const { monthlyStats, smartSuggestion, buildSession, addActivity } = useCadenceStore();

// État du check-in du soir
const selectedEnergy = ref<EnergyMode>('equilibre');
const selectedBack = ref<BackState>('raide');

const energyOptions = [
  { value: 'survie', label: 'Survie', sublabel: '3-5 min' },
  { value: 'equilibre', label: 'Équilibre', sublabel: '15 min' },
  { value: 'elan', label: 'Élan', sublabel: '25 min' },
];

const backOptions = [
  { value: 'sensible', label: 'Sensible', sublabel: 'Douceur max' },
  { value: 'raide', label: 'Raide', sublabel: 'Mobilité' },
  { value: 'ok', label: 'OK', sublabel: 'Renfo doux' },
];

// Lancer la séance depuis le check-in ou la suggestion intelligente
const handleStartSession = (mode = selectedEnergy.value, back = selectedBack.value) => {
  buildSession(mode, back);
  router.push('/session');
};

// Modale "+ Noter une sortie" (Diary libre)
const isDiaryModalOpen = ref(false);
const isSavingDiary = ref(false);

const diaryForm = reactive({
  activityType: 'marche' as 'marche' | 'course' | 'etirements' | 'autre',
  durationMinutes: 30,
  backFeelingAfter: 'soulage' as BackFeeling,
  note: '',
});

const activityTypeOptions = [
  { value: 'marche', label: 'Marche' },
  { value: 'course', label: 'Course' },
  { value: 'etirements', label: 'Étirements' },
  { value: 'autre', label: 'Autre' },
];

const feelingOptions = [
  { value: 'soulage', label: 'Soulagé', sublabel: 'Top' },
  { value: 'ras', label: 'RAS', sublabel: 'Neutre' },
  { value: 'raide', label: 'Un peu tiré', sublabel: 'Doucement' },
];

const handleSaveDiary = async () => {
  isSavingDiary.value = true;
  try {
    await addActivity({
      source: 'diary',
      activityType: diaryForm.activityType,
      durationMinutes: diaryForm.durationMinutes,
      backFeelingAfter: diaryForm.backFeelingAfter,
      note: diaryForm.note.trim() || undefined,
    });
    isDiaryModalOpen.value = false;
    diaryForm.note = '';
  } finally {
    isSavingDiary.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Indicateur bienveillant -->
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-widest text-slate-400">Bonsoir Manon</p>
      <h1 class="text-2xl font-bold text-white tracking-tight">À ton rythme ce soir</h1>

      <div
        v-if="monthlyStats.relievedCount > 0"
        class="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-[var(--accent-soft)]/10 border border-[var(--accent-soft)]/25 text-xs text-[var(--accent-soft)]"
      >
        <HeartHandshake class="w-3.5 h-3.5" />
        <span>Dos soulagé {{ monthlyStats.relievedCount }} fois ce mois-ci</span>
      </div>
    </header>

    <!-- Carte Intelligente (Suggestion contextuelle) -->
    <UiAppCard highlight class="space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
            <Sparkles class="w-3.5 h-3.5" />
            Suggestion adaptée
          </span>
          <h2 class="text-base font-semibold text-white">{{ smartSuggestion.title }}</h2>
          <p class="text-xs text-slate-300 leading-relaxed">{{ smartSuggestion.subtitle }}</p>
        </div>
      </div>

      <UiAppButton
        variant="secondary"
        block
        @click="handleStartSession(smartSuggestion.mode, smartSuggestion.backState)"
      >
        <Play class="w-4 h-4 fill-current" />
        <span>Lancer cette suggestion</span>
      </UiAppButton>
    </UiAppCard>

    <!-- Check-in du soir -->
    <section class="space-y-4">
      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-300">Ton énergie disponible</label>
        <UiPillSelector v-model="selectedEnergy" :options="energyOptions" />
      </div>

      <div class="space-y-2">
        <label class="text-xs font-medium text-slate-300">L'état de ton dos ce soir</label>
        <UiPillSelector v-model="selectedBack" :options="backOptions" />
      </div>
    </section>

    <!-- Actions principales -->
    <div class="space-y-2.5 pt-1">
      <UiAppButton variant="primary" block @click="handleStartSession()">
        <Play class="w-4 h-4 fill-current" />
        <span>Lancer ma séance sur mesure</span>
      </UiAppButton>

      <UiAppButton variant="ghost" block @click="isDiaryModalOpen = true">
        <Plus class="w-4 h-4" />
        <span>Noter une sortie (marche, run...)</span>
      </UiAppButton>
    </div>

    <!-- Modale d'ajout au Diary -->
    <UiAppModal :open="isDiaryModalOpen" title="Noter une activité libre" @close="isDiaryModalOpen = false">
      <form class="space-y-4" @submit.prevent="handleSaveDiary">
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 flex items-center gap-1.5">
            <Footprints class="w-3.5 h-3.5 text-[var(--accent-soft)]" />
            Type d'activité
          </label>
          <UiPillSelector v-model="diaryForm.activityType" :options="activityTypeOptions" />
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-300">Durée approximative</span>
            <span class="font-semibold text-[var(--accent-primary)]">{{ diaryForm.durationMinutes }} min</span>
          </div>
          <input
            v-model.number="diaryForm.durationMinutes"
            type="range"
            min="10"
            max="90"
            step="5"
            class="w-full accent-[var(--accent-primary)]"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300">Comment ton dos a réagi ?</label>
          <UiPillSelector v-model="diaryForm.backFeelingAfter" :options="feelingOptions" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300">Un petit mot / souvenir (optionnel)</label>
          <input
            v-model="diaryForm.note"
            type="text"
            placeholder="Ex : Marche au soleil avec ma playlist R&B..."
            class="w-full rounded-xl bg-[var(--bg-night)] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <UiAppButton type="submit" variant="primary" block :disabled="isSavingDiary">
          {{ isSavingDiary ? 'Enregistrement...' : 'Ajouter à mon Diary' }}
        </UiAppButton>
      </form>
    </UiAppModal>
  </div>
</template>