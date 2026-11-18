<script setup lang="ts">
import { Sparkles, CalendarHeart, BookOpen } from '@lucide/vue';

const navItems = [
  { label: "Aujourd'hui", to: '/', icon: Sparkles },
  { label: 'Diary', to: '/diary', icon: CalendarHeart },
  { label: 'Bibliothèque', to: '/library', icon: BookOpen },
];
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-[#151823]/90 backdrop-blur-md border-t border-white/10">
    <div class="max-w-md mx-auto flex justify-around items-center h-16 px-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center gap-1 text-xs font-medium text-slate-400 transition-colors"
        active-class="text-[var(--accent-primary)]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>