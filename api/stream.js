// Vercel serverless function for stream endpoint
module.exports = async (req, res) => {
  try {
    const { aiStream } = require('../functions/lib/index');
    return await aiStream(req, res);
  } catch (error) {
    console.error('Stream function error:', error);
    res.status(500).json({ error: 'Function initialization failed', details: error.message });
  }
};
