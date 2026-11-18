<script setup lang="ts">
defineProps<{
  highlight?: boolean;
}>();
</script>

<template>
  <div
    class="rounded-2xl bg-[var(--bg-slate)] p-4 border transition-colors"
    :class="highlight ? 'border-[var(--accent-primary)]/40 bg-[#222536]' : 'border-white/5'"
  >
    <slot />
  </div>
</template>