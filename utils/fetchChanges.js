const aprimoClient = require("../services/aprimoClient");

/**
 * Fetches the most recent changes for a given Aprimo record that matches the modifiedOn and modifiedBy.
 * @param {string} recordId - The unique ID of the record to fetch changes for.
 * @param {string} modifiedOn - The timestamp of the modification (format: YYYY-MM-DDTHH:mm:ss).
 * @param {string} modifiedBy - The user ID of the person who made the modification.
 * @returns {Array|null} An array of field changes if successful, otherwise null.
 */
const fetchChanges = async (recordId, modifiedOn, modifiedBy) => {
  try {
    // Fetch the most recent 10 change entries for the record
    const { data } = await aprimoClient.get(
      `/api/core/record/${recordId}/trail?filter=change&skip=0&take=10`
    );

    const changeEntries = data.entries || [];
    if (changeEntries.length === 0) {
      console.warn(`No change entries found for record ${recordId}.`);
      return null;
    }

    // Convert modifiedOn to a Date object for comparison
    const modifiedDate = new Date(modifiedOn);

    // Find the closest matching entry within ±1 second of modifiedOn
    const matchingEntry = changeEntries.find(({ createdOn, userId }) => {
      const entryDate = new Date(createdOn);
      return userId === modifiedBy && Math.abs(entryDate - modifiedDate) <= 1000;
    });

    if (!matchingEntry) {
      console.warn(
        `No matching change entry found for record ${recordId} with modifiedOn: ${modifiedOn} and modifiedBy: ${modifiedBy}`
      );
      return null;
    }

    // Fetch the full details of the matched change entry
    const { data: entryData } = await aprimoClient.get(
      `/api/core/record/${recordId}/trail/entry/${matchingEntry.id}`
    );

    return entryData.changes || null;
  } catch (error) {
    console.error(`Error fetching record changes for ${recordId}:`, error.message);
    return null;
  }
};

module.exports = fetchChanges;
