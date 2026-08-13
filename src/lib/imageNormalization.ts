export const DEFAULT_MAX_IMAGE_DIMENSION = 1600;
export const DEFAULT_MAX_INLINE_IMAGE_BYTES = 1_500_000;
export const DEFAULT_IMAGE_QUALITY = 0.82;

export interface NormalizedImageResult {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  wasNormalized: boolean;
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s.exec(dataUrl || '');
  if (!match) {
    return { mimeType: 'image/jpeg', base64: dataUrl || '' };
  }
  return { mimeType: match[1].toLowerCase(), base64: match[2] || '' };
}

export function estimateDataUrlSizeBytes(dataUrl: string): number {
  const { base64 } = parseDataUrl(dataUrl);
  const normalized = (base64 || '').replace(/\s+/g, '');
  if (!normalized) return 0;
  const padding = normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.ceil((normalized.length * 3) / 4) - padding);
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image could not be decoded.'));
    img.src = dataUrl;
  });
}

export async function normalizeImageForVision(
  imageDataUrl: string,
  options: {
    maxDimension?: number;
    maxBytes?: number;
    quality?: number;
  } = {}
): Promise<NormalizedImageResult> {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    throw new Error('Invalid image payload.');
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_IMAGE_DIMENSION;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_INLINE_IMAGE_BYTES;
  const quality = options.quality ?? DEFAULT_IMAGE_QUALITY;

  const { mimeType } = parseDataUrl(imageDataUrl);
  const originalSize = estimateDataUrlSizeBytes(imageDataUrl);

  try {
    const img = await loadImage(imageDataUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      throw new Error('Image dimensions could not be determined.');
    }

    if (originalSize <= maxBytes && width <= maxDimension && height <= maxDimension) {
      return {
        dataUrl: imageDataUrl,
        mimeType,
        width,
        height,
        sizeBytes: originalSize,
        wasNormalized: false,
      };
    }

    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, maxDimension / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas is not available in this browser.');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let outputMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    let outputQuality = quality;
    let candidate = canvas.toDataURL(outputMime, outputQuality);
    let candidateSize = estimateDataUrlSizeBytes(candidate);

    while (candidateSize > maxBytes && outputQuality > 0.55) {
      outputQuality -= 0.05;
      candidate = canvas.toDataURL(outputMime, outputQuality);
      candidateSize = estimateDataUrlSizeBytes(candidate);
    }

    if (candidateSize > maxBytes && outputMime !== 'image/jpeg') {
      outputMime = 'image/jpeg';
      outputQuality = quality;
      candidate = canvas.toDataURL(outputMime, outputQuality);
      candidateSize = estimateDataUrlSizeBytes(candidate);
      while (candidateSize > maxBytes && outputQuality > 0.55) {
        outputQuality -= 0.05;
        candidate = canvas.toDataURL(outputMime, outputQuality);
        candidateSize = estimateDataUrlSizeBytes(candidate);
      }
    }

    let scale = 0.95;
    while (candidateSize > maxBytes && scale > 0.45) {
      scale -= 0.1;
      const nextWidth = Math.max(1, Math.round(canvas.width * scale));
      const nextHeight = Math.max(1, Math.round(canvas.height * scale));
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = nextWidth;
      nextCanvas.height = nextHeight;
      const nextCtx = nextCanvas.getContext('2d');
      if (!nextCtx) break;
      nextCtx.clearRect(0, 0, nextWidth, nextHeight);
      nextCtx.drawImage(img, 0, 0, nextWidth, nextHeight);
      candidate = nextCanvas.toDataURL(outputMime, outputQuality);
      candidateSize = estimateDataUrlSizeBytes(candidate);
    }

    if (candidateSize > maxBytes) {
      throw new Error('IMAGE_TOO_LARGE');
    }

    return {
      dataUrl: candidate,
      mimeType: outputMime,
      width: canvas.width,
      height: canvas.height,
      sizeBytes: candidateSize,
      wasNormalized: true,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Image validation failed.';
    if (msg === 'IMAGE_TOO_LARGE') throw new Error('IMAGE_TOO_LARGE');
    throw new Error(msg);
  }
}
