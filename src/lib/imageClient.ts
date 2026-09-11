import { GenerationStage, GeneratedImage, buildFinalImagePrompt } from './imageService';

export async function generateImage(prompt: string, options?: { preferredProviders?: string[]; allowFallback?: boolean }, onStage?: (stage: GenerationStage) => void): Promise<GeneratedImage> {
  onStage?.('analyzing');
  await new Promise((r) => setTimeout(r, 120));
  onStage?.('expanding');

  try {
    onStage?.('planning');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const { auth } = await import('./firebase');
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (e) {
      // ignore token acquisition errors — backend will enforce auth where required
    }

    const bodyPayload: any = { prompt };
    if (options?.preferredProviders) bodyPayload.preferredProviders = options.preferredProviders;
    if (typeof options?.allowFallback === 'boolean') bodyPayload.allowFallback = options.allowFallback;

    const resp = await fetch('/api/v1/image/generate', { method: 'POST', headers, body: JSON.stringify(bodyPayload) });
    if (!resp.ok) {
      let errMsg = `Generation failed: ${resp.status}`;
      try {
        const body = await resp.json();
        if (body?.error) errMsg = body.error;
      } catch (e) {}
      throw new Error(errMsg);
    }

    const data = await resp.json();
    if (!data) throw new Error('No response from image generation endpoint');

    if (data.generationId) {
      return {
        id: data.generationId,
        prompt,
        imageUrl: data.mediaUrl || '',
        generatedAt: Date.now(),
        model: data.model || data.provider || 'unknown',
        provider: data.provider || null,
        metadata: data,
      } as GeneratedImage;
    }

    if (data.mediaUrl || data.imageUrl) {
      return {
        id: `img_${Date.now()}`,
        prompt,
        imageUrl: data.mediaUrl || data.imageUrl,
        generatedAt: Date.now(),
        model: data.model || data.provider || 'unknown',
        provider: data.provider || null,
        metadata: data,
      } as GeneratedImage;
    }

    throw new Error('Image generation returned no mediaUrl or generationId');
  } catch (err: any) {
    console.warn('[imageClient] generateImage failed:', err?.message || err);
    // Propagate errors so UI can show honest failure/provenance
    throw err;
  }
}

export { buildFinalImagePrompt };
