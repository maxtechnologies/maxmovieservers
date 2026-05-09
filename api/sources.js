const apiClient = require('../utils/apiClient');

// Your Vercel deployment URL - CHANGE THIS TO YOUR ACTUAL URL
// If you're using maxmovieservers.vercel.app, keep as is
const PROXY_BASE_URL = 'https://maxmovieservers.vercel.app/api/proxy';

// Helper function to create a proxy URL
function createProxyUrl(directUrl) {
  if (!directUrl) return null;
  // Encode the direct URL and wrap it in your proxy
  return `${PROXY_BASE_URL}?url=${encodeURIComponent(directUrl)}`;
}

module.exports = async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 405,
      success: false,
      message: 'Method not allowed. Use GET.'
    });
  }

  try {
    const { id, season, episode } = req.query;
    
    if (!id) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'ID parameter is required'
      });
    }

    // Build params for the API request
    let params = {};
    if (season) params.season = season;
    if (episode) params.episode = episode;

    // Fetch from GiftedTech API
    const data = await apiClient.get(`/sources/${id}`, params);
    
    // Extract direct video URLs and wrap them in your proxy
    let extractedSources = [];
    let extractedSubtitles = [];
    
    if (data.results && Array.isArray(data.results)) {
      extractedSources = data.results.map(source => {
        let directStreamUrl = null;
        let directDownloadUrl = null;
        let proxyStreamUrl = null;
        let proxyDownloadUrl = null;
        
        // Extract from stream_url if it exists and is a proxy URL
        if (source.stream_url && source.stream_url.includes('/api/v2/stream')) {
          try {
            const urlObj = new URL(source.stream_url);
            const encodedUrl = urlObj.searchParams.get('url');
            if (encodedUrl) {
              directStreamUrl = decodeURIComponent(encodedUrl);
              // Create your own proxy URL (this will NEVER have CORS issues!)
              proxyStreamUrl = createProxyUrl(directStreamUrl);
            }
          } catch (e) {
            console.error('Failed to extract stream URL:', e);
            directStreamUrl = source.stream_url;
            proxyStreamUrl = createProxyUrl(directStreamUrl);
          }
        } else if (source.stream_url) {
          directStreamUrl = source.stream_url;
          proxyStreamUrl = createProxyUrl(directStreamUrl);
        }
        
        // Extract from download_url if it exists and is a proxy URL
        if (source.download_url && source.download_url.includes('/api/v2/download')) {
          try {
            const urlObj = new URL(source.download_url);
            const encodedUrl = urlObj.searchParams.get('url');
            if (encodedUrl) {
              directDownloadUrl = decodeURIComponent(encodedUrl);
              proxyDownloadUrl = createProxyUrl(directDownloadUrl);
            }
          } catch (e) {
            console.error('Failed to extract download URL:', e);
            directDownloadUrl = source.download_url;
            proxyDownloadUrl = createProxyUrl(directDownloadUrl);
          }
        } else if (source.download_url) {
          directDownloadUrl = source.download_url;
          proxyDownloadUrl = createProxyUrl(directDownloadUrl);
        }
        
        return {
          quality: source.quality || 'HD',
          format: source.format || 'mp4',
          size: source.size,
          // THE IMPORTANT PART: Return proxy URLs instead of direct ones!
          stream_url: proxyStreamUrl,      // This goes through your proxy (no CORS!)
          download_url: proxyDownloadUrl,   // This goes through your proxy too
          // Keep direct URLs for reference (optional)
          direct_stream_url: directStreamUrl,
          direct_download_url: directDownloadUrl,
          id: source.id
        };
      }).filter(source => source.stream_url !== null);
    }
    
    // Process subtitles (they are already direct URLs from cacdn.hakunaymatata.com)
    if (data.subtitles && Array.isArray(data.subtitles)) {
      extractedSubtitles = data.subtitles.map(sub => ({
        id: sub.id,
        lan: sub.lan,
        lanName: sub.lanName,
        url: sub.url,  // Subtitles work directly, no proxy needed
        size: sub.size
      }));
    }
    
    return res.status(200).json({
      status: 200,
      success: true,
      creator: "MaxMovies",
      results: extractedSources,
      subtitles: extractedSubtitles,
      originalId: id,
      note: "stream_url now uses your proxy - no CORS issues!"
    });
    
  } catch (error) {
    console.error('Sources endpoint error:', error);
    return res.status(error.status || 500).json({
      status: error.status || 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
