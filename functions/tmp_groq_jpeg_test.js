(async()=>{
  try{
    require('dotenv').config({ path: '../.env' });
    const key = process.env.GROQ_API_KEY || process.env.GROQ_KEY || process.env.GROQ;
    if(!key){ console.error('MISSING_GROQ_KEY'); process.exit(2); }
    const fetch = global.fetch || (await import('node-fetch')).default;
    const tests = [
      { label: 'PNG_WIKI', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png' },
      { label: 'JPEG_PLACEKITTEN', url: 'https://placekitten.com/800/600' },
    ];
    const model = 'qwen/qwen3.6-27b';

    for (const t of tests) {
      console.log('\n--- Fetching', t.label, t.url);
      const resp = await fetch(t.url);
      if (!resp.ok) { console.error('Failed to fetch', t.url, resp.status); continue; }
      const ct = resp.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await resp.arrayBuffer());
      const base64 = buffer.toString('base64');
      console.log('Fetched metadata:', { mime: ct, bytes: buffer.length, base64Len: base64.length });
      const dataUrl = `data:${ct};base64,${base64}`;
      const body = { model, messages:[{ role:'user', content:[{ type:'text', text:'What objects and text are visible in this image? Describe in detail.' },{ type:'image_url', image_url:{ url: dataUrl } }]}], temperature:0.3, max_tokens:1024 };

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions',{ method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+key }, body: JSON.stringify(body) });
      const text = await groqRes.text();
      const preview = text ? (text.length>2000? text.slice(0,2000)+'...' : text) : '';
      console.log('\n=== GROQ TEST', t.label, '===');
      console.log('HTTP_STATUS:', groqRes.status);
      console.log('CONTENT_TYPE:', groqRes.headers.get('content-type')||'');
      console.log('MODEL:', model);
      console.log('IMAGE_MIME:', ct);
      console.log('BYTE_SIZE:', buffer.length);
      console.log('BASE64_LEN:', base64.length);
      console.log('REQUEST_FORMAT: JSON chat.completions multimodal');
      console.log('GROQ_RESPONSE_PREVIEW:', preview);
      // Respect rate limit pause
      await new Promise(r => setTimeout(r, 5000));
    }
  }catch(e){ console.error('ERROR', e && e.message ? e.message : e); process.exit(1); }
})();