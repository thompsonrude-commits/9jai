// Vercel chat endpoint with direct Groq integration
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, X-User-Id');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, temperature = 0.7, maxTokens = 2048 } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Direct Groq API call
    const GROQ_KEY = process.env.GROQ_KEY;
    if (!GROQ_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured',
        text: 'Backend configuration error. Please contact administrator.',
        provider: 'none',
        model: 'error'
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return res.status(500).json({
        error: 'AI provider error',
        text: 'Local fallback mode is active. Please try again.',
        provider: 'groq',
        model: 'error',
        details: errorText.substring(0, 100)
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No response';
    
    return res.status(200).json({
      text: text,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      latencyMs: 0,
      cached: false,
      tokensUsed: data.usage?.total_tokens
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Internal error',
      text: 'Local fallback mode is active. Please try again.',
      provider: 'none',
      model: 'error',
      details: error.message
    });
  }
};
