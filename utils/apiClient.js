const axios = require('axios');

class MovieAPIClient {
  constructor() {
    this.baseURL = 'https://movieapi.giftedtech.co.ke/api/v2';
    
    // Try multiple environment variable names for flexibility
    this.apiKey = process.env.GIFTED_API_KEY || 
                  process.env.API_KEY || 
                  process.env.MOVIE_API_KEY ||
                  process.env.GIFTED_KEY;
    
    // Check if API key is set
    if (!this.apiKey) {
      console.error('❌ No API key found in environment variables!');
      console.error('Please set GIFTED_API_KEY in Vercel environment variables');
    } else {
      console.log(`✅ API key loaded (${this.apiKey.substring(0, 10)}...)`);
    }
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        // ✅ CORRECT BEARER AUTHENTICATION
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MaxMovies/2.0 (Vercel Server)'
      }
    });
    
    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Log auth errors specifically
          if (error.response.status === 401 || error.response.status === 403) {
            console.error('🔑 AUTH ERROR: Invalid or expired API key');
            console.error('   Status:', error.response.status);
            console.error('   Message:', error.response.data?.message || error.response.data?.error);
            console.error('   Get a valid key from: https://movieapi.giftedtech.co.ke/docs');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get(endpoint, params = {}) {
    try {
      console.log(`📡 GET ${endpoint}`);
      const response = await this.client.get(endpoint, { params });
      console.log(`✅ ${response.status} ${endpoint}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed: ${endpoint}`);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // outside the range of 2xx
      return {
        status: error.response.status,
        message: error.response.data?.message || 
                 error.response.data?.error || 
                 `HTTP ${error.response.status}`,
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        status: 503,
        message: 'No response from GiftedTech API. Please try again later.',
        request: error.request
      };
    } else {
      // Something happened in setting up the request
      return {
        status: 500,
        message: error.message || 'Error setting up request'
      };
    }
  }
}

module.exports = new MovieAPIClient();
