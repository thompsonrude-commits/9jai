// Vercel serverless function for stream endpoint
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Direct Groq API call (same as chat endpoint)
  try {
    const { messages, temperature = 0.7, maxTokens = 2048 } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY || process.env.GROQ_KEY;
    if (!GROQ_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured',
        text: 'Backend configuration error.',
        provider: 'none'
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: 'AI provider error',
        text: 'Service temporarily unavailable',
        provider: 'groq'
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No response';
    
    return res.status(200).json({
      text: text,
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      tokensUsed: data.usage?.total_tokens
    });
  } catch (error) {
    console.error('Stream error:', error);
    return res.status(500).json({ 
      error: 'Internal error',
      text: 'Service temporarily unavailable',
      provider: 'none'
    });
  }
};
