import { GoogleGenAI, Type } from '@google/genai';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const allExercises = await prisma.exercise.findMany();

  if (!allExercises.length) return { updated: 0 };

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const prompt = `Tu es un kinésithérapeute spécialisé dans les douleurs lombaires et la mobilité douce.
Pour chaque exercice de la liste suivante, rédige :
1. "cue" : un mémo ultra-court (1 phrase max) à lire en plein mouvement.
2. "steps" : un tableau de EXACTEMENT 3 consignes précises en français :
   - Étape 1 (Installation) : position exacte des mains, pieds, genoux et placement du bassin.
   - Étape 2 (Mouvement & souffle) : comment bouger lentement et quand inspirer/expirer.
   - Étape 3 (Sécurité dos) : le point de vigilance précis pour protéger les lombaires.

Exercices à détailler :
${JSON.stringify(allExercises.map((e) => ({ id: e.id, name: e.name, cue: e.cue })))}`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                cue: { type: Type.STRING },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['id', 'cue', 'steps'],
            },
          },
        },
        required: ['items'],
      },
    },
  });

  const parsed = JSON.parse(res.text || '{"items":[]}');

  for (const item of parsed.items || []) {
    await prisma.exercise.update({
      where: { id: item.id },
      data: {
        cue: item.cue,
        steps: item.steps,
      },
    });
  }

  return { updated: parsed.items?.length || 0 };
});