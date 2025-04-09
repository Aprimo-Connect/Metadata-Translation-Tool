/**
 * Analyzes record changes and determines which should be translated.
 * @param {Object} languageDictionary - Mapping of language codes to Aprimo language IDs.
 * @param {Object} fieldDictionary - Mapping of field IDs to field names.
 * @param {Array} fetchedChanges - List of recent changes, each containing `fieldId`, `languageId`, and `value`.
 * @param {Array} translations - Translation rules defining which fields and languages need translation.
 * @returns {Array} A list of changes that need to be translated.
 */
const analyzeChanges = async (languageDictionary, fieldDictionary, fetchedChanges, translations) => {
  const changesToTranslate = new Map(); // Store unique changes efficiently

  for (const change of fetchedChanges) {
    let languageCode = getLanguageCode(change.languageId, languageDictionary);

    if (change.languageId === "00000000-0000-0000-0000-000000000000") {
      languageCode = "en-US"; 
    }

    if (!languageCode) continue;

    const changeFieldName = fieldDictionary[change.fieldId.replace(/-/g, "")];
    if (!changeFieldName) continue;

    // Determine what kind of change it is
    let changeData = {};
    if (change.value !== undefined) {
      changeData.newValue = change.value;
    }
    if (change.items?.added?.length > 0) {
      changeData.added = change.items.added.map(item => item.value);
    }
    if (change.items?.removed?.length > 0) {
      changeData.removed = change.items.removed.map(item => item.value);
    }

    // Ensure we have something to store before proceeding
    if (Object.keys(changeData).length === 0) continue;

    for (const { source } of translations) {
      if (shouldTranslate(changeFieldName, source) && source.languages.includes(languageCode)) {
        const key = `${change.fieldId}|${languageCode}|${JSON.stringify(changeData)}`;
        if (!changesToTranslate.has(key)) {
          changesToTranslate.set(key, {
            fieldId: change.fieldId,
            fieldName: changeFieldName,
            languageId: change.languageId,
            ...changeData,
          });
        }
        break; // Stop checking once a match is found
      }
    }
  }

  return Array.from(changesToTranslate.values());
};

/**
 * Retrieves the language code for a given language ID.
 * @param {string} languageId - The language ID to look up.
 * @param {Object} languageDictionary - Mapping of language codes to IDs.
 * @returns {string|null} The corresponding language code, or null if not found.
 */
const getLanguageCode = (languageId, languageDictionary) => {
  const normalizedId = languageId.replace(/-/g, "");
  return Object.entries(languageDictionary).find(([_, id]) => id.replace(/-/g, "") === normalizedId)?.[0] || null;
};

/**
 * Determines if a given field should be translated based on translation rules.
 * @param {string} fieldName - The name of the field that was changed.
 * @param {Object} source - The translation source rules.
 * @returns {boolean} True if the field should be translated, false otherwise.
 */
const shouldTranslate = (fieldName, source) => {
  if (!source.fieldName && !source.fieldNames) return true; // Match all fields if none are specified
  if (source.fieldName) return source.fieldName === fieldName; // Direct match

  const { fieldNames } = source;
  if (!Array.isArray(fieldNames)) return false; // Safety check

  const excludedFields = fieldNames.filter(f => f.startsWith("!")).map(f => f.substring(1));
  const allowedFields = fieldNames.filter(f => !f.startsWith("!"));

  return allowedFields.includes(fieldName) || (allowedFields.length === 0 && !excludedFields.includes(fieldName));
};

module.exports = analyzeChanges;
