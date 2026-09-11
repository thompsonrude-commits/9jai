// Vercel serverless function for health endpoint
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { getAllHealthSnapshots } = require('../functions/lib/logger');
    const health = getAllHealthSnapshots();
    
    return res.status(200).json({
      ok: true,
      service: '9jai-vercel',
      timestamp: Date.now(),
      providers: health
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(200).json({
      ok: true,
      service: '9jai-vercel',
      timestamp: Date.now(),
      error: error.message
    });
  }
};
