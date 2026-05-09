const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers (this is what GiftedTech DIDN'T do!)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 405,
      success: false,
      message: 'Method not allowed. Use GET.'
    });
  }
  
  try {
    // Get the target URL from query parameter
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'url parameter is required'
      });
    }
    
    // Decode the URL (it might be encoded)
    const targetUrl = decodeURIComponent(url);
    
    console.log('Proxying video:', targetUrl);
    
    // Fetch the video from the CDN
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://hakunaymatata.com/',
      },
      timeout: 30000
    });
    
    // Set response headers for video streaming
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    res.setHeader('Content-Length', response.headers['content-length']);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the video to the browser
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        status: error.response.status,
        success: false,
        message: 'Failed to fetch video from CDN'
      });
    }
    
    return res.status(500).json({
      status: 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
