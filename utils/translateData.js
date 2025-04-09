const { translateBatchText } = require("../services/translationClient");
const { toAzureLanguage, toAprimoLanguage } = require("./languageCodes");

const translateData = async (languageDictionary, fieldDictionary, changesToTranslate, translations) => {
  const translatedFields = [];
  const batchRequests = new Map(); // Group translations by source language

  // **STEP 1: Organize Translations Efficiently**
  for (const change of changesToTranslate) {
    // Normalize the `languageId` by removing hyphens
    const normalizedLanguageId = change.languageId.replace(/-/g, "");

    // Reverse lookup: Find the corresponding language code using its ID
    let sourceLanguageCode = Object.entries(languageDictionary).find(
      ([code, id]) => id.replace(/-/g, "") === normalizedLanguageId
    )?.[0];

    // If the languageId is all zeros, treat it as en-US but keep its original ID
    if (!sourceLanguageCode && change.languageId === "00000000-0000-0000-0000-000000000000") {
      sourceLanguageCode = "en-US";
    }

    if (!sourceLanguageCode) {
      console.warn(
        `Language ID ${change.languageId} (normalized: ${normalizedLanguageId}) not found in dictionary`
      );
      continue;
    }

    // **Find all target languages from `translations`**
    const targetLanguages = new Set();
    const affectedDestinations = [];

    for (const translation of translations) {
      const { source, destinations } = translation;

      let matchesField = false;

      // **If no fieldName or fieldNames are provided, translate all fields**
      if (!source.fieldName && !source.fieldNames) {
        matchesField = true;
      }

      // **Check if fieldId matches source.fieldName**
      if (source.fieldName && source.fieldName === change.fieldName) {
        matchesField = true;
      }

      // **Check if fieldId is included in source.fieldNames**
      if (Array.isArray(source.fieldNames)) {
        const excludedFields = source.fieldNames
          .filter(f => f.startsWith("!"))
          .map(f => f.substring(1));

        const allowedFields = source.fieldNames.filter(f => !f.startsWith("!"));

        if (allowedFields.includes(change.fieldName)) {
          matchesField = true;
        } else if (allowedFields.length === 0 && !excludedFields.includes(change.fieldName)) {
          matchesField = true;
        }
      }

      // **Ensure the source language matches**
      const matchesLanguage = source.languages.includes(sourceLanguageCode);

      if (matchesField && matchesLanguage) {
        for (const destination of destinations) {
          destination.languages.forEach(lang => targetLanguages.add(lang));
          affectedDestinations.push(destination);
        }
      }
    }

    if (targetLanguages.size === 0) {
      console.warn(`No target languages found for change: ${change.fieldName} (fieldId: ${change.fieldId})`);
      continue;
    }

    // Group requests by source language
    const batchKey = `${sourceLanguageCode}`;
    if (!batchRequests.has(batchKey)) {
      batchRequests.set(batchKey, {
        texts: new Map(), // Store unique texts
        toLanguages: new Set(), // Store unique target languages
        destinations: new Map() // Track destinations for each text
      });
    }

    const batchEntry = batchRequests.get(batchKey);

    if (change.newValue !== undefined) {
      batchEntry.texts.set(change.newValue, { ...change, type: "newValue" });
    } else if (change.newValues !== undefined) {
      change.newValues.forEach(value => {
        batchEntry.texts.set(value, { ...change, type: "newValues", originalText: value });
      });
    } else {
      if (change.added?.length > 0) {
        change.added.forEach(value => {
          batchEntry.texts.set(value, { ...change, type: "added", originalText: value });
        });
      }
      if (change.removed?.length > 0) {
        change.removed.forEach(value => {
          batchEntry.texts.set(value, { ...change, type: "removed", originalText: value });
        });
      }
    }
    
    targetLanguages.forEach(lang => batchEntry.toLanguages.add(lang));

    // Associate each text with its destinations
    if (change.newValue !== undefined) {
      batchEntry.destinations.set(change.newValue, affectedDestinations);
    } else if (change.newValues !== undefined) {
      change.newValues.forEach(value => {
        batchEntry.destinations.set(value, affectedDestinations);
      });
    } else {
      if (change.added?.length > 0) {
        change.added.forEach(value => {
          batchEntry.destinations.set(value, affectedDestinations);
        });
      }
      if (change.removed?.length > 0) {
        change.removed.forEach(value => {
          batchEntry.destinations.set(value, affectedDestinations);
        });
      }
    }
  }

  // **STEP 2: Send Batch Translation Requests**
  const translationResponses = new Map();

  for (const [sourceLanguage, data] of batchRequests) {
    const texts = Array.from(data.texts.keys());
    const targetLanguages = Array.from(data.toLanguages);

    // Properly structure the request for Azure Translator API
    const response = await translateBatchText([
      {
        texts: texts,  // Send all texts in the batch
        from: sourceLanguage,
        toLanguages: targetLanguages
      }
    ]);

    // Store translations in a Map for quick lookup
    response.forEach((result, index) => {
      const originalText = texts[index]; // Get original text from ordered array
      translationResponses.set(`${sourceLanguage}|${originalText}`, result.translations);
    });
  }

  // **STEP 3: Map Translations to Record Updates**
  for (const [sourceLanguage, data] of batchRequests) {
    for (const [originalText, destinations] of data.destinations.entries()) {
      for (const destination of destinations) {
        for (const targetLang of destination.languages) {
          let translatedValue = "[Translation Failed]";
          const normalizedTargetLang = toAzureLanguage(targetLang);
          const cleanTextKey = originalText.includes("|") ? originalText.split("|").pop() : originalText;
          const translationKey = `${sourceLanguage}|${cleanTextKey}`;

          if (translationResponses.has(translationKey)) {
            const translations = translationResponses.get(translationKey);
            const translatedValueObj = translations.find(
              (t) => t.to === normalizedTargetLang
            );

            if (translatedValueObj) {
              translatedValue = translatedValueObj.text;
            }
          }

          // **If destination.fieldName is missing, use the same fieldName as the source change**
          const finalFieldName = destination.fieldName || data.texts.get(originalText)?.fieldName || null;

          // **Find the fieldId using the resolved fieldName**
          const fieldId = finalFieldName ? Object.keys(fieldDictionary).find(
            key => fieldDictionary[key] === finalFieldName
          ) : null;

          // Convert back to Aprimo format for field updates
          const changeInfo = data.texts.get(originalText) || {};
          const changeType = changeInfo.type || "newValue";
          const targetLangId = languageDictionary[toAprimoLanguage(targetLang)];

          // Find or create the corresponding entry in translatedFields
          let translationEntry = translatedFields.find(
            (entry) => entry.recordId === destination.recordId &&
                      entry.fieldId === fieldId &&
                      entry.languageId === targetLangId
          );

          if (!translationEntry) {
            translationEntry = {
              recordId: destination.recordId,
              fieldId: fieldId,
              fieldName: finalFieldName,
              languageId: targetLangId
            };
            translatedFields.push(translationEntry);
          }

          // Store the translated values properly
          if (changeType === "newValue") {
            translationEntry.value = translatedValue;
          } else if (changeType === "newValues") {
            translationEntry.newValues = translationEntry.newValues || [];
            translationEntry.newValues.push(translatedValue);
          } else if (changeType === "added") {
            translationEntry.added = translationEntry.added || [];
            translationEntry.added.push(translatedValue);
          } else if (changeType === "removed") {
            translationEntry.removed = translationEntry.removed || [];
            translationEntry.removed.push(translatedValue);
          }
        }
      }
    }
  }

  return translatedFields;
};

module.exports = translateData;
