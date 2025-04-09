const axios = require("axios");
const https = require("https");
require("dotenv").config(); // Load environment variables from .env file

/**
 * AprimoClient - Handles authentication and API requests to Aprimo DAM
 * 
 * Features:
 * ✅ Caches authentication tokens to reduce redundant auth requests
 * ✅ Uses Axios for HTTP requests with automatic error handling
 * ✅ Reuses HTTPS connections for better performance
 */
class AprimoClient {
  constructor() {
    // Base URLs and credentials from environment variables
    this.baseUrl = process.env.APRIMO_DAM_URL;
    this.authUrl = process.env.APRIMO_AUTH_URL;
    this.clientId = process.env.APRIMO_CLIENT_ID;
    this.clientSecret = process.env.APRIMO_CLIENT_SECRET;
    this.scope = "api"; // Required API scope

    // Authentication token and expiration tracking
    this.token = null;
    this.tokenExpiration = null;

    // Create a reusable Axios instance with a keep-alive HTTPS agent
    this.axiosInstance = axios.create({
      timeout: 5000, // Set request timeout to 5 seconds
      httpsAgent: new https.Agent({ keepAlive: true }), // Enable connection reuse
    });
  }

  /**
   * Authenticate with Aprimo and retrieve an access token
   * - Uses client credentials grant type
   * - Caches token to avoid unnecessary authentication requests
   * - Renews token before expiration
   * 
   * @returns {Promise<string>} The access token
   * @throws {Error} If authentication fails
   */
  async authenticate() {
    // If a valid cached token exists, use it
    if (this.token && this.tokenExpiration && Date.now() < this.tokenExpiration) {
      console.log("Using cached Aprimo token.");
      return this.token;
    }

    try {
      console.log("Authenticating with Aprimo...");

      // Send authentication request to Aprimo OAuth server
      const response = await this.axiosInstance.post(
        `${this.authUrl}/login/connect/token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: this.scope,
          grant_type: "client_credentials",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      // Store the new token and calculate expiration time
      this.token = response.data.access_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in - 60) * 1000; // 60s buffer

      console.log("Aprimo Authenticated!");
      return this.token;
    } catch (error) {
      console.error("Aprimo authentication failed:", error.response?.data || error.message);
      throw new Error("Failed to authenticate with Aprimo");
    }
  }

  /**
   * Perform an API request to Aprimo
   * - Automatically handles authentication
   * - Uses the cached token for efficiency
   * - Logs request details for debugging
   * 
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint (relative to base URL)
   * @param {Object|null} [body] - Request payload (for POST/PUT)
   * @param {Object} [extraHeaders={}] - Additional request headers
   * @returns {Promise<Object>} The API response
   * @throws {Error} If the request fails
   */
  async request(method, endpoint, body = null, extraHeaders = {}) {
    const token = await this.authenticate(); // Ensure we have a valid token

    try {
      console.log(`${method.toUpperCase()} ${this.baseUrl}${endpoint}`);

      // Send the request using Axios
      const response = await this.axiosInstance({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data: body,
        headers: {
          Authorization: `Bearer ${token}`, // Include the access token
          "API-VERSION": "1", // Required API version header
          Accept: "application/hal+json", // Use HAL+JSON format for responses
          "Content-Type": "application/json",
          "Languages": "*", // Get all the language versions, omitting only returns the user default
          ...extraHeaders, // Merge any additional headers
        },
      });

      return response;
    } catch (error) {
      console.error(`Error in ${method.toUpperCase()} ${endpoint}:`, error.response?.data || error.message);
      throw new Error(`Failed to ${method.toUpperCase()} data at ${endpoint}`);
    }
  }

  /**
   * Perform a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request payload
   * @returns {Promise<Object>} API response
   */
  async post(endpoint, body) {
    return this.request("post", endpoint, body);
  }

  /**
   * Perform a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} [extraHeaders={}] - Additional request headers
   * @returns {Promise<Object>} API response
   */
  async get(endpoint, extraHeaders = {}) {
    return this.request("get", endpoint, null, extraHeaders);
  }

  /**
   * Perform a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request payload
   * @returns {Promise<Object>} API response
   */
  async put(endpoint, body) {
    return this.request("put", endpoint, body);
  }
}

// Export a single instance to ensure token caching is shared across all requests
module.exports = new AprimoClient();
