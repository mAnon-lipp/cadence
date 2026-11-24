import { GoogleGenAI, Type } from '@google/genai';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const allExercises = await prisma.exercise.findMany();

  if (!allExercises.length) return { updated: 0 };

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  // Détection des modèles Flash disponibles
  let modelsToTry: string[] = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  try {
    const pager = await ai.models.list();
    const available: string[] = [];
    for await (const m of pager) {
      const name = m.name?.replace('models/', '') || '';
      if (
        name.includes('flash') &&
        !name.includes('image') &&
        !name.includes('audio') &&
        !name.includes('tts') &&
        !name.includes('thinking')
      ) {
        available.push(name);
      }
    }
    if (available.length > 0) modelsToTry = available;
  } catch {}

  const prompt = `Tu es un kinésithérapeute et coach de mobilité spécialisé dans la protection du dos et la souplesse.
Pour chaque exercice de la liste suivante, rédige en français :
1. "cue" : un mémo ultra-court (1 phrase max) à lire en plein mouvement.
2. "steps" : un tableau de EXACTEMENT 3 consignes précises :
   - Étape 1 (Installation) : position exacte des mains, pieds, genoux et placement du bassin.
   - Étape 2 (Mouvement & souffle) : comment entrer dans l'étirement lentement et quand inspirer/expirer.
   - Étape 3 (Sécurité dos) : le repère précis pour ne pas arrondir ni cambrer excessivement les lombaires.

Exercices à détailler :
${JSON.stringify(allExercises.map((e) => ({ id: e.id, name: e.name, cue: e.cue })))}`;

  const schema = {
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
  };

  let parsed: any = null;
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: schema,
      });
      parsed = JSON.parse(res.text || '{"items":[]}');
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!parsed) {
    throw createError({
      statusCode: 502,
      statusMessage: lastErr?.message || 'Impossible de contacter Gemini pour détailler les exercices.',
    });
  }

  let updatedCount = 0;
  for (const item of parsed.items || []) {
    if (Array.isArray(item.steps) && item.steps.length > 0) {
      await prisma.exercise.update({
        where: { id: item.id },
        data: {
          cue: item.cue,
          steps: item.steps,
        },
      });
      updatedCount++;
    }
  }

  return { updated: updatedCount };
});