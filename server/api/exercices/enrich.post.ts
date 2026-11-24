import { GoogleGenAI, Type } from '@google/genai';

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY manquante dans les variables Vercel.',
    });
  }

  // On ne récupère que les exercices sans étapes détaillées, par lot de 4 max
  const unenriched = await prisma.exercise.findMany({
    where: {
      steps: { isEmpty: true },
    },
    take: 4,
  });

  if (!unenriched.length) {
    return { updated: 0, remaining: 0 };
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const prompt = `Tu es un kinésithérapeute spécialisé dans les douleurs lombaires et la souplesse.
Pour chaque exercice de la liste suivante, rédige en français :
1. "cue" : un mémo ultra-court (1 phrase max) à lire en plein mouvement.
2. "steps" : un tableau de EXACTEMENT 3 consignes précises :
   - Étape 1 (Installation) : position exacte des mains, pieds, genoux et placement du bassin.
   - Étape 2 (Mouvement & souffle) : comment bouger lentement et quand inspirer/expirer.
   - Étape 3 (Sécurité dos) : le repère précis pour ne pas arrondir ni cambrer excessivement les lombaires.

Exercices à détailler :
${JSON.stringify(unenriched.map((e) => ({ id: e.id, name: e.name, cue: e.cue })))}`;

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

  for (const modelName of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
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
      statusMessage: lastErr?.message || 'Erreur lors de l’appel à Gemini.',
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

  const remaining = await prisma.exercise.count({
    where: { steps: { isEmpty: true } },
  });

  return { updated: updatedCount, remaining };
});