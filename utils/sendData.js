// Import Aprimo API client to handle requests
const aprimoClient = require("../services/aprimoClient");

const fetchRecord = require("./fetchRecord"); // Sends the translated data back to Aprimo

/**
 * Sends translated field updates to Aprimo.
 * @param {Array} fieldUpdates - An array of field update objects containing:
 *        - recordId (string): The ID of the record being updated.
 *        - fieldId (string): The ID of the field being updated.
 *        - languageId (string): The language ID of the translated text.
 *        - value (string): The translated text to update.
 * @returns {boolean} - Returns `true` if all updates were successful, `false` if there was an error.
 */
const sendData = async (fieldUpdates, fieldData) => {
  try {
    // Extract unique record IDs from the updates
    const recordIdSet = new Set(fieldUpdates.map(update => update.recordId));
    const uniqueRecordIds = [...recordIdSet];

    // Process updates for each unique record
    for (const recordId of uniqueRecordIds) {
      // Initialize request body for the API request
      const requestBody = {
        fields: {
          addOrUpdate: [] // Will store grouped field updates
        }
      };

      // Get all updates specific to the current recordId
      const updatesForRecord = fieldUpdates.filter(update => update.recordId === recordId);

      // Group updates by fieldId to avoid duplicate field updates
      const groupedUpdates = new Map();

      for (const fieldUpdate of updatesForRecord) {
        // If this field hasn't been added yet, initialize its entry
        if (!groupedUpdates.has(fieldUpdate.fieldId)) {
          groupedUpdates.set(fieldUpdate.fieldId, {
            id: fieldUpdate.fieldId,
            localizedValues: [] // Store all language variations under the same field
          });
        }

        const localizedEntry = { languageId: fieldUpdate.languageId };

        if (fieldUpdate.value !== undefined) {
          localizedEntry.value = fieldUpdate.value; // Single value change
        } else if (fieldUpdate.newValues !== undefined) {
          // **Use newValues directly if provided, bypassing existing values**
          localizedEntry.values = fieldUpdate.newValues;
        } else {
          // Fetch the existing field data for the record
          const record = await fetchRecord(recordId);
          let previousValues = [];
        
          // Find the specific field in the fetched record data
          if (record?.fields) {
            const fieldData = record.fields.find(field => field.id === fieldUpdate.fieldId);
        
            if (fieldData?.localizedValues) {
              const existingLocalizedValue = fieldData.localizedValues.find(
                lv => lv.languageId === fieldUpdate.languageId
              );
        
              if (existingLocalizedValue) {
                // Ensure values is always an array
                existingLocalizedValue.values = existingLocalizedValue.values || [];
                previousValues = [...existingLocalizedValue.values]; // Copy existing values
              }
            }
          }
        
          // **Apply changes**
          if (fieldUpdate.added?.length > 0) {
            previousValues = [...new Set([...previousValues, ...fieldUpdate.added])]; // Add new values
          }
          if (fieldUpdate.removed?.length > 0) {
            previousValues = previousValues.filter(value => !fieldUpdate.removed.includes(value)); // Remove values
          }
        
          // **Set the final list to be sent**
          localizedEntry.values = previousValues;
        }
        
        // Add the language-specific update to the field's localizedValues array
        groupedUpdates.get(fieldUpdate.fieldId).localizedValues.push(localizedEntry);
      };

      // Convert the grouped updates map into an array format expected by Aprimo
      requestBody.fields.addOrUpdate = Array.from(groupedUpdates.values());

      // Send the update request to Aprimo API
      const response = await aprimoClient.put(`/api/core/record/${recordId}`, requestBody);

      // Aprimo should return a 204 (No Content) if the update was successful
      if (response.status !== 204) {
        console.error(`Failed to update record ${recordId}`);
        return false; // Return false if any record update fails
      }
    }

    return true; // Return true if all updates were processed successfully
  } catch (error) {
    console.error("Error updating records in Aprimo:", error.message);
    return false; // Return false if an error occurs
  }
};

// Export the function to be used in other modules
module.exports = sendData;
