// Import the Aprimo API client for making authenticated requests
const aprimoClient = require("../services/aprimoClient");

// Load environment variables from .env file (if needed)
require("dotenv").config();

/**
 * Fetches the list of supported languages from Aprimo and maps them into a dictionary.
 *
 * This function retrieves language metadata from Aprimo and constructs a dictionary
 * mapping language culture codes (e.g., "en-US", "fr-FR") to their respective Aprimo language IDs.
 *
 * @returns {Object|null} A dictionary where keys are culture codes and values are language IDs,
 *                        or null if an error occurs.
 */
const fetchLanguages = async () => {
  try {
    // Step 1: Send GET request to Aprimo's language API endpoint
    const response = await aprimoClient.get(`/api/core/languages`);

    // Step 2: Initialize an empty object to store language mappings
    const languageDictionary = {};

    // Step 3: Process each language in the response and populate the dictionary
    response.data.items.forEach(language => {
      if (language.culture && language.id) {
        languageDictionary[language.culture] = language.id; // Store culture code as key, language ID as value
      }
    });

    return languageDictionary; // Return the constructed dictionary
  } catch (error) {
    // Log error message and return null to indicate failure
    console.error("Error fetching languages:", error.message);
    return null;
  }
};

// Export the function for use in other modules
module.exports = fetchLanguages;
