const express = require("express");
const asyncHandler = require("express-async-handler");

const authenticate = require("../middleware/authenticate");
const validateWebhook = require("../middleware/validateWebhook");
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

module.exports = app;
