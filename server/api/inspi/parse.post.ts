import { GoogleGenAI, Type } from '@google/genai';

async function resolveFinalUrl(rawUrl: string): Promise<string> {
  try {
    const res = await fetch(rawUrl, { method: 'HEAD', redirect: 'follow' });
    return res.url.split('?')[0] ?? rawUrl.split('?')[0] ?? rawUrl;
  } catch {
    return rawUrl.split('?')[0] ?? rawUrl;
  }
}

async function fetchInstagramEmbedFallback(postUrl: string) {
  try {
    const cleanBase = postUrl.replace(/\/$/, '');
    const html = await $fetch<string>(`${cleanBase}/embed/captioned/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
      responseType: 'text',
    });

    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const videoUrl = videoMatch
      ? videoMatch[1]!.replace(/\\u0026/g, '&').replace(/\\\//g, '/')
      : null;

    const captionMatch = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/);
    const caption = captionMatch
      ? captionMatch[1]!.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : '';

    const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1]!.replace(/&amp;/g, '&') : null;

    return { videoUrl, caption, imageUrl };
  } catch {
    return { videoUrl: null, caption: '', imageUrl: null };
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ url?: string }>(event);

  if (!body?.url) {
    throw createError({ statusCode: 400, statusMessage: 'URL manquante.' });
  }

  const cleanUrl = await resolveFinalUrl(body.url.trim());
  const isTikTok = cleanUrl.includes('tiktok.com');
  const isInstagram = cleanUrl.includes('instagram.com');

  if (!isTikTok && !isInstagram) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Lien non supporté. Colle un lien TikTok ou Instagram.',
    });
  }

  const platform = isTikTok ? 'tiktok' : 'instagram';
  let caption = '';
  let videoUrl: string | null = null;
  let imageUrls: string[] = [];

  // 1. Extraction RAPIDE (sans Apify si possible pour éviter le timeout Vercel)
  if (isTikTok) {
    try {
      const tikwm = await $fetch<any>('https://www.tikwm.com/api/', {
        method: 'POST',
        timeout: 8000,
        body: new URLSearchParams({ url: cleanUrl, hd: '1' }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (tikwm?.data) {
        caption = tikwm.data.title || '';
        videoUrl = tikwm.data.play || tikwm.data.wmplay || null;
      }
    } catch {}

    // Fallback Apify uniquement si TikWM n'a rien donné (timeout court à 20s)
    if (!videoUrl && !caption && config.apifyApiToken) {
      try {
        const apifyRes = await $fetch<any[]>(
          `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${config.apifyApiToken}&timeout=20`,
          {
            method: 'POST',
            timeout: 22000,
            body: { postURLs: [cleanUrl], resultsPerPage: 1, shouldDownloadVideos: false },
          }
        );
        const item = apifyRes?.[0];
        caption = item?.text || '';
        videoUrl = item?.mediaUrls?.[0] || item?.videoUrl || item?.videoMeta?.downloadAddr || null;
      } catch {}
    }
  } else {
    // Instagram : tente d'abord le embed rapide (< 2s)
    const embedData = await fetchInstagramEmbedFallback(cleanUrl);
    caption = embedData.caption;
    videoUrl = embedData.videoUrl;
    if (embedData.imageUrl && !videoUrl) imageUrls = [embedData.imageUrl];

    // Fallback Apify avec timeout strict à 20s si le embed est bloqué
    if (!videoUrl && imageUrls.length === 0 && config.apifyApiToken) {
      try {
        const apifyRes = await $fetch<any[]>(
          `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${config.apifyApiToken}&timeout=20`,
          {
            method: 'POST',
            timeout: 22000,
            body: { directUrls: [cleanUrl], resultsType: 'posts', resultsLimit: 1 },
          }
        );
        const item = apifyRes?.[0];
        caption = caption || item?.caption || '';
        videoUrl =
          item?.videoUrl ||
          item?.video_url ||
          item?.videoPlaybackUrl ||
          item?.childPosts?.find((c: any) => c.videoUrl)?.videoUrl ||
          null;
        if (Array.isArray(item?.images) && item.images.length > 0) {
          imageUrls = item.images;
        }
      } catch {}
    }
  }

  // 2. Préparation Gemini (inlineData direct = 5x plus rapide que ai.files.upload)
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const generationConfig = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              backSafety: { type: Type.STRING },
              cue: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              bpmMin: { type: Type.INTEGER },
              bpmMax: { type: Type.INTEGER },
              upBeats: { type: Type.INTEGER },
              holdBeats: { type: Type.INTEGER },
              downBeats: { type: Type.INTEGER },
              cycles: { type: Type.INTEGER },
            },
            required: [
              'name',
              'category',
              'backSafety',
              'cue',
              'steps',
              'bpmMin',
              'bpmMax',
              'upBeats',
              'holdBeats',
              'downBeats',
              'cycles',
            ],
          },
        },
      },
      required: ['exercises'],
    },
  };

  const prompt = `Tu es un coach kiné spécialisé dans le soin du dos et la souplesse.
Analyse ce contenu ${platform} (lis tous les textes incrustés sur la vidéo/images et observe les mouvements).
Extrais CHAQUE exercice distinct en français.
- "category" : "decompression", "mobilite", "souplesse", "renfo", ou "inspi"
- "backSafety" : "safe" ou "moderate"
- "cue" : mémo ultra-court (1 phrase)
- "steps" : tableau de 3 repères précis (1. Installation, 2. Mouvement & souffle, 3. Sécurité dos)
- "bpmMin": 70, "bpmMax": 95, "upBeats": 4, "holdBeats": 2, "downBeats": 4, "cycles": 6.
${caption ? `Légende : "${caption}"` : ''}`;

  const contents: any[] = [];

  if (videoUrl) {
    const videoRes = await fetch(videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (videoRes.ok) {
      const buf = Buffer.from(await videoRes.arrayBuffer());
      // Envoi direct en mémoire si < 18 Mo (évite les 15s d'attente d'indexation Google File API)
      if (buf.byteLength < 18 * 1024 * 1024) {
        contents.push({
          inlineData: {
            data: buf.toString('base64'),
            mimeType: 'video/mp4',
          },
        });
      }
    }
  } else if (imageUrls.length > 0) {
    for (const imgUrl of imageUrls.slice(0, 4)) {
      const imgRes = await fetch(imgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        contents.push({
          inlineData: {
            data: buf.toString('base64'),
            mimeType: imgRes.headers.get('content-type') || 'image/jpeg',
          },
        });
      }
    }
  }

  if (contents.length === 0 && !caption) {
    throw createError({
      statusCode: 422,
      statusMessage: "Impossible de récupérer la vidéo ou sa description (post privé ou protégé).",
    });
  }

  contents.push(prompt);

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: generationConfig,
  });

  const parsed = JSON.parse(res.text || '{"exercises":[]}');

  return {
    exercises: (parsed?.exercises || []).map((ex: any) => ({
      ...ex,
      sourceUrl: cleanUrl,
    })),
  };
});