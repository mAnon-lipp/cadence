<script setup lang="ts">
import { X } from '@lucide/vue';

defineProps<{
  open: boolean;
  title: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-3xl bg-[#181b26] border border-white/10 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">{{ title }}</h3>
          <button @click="$emit('close')" class="p-1.5 rounded-full text-slate-400 hover:bg-white/10">
            <X class="w-5 h-5" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>