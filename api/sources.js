const apiClient = require('../utils/apiClient');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    const { id, season, episode } = req.query;
    
    if (!id) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'ID parameter is required'
      });
    }

    let params = {};
    if (season) params.season = season;
    if (episode) params.episode = episode;

    const data = await apiClient.get(`/sources/${id}`, params);
    
    // Extract direct video URLs from the response
    let extractedSources = [];
    let extractedSubtitles = [];
    
    if (data.results && Array.isArray(data.results)) {
      extractedSources = data.results.map(source => {
        let directStreamUrl = null;
        let directDownloadUrl = null;
        
        if (source.stream_url && source.stream_url.includes('/api/v2/stream')) {
          try {
            const urlObj = new URL(source.stream_url);
            const encodedUrl = urlObj.searchParams.get('url');
            if (encodedUrl) {
              directStreamUrl = decodeURIComponent(encodedUrl);
            }
          } catch (e) {
            console.error('Failed to extract stream URL:', e);
            directStreamUrl = source.stream_url;
          }
        } else if (source.stream_url) {
          directStreamUrl = source.stream_url;
        }
        
        if (source.download_url && source.download_url.includes('/api/v2/download')) {
          try {
            const urlObj = new URL(source.download_url);
            const encodedUrl = urlObj.searchParams.get('url');
            if (encodedUrl) {
              directDownloadUrl = decodeURIComponent(encodedUrl);
            }
          } catch (e) {
            console.error('Failed to extract download URL:', e);
            directDownloadUrl = source.download_url;
          }
        } else if (source.download_url) {
          directDownloadUrl = source.download_url;
        }
        
        return {
          quality: source.quality || 'HD',
          format: source.format || 'mp4',
          size: source.size,
          stream_url: directStreamUrl,
          download_url: directDownloadUrl,
          id: source.id
        };
      }).filter(source => source.stream_url !== null);
    }
    
    if (data.subtitles && Array.isArray(data.subtitles)) {
      extractedSubtitles = data.subtitles.map(sub => ({
        id: sub.id,
        lan: sub.lan,
        lanName: sub.lanName,
        url: sub.url,
        size: sub.size
      }));
    }
    
    return res.status(200).json({
      status: 200,
      success: true,
      creator: "MaxMovies",
      results: extractedSources,
      subtitles: extractedSubtitles,
      originalId: id
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
