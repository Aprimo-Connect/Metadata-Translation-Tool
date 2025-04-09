// Import required modules for handling translation job processing
const fetchChanges = require("./fetchChanges"); // Fetches recent record changes from Aprimo
const fetchFields = require("./fetchFields"); // Retrieves field metadata (IDs and names) from Aprimo
const fetchLanguages = require("./fetchLanguages"); // Fetches available language mappings from Aprimo
const analyzeChanges = require("./analyzeChanges"); // Determines which changes need translation
const translateData = require("./translateData"); // Calls the translation API and processes results
const sendData = require("./sendData"); // Sends the translated data back to Aprimo

/**
 * Processes a translation job for a given record in Aprimo.
 * @param {string} jobId - A unique identifier for the job (for logging/debugging purposes).
 * @param {string} recordId - The ID of the record being processed.
 * @param {Array} translations - Translation configuration specifying what needs translation.
 * @returns {boolean} - Returns `true` if successful, `false` if there was an error.
 */
const processTranslationJob = async (jobId, recordId, modifiedOn, modifiedBy, translations) => {
  try {
    console.log("Fetching languages...");
    const languageDictionary = await fetchLanguages();
    if (!languageDictionary) throw new Error("Failed to fetch languages.");

    console.log("Fetching fields...");
    const fieldDictionary = await fetchFields(recordId);
    if (!fieldDictionary) throw new Error("Failed to fetch fields.");

    console.log("Fetching changes...");
    const fetchedChanges = await fetchChanges(recordId, modifiedOn, modifiedBy);
    if (!fetchedChanges) throw new Error("Failed to fetch record changes.");

    console.log("Analyzing changes...");
    const changes = await analyzeChanges(languageDictionary, fieldDictionary, fetchedChanges, translations);
    if (!changes) throw new Error("Failed to analyze changes.");

    // If no relevant changes were found, return early
    if (changes.length === 0) {
      console.log("No changes to translate.");
      return true; // Indicate success since there's nothing to do
    }

    console.log("Generating translations...");
    const fieldUpdates = await translateData(languageDictionary, fieldDictionary, changes, translations);
    if (!fieldUpdates) throw new Error("Failed to generate translations.");

    console.log("Updating record...");
    const result = await sendData(fieldUpdates);
    
    return !!result; // Convert result to boolean (true if successful, false otherwise)
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error.message);
    return false; // Return false to indicate failure
  }
};

// Export the function for use in other modules
module.exports = processTranslationJob;
