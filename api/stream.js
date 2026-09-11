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

  // For now, use chat endpoint (Vercel has streaming limitations)
  try {
    const { routeChat } = require('../functions/lib/router');
    
    const result = await routeChat({
      ...req.body,
      task: 'chat',
      userId: req.headers['x-user-id'],
      sessionId: req.headers['x-session-id'],
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Stream error:', error);
    return res.status(500).json({ error: 'Stream failed' });
  }
};
