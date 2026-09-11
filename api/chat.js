// Vercel serverless function for chat endpoint
module.exports = async (req, res) => {
  // Set CORS headers
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
    // Import router functions
    const { routeChat } = require('../functions/lib/router');
    
    const result = await routeChat({
      ...req.body,
      task: 'chat',
      userId: req.headers['x-user-id'],
      sessionId: req.headers['x-session-id'],
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ 
      error: 'Chat failed', 
      text: 'Local fallback mode is active. Please try again.',
      provider: 'local',
      model: 'fallback'
    });
  }
};
