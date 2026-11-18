import type { Exercise, ExerciseCategory, BackSafety } from '~/data/exercises';

export type EnergyMode = 'survie' | 'equilibre' | 'elan';
export type BackState = 'sensible' | 'raide' | 'ok';
export type BackFeeling = 'soulage' | 'ras' | 'raide';

export interface ActivityEntry {
  id: string;
  date: string;
  source: 'guided' | 'diary';
  mode?: EnergyMode | null;
  avgBpm?: number | null;
  exercisesDone?: string[];
  activityType?: 'marche' | 'course' | 'etirements' | 'autre' | null;
  note?: string | null;
  durationMinutes: number;
  backFeelingAfter: BackFeeling;
}

export function useCadenceStore() {
  const exercises = useState<Exercise[]>('cadence-exercises', () => []);
  const activities = useState<ActivityEntry[]>('cadence-activities', () => []);
  const isLoaded = useState<boolean>('cadence-loaded', () => false);
  const currentSessionPlan = useState<{
    mode: EnergyMode;
    backState: BackState;
    exercises: Exercise[];
  } | null>('cadence-session-plan', () => null);

  const mapExercise = (ex: any): Exercise => ({
    id: ex.id,
    name: ex.name,
    category: ex.category as ExerciseCategory,
    backSafety: ex.backSafety as BackSafety,
    cue: ex.cue,
    steps: Array.isArray(ex.steps) ? ex.steps : [],
    idealBpmRange: [ex.bpmMin, ex.bpmMax],
    pattern: {
      upBeats: ex.upBeats,
      holdBeats: ex.holdBeats,
      downBeats: ex.downBeats,
    },
    cycles: ex.cycles,
    sourceUrl: ex.sourceUrl ?? undefined,
  });

  // Charge les données depuis Prisma/Supabase
  const fetchAll = async () => {
    const [rawExercises, rawActivities] = await Promise.all([
      $fetch<any[]>('/api/exercises'),
      $fetch<ActivityEntry[]>('/api/activities'),
    ]);

    exercises.value = rawExercises.map(mapExercise);
    activities.value = rawActivities;
    isLoaded.value = true;
  };

  if (!isLoaded.value) {
    fetchAll();
  }

  const addActivity = async (entry: Omit<ActivityEntry, 'id' | 'date'> & { date?: string }) => {
    const created = await $fetch<ActivityEntry>('/api/activities', {
      method: 'POST',
      body: entry,
    });
    activities.value = [created, ...activities.value];
    return created;
  };

  const addCustomExercise = async (ex: {
    name: string;
    category: ExerciseCategory;
    backSafety: BackSafety;
    cue: string;
    steps?: string[];
    sourceUrl?: string;
  }) => {
    const created = await $fetch<any>('/api/exercises', {
      method: 'POST',
      body: ex,
    });

    const formatted = mapExercise(created);
    exercises.value = [formatted, ...exercises.value];
    return formatted;
  };

  const addBatchExercises = async (
    items: Array<{
      name: string;
      category: ExerciseCategory;
      backSafety: BackSafety;
      cue: string;
      steps?: string[];
      bpmMin?: number;
      bpmMax?: number;
      upBeats?: number;
      holdBeats?: number;
      downBeats?: number;
      cycles?: number;
      sourceUrl?: string;
    }>
  ) => {
    const createdList = await Promise.all(
      items.map((item) =>
        $fetch<any>('/api/exercises', {
          method: 'POST',
          body: item,
        })
      )
    );

    const formattedList = createdList.map(mapExercise);
    exercises.value = [...formattedList, ...exercises.value];
    return formattedList;
  };

  const enrichAllExercises = async () => {
    const res = await $fetch<{ updated: number }>('/api/exercises/enrich', {
      method: 'POST',
    });
    await fetchAll();
    return res;
  };

  const buildSession = (mode: EnergyMode, backState: BackState) => {
    const targetCount = mode === 'survie' ? 2 : mode === 'equilibre' ? 4 : 6;

    const compatible = exercises.value.filter((ex) => {
      if (backState === 'sensible') return ex.category === 'decompression';
      if (backState === 'raide') {
        return ex.category === 'decompression' || ex.category === 'mobilite' || ex.category === 'inspi';
      }
      return true;
    });

    const pool = compatible.length > 0 ? [...compatible] : [...exercises.value];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    currentSessionPlan.value = { mode, backState, exercises: selected };
    return currentSessionPlan.value;
  };

  const monthlyStats = computed(() => {
    const now = new Date();
    const thisMonth = activities.value.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const relievedCount = thisMonth.filter((a) => a.backFeelingAfter === 'soulage').length;
    return {
      totalSessions: thisMonth.length,
      relievedCount,
    };
  });

  const smartSuggestion = computed(() => {
    const last = activities.value[0];
    if (!last) {
      return {
        title: 'Première découverte • 5 min',
        subtitle: 'Une routine ultra-douce pour tester le rythme sans pression.',
        mode: 'survie' as EnergyMode,
        backState: 'sensible' as BackState,
      };
    }

    const hoursSince = (Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60);

    if (last.source === 'diary' && last.activityType === 'course' && hoursSince < 36) {
      return {
        title: 'Récupération post-run • 5 min',
        subtitle: 'Suite à ta sortie course, étirements psoas & décompression lombaire.',
        mode: 'survie' as EnergyMode,
        backState: 'raide' as BackState,
      };
    }

    if (last.source === 'diary' && last.activityType === 'marche' && hoursSince < 36) {
      return {
        title: 'Déverrouillage haut du dos • 12 min',
        subtitle: 'Tu as déjà bien marché : focus mobilité thoracique & posture.',
        mode: 'equilibre' as EnergyMode,
        backState: 'raide' as BackState,
      };
    }

    if (hoursSince > 72) {
      return {
        title: 'Reprise en douceur • 3 min',
        subtitle: 'Juste deux mouvements au sol pour délier le bas du dos.',
        mode: 'survie' as EnergyMode,
        backState: 'sensible' as BackState,
      };
    }

    return {
      title: 'Routine du soir • 15 min',
      subtitle: 'Un mix mobilité et gainage profond calé sur ta playlist.',
      mode: 'equilibre' as EnergyMode,
      backState: 'ok' as BackState,
    };
  });

  return {
    exercises,
    activities,
    isLoaded,
    currentSessionPlan,
    monthlyStats,
    smartSuggestion,
    fetchAll,
    addActivity,
    addCustomExercise,
    addBatchExercises,
    enrichAllExercises,
    buildSession,
  };
}