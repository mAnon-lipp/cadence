<script setup lang="ts">
const { activities, monthlyStats } = useCadenceStore();
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-widest text-slate-400">Ton parcours</p>
      <h1 class="text-2xl font-bold text-white tracking-tight">
        {{ monthlyStats.totalSessions }} moment{{ monthlyStats.totalSessions > 1 ? 's' : '' }} pour toi ce mois-ci
      </h1>
    </header>

    <DiaryMonthlyGrid :activities="activities" />

    <section class="space-y-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Journal récent</h2>

      <div v-if="activities.length === 0" class="text-center py-8 text-xs text-slate-400">
        Aucun moment enregistré pour l'instant — commence par une routine de 3 min ou note une marche.
      </div>

      <div v-else class="space-y-2.5">
        <DiaryActivityItem v-for="item in activities" :key="item.id" :entry="item" />
      </div>
    </section>
  </div>
</template>