// Vercel serverless function for health endpoint
module.exports = async (req, res) => {
  try {
    const { aiHealth } = require('../functions/lib/index');
    return await aiHealth(req, res);
  } catch (error) {
    console.error('Health function error:', error);
    res.status(500).json({ error: 'Function initialization failed', details: error.message });
  }
};
