// Import the Aprimo API client for making authenticated requests
const aprimoClient = require("../services/aprimoClient");

/**
 * Fetches field metadata for a given Aprimo record.
 * @param {string} recordId - The unique ID of the record to fetch fields for.
 * @returns {Object|null} A dictionary where keys are field IDs and values are field names,
 *                        or null if an error occurs.
 */
const fetchFields = async (recordId) => {
  try {
    // Step 1: Request field data for the specified record
    const response = await aprimoClient.get(`/api/core/record/${recordId}`, { "select-record": "fields" });

    // Step 2: Validate the API response structure to ensure it contains fields
    if (!response.data || !response.data._embedded || !response.data._embedded.fields || !response.data._embedded.fields.items) {
      console.warn("No fields found in response.");
      return {}; // Return an empty dictionary if no fields are found
    }

    // Step 3: Transform the fields array into a dictionary mapping field IDs to field names
    const fieldDictionary = response.data._embedded.fields.items.reduce((acc, field) => {
      if (field.fieldName && field.id) {
        acc[field.id] = field.fieldName; // Store field ID as key and field name as value
      }
      return acc;
    }, {});

    return fieldDictionary; // Return the constructed dictionary
  } catch (error) {
    // Log error message and return null to indicate failure
    console.error("Error fetching field data:", error.message);
    return null;
  }
};

// Export the function for use in other modules
module.exports = fetchFields;
