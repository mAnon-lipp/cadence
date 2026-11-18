<script setup lang="ts">
export interface PillOption {
  value: string;
  label: string;
  sublabel?: string;
}

defineProps<{
  modelValue: string;
  options: PillOption[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      @click="$emit('update:modelValue', opt.value)"
      class="flex flex-col items-center justify-center rounded-2xl py-3 px-2 text-center border transition-all active:scale-95"
      :class="
        modelValue === opt.value
          ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-white'
          : 'bg-[var(--bg-slate)] border-white/5 text-slate-400 hover:border-white/15'
      "
    >
      <span class="text-xs font-semibold">{{ opt.label }}</span>
      <span v-if="opt.sublabel" class="text-[10px] opacity-75 mt-0.5">{{ opt.sublabel }}</span>
    </button>
  </div>
</template>