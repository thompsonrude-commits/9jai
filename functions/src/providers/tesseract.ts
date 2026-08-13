/**
 * Tesseract OCR Provider — FREE, NO API KEY REQUIRED
 * 
 * Tesseract.js is a pure JavaScript OCR library
 * Supports 100+ languages including Nigerian languages
 * 
 * Installation:
 *   npm install tesseract.js
 * 
 * FREE-FIRST COMPLIANCE: ✅ YES
 */

// Dynamic import to avoid loading during initialization
async function loadTesseract() {
  const { createWorker } = await import('tesseract.js');
  return { createWorker };
}

/**
 * Extract text from image using Tesseract OCR
 */
export async function tesseractOCR(
  imageUrl: string,
  language = 'eng'
): Promise<{ text: string; confidence: number }> {
  const { createWorker } = await loadTesseract();
  const worker = await createWorker(language);
  
  try {
    const result = await worker.recognize(imageUrl);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100, // Convert 0-100 to 0-1
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text with detailed layout information
 */
export async function tesseractOCRWithLayout(
  imageUrl: string,
  language = 'eng'
): Promise<{
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  paragraphs: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}> {
  const { createWorker } = await loadTesseract();
  const worker = await createWorker(language);
  
  try {
    const result = await worker.recognize(imageUrl);
    const data = result.data as any;
    
    return {
      text: data.text,
      confidence: data.confidence / 100,
      words: (data.words || []).map((w: any) => ({
        text: w.text,
        confidence: w.confidence / 100,
        bbox: w.bbox,
      })),
      lines: (data.lines || []).map((l: any) => ({
        text: l.text,
        confidence: l.confidence / 100,
        bbox: l.bbox,
      })),
      paragraphs: (data.paragraphs || []).map((p: any) => ({
        text: p.text,
        confidence: p.confidence / 100,
        bbox: p.bbox,
      })),
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from image buffer (for uploads)
 */
export async function tesseractOCRFromBuffer(
  imageBuffer: Buffer,
  language = 'eng'
): Promise<{ text: string; confidence: number }> {
  const { createWorker } = await loadTesseract();
  const worker = await createWorker(language);
  
  try {
    const result = await worker.recognize(imageBuffer);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Multi-language OCR (try multiple languages)
 */
export async function tesseractMultiLanguage(
  imageUrl: string,
  languages: string[] = ['eng']
): Promise<{ text: string; confidence: number; language: string }> {
  const langString = languages.join('+');
  const { createWorker } = await loadTesseract();
  const worker = await createWorker(langString);
  
  try {
    const result = await worker.recognize(imageUrl);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
      language: langString,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Nigerian languages OCR (English + Nigerian languages)
 */
export async function tesseractNigerian(
  imageUrl: string
): Promise<{ text: string; confidence: number }> {
  // Tesseract supports: eng (English), yor (Yoruba), hau (Hausa), ibo (Igbo)
  // Note: Edo not yet in Tesseract official traineddata
  return tesseractMultiLanguage(imageUrl, ['eng', 'yor', 'hau', 'ibo']);
}

/**
 * Get supported languages
 */
export function getSupportedOCRLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'eng', name: 'English' },
    { code: 'yor', name: 'Yoruba' },
    { code: 'hau', name: 'Hausa' },
    { code: 'ibo', name: 'Igbo' },
    { code: 'ara', name: 'Arabic' },
    { code: 'fra', name: 'French' },
    { code: 'spa', name: 'Spanish' },
    { code: 'por', name: 'Portuguese' },
    { code: 'swa', name: 'Swahili' },
    { code: 'amh', name: 'Amharic' },
  ];
}

/**
 * Detect text orientation
 */
export async function detectTextOrientation(
  imageUrl: string
): Promise<{ angle: number; confidence: number }> {
  const { createWorker } = await loadTesseract();
  const worker = await createWorker('eng');
  
  try {
    const result = await worker.detect(imageUrl);
    
    return {
      angle: result.data.orientation_degrees || 0,
      confidence: result.data.orientation_confidence || 0,
    };
  } finally {
    await worker.terminate();
  }
}

