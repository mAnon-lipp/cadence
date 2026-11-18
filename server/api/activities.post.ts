import { prisma } from '../utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return prisma.activity.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      source: body.source,
      mode: body.mode ?? null,
      avgBpm: body.avgBpm ?? null,
      exercisesDone: body.exercisesDone ?? [],
      activityType: body.activityType ?? null,
      note: body.note ?? null,
      durationMinutes: Number(body.durationMinutes),
      backFeelingAfter: body.backFeelingAfter,
      steps: body.steps ?? [],
    },
  });
});