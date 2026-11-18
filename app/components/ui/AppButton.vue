<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost';
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    block: false,
  }
);
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
    :class="[
      block ? 'w-full' : '',
      variant === 'primary' && 'bg-[var(--accent-primary)] text-slate-950 shadow-lg shadow-[var(--accent-primary)]/20',
      variant === 'secondary' && 'bg-[var(--bg-slate)] text-slate-100 border border-white/10 hover:bg-white/5',
      variant === 'ghost' && 'text-slate-400 hover:text-slate-200 px-3 py-2',
    ]"
  >
    <slot />
  </button>
</template>