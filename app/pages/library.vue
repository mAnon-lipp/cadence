<script setup lang="ts">
import {
  Plus,
  ShieldCheck,
  ExternalLink,
  Music2,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
  Wand2,
} from '@lucide/vue';
import type { ExerciseCategory, BackSafety } from '~/data/exercises';

const {
  exercises,
  addCustomExercise,
  addBatchExercises,
  enrichAllExercises,
  syncFlexibilityExercises,
} = useCadenceStore();

onMounted(() => {
  syncFlexibilityExercises();
});

const activeFilter = ref<'all' | ExerciseCategory>('all');
const expandedId = ref<string | null>(null);
const isEnriching = ref(false);

const filterOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'decompression', label: 'Dos doux' },
  { value: 'mobilite', label: 'Mobilité' },
  { value: 'souplesse', label: 'Souplesse' },
  { value: 'renfo', label: 'Renfo' },
  { value: 'inspi', label: 'Mes inspis' },
];

const filteredExercises = computed(() => {
  if (activeFilter.value === 'all') return exercises.value;
  return exercises.value.filter((ex) => ex.category === activeFilter.value);
});

const hasUnenrichedExercises = computed(() =>
  exercises.value.some((ex) => !ex.steps || ex.steps.length === 0)
);

const stepTitles = ['Installation', 'Mouvement & souffle', 'Sécurité dos'];

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const handleEnrichAll = async () => {
  isEnriching.value = true;
  try {
    await enrichAllExercises();
  } finally {
    isEnriching.value = false;
  }
};

// Modale Import Vidéo / Manuel
const isModalOpen = ref(false);
const importMode = ref<'video' | 'manual'>('video');

// État Import Vidéo IA
const videoUrl = ref('');
const isAnalyzing = ref(false);
const analyzeError = ref<string | null>(null);
const detectedExercises = ref<Array<any & { selected: boolean }>>([]);
const isSavingBatch = ref(false);

const handleAnalyzeVideo = async () => {
  if (!videoUrl.value.trim()) return;
  isAnalyzing.value = true;
  analyzeError.value = null;
  detectedExercises.value = [];

  try {
    const res = await $fetch<{ exercises: any[] }>('/api/inspi/parse', {
      method: 'POST',
      body: { url: videoUrl.value.trim() },
    });

    if (!res.exercises?.length) {
      analyzeError.value = "Aucun exercice n'a pu être identifié dans cette vidéo.";
      return;
    }

    detectedExercises.value = res.exercises.map((ex) => ({
      ...ex,
      selected: true,
    }));
  } catch (err: any) {
    analyzeError.value = err?.data?.statusMessage || "Erreur lors de l'analyse de la vidéo.";
  } finally {
    isAnalyzing.value = false;
  }
};

const handleSaveDetected = async () => {
  const toSave = detectedExercises.value.filter((ex) => ex.selected);
  if (!toSave.length) return;

  isSavingBatch.value = true;
  try {
    await addBatchExercises(toSave);
    resetAndCloseModal();
    activeFilter.value = 'all';
  } finally {
    isSavingBatch.value = false;
  }
};

// État Ajout Manuel
const isSavingManual = ref(false);
const manualForm = reactive({
  name: '',
  sourceUrl: '',
  backSafety: 'safe' as BackSafety,
  cue: '',
});

const safetyOptions = [
  { value: 'safe', label: '100 % Dos Safe', sublabel: 'Zéro contrainte' },
  { value: 'moderate', label: 'Modéré', sublabel: 'Gainage actif' },
];

const handleAddManual = async () => {
  if (!manualForm.name.trim()) return;
  isSavingManual.value = true;
  try {
    await addCustomExercise({
      name: manualForm.name.trim(),
      category: 'inspi',
      backSafety: manualForm.backSafety,
      cue: manualForm.cue.trim() || 'Garde la colonne alignée et respire calmement sur le tempo.',
      sourceUrl: manualForm.sourceUrl.trim() || undefined,
    });
    resetAndCloseModal();
    activeFilter.value = 'inspi';
  } finally {
    isSavingManual.value = false;
  }
};

