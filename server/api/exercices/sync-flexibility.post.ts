import { FLEXIBILITY_EXERCISES } from '../../../app/data/exercises';

export default defineEventHandler(async () => {
  const existing = await prisma.exercise.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((e) => e.name));

  const toCreate = FLEXIBILITY_EXERCISES.filter((ex) => !existingNames.has(ex.name));

  if (toCreate.length > 0) {
    await prisma.exercise.createMany({
      data: toCreate.map((ex) => ({
        name: ex.name,
        category: ex.category,
        backSafety: ex.backSafety,
        cue: ex.cue,
        steps: ex.steps ?? [],
        bpmMin: ex.idealBpmRange[0],
        bpmMax: ex.idealBpmRange[1],
        upBeats: ex.pattern.upBeats,
        holdBeats: ex.pattern.holdBeats,
        downBeats: ex.pattern.downBeats,
        cycles: ex.cycles,
      })),
    });
  }

  return { added: toCreate.length };
});