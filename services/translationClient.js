const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config(); // Load environment variables from .env file

// Retrieve required environment variables for Azure Translator API
const TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT;

// Ensure that all necessary environment variables are available
if (!TRANSLATOR_KEY || !TRANSLATOR_REGION || !TRANSLATOR_ENDPOINT) {
  throw new Error("Azure Translator API environment variables are missing.");
}

/**
 * Translates a batch of text inputs using the Azure Translator API.
 *
 * @param {Array} batchRequests - Array of translation requests, each containing:
 *   - `texts`: Array of text strings to translate
 *   - `from`: Source language code
 *   - `toLanguages`: Array of target language codes
 * @returns {Promise<Array>} The translation response from Azure API
 * @throws {Error} If the request fails or invalid input is provided
 */
const translateBatchText = async (batchRequests) => {
  try {
    // Validate input: Ensure batchRequests is provided and not empty
    if (!batchRequests || batchRequests.length === 0) {
      throw new Error("No valid batch requests provided.");
    }

    // Construct request body by flattening all text inputs from batchRequests
    const requestBody = batchRequests.flatMap(req =>
      req.texts.map(text => ({ text })) // Azure API expects an array of objects with a `text` field
    );

    // Extract source language (assume all requests share the same source language)
    const sourceLanguage = batchRequests[0].from;

    // Collect unique target languages across all batch requests
    const targetLanguages = [...new Set(batchRequests.flatMap(req => req.toLanguages))];

    // Validate target languages
    if (targetLanguages.length === 0) {
      throw new Error("No valid target languages provided for translation.");
    }

    // Perform the translation request to Azure Translator API
    const response = await axios.post(
      `${TRANSLATOR_ENDPOINT}/translate`,
      requestBody,
      {
        params: {
          "api-version": "3.0", // API version for Azure Translator
          from: sourceLanguage, // Source language
          to: targetLanguages, // Array of target languages
        },
        paramsSerializer: (params) => {
          // Custom parameter serialization to properly format array parameters
          return Object.keys(params)
            .map((key) =>
              Array.isArray(params[key])
                ? params[key].map(val => `${key}=${encodeURIComponent(val)}`).join("&")
                : `${key}=${encodeURIComponent(params[key])}`
            )
            .join("&");
        },
        headers: {
          "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY, // API key for authentication
          "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION, // Region for Azure Translator
          "Content-Type": "application/json", // Ensure JSON request format
          "X-ClientTraceId": uuidv4(), // Unique request identifier for debugging
        },
      }
    );

    console.log("Translation response received.");
    return response.data; // Return translation response
  } catch (error) {
    console.error("Azure Translation API Error:", error.response?.data || error.message);
    return []; // Return empty array on failure to avoid breaking downstream processes
  }
};

module.exports = { translateBatchText };
