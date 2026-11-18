import { GoogleGenAI, Type } from "@google/genai";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Résolution des liens courts (ex: vm.tiktok.com/xxx)
async function resolveFinalUrl(rawUrl: string): Promise<string> {
  try {
    const res = await fetch(rawUrl, { method: "HEAD", redirect: "follow" });
    return res.url.split("?")[0] ?? rawUrl.split("?")[0] ?? rawUrl;
  } catch {
    return rawUrl.split("?")[0] ?? rawUrl;
  }
}

// Fallback sur la page embed publique d'Instagram
async function fetchInstagramEmbedFallback(postUrl: string) {
  try {
    const cleanBase = postUrl.replace(/\/$/, "");
    const html = await $fetch<string>(`${cleanBase}/embed/captioned/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      responseType: "text",
    });

    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const videoUrl = videoMatch
      ? videoMatch[1]!.replace(/\\u0026/g, "&").replace(/\\\//g, "/")
      : null;

    const captionMatch = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/);
    const caption = captionMatch
      ? captionMatch[1]!
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1]!.replace(/&amp;/g, "&") : null;

    return { videoUrl, caption, imageUrl };
  } catch {
    return { videoUrl: null, caption: "", imageUrl: null };
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ url?: string }>(event);

  if (!body?.url) {
    throw createError({ statusCode: 400, statusMessage: "URL manquante." });
  }

  const cleanUrl = await resolveFinalUrl(body.url.trim());
  const isTikTok = cleanUrl.includes("tiktok.com");
  const isInstagram = cleanUrl.includes("instagram.com");

  if (!isTikTok && !isInstagram) {
    throw createError({
      statusCode: 400,
      statusMessage: "Lien non supporté. Colle un lien TikTok ou Instagram.",
    });
  }

  const platform = isTikTok ? "tiktok" : "instagram";

  // 1. Extraction métadonnées + sous-titres + médias via Apify
  let caption = "";
  let subtitles = "";
  let videoUrl: string | null = null;
  let imageUrls: string[] = [];

  try {
    if (isTikTok) {
      const apifyRes = await $fetch<any[]>(
        `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${config.apifyApiToken}&timeout=45`,
        {
          method: "POST",
          timeout: 50000,
          body: {
            postURLs: [cleanUrl],
            resultsPerPage: 1,
            shouldDownloadVideos: false,
            shouldDownloadSubtitles: true,
            shouldDownloadCovers: false,
          },
        },
      );
      const item = apifyRes?.[0];
      caption = item?.text || "";

      if (
        Array.isArray(item?.videoMeta?.subtitleLinks) &&
        item.videoMeta.subtitleLinks.length > 0
      ) {
        try {
          const subUrl =
            item.videoMeta.subtitleLinks[0].tiktokLink ||
            item.videoMeta.subtitleLinks[0].downloadLink;
          if (subUrl) {
            subtitles = await $fetch<string>(subUrl, { responseType: "text" });
          }
        } catch {}
      }

      videoUrl =
        item?.mediaUrls?.[0] ||
        item?.videoUrl ||
        item?.videoMeta?.downloadAddr ||
        null;
    } else {
      const apifyRes = await $fetch<any[]>(
        `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${config.apifyApiToken}&timeout=45`,
        {
          method: "POST",
          timeout: 50000,
          body: {
            directUrls: [cleanUrl],
            resultsType: "posts",
            resultsLimit: 1,
          },
        },
      );
      const item = apifyRes?.[0];
      caption = item?.caption || "";
      videoUrl =
        item?.videoUrl ||
        item?.video_url ||
        item?.videoPlaybackUrl ||
        item?.childPosts?.find((c: any) => c.videoUrl)?.videoUrl ||
        null;

      if (Array.isArray(item?.images) && item.images.length > 0) {
        imageUrls = item.images;
      } else if (
        Array.isArray(item?.childPosts) &&
        item.childPosts.length > 0
      ) {
        imageUrls = item.childPosts
          .map((c: any) => c.displayUrl)
          .filter(Boolean);
      } else if (item?.displayUrl && !videoUrl) {
        imageUrls = [item.displayUrl];
      }

      if (!caption && !videoUrl && imageUrls.length === 0) {
        const embedData = await fetchInstagramEmbedFallback(cleanUrl);
        if (embedData.caption) caption = embedData.caption;
        if (embedData.videoUrl) videoUrl = embedData.videoUrl;
        if (embedData.imageUrl && !videoUrl) imageUrls = [embedData.imageUrl];
      }
    }
  } catch (err: any) {
    console.error("[ERREUR APIFY] :", err?.data || err?.message || err);
    throw createError({
      statusCode: 502,
      statusMessage:
        "Impossible de récupérer le post (compte privé, timeout ou lien invalide).",
    });
  }

  // 2. Configuration Gemini SDK
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        hasExercises: {
          type: Type.BOOLEAN,
          description:
            "true si des exercices ou étirements précis sont présents, false sinon",
        },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Nom clair de l’exercice en français",
              },
              category: {
                type: Type.STRING,
                description: "Parmi : decompression, mobilite, renfo, inspi",
              },
              backSafety: {
                type: Type.STRING,
                description:
                  "safe (si doux/mobilité/sans charge) ou moderate (si gainage/renfo actif)",
              },
              cue: {
                type: Type.STRING,
                description:
                  "Consigne courte et bienveillante pour protéger le bas du dos",
              },
              // Dans generationConfig -> properties -> exercises -> items -> properties :
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "Exactement 3 étapes courtes : 1. Position de départ précise, 2. Exécution & respiration, 3. Repère de sécurité lombaire",
              },
              bpmMin: { type: Type.INTEGER },
              bpmMax: { type: Type.INTEGER },
              upBeats: { type: Type.INTEGER },
              holdBeats: { type: Type.INTEGER },
              downBeats: { type: Type.INTEGER },
              cycles: { type: Type.INTEGER },
            },
            required: [
              "name",
              "category",
              "backSafety",
              "cue",
              "bpmMin",
              "bpmMax",
              "upBeats",
              "holdBeats",
              "downBeats",
              "cycles",
              "steps",
            ],
          },
        },
      },
      required: ["hasExercises", "exercises"],
    },
  };

  // Auto-détection des modèles Flash disponibles sur ta clé
  let modelsToTry: string[] = ["gemini-2.5-flash", "gemini-2.0-flash"];
  try {
    const pager = await ai.models.list();
    const availableFlash: string[] = [];
    for await (const m of pager) {
      const name = m.name?.replace("models/", "") || "";
      if (
        name.includes("flash") &&
        !name.includes("image") &&
        !name.includes("audio") &&
        !name.includes("tts") &&
        !name.includes("thinking")
      ) {
        availableFlash.push(name);
      }
    }
    if (availableFlash.length > 0) modelsToTry = availableFlash;
  } catch {}

  async function runGeminiWithFallback(contents: any) {
    let lastErr: any = null;
    for (const modelName of modelsToTry) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents,
          config: generationConfig,
        });
        return JSON.parse(res.text || "{}");
      } catch (err: any) {
        lastErr = err;
        console.warn(
          `[WARN GEMINI] ${modelName} échec (${err?.status || err?.message})`,
        );
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw lastErr;
  }

  let parsed: any = null;
  const combinedText = [caption, subtitles]
    .filter(Boolean)
    .join("\n\n--- Transcription audio ---\n");

  const baseInstructions = `Tu es un coach kiné bienveillant spécialisé dans le soin du dos.
Extrais CHAQUE exercice ou étirement distinct présenté dans ce contenu ${platform}.
Traduis les noms en français si nécessaire.
Pour chaque mouvement, déduis :
- "category" : "decompression" (étirements passifs/soulagement lombaire), "mobilite" (rotations/souplesse), "renfo" (gainage doux/fessiers), ou "inspi"
- "backSafety" : "safe" si très doux, "moderate" s'il demande un gainage actif
- "cue" : une consigne posture claire pour ne pas cambrer ni brusquer le dos
- des temps musicaux naturels ("upBeats": 4, "holdBeats": 1 ou 2, "downBeats": 4, "cycles": 6, "bpmMin": 70, "bpmMax": 95).`;

  // 3A. TENTATIVE 1 : Analyse du texte + sous-titres (uniquement s'ils décrivent déjà les mouvements)
  if (combinedText.trim().length >= 40) {
    const textPrompt = `${baseInstructions}
Si la description ne liste PAS clairement les exercices (par exemple si tout est montré visuellement ou écrit uniquement sur la vidéo), mets "hasExercises": false.

Texte brut :
"""
${combinedText}
"""`;
    try {
      const result = await runGeminiWithFallback(textPrompt);
      if (
        result?.hasExercises &&
        Array.isArray(result.exercises) &&
        result.exercises.length > 0
      ) {
        parsed = result;
      }
    } catch {}
  }

  // 3B. TENTATIVE 2 (MULTIMODAL) : Lecture directe de la vidéo ou des images du carrousel
  if (!parsed) {
    if (isTikTok && !videoUrl) {
      try {
        const tikwm = await $fetch<any>("https://www.tikwm.com/api/", {
          method: "POST",
          body: new URLSearchParams({ url: cleanUrl, hd: "1" }).toString(),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (tikwm?.data?.play) videoUrl = tikwm.data.play;
      } catch {}
    }

    if (videoUrl) {
      const tempFilePath = join(tmpdir(), `cadence_${Date.now()}.mp4`);
      let uploadedFile: any = null;

      try {
        let directMp4Url = videoUrl;
        if (isTikTok) {
          try {
            const tikwm = await $fetch<any>("https://www.tikwm.com/api/", {
              method: "POST",
              body: new URLSearchParams({ url: cleanUrl, hd: "1" }).toString(),
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            if (tikwm?.data?.play) directMp4Url = tikwm.data.play;
          } catch {}
        }

        const videoRes = await fetch(directMp4Url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!videoRes.ok)
          throw new Error(`Échec téléchargement vidéo (${videoRes.status})`);

        await writeFile(
          tempFilePath,
          Buffer.from(await videoRes.arrayBuffer()),
        );

        uploadedFile = await ai.files.upload({
          file: tempFilePath,
          config: { mimeType: "video/mp4" },
        });

        let fileState = await ai.files.get({ name: uploadedFile.name });
        let retries = 0;
        while (fileState.state === "PROCESSING" && retries < 15) {
          await new Promise((r) => setTimeout(r, 2000));
          fileState = await ai.files.get({ name: uploadedFile.name });
          retries++;
        }

        if (fileState.state !== "ACTIVE") {
          throw new Error(
            `Traitement vidéo Gemini incomplet (${fileState.state})`,
          );
        }

        const videoPrompt = `Regarde et écoute attentivement cette vidéo ${platform} (lis TOUS les textes incrustés à l'écran, les noms des exercices et observe les mouvements).
${baseInstructions}
${caption ? `Contexte de la légende : "${caption}"` : ""}`;

        parsed = await runGeminiWithFallback([
          {
            fileData: { fileUri: fileState.uri, mimeType: fileState.mimeType },
          },
          videoPrompt,
        ]);
      } catch (err: any) {
        console.error("[ERREUR GEMINI VIDÉO] :", err?.message || err);
        throw createError({
          statusCode: 502,
          statusMessage: `Échec extraction vidéo : ${err?.message || "erreur inconnue"}`,
        });
      } finally {
        await unlink(tempFilePath).catch(() => {});
        if (uploadedFile?.name) {
          await ai.files.delete({ name: uploadedFile.name }).catch(() => {});
        }
      }
    } else if (imageUrls.length > 0) {
      try {
        const imageParts: any[] = [];
        for (const imgUrl of imageUrls.slice(0, 6)) {
          const imgRes = await fetch(imgUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            imageParts.push({
              inlineData: {
                data: buf.toString("base64"),
                mimeType: imgRes.headers.get("content-type") || "image/jpeg",
              },
            });
          }
        }

        if (imageParts.length === 0)
          throw new Error("Impossible de télécharger les images du post");

        const imagePrompt = `Lis attentivement le texte et observe les postures sur ces images d'un post ${platform}.
${baseInstructions}
${caption ? `Contexte de la légende : "${caption}"` : ""}`;

        parsed = await runGeminiWithFallback([...imageParts, imagePrompt]);
      } catch (err: any) {
        console.error("[ERREUR GEMINI IMAGES] :", err?.message || err);
        throw createError({
          statusCode: 502,
          statusMessage: `Échec extraction images : ${err?.message || "erreur inconnue"}`,
        });
      }
    } else {
      throw createError({
        statusCode: 422,
        statusMessage:
          "Impossible d'accéder au média de ce post (compte privé ou protégé).",
      });
    }
  }

  return {
    exercises: (parsed?.exercises || []).map((ex: any) => ({
      ...ex,
      sourceUrl: cleanUrl,
    })),
  };
});
