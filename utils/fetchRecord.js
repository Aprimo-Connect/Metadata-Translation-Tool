// Import the Aprimo API client for making authenticated requests
const aprimoClient = require("../services/aprimoClient");

/**
 * Fetches field data for a given Aprimo record.
 * @param {string} recordId - The unique ID of the record to fetch fields for.
 * @returns {Object|null} An object containing the fields of the record, or null if an error occurs.
 */
const fetchRecord = async (recordId) => {
  try {
    // Send a GET request to Aprimo API to retrieve record details, selecting only the fields
    const response = await aprimoClient.get(`/api/core/record/${recordId}`, { "select-record": "fields" });

    // Ensure the response contains the expected field data
    if (!response.data || !response.data._embedded?.fields?.items) {
      console.warn("No fields found in the response.");
      return {}; // Return an empty object if no fields are found
    }

    // Return the fields as part of an object
    return { fields: response.data._embedded.fields.items };
  } catch (error) {
    // Log the error and return null to indicate failure
    console.error("Error fetching record data:", error.message);
    return null;
  }
};

// Export the function for use in other modules
module.exports = fetchRecord;
