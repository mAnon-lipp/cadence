import { prisma } from '../utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return prisma.exercise.create({
    data: {
      name: body.name,
      category: body.category || 'inspi',
      backSafety: body.backSafety || 'safe',
      cue: body.cue || 'Mouvement importé — garde le dos aligné et respire.',
      bpmMin: body.bpmMin ?? 75,
      bpmMax: body.bpmMax ?? 95,
      upBeats: body.upBeats ?? 4,
      holdBeats: body.holdBeats ?? 1,
      downBeats: body.downBeats ?? 4,
      cycles: body.cycles ?? 6,
      sourceUrl: body.sourceUrl || null,
    },
  });
});