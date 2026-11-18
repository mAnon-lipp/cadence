<script setup lang="ts">
import { Mic, MicOff, ExternalLink } from '@lucide/vue';

defineProps<{
  isListening: boolean;
  isLocked: boolean;
  bpm: number;
  micError: string | null;
}>();

defineEmits<{
  toggleMic: [];
}>();
</script>

<template>
  <div class="flex items-center justify-between gap-2 rounded-2xl bg-[var(--bg-slate)]/90 border border-white/10 px-3.5 py-2.5">
    <button
      type="button"
      @click="$emit('toggleMic')"
      class="flex items-center gap-2 text-left"
    >
      <span
        class="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
        :class="isListening ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-white/5 text-slate-400'"
      >
        <Mic v-if="isListening" class="w-4 h-4 animate-pulse" />
        <MicOff v-else class="w-4 h-4" />
      </span>
      <div>
        <p class="text-xs font-semibold text-white">
          <template v-if="micError">{{ micError }}</template>
          <template v-else-if="isListening">
            {{ isLocked ? `${bpm} BPM verrouillé` : 'Écoute du rythme...' }}
          </template>
          <template v-else>Activer le micro</template>
        </p>
        <p class="text-[10px] text-slate-400">
          {{ isListening ? 'Synchronisé à ta musique' : 'Pour caler sur YouTube Music' }}
        </p>
      </div>
    </button>

    <a
      href="https://music.youtube.com"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition-colors"
    >
      <span>YT Music</span>
      <ExternalLink class="w-3 h-3 opacity-75" />
    </a>
  </div>
</template>