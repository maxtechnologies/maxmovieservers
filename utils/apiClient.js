const axios = require('axios');

class MovieAPIClient {
  constructor() {
    this.baseURL = 'https://movieapi.giftedtech.co.ke/api/v2';
    this.apiKey = 'gifted_movieapi_378ry3dq7qdlqdgdqg8ordqg78qd0';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || 'API request failed',
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
        message: 'Error setting up request'
      };
    }
  }
}

module.exports = new MovieAPIClient();
