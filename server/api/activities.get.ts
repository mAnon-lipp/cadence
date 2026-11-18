import { prisma } from '../utils/prisma';

export default defineEventHandler(async () => {
  return prisma.activity.findMany({
    orderBy: { date: 'desc' },
  });
});