const resetAndCloseModal = () => {
  isModalOpen.value = false;
  videoUrl.value = '';
  detectedExercises.value = [];
  analyzeError.value = null;
  manualForm.name = '';
  manualForm.sourceUrl = '';
  manualForm.cue = '';
};
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-widest text-slate-400">Mouvements & Inspis</p>
        <h1 class="text-2xl font-bold text-white tracking-tight">Bibliothèque</h1>
      </div>

      <UiAppButton variant="primary" class="!px-3.5 !py-2 text-xs" @click="isModalOpen = true">
        <Plus class="w-4 h-4" />
        <span>Inspi</span>
      </UiAppButton>
    </header>

    <!-- Bandeau d'enrichissement IA si des exercices n'ont pas encore leurs 3 repères détaillés -->
    <UiAppCard
      v-if="hasUnenrichedExercises"
      highlight
      class="flex items-center justify-between gap-3 !p-3.5"
    >
      <div class="space-y-0.5">
        <p class="text-xs font-semibold text-white">Postures détaillées disponibles</p>
        <p class="text-[11px] text-slate-300">
          Génère les 3 repères précis (installation, souffle, dos) pour tes mouvements.
        </p>
      </div>
      <UiAppButton
        variant="secondary"
        class="!px-3 !py-2 text-xs shrink-0"
        :disabled="isEnriching"
        @click="handleEnrichAll"
      >
        <Loader2 v-if="isEnriching" class="w-3.5 h-3.5 animate-spin" />
        <Wand2 v-else class="w-3.5 h-3.5 text-[var(--accent-primary)]" />
        <span>{{ isEnriching ? 'En cours...' : 'Détailler' }}</span>
      </UiAppButton>
    </UiAppCard>

    <!-- Filtres horizontaux -->
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="f in filterOptions"
        :key="f.value"
        @click="activeFilter = f.value as any"
        class="px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-colors"
        :class="
          activeFilter === f.value
            ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-white'
            : 'bg-[var(--bg-slate)] border-white/5 text-slate-400'
        "
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Liste des exercices -->
    <div class="space-y-3">
      <UiAppCard
        v-for="ex in filteredExercises"
        :key="ex.id"
        class="space-y-2.5 transition-colors"
      >
        <div
          class="flex items-start justify-between gap-2 cursor-pointer"
          @click="toggleExpand(ex.id)"
        >
          <h2 class="text-sm font-semibold text-white">{{ ex.name }}</h2>
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              :class="
                ex.backSafety === 'safe'
                  ? 'bg-[var(--accent-soft)]/15 text-[var(--accent-soft)]'
                  : 'bg-amber-500/15 text-amber-300'
              "
            >
              <ShieldCheck class="w-3 h-3" />
              {{ ex.backSafety === 'safe' ? '100 % Safe' : 'Dos modéré' }}
            </span>

            <ChevronDown
              v-if="ex.steps?.length"
              class="w-4 h-4 text-slate-400 transition-transform duration-200"
              :class="expandedId === ex.id ? 'rotate-180 text-white' : ''"
            />
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">{{ ex.cue }}</p>

        <!-- Fiche posture détaillée (Accordéon) -->
        <div
          v-if="expandedId === ex.id && ex.steps?.length"
          class="pt-2 mt-1 border-t border-white/10 space-y-2.5"
        >
          <div
            v-for="(step, idx) in ex.steps"
            :key="idx"
            class="flex items-start gap-2.5 text-xs"
          >
            <span
              class="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold text-[10px] shrink-0 mt-0.5"
            >
              {{ idx + 1 }}
            </span>
            <div class="space-y-0.5">
              <p class="text-[11px] font-semibold text-slate-200">
                {{ stepTitles[idx] || `Repère ${idx + 1}` }}
              </p>
              <p class="text-slate-300 leading-relaxed">{{ step }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1">
              <Music2 class="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              {{ ex.idealBpmRange[0] }}-{{ ex.idealBpmRange[1] }} BPM
            </span>

            <button
              v-if="ex.steps?.length"
              type="button"
              @click="toggleExpand(ex.id)"
              class="text-slate-300 hover:text-white underline underline-offset-2"
            >
              {{ expandedId === ex.id ? 'Masquer détails' : 'Voir la posture' }}
            </button>
          </div>

          <a
            v-if="ex.sourceUrl"
            :href="ex.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
          >
            <span>Vidéo</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>
      </UiAppCard>
    </div>

    <!-- Modale "+ Ajouter une inspi" -->
    <UiAppModal :open="isModalOpen" title="Importer une inspi" @close="resetAndCloseModal">
      <div class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-night)]">
        <button
          type="button"
          @click="importMode = 'video'"
          class="py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="importMode === 'video' ? 'bg-[var(--bg-slate)] text-white' : 'text-slate-400'"
        >
          Lien TikTok / Insta
        </button>
        <button
          type="button"
          @click="importMode = 'manual'"
          class="py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="importMode === 'manual' ? 'bg-[var(--bg-slate)] text-white' : 'text-slate-400'"
        >
          Saisie manuelle
        </button>
      </div>

      <!-- Mode 1 : Extraction Vidéo IA -->
      <div v-if="importMode === 'video'" class="space-y-4">
        <form class="space-y-3" @submit.prevent="handleAnalyzeVideo">
          <div class="space-y-1.5">
            <label class="text-xs text-slate-300">Colle le lien de la vidéo (TikTok ou Reel)</label>
            <input
              v-model="videoUrl"
              type="url"
              required
              placeholder="https://www.tiktok.com/@..."
              class="w-full rounded-xl bg-[var(--bg-night)] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <UiAppButton type="submit" variant="secondary" block :disabled="isAnalyzing">
            <Loader2 v-if="isAnalyzing" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4 text-[var(--accent-primary)]" />
            <span>{{ isAnalyzing ? 'Analyse des postures en cours...' : 'Extraire les exercices' }}</span>
          </UiAppButton>
        </form>

        <p
          v-if="analyzeError"
          class="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3"
        >
          {{ analyzeError }}
        </p>

        <!-- Liste des exercices détectés dans la vidéo -->
        <div v-if="detectedExercises.length > 0" class="space-y-3 pt-1">
          <p class="text-xs font-medium text-[var(--accent-soft)]">
            {{ detectedExercises.length }} exercice(s) repéré(s) — sélectionne ceux à garder :
          </p>

          <div class="max-h-64 overflow-y-auto space-y-2 pr-1">
            <button
              v-for="(ex, idx) in detectedExercises"
              :key="idx"
              type="button"
              @click="ex.selected = !ex.selected"
              class="w-full text-left p-3 rounded-2xl border transition-colors flex items-start gap-3"
              :class="
                ex.selected
                  ? 'bg-[var(--bg-night)] border-[var(--accent-primary)]/60'
                  : 'bg-[var(--bg-night)]/40 border-white/5 opacity-60'
              "
            >
              <span
                class="mt-0.5 flex items-center justify-center w-5 h-5 rounded-md border shrink-0"
                :class="
                  ex.selected
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-slate-950'
                    : 'border-white/20'
                "
              >
                <Check v-if="ex.selected" class="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <div class="space-y-1">
                <p class="text-xs font-semibold text-white">{{ ex.name }}</p>
                <p class="text-[11px] text-slate-300">{{ ex.cue }}</p>
                <ul v-if="ex.steps?.length" class="text-[10px] text-slate-400 space-y-0.5 pt-1">
                  <li v-for="(s, sIdx) in ex.steps" :key="sIdx">• {{ s }}</li>
                </ul>
              </div>
            </button>
          </div>

          <UiAppButton variant="primary" block :disabled="isSavingBatch" @click="handleSaveDetected">
            {{ isSavingBatch ? 'Enregistrement...' : 'Ajouter la sélection à ma bibliothèque' }}
          </UiAppButton>
        </div>
      </div>

      <!-- Mode 2 : Saisie Manuelle -->
      <form v-else class="space-y-4" @submit.prevent="handleAddManual">
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300">Nom du mouvement</label>
          <input
            v-model="manualForm.name"
            type="text"
            required
            placeholder="Ex : Décompression lombaire au mur"
            class="w-full rounded-xl bg-[var(--bg-night)] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300">Niveau pour le dos</label>
          <UiPillSelector v-model="manualForm.backSafety" :options="safetyOptions" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs text-slate-300">Consigne posture (optionnel)</label>
          <input
            v-model="manualForm.cue"
            type="text"
            placeholder="Ex : Plaquer le bas du dos, respirer lentement"
            class="w-full rounded-xl bg-[var(--bg-night)] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <UiAppButton type="submit" variant="primary" block :disabled="isSavingManual">
          {{ isSavingManual ? 'Ajout en cours...' : 'Enregistrer dans ma bibliothèque' }}
        </UiAppButton>
      </form>
    </UiAppModal>
  </div>
</template>