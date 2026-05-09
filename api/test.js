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

  return res.status(200).json({
    status: 200,
    success: true,
    message: 'MaxMovies API Proxy is working!',
    endpoints: {
      homepage: '/api/homepage',
      trending: '/api/trending',
      search: '/api/search?query={query}&page=1',
      info: '/api/info?id={id}',
      sources: '/api/sources?id={id}&season=1&episode=1'
    },
    note: 'Sources endpoint now returns direct video URLs (no CORS issues!)',
    creator: 'MaxMovies'
  });
};
