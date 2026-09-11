// Vercel serverless function for providers endpoint
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { getCompactProviderReports } = require('../functions/lib/media/providerRegistry');
    const reports = await getCompactProviderReports();
    
    return res.status(200).json({ 
      status: 'success', 
      data: reports 
    });
  } catch (error) {
    console.error('Providers error:', error);
    return res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
};
