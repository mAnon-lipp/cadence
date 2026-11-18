import { INITIAL_EXERCISES } from '~/data/exercises';
import { prisma } from '../utils/prisma';

export default defineEventHandler(async () => {
  const count = await prisma.exercise.count();

  // Seed automatique au tout premier lancement
  if (count === 0) {
    await prisma.exercise.createMany({
      data: INITIAL_EXERCISES.map((ex) => ({
        name: ex.name,
        category: ex.category,
        backSafety: ex.backSafety,
        cue: ex.cue,
        bpmMin: ex.idealBpmRange[0],
        bpmMax: ex.idealBpmRange[1],
        upBeats: ex.pattern.upBeats,
        holdBeats: ex.pattern.holdBeats,
        downBeats: ex.pattern.downBeats,
        cycles: ex.cycles,
        sourceUrl: ex.sourceUrl ?? null,
      })),
    });
  }

  return prisma.exercise.findMany({
    orderBy: { createdAt: 'desc' },
  });
});