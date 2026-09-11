// Vercel serverless function for image endpoint
module.exports = async (req, res) => {
  try {
    const { aiImage } = require('../functions/lib/index');
    return await aiImage(req, res);
  } catch (error) {
    console.error('Image function error:', error);
    res.status(500).json({ error: 'Function initialization failed', details: error.message });
  }
};
