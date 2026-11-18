<script setup lang="ts">
import { Music, Footprints } from '@lucide/vue';
import type { ActivityEntry } from '~/composables/useCadenceStore';

const props = defineProps<{
  entry: ActivityEntry;
}>();

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(props.entry.date)
  )
);

const titleLabel = computed(() => {
  if (props.entry.source === 'guided') {
    const modeNames = { survie: 'Séance Douce', equilibre: 'Séance Équilibre', elan: 'Séance Élan' };
    return (props.entry.mode && modeNames[props.entry.mode]) || 'Séance Cadence';
  }
  const typeNames = { marche: 'Marche', course: 'Course', etirements: 'Étirements', autre: 'Activité libre' };
  return (props.entry.activityType && typeNames[props.entry.activityType]) || 'Activité libre';
});

const feelingBadge = computed(() => {
  if (props.entry.backFeelingAfter === 'soulage') {
    return { label: 'Dos soulagé', cls: 'bg-[var(--accent-soft)]/15 text-[var(--accent-soft)]' };
  }
  if (props.entry.backFeelingAfter === 'raide') {
    return { label: 'Un peu raide', cls: 'bg-amber-500/15 text-amber-300' };
  }
  return { label: 'RAS', cls: 'bg-white/10 text-slate-300' };
});
</script>

<template>
  <UiAppCard class="space-y-2">
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2.5">
        <span
          class="flex items-center justify-center w-9 h-9 rounded-xl"
          :class="entry.source === 'guided' ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]' : 'bg-[var(--accent-soft)]/15 text-[var(--accent-soft)]'"
        >
          <Music v-if="entry.source === 'guided'" class="w-4 h-4" />
          <Footprints v-else class="w-4 h-4" />
        </span>
        <div>
          <h3 class="text-sm font-semibold text-white">{{ titleLabel }}</h3>
          <p class="text-[11px] text-slate-400 capitalize">
            {{ formattedDate }} • {{ entry.durationMinutes }} min
            <span v-if="entry.avgBpm"> • {{ entry.avgBpm }} BPM</span>
          </p>
        </div>
      </div>

      <span class="px-2.5 py-1 rounded-full text-[10px] font-medium" :class="feelingBadge.cls">
        {{ feelingBadge.label }}
      </span>
    </div>

    <p v-if="entry.note" class="text-xs text-slate-300 italic pl-11">
      «&nbsp;{{ entry.note }}&nbsp;»
    </p>
    <p v-else-if="entry.exercisesDone?.length" class="text-[11px] text-slate-400 pl-11">
      {{ entry.exercisesDone.join(' • ') }}
    </p>
  </UiAppCard>
</template>