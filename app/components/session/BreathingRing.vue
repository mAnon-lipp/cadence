<script setup lang="ts">
import type { MovementPhase } from '~/composables/useBpmEngine';

const props = defineProps<{
  phase: MovementPhase;
  phaseLabel: string;
  phaseProgress: number;
  beatInPhase: number;
  totalBeatsInPhase: number;
  bassEnergy: number;
}>();

// Calcule l'échelle de l'anneau (0.72 au repos -> 1.08 en extension)
const ringScale = computed(() => {
  if (props.phase === 'up') {
    return 0.72 + props.phaseProgress * 0.36;
  }
  if (props.phase === 'hold') {
    return 1.08;
  }
  return 1.08 - props.phaseProgress * 0.36;
});

const haloScale = computed(() => 1 + props.bassEnergy * 0.35);
</script>

<template>
  <div class="relative flex items-center justify-center w-64 h-64 mx-auto my-4 select-none">
    <!-- Halo réactif aux basses de la musique -->
    <div
      class="absolute inset-4 rounded-full bg-[var(--accent-primary)]/15 blur-2xl transition-transform duration-75"
      :style="{ transform: `scale(${haloScale})` }"
    />

    <!-- Cercle repère extérieur -->
    <div class="absolute inset-2 rounded-full border border-white/10" />

    <!-- Anneau principal guidant le mouvement -->
    <div
      class="relative flex flex-col items-center justify-center w-52 h-52 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-slate)]/80 backdrop-blur-md shadow-2xl transition-transform duration-75"
      :style="{ transform: `scale(${ringScale})` }"
    >
      <span class="text-xs uppercase tracking-widest text-[var(--accent-soft)] font-medium">
        {{ phaseLabel }}
      </span>
      <span class="text-3xl font-bold text-white mt-1 tabular-nums">
        {{ beatInPhase }} <span class="text-sm font-normal text-slate-400">/ {{ totalBeatsInPhase }}</span>
      </span>
    </div>
  </div>
</template>