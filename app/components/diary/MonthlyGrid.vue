<script setup lang="ts">
import type { ActivityEntry } from '~/composables/useCadenceStore';

const props = defineProps<{
  activities: ActivityEntry[];
}>();

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

const monthTitle = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);

// Nombre de jours dans le mois + décalage pour commencer le lundi
const daysGrid = computed(() => {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  const activityByDay = new Map<number, 'guided' | 'diary' | 'both'>();
  props.activities.forEach((act) => {
    const d = new Date(act.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      const existing = activityByDay.get(day);
      if (!existing) activityByDay.set(day, act.source);
      else if (existing !== act.source) activityByDay.set(day, 'both');
    }
  });

  const cells: Array<{ day: number | null; source?: 'guided' | 'diary' | 'both'; isToday?: boolean }> = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      source: activityByDay.get(d),
      isToday: d === now.getDate(),
    });
  }
  return cells;
});
</script>

<template>
  <UiAppCard class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-white capitalize">{{ monthTitle }}</h2>
      <div class="flex items-center gap-3 text-[10px] text-slate-400">
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-[var(--accent-primary)]" /> Séance
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-[var(--accent-soft)]" /> Sortie
        </span>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1.5 text-center text-[10px] text-slate-500">
      <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
    </div>

    <div class="grid grid-cols-7 gap-1.5">
      <div
        v-for="(cell, idx) in daysGrid"
        :key="idx"
        class="aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative"
        :class="[
          cell.day ? 'bg-white/[0.03]' : '',
          cell.isToday ? 'ring-1 ring-white/25 font-bold text-white' : 'text-slate-400',
        ]"
      >
        <template v-if="cell.day">
          <span>{{ cell.day }}</span>
          <div v-if="cell.source" class="flex gap-0.5 mt-0.5">
            <span
              v-if="cell.source === 'guided' || cell.source === 'both'"
              class="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
            />
            <span
              v-if="cell.source === 'diary' || cell.source === 'both'"
              class="w-1.5 h-1.5 rounded-full bg-[var(--accent-soft)]"
            />
          </div>
        </template>
      </div>
    </div>
  </UiAppCard>
</template>