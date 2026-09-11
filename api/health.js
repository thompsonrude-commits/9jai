// Simple health check - no dependencies
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    ok: true,
    service: '9jai-vercel-backend',
    timestamp: Date.now(),
    version: '1.0.0',
    status: 'operational'
  });
};
