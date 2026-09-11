/**
 * Multimodal Processor — handles image, audio, PDF, video, and document uploads
 * Extracts content and prepares it for AI analysis
 */

import { unifiedChatStream } from './ai';

// ── Types ──────────────────────────────────────────────────────────────────

export type FileType = 'image' | 'audio' | 'pdf' | 'document' | 'video' | 'spreadsheet' | 'unknown';

export interface ProcessedFile {
  id: string;
  name: string;
  type: FileType;
  size: number;
  mimeType: string;
  preview?: string;       // base64 thumbnail or data URL
  extractedText?: string; // text content extracted from the file
  analysisHint?: string;  // hint for AI about what this file contains
  dataUrl?: string;       // full data URL for images
}

// ── File type detector ─────────────────────────────────────────────────────

export function detectFileType(file: File): FileType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/') || mime.startsWith('video/webm') && name.endsWith('.webm')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('spreadsheet') || mime.includes('excel') ||
    name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')
  ) return 'spreadsheet';
  if (
    mime.includes('word') || mime.includes('document') || mime.includes('text') ||
    name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.txt') || name.endsWith('.md')
  ) return 'document';

  return 'unknown';
}

// ── File size formatter ────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Image processor ────────────────────────────────────────────────────────

async function processImage(file: File): Promise<Partial<ProcessedFile>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve({
        preview: dataUrl,
        dataUrl,
        analysisHint: `User uploaded an image named "${file.name}". Analyze what you see in this image and relate it to the conversation context.`,
      });
    };
    reader.onerror = () => resolve({ analysisHint: `User uploaded an image: ${file.name}` });
    reader.readAsDataURL(file);
  });
}

// ── PDF processor ──────────────────────────────────────────────────────────
// Uses PDF.js if available, otherwise falls back to text extraction

async function processPDF(file: File): Promise<Partial<ProcessedFile>> {
  try {
    // Try to use PDF.js from CDN if available
    const pdfjsLib = (window as any).pdfjsLib;
    if (pdfjsLib) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      const maxPages = Math.min(pdf.numPages, 20); // limit to 20 pages
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n[Page ${i}]\n${pageText}`;
      }

      return {
        extractedText: fullText.slice(0, 15000), // limit to 15k chars
        analysisHint: `User uploaded a PDF document: "${file.name}" (${pdf.numPages} pages). The extracted text is provided below.`,
      };
    }
  } catch (err) {
    console.warn('[Multimodal] PDF.js extraction failed:', err);
  }

  // Fallback: read as text (works for text-based PDFs)
  try {
    const text = await file.text();
    if (text.length > 100) {
      return {
        extractedText: text.slice(0, 15000),
        analysisHint: `User uploaded a PDF: "${file.name}". Raw text extracted.`,
      };
    }
  } catch { /* ignore */ }

  return {
    analysisHint: `User uploaded a PDF document: "${file.name}". I cannot extract the text directly, but please describe what you'd like to know about it.`,
  };
}

// ── Document processor ─────────────────────────────────────────────────────

async function processDocument(file: File): Promise<Partial<ProcessedFile>> {
  try {
    const text = await file.text();
    return {
      extractedText: text.slice(0, 15000),
      analysisHint: `User uploaded a document: "${file.name}". The content is provided below.`,
    };
  } catch (err) {
    return {
      analysisHint: `User uploaded a document: "${file.name}". Please describe what you'd like to know about it.`,
    };
  }
}

// ── Spreadsheet processor ──────────────────────────────────────────────────

async function processSpreadsheet(file: File): Promise<Partial<ProcessedFile>> {
  try {
    // CSV handling (client-side)
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 50); // first 50 rows
      return {
        extractedText: lines.join('\n'),
        analysisHint: `User uploaded a CSV spreadsheet: "${file.name}". The data is provided below.`,
      };
    }

    // XLSX/XLS handling: if running in browser, try server-side parse endpoint for richer structure
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Only attempt fetch when available (browser runtime). In Node/test env this will be skipped.
      if (typeof fetch === 'function') {
        try {
          const arr = await file.arrayBuffer();
          // Convert ArrayBuffer to base64 for JSON transport to the functions bridge
          function arrayBufferToBase64(buffer: ArrayBuffer) {
            const bytes = new Uint8Array(buffer);
            let binary = '';
            const chunkSize = 0x8000;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              const chunk = bytes.subarray(i, i + chunkSize);
              binary += String.fromCharCode.apply(null, Array.from(chunk));
            }
            return btoa(binary);
          }
          const fileBase64 = arrayBufferToBase64(arr);

          const resp = await fetch('/api/v1/spreadsheet/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64, filename: file.name }),
          } as any);

          if (resp.ok) {
            const j = await resp.json();
            if (j && j.success && j.data) {
              // Build a compact textual preview so downstream code that expects extractedText still works
              const wb = j.data;
              const sheetSummaries = (wb.sheets || []).map((s: any) => {
                const hdr = s.headers ? s.headers.join(' | ') : '';
                const rows = (s.previewRows || []).slice(0, 5).map((r: any) => r.map((c: any) => (c === null || c === undefined) ? '' : String(c)).join(' | ')).join('\n');
                return `Sheet: ${s.name}\nHeaders: ${hdr}\nPreview:\n${rows}`;
              }).join('\n\n---\n\n');

              return {
                extractedText: sheetSummaries.slice(0, 15000),
                analysisHint: `User uploaded an Excel workbook: "${file.name}". Parsed ${wb.sheetCount} sheets.`,
              };
            }
          }
        } catch (err) {
          console.warn('[Multimodal] server-side spreadsheet parse failed:', err);
        }
      }
    }
  } catch (err) { console.warn('[Multimodal] processSpreadsheet error:', err); }

  return {
    analysisHint: `User uploaded a spreadsheet: "${file.name}". Please describe what analysis you'd like.`,
  };
}

