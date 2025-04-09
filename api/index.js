const express = require("express");
const asyncHandler = require("express-async-handler");

const authenticate = require("../middleware/authenticate");
const validateWebhook = require("../middleware/validateWebhook");
const validatePagehook = require("../middleware/validatePagehook");
const processTranslationJob = require("../utils/processTranslationJob");

const fetchChanges = require("../utils/fetchChanges"); // Fetches recent record changes from Aprimo
const fetchFields = require("../utils/fetchFields"); // Retrieves field metadata (IDs and names) from Aprimo
const fetchLanguages = require("../utils/fetchLanguages"); // Fetches available language mappings from Aprimo
const analyzeChanges = require("../utils/analyzeChanges"); // Determines which changes need translation
const translateData = require("../utils/translateData"); // Calls the translation API and processes results
const sendData = require("../utils/sendData"); // Sends the translated data back to Aprimo
const fetchRecord = require("../utils/fetchRecord"); // Sends the translated data back to Aprimo

const app = express();

// Middleware to parse JSON and plain text requests
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }))

/**
 * Webhook endpoint to receive translation requests.
 * 
 * This route:
 * 1. Authenticates the request to ensure it comes from a trusted source.
 * 2. Validates the incoming JSON payload using predefined rules.
 * 3. Processes the translation job asynchronously.
 */
app.post(
  "/api/webhook",
  authenticate,       // Middleware to verify the request has a valid authentication token
  validateWebhook,    // Middleware to validate the structure of the incoming webhook payload
  asyncHandler(async (req, res) => {
    // Extract the validated request data
    const { modifiedOn, modifiedBy, recordId, translations } = req.validatedBody;

    const referenceId = req.headers["referenceid"] || `job-${Date.now()}`;

    // Generate a unique job ID for tracking purposes
    const jobId = `${referenceId}`;
    console.log(`Job received: ${jobId}. Processing...`);

    // Execute the translation job (fetching data, analyzing changes, translating, and updating records)
    const success = await processTranslationJob(jobId, recordId, modifiedOn, modifiedBy, translations);

    console.log(`Job ${jobId} status: ${success ? "completed" : "failed"}`);

    // Return a response indicating whether the job was successfully processed
    return res.json({ success, jobId });
  })
);

app.post(
  "/api/pagehook",
  validatePagehook,    // Middleware to validate the structure of the incoming pagehook payload
  asyncHandler(async (req, res) => {
    console.log(JSON.stringify(req.validatedBody, null, 2));

    const referenceId = req.headers["referenceid"] || `job-${Date.now()}`;

    // Generate a unique job ID for tracking purposes
    const jobId = `${referenceId}`;

    try {
      const recordId = req.validatedBody.recordIds;

      console.log("Fetching languages...");
      const languageDictionary = await fetchLanguages();
      if (!languageDictionary) throw new Error("Failed to fetch languages.");
  
      console.log("Fetching fields...");
      const fieldDictionary = await fetchFields(recordId);
      if (!fieldDictionary) throw new Error("Failed to fetch fields.");

      console.log("Fetching current record data...");
      const recordData = await fetchRecord(recordId);
      if (!recordData || !recordData.fields) throw new Error("Failed to fetch record data.");

      const sources = [
        {
          "fieldName": "EliteDescription",
          "languages": ["en-US"]
        },
        {
          "fieldName": "EliteImageDescription",
          "languages": ["en-US"]
        },
        {
          "fieldName": "EliteTags",
          "languages": ["en-US"]
        }
      ];

      const changes = [];

      for (const source of sources) {
        const fieldData = recordData.fields.find(f => f.fieldName === source.fieldName);
      
        if (fieldData?.localizedValues) {
          for (const language of source.languages) {
            let languageId = Object.entries(languageDictionary).find(([code, _]) => code === language)?.[1];

            if (language === "en-US") {
              languageId = "00000000000000000000000000000000";
            } else {
              if (!languageId) {
                console.error(`Failed to find language ID for ${language}.`);
                return res.status(500).json({ errorMsg: `Missing language mapping for ${language}.` });
              }
            }

            const localizedValue = fieldData.localizedValues.find(lv => lv.languageId === languageId);

            if (localizedValue) {
              const changeEntry = {
                fieldId: fieldData.id,
                fieldName: source.fieldName,
                languageId: languageId === "00000000000000000000000000000000" ? languageDictionary["en-US"] : languageId,
              };
      
              if (localizedValue.value !== undefined) {
                changeEntry.newValue = localizedValue.value;
              } else if (localizedValue.values !== undefined) {
                changeEntry.newValues = localizedValue.values;
              }
      
              changes.push(changeEntry);
            }
          }
        }
      }

      const translations = [
        {
          source: {
            fieldNames: ["EliteDescription"],
            languages: ["en-US"],
          },
          destinations: [
            {
              recordId: recordId,
              fieldName: "EliteDescriptionML",
              languages: ["zh-CN", "zh-TW"]
            }
          ],
        },
        {
          source: {
            fieldNames: ["EliteImageDescription"],
            languages: ["en-US"],
          },
          destinations: [
            {
              recordId: recordId,
              fieldName: "EliteImageDescriptionML",
              languages: ["zh-CN", "zh-TW"]
            }
          ],
        },
        {
          source: {
            fieldNames: ["EliteTags"],
            languages: ["en-US"],
          },
          destinations: [
            {
              recordId: recordId,
              fieldName: "EliteTagsML",
              languages: ["zh-CN", "zh-TW"]
            }
          ],
        },
      ];
  
      console.log("Generating translations...");
      const fieldUpdates = await translateData(languageDictionary, fieldDictionary, changes, translations);
      if (!fieldUpdates) throw new Error("Failed to generate translations.");

      console.log("Updating record...");
      const result = await sendData(fieldUpdates);

      if (result === true) {
        return res.status(200).json({ errorMsg: "Translation sucessful!" });
      }
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error.message);
    }

    return res.status(500).json({ errorMsg: "An error occured." });
  })
);

module.exports = app;
