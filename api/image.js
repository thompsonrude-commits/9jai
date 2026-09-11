// Vercel serverless function for image endpoint
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

  const prompt = req.body?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt required' });
  }

  try {
    const { pollinationsImage } = require('../functions/lib/providers/pollinations');
    const result = await pollinationsImage(prompt);
    
    return res.status(200).json({
      imageUrl: result.url,
      provider: 'pollinations',
      model: result.model,
      latencyMs: 0
    });
  } catch (error) {
    console.error('Image error:', error);
    return res.status(500).json({ 
      error: 'Image generation failed', 
      details: error.message 
    });
  }
};
