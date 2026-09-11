// Vercel serverless function for chat endpoint
module.exports = async (req, res) => {
  try {
    const { aiChat } = require('../functions/lib/index');
    return await aiChat(req, res);
  } catch (error) {
    console.error('Chat function error:', error);
    res.status(500).json({ error: 'Function initialization failed', details: error.message });
  }
};
