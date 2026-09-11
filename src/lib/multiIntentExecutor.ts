import { ClassifiedIntent } from './providerAdapter';
import { proxySearch, proxyImage } from './aiProxy';
import { getOrchestratedChatResponse, extractTextViaOrchestrator } from './aiOrchestratorBridge';
import { buildFileContext, ProcessedFile } from './multimodalProcessor';

export async function orchestrateMultiIntent(
  userMessage: string,
  classifiedIntent: ClassifiedIntent,
  files: ProcessedFile[] = [],
): Promise<{ messages: { role: 'user' | 'model'; content: string }[] } | null> {
  // Basic multi-intent executor: implement common combos using available engines
  const primary = classifiedIntent.capability;
  const secondary = classifiedIntent.secondaryCapabilities ?? [];

  // Helper: safe wrapper
  const safeResult = (role: 'user' | 'model', content: string) => ({ messages: [{ role, content }] });

  try {
    // SEARCH -> IMAGE: Do search first then generate an image based on summary
    if (primary === 'search' && secondary.includes('image')) {
      const search = await proxySearch(userMessage);
      const results = search.results || [];
      const summary = results.slice(0, 3).map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.snippet || ''}${r.url && r.url !== '#' ? `\n${r.url}` : ''}`).join('\n\n') || 'No live results available.';
      const searchMsg = `🔎 Search results for "${userMessage}"\n\n${summary}`;

      // Use the search summary to craft an image prompt
      const imagePrompt = `Create an illustrative image for: ${userMessage}. Use the following summary as context: ${summary}`;
      const image = await proxyImage(imagePrompt);
      const imageUrl = image?.imageUrl || '';
      const imageMsg = imageUrl ? `__IMAGE__${imageUrl}` : 'Image generation unavailable.';

      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: searchMsg }, { role: 'model', content: imageMsg }] };
    }

    // IMAGE -> SEARCH: Generate an image then run a search based on the concept
    if (primary === 'image' && secondary.includes('search')) {
      const imageResult = await proxyImage(userMessage);
      const imageUrl = imageResult?.imageUrl || '';
      const imgMsg = imageUrl ? `__IMAGE__${imageUrl}` : 'Image generation unavailable.';
      // Build a search query from the prompt
      const searchQuery = `Information about ${userMessage}`;
      const search = await proxySearch(searchQuery);
      const results = search.results || [];
      const summary = results.slice(0, 3).map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.snippet || ''}${r.url && r.url !== '#' ? `\n${r.url}` : ''}`).join('\n\n') || 'No live results available.';
      const searchMsg = `🔎 Search results for "${searchQuery}"\n\n${summary}`;
      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: imgMsg }, { role: 'model', content: searchMsg }] };
    }

    // DOCUMENT + LANGUAGE (translate attached files)
    if (primary === 'document' && secondary.includes('language')) {
      // Extract text from attached files if provided
      let collected = '';
      if (files && files.length > 0) {
        for (const f of files) {
          if (f.extractedText) collected += `\n\n${f.name}:\n${f.extractedText}`;
          else if (f.preview && f.type === 'image') {
            // Try OCR via orchestrator
            try {
              const o = await extractTextViaOrchestrator(f.preview || '');
              collected += `\n\n${f.name}:\n${o.text || ''}`;
            } catch (e) {
              collected += `\n\n${f.name}: (unable to extract text automatically)`;
            }
          }
        }
      }

      // If no files, fall back to translating the message body
      const toTranslate = collected || userMessage;
      const targetLangMatch = /(?:into|to)\s+(edo|yoruba|igbo|hausa|pidgin|english)/i.exec(userMessage || '');
      const target = (targetLangMatch && targetLangMatch[1]) ? targetLangMatch[1] : 'edo';
      const translatePrompt = `Translate the following content into ${target}. Preserve headings, lists, and tables where possible. Do not invent words; preserve names and technical terms.

Content:\n${toTranslate}`;

      const translated = await getOrchestratedChatResponse([{ role: 'user', content: translatePrompt }], 0.2);
      if (translated && translated.text) {
        return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: translated.text }] };
      }

      return safeResult('model', 'Translation currently unavailable.');
    }

    // DOCUMENT + OCR: If user wants OCR, extract text
    if (primary === 'document' && secondary.includes('ocr')) {
      if (files && files.length > 0) {
        const parts: string[] = [];
        for (const f of files) {
          if (f.extractedText) parts.push(`Extracted from ${f.name}:\n${f.extractedText}`);
          else if (f.preview && f.type === 'image') {
            try {
              const o = await extractTextViaOrchestrator(f.preview || '');
              parts.push(`Extracted from ${f.name}:\n${o.text}`);
            } catch (e) {
              parts.push(`Could not extract from ${f.name}.`);
            }
          }
        }
        const joined = parts.join('\n\n') || 'No text could be extracted.';
        return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: joined }] };
      }
      return safeResult('model', 'No files attached to perform OCR.');
    }

    // RESEARCH -> DOCUMENT: search, synthesize sources, produce a structured report (text)
    if (primary === 'search' && secondary.includes('document')) {
      const search = await proxySearch(userMessage);
      const results = search.results || [];
      const sourcesText = results.map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.snippet || ''}${r.url && r.url !== '#' ? `\n${r.url}` : ''}`).join('\n\n') || 'No live results available.';

      const synthPrompt = `You are an expert research assistant. Using the following search results, synthesize a concise professional report with headings: Summary, Key Findings, Sources. Preserve source citations and include URLs where provided.\n\nSearch results:\n${sourcesText}`;
      const report = await getOrchestratedChatResponse([{ role: 'user', content: synthPrompt }], 0.1);
      const reportText = (report && report.text) ? report.text : (`Research synthesis currently unavailable.\n\nSources:\n${sourcesText}`);

      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: reportText }] };
    }

    // RESEARCH -> SPREADSHEET: search, convert top results into a CSV spreadsheet (base64)
    if (primary === 'search' && secondary.includes('spreadsheet')) {
      const search = await proxySearch(userMessage);
      const results = search.results || [];
      const rows = results.slice(0, 50).map((r: any) => [r.title || '', r.url || '', r.source || '', (r.snippet || '').replace(/\n/g, ' ')]);
      const headers = ['Title', 'URL', 'Source', 'Snippet'];
      const csvLines = [headers.map(h => `"${String(h).replace(/"/g,'""')}"`).join(',')].concat(rows.map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')));
      const csv = csvLines.join('\n');
      const csvBase64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(csv))) : Buffer.from(csv, 'utf8').toString('base64');
      const payload = `__SPREADSHEET__${csvBase64}`;
      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: `I converted the top search results into a spreadsheet. Download or open the CSV using the attached data:\n${payload}` }] };
    }

    // SPREADSHEET -> CHART: parse CSV-like extractedText and produce a simple SVG bar chart
    if (primary === 'spreadsheet' && secondary.includes('chart')) {
      // Find first spreadsheet file
      const sheet = files.find(f => f.type === 'spreadsheet' && f.extractedText);
      if (!sheet) return safeResult('model', 'No spreadsheet file with extractable data attached.');

      // Parse CSV naive
      const lines = sheet.extractedText!.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 200);
      const parsed = lines.map(line => line.split(/,|\t/).map(cell => cell.replace(/^"|"$/g, '').trim()));
      const headers = parsed[0] || [];
      const dataRows = parsed.slice(1);

      // Detect first numeric column
      let numericCol = -1;
      for (let c = 0; c < headers.length; c++) {
        const nums = dataRows.map(r => Number(r[c])).filter(n => !isNaN(n));
        if (nums.length >= Math.max(1, Math.floor(dataRows.length / 3))) { numericCol = c; break; }
      }

      if (numericCol === -1) return safeResult('model', 'Could not detect a numeric column to chart. Please attach a spreadsheet with numeric columns.');

      const labels = dataRows.map(r => r[0] || '').slice(0, 10);
      const values = dataRows.map(r => Number(r[numericCol]) || 0).slice(0, 10);

      // Simple SVG bar chart
      const maxV = Math.max(...values, 1);
      const width = 800, height = 400, pad = 40;
      const barW = Math.floor((width - pad * 2) / Math.max(1, values.length)) - 8;
      const bars = values.map((v, i) => {
        const h = Math.round(((v / maxV) * (height - pad * 2)));
        const x = pad + i * (barW + 8);
        const y = height - pad - h;
        return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="#008751" />`;
      }).join('\n');
      const labelEls = labels.map((lab, i) => {
        const x = pad + i * (barW + 8) + barW / 2;
        return `<text x="${x}" y="${height - pad + 16}" font-size="12" fill="#062e2a" text-anchor="middle">${lab}</text>`;
      }).join('\n');

      const svg = `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
        `<rect width="100%" height="100%" fill="#f7fff9"/>` +
        `<g>${bars}</g>` +
        `<g>${labelEls}</g>` +
        `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" fill="#064e3b">Chart: ${sheet.name}</text>` +
        `</svg>`;

      const dataUrl = `data:image/svg+xml;base64,${typeof btoa === 'function' ? btoa(svg) : Buffer.from(svg, 'utf8').toString('base64')}`;
      const imgTag = `__IMAGE__${dataUrl}`;
      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: `Generated chart from spreadsheet column "${headers[numericCol] || 'column'}".` }, { role: 'model', content: imgTag }] };
    }

    // SPREADSHEET -> PRESENTATION: produce slide outlines from spreadsheet analysis
    if (primary === 'spreadsheet' && secondary.includes('presentation')) {
      const sheet = files.find(f => f.type === 'spreadsheet' && f.extractedText);
      if (!sheet) return safeResult('model', 'No spreadsheet file with extractable data attached.');

      const lines = sheet.extractedText!.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 200);
      const parsed = lines.map(line => line.split(/,|\t/).map(cell => cell.replace(/^"|"$/g, '').trim()));
      const headers = parsed[0] || [];
      const dataRows = parsed.slice(1, 50);

      const analysisPrompt = `You are a presentation assistant. Create a short slide deck outline (title and 3-8 slides) based on this dataset. Include slide titles and 2-4 bullet points per slide summarizing key insights. Dataset headers: ${headers.join(', ')}. First rows sample: ${JSON.stringify(dataRows.slice(0,5))}`;
      const slidesResp = await getOrchestratedChatResponse([{ role: 'user', content: analysisPrompt }], 0.2);
      const slidesText = slidesResp?.text || 'Unable to generate slides.';
      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: slidesText }] };
    }

    // AUDIO -> TRANSCRIBE -> SUMMARY / TRANSLATE
    if (primary === 'audio' && (secondary.includes('summary') || secondary.includes('language') || secondary.includes('translate') || secondary.includes('transcribe'))) {
      if (!files || files.length === 0) return safeResult('model', 'No audio file attached for transcription.');
      const outParts: string[] = [];
      for (const f of files.filter(x => x.type === 'audio')) {
        // If already extractedText available, use it
        if (f.extractedText) { outParts.push(`Transcription for ${f.name}:\n${f.extractedText}`); continue; }
        // Try backend transcription via proxy (expects fileName upload flow); attempt with file id as fallback
        try {
          const trans = await (await import('./aiProxy')).proxyTranscribe(f.id, f.mimeType);
          outParts.push(`Transcription for ${f.name}:\n${trans.text}`);
          if (secondary.includes('summary')) {
            const summ = await getOrchestratedChatResponse([{ role: 'user', content: `Summarize the following transcription:\n${trans.text}` }], 0.2);
            if (summ?.text) outParts.push(`Summary:\n${summ.text}`);
          }
          if (secondary.includes('language') || secondary.includes('translate')) {
            const targ = /(?:to|into)\s+(edo|yoruba|igbo|hausa|pidgin|english)/i.exec(userMessage)?.[1] || 'edo';
            const transPrompt = `Translate the following transcription into ${targ} preserving names and formatting:\n${trans.text}`;
            const translated = await getOrchestratedChatResponse([{ role: 'user', content: transPrompt }], 0.2);
            if (translated?.text) outParts.push(`Translation (${targ}):\n${translated.text}`);
          }
        } catch (e) {
          outParts.push(`Failed to transcribe ${f.name}.`);
        }
      }
      return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: outParts.join('\n\n') }] };
    }

    // TEXT -> TTS: attempt backend TTS then fall back to browser instructions
    if ((primary === 'language' || primary === 'chat' || primary === 'tts') && secondary.includes('tts')) {
      const textToSpeak = userMessage;
      try {
        const resp = await fetch('/api/v1/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: textToSpeak, voiceId: 'nosa' }), signal: AbortSignal.timeout(30000) });
        if (resp.ok) {
          const j = await resp.json();
          if (j && j.audioBase64) {
            const dataUrl = `data:${j.contentType || 'audio/mp3'};base64,${j.audioBase64}`;
            return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: `__AUDIO__${dataUrl}` }] };
          }
        }
      } catch (e) {
        console.warn('[multiIntentExecutor] TTS backend failed:', e);
      }
      return safeResult('model', 'Text-to-speech is not available from the backend. You can use your browser TTS or configure Google TTS in the admin settings.');
    }

    // IMAGE -> OCR -> TRANSLATE / DOCUMENT
    if (primary === 'image' && (secondary.includes('ocr') || secondary.includes('language') || secondary.includes('document'))) {
      // Attempt vision analysis or OCR
      const firstImage = files.find(f => f.type === 'image' && f.preview) as ProcessedFile | undefined;
      if (!firstImage) return safeResult('model', 'Please attach an image to perform OCR or document extraction.');
      try {
        const vis = await (await import('./aiProxy')).proxyVision(firstImage.preview || '', userMessage);
        const extracted = vis.text || vis.description || '';
        if (secondary.includes('language')) {
          const targ = /(?:to|into)\s+(edo|yoruba|igbo|hausa|pidgin|english)/i.exec(userMessage)?.[1] || 'edo';
          const translated = await getOrchestratedChatResponse([{ role: 'user', content: `Translate the following text into ${targ} preserving names and formatting:\n${extracted}` }], 0.2);
          return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: translated?.text || extracted }] };
        }
        if (secondary.includes('document')) {
          // Package as a simple structured document
          const doc = `Extracted from ${firstImage.name}:\n\n${extracted}`;
          return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: doc }] };
        }
        return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: extracted || 'No text detected in image.' }] };
      } catch (e) {
        console.warn('[multiIntentExecutor] image OCR failed:', e);
        return safeResult('model', 'Image OCR is currently unavailable.');
      }
    }

    // MUSIC pipeline: lyrics -> suno prompt -> attempt instrumental/audio generation
    if (primary === 'music') {
      // Use creative content generator to produce lyrics and suno prompt
      try {
        const { extractCreativeParameters } = await import('./creativeIntegration');
        const { generateCreativeContent } = await import('./creativeContentGenerator');
        const params = extractCreativeParameters(userMessage);
        const prompt = {
          type: params.theme ? 'lyrics' : 'lyrics',
          theme: params.theme || userMessage,
          language: 'en',
          languageName: 'English (Nigeria)',
          style: params.style,
          mood: params.mood,
          genre: params.genre,
          additionalContext: params.additionalContext,
        } as any;

        // Generate lyrics (stream fully into a string)
        let lyrics = '';
        for await (const chunk of generateCreativeContent(prompt)) {
          lyrics += chunk;
        }

        // Generate Suno prompt if possible
        const sunoPromptSpec = `Create a Suno-style music generation prompt for these lyrics. Genre: ${prompt.genre || 'Afrobeat'}. Mood: ${prompt.mood || 'Uplifting'}. Include BPM, key, main instruments, and vocal style. Lyrics:\n${lyrics.slice(0, 2000)}`;
        const suno = await getOrchestratedChatResponse([{ role: 'user', content: sunoPromptSpec }], 0.2);
        const sunoPrompt = suno?.text || '';

        // Try backend media generation for audio (best-effort)
        try {
          const genResp = await fetch('/api/v1/media/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'audio', prompt: sunoPrompt, lyrics, genre: prompt.genre }), signal: AbortSignal.timeout(180000) });
          if (genResp.ok) {
            const body = await genResp.json();
            if (body && (body.mediaUrl || body.audioBase64)) {
              const audioUrl = body.mediaUrl || (body.audioBase64 ? `data:${body.contentType||'audio/mp3'};base64,${body.audioBase64}` : null);
              const audioTag = audioUrl ? `__AUDIO__${audioUrl}` : '';
              return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: `🎵 Lyrics:\n${lyrics}` }, { role: 'model', content: `🎚️ Suno Prompt:\n${sunoPrompt}` }, { role: 'model', content: audioTag || 'Instrumental generation attempted but not available.' }] };
            }
          }
        } catch (e) {
          console.warn('[multiIntentExecutor] audio generation attempt failed:', e);
        }

        // If audio generation not available, return lyrics + suno prompt
        return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: `🎵 Lyrics:\n${lyrics}` }, { role: 'model', content: `🎚️ Suno Prompt:\n${sunoPrompt}` }] };
      } catch (e) {
        console.warn('[multiIntentExecutor] music pipeline failed:', e);
        return safeResult('model', 'Music pipeline is not fully available. I generated a lyrics draft that you can refine.');
      }
    }

    // Default: not handled, allow caller to proceed with primary-only flow
    return null;
  } catch (err) {
    console.warn('[multiIntentExecutor] orchestration failed:', err);
    return { messages: [{ role: 'user', content: userMessage }, { role: 'model', content: 'Multi-step execution failed. Proceeding with primary capability only.' }] };
  }
}