// ── Video processor ────────────────────────────────────────────────────────

async function processVideo(file: File): Promise<Partial<ProcessedFile>> {
  // Extract a thumbnail from the video
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.currentTime = 1; // seek to 1 second

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 320, 180);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve({
          preview: thumbnail,
          analysisHint: `User uploaded a video: "${file.name}" (${formatFileSize(file.size)}). A thumbnail has been captured. Please describe what you'd like to do with this video.`,
        });
      } else {
        URL.revokeObjectURL(url);
        resolve({ analysisHint: `User uploaded a video: "${file.name}"` });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ analysisHint: `User uploaded a video: "${file.name}"` });
    };

    video.load();
  });
}

// ── Main processor ─────────────────────────────────────────────────────────

export async function processFile(file: File): Promise<ProcessedFile> {
  const type = detectFileType(file);
  const base: ProcessedFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    type,
    size: file.size,
    mimeType: file.type,
  };

  let extra: Partial<ProcessedFile> = {};

  switch (type) {
    case 'image':
      extra = await processImage(file);
      break;
    case 'pdf':
      extra = await processPDF(file);
      break;
    case 'document':
      extra = await processDocument(file);
      break;
    case 'spreadsheet':
      extra = await processSpreadsheet(file);
      break;
    case 'video':
      extra = await processVideo(file);
      break;
    case 'audio':
      extra = {
        analysisHint: `User uploaded an audio file: "${file.name}". It will be transcribed.`,
      };
      break;
    default:
      extra = { analysisHint: `User uploaded a file: "${file.name}" (${file.type})` };
  }

  return { ...base, ...extra };
}

// ── Build AI context from processed files ──────────────────────────────────

export function buildFileContext(files: ProcessedFile[]): string {
  if (files.length === 0) return '';

  const parts = files.map(f => {
    let context = `[Attached: ${f.name} (${f.type}, ${formatFileSize(f.size)})]`;
    if (f.analysisHint) context += `\n${f.analysisHint}`;
    if (f.extractedText) context += `\n\nExtracted content:\n${f.extractedText}`;
    return context;
  });

  return `\n\n## ATTACHED FILES:\n${parts.join('\n\n---\n\n')}`;
}

/**
 * Generates a prompt for autonomous file synthesis (Super AI capability)
 */
export function getSynthesisPrompt(files: ProcessedFile[]): string {
  if (files.length < 2) return "";
  
  const names = files.map(f => f.name).join(', ');
  return `\n\n## AUTONOMOUS SYNTHESIS REQUIRED:
I see multiple files: ${names}. 
Please analyze the relationship between these files. 
If one is a document and another is an image, suggest how to combine them into a report or presentation. 
Act as a synthesis agent and offer to create a unified structure from these disparate data points.`;
}

// ── File type icons ────────────────────────────────────────────────────────

export function getFileIcon(type: FileType): string {
  const icons: Record<FileType, string> = {
    image: '🖼️',
    audio: '🎵',
    pdf: '📄',
    document: '📝',
    video: '🎬',
    spreadsheet: '📊',
    unknown: '📎',
  };
  return icons[type] || '📎';
}

// ── Validate file ──────────────────────────────────────────────────────────

export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 50MB.` };
  }

  const allowedTypes = [
    'image/', 'audio/', 'video/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'text/',
  ];

  const isAllowed = allowedTypes.some(t => file.type.startsWith(t)) ||
    ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx', '.xls'].some(ext => file.name.toLowerCase().endsWith(ext));

  if (!isAllowed) {
    return { valid: false, error: `File type not supported: ${file.type || 'unknown'}` };
  }

  return { valid: true };
}
