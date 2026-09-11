// Simple image generation using Pollinations (free, no API key)
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

  const prompt = req.body?.prompt || '3D concept art';
  
  // Pollinations.ai - Free image generation
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
  
  return res.status(200).json({
    imageUrl: imageUrl,
    provider: 'pollinations',
    model: 'flux',
    latencyMs: 0
  });
};
