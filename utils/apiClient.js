const axios = require('axios');

class MovieAPIClient {
  constructor() {
    this.baseURL = 'https://movieapi.giftedtech.co.ke/api/v2';
    // READ FROM VERCEL ENVIRONMENT VARIABLES
    this.apiKey = process.env.GIFTED_API_KEY;
    
    // Check if API key is set
    if (!this.apiKey) {
      console.error('❌ GIFTED_API_KEY environment variable is not set!');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MaxMovies/1.0)'
      }
    });
  }

  async get(endpoint, params = {}) {
    try {
      console.log(`📡 Fetching: ${this.baseURL}${endpoint}`);
      const response = await this.client.get(endpoint, { params });
      console.log(`✅ Success: ${endpoint}`);
      return response.data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error.response?.status, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.error || 'API request failed',
        data: error.response.data
      };
    } else if (error.request) {
      return {
        status: 503,
        message: 'No response from movie API'
      };
    } else {
      return {
        status: 500,
        message: error.message || 'Error setting up request'
      };
    }
  }
}

module.exports = new MovieAPIClient();
