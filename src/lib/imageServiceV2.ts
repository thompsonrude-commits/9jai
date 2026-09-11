import { buildFinalImagePrompt, generateImageWithFallback, GeneratedImage, GenerationStage } from './imageService';

// Wrapper that calls the canonical backend path and accepts provider controls
export async function generateImage(prompt: string, options?: { preferredProviders?: string[]; allowFallback?: boolean }, onStage?: (stage: GenerationStage) => void): Promise<GeneratedImage> {
  onStage?.('analyzing');
  await new Promise((resolve) => setTimeout(resolve, 200));
  onStage?.('expanding');

  try {
    onStage?.('planning');
    // Attach Firebase ID token for authenticated backend calls if available
    let headers: Record<string,string> = { 'Content-Type': 'application/json' };
    try {
      const { auth } = await import('./firebase');
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (tokenErr) {
      // ignore
    }

    const bodyPayload: any = { prompt };
    if (options?.preferredProviders) bodyPayload.preferredProviders = options.preferredProviders;
    if (typeof options?.allowFallback === 'boolean') bodyPayload.allowFallback = options.allowFallback;

    const response = await fetch('/api/v1/image/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) throw new Error(`Generation failed: ${response.status}`);

    const data = await response.json();
    if (!data) throw new Error('No response body');

    if (data.generationId) {
      return {
        id: data.generationId,
        prompt,
        imageUrl: '',
        generatedAt: Date.now(),
        model: data.model || data.provider || 'unknown',
        provider: data.provider || null,
        metadata: data.metadata || null,
      };
    }

    if (data.imageUrl) {
      return {
        id: `img_${Date.now()}`,
        prompt,
        imageUrl: data.imageUrl,
        generatedAt: Date.now(),
        model: data.model || data.provider || 'unknown',
        provider: data.provider || null,
        metadata: data.metadata || null,
      };
    }

    throw new Error('No imageUrl or generationId returned');
  } catch (err: any) {
    console.warn('[ImageServiceV2] generateImageCanonical failed:', err?.message || err);
    // Propagate the error to the caller so the UI can display an honest failure state and provenance.
    throw err;
  }
}

export { buildFinalImagePrompt }; // re-export for consumers
