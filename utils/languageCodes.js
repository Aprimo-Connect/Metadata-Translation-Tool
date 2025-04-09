const languageMap = {
  "de-DE": "de",       // German
  "en-US": "en",       // English (US)
  "es-ES": "es",       // Spanish (Spain)
  "fr-FR": "fr",       // French (France)
  "it-IT": "it",       // Italian
  "nl-NL": "nl",       // Dutch
  "pt-BR": "pt",       // Portuguese (Brazil)
  "ru-RU": "ru",       // Russian
  "zh-CN": "zh-Hans",  // Simplified Chinese (Mandarin)
  "zh-TW": "zh-Hant",  // Traditional Chinese (Mandarin)
  "ko-KR": "ko",       // Korean
  "ja-JP": "ja"        // Japanese
};

// **Reverse mapping for going back to Aprimo**
const reverseLanguageMap = Object.fromEntries(
  Object.entries(languageMap).map(([aprimoLang, azureLang]) => [azureLang, aprimoLang])
);

/**
 * Convert Aprimo language code to Azure AI language code.
 * @param {string} lang - The Aprimo language code.
 * @returns {string} - The corresponding Azure AI language code.
 */
const toAzureLanguage = (lang) => languageMap[lang] || lang;

/**
 * Convert Azure AI language code back to Aprimo language code.
 * @param {string} lang - The Azure AI language code.
 * @returns {string} - The corresponding Aprimo language code.
 */
const toAprimoLanguage = (lang) => reverseLanguageMap[lang] || lang;

module.exports = { toAzureLanguage, toAprimoLanguage };