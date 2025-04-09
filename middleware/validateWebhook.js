const yup = require("yup");

// Define the validation schema using Yup
const webhookSchema = yup.object({
  recordId: yup.string().required("recordId is required."), // Ensure recordId is a non-empty string
  translations: yup
    .array()
    .of(
      yup.object({
        source: yup
          .object({
            fieldName: yup.string().nullable(), // fieldName is optional (nullable allows null values)
            fieldNames: yup.array().of(yup.string()).nullable(), // fieldNames is also optional

            languages: yup
              .array()
              .of(yup.string()) // Ensure each language is a string
              .min(1) // At least one language must be provided
              .required("Languages are required."),
          })
          .test(
            "fieldName-or-fieldNames",
            "Provide only one: either 'fieldName' (string) or 'fieldNames' (array), but not both.",
            (source) => {
              // Ensure that either `fieldName` or `fieldNames` is present, but not both
              const hasFieldName = !!source.fieldName;
              const hasFieldNames = Array.isArray(source.fieldNames);
              return !(hasFieldName && hasFieldNames); // Allow none, or one, but not both
            }
          )
          .required(),

        destinations: yup
          .array()
          .of(
            yup.object({
              recordId: yup.string().required("Destination recordId is required."), // Destination must have a valid recordId
              fieldName: yup.string().nullable(), // fieldName is optional
              languages: yup
                .array()
                .of(yup.string()) // Ensure each language is a string
                .min(1) // At least one language is required
                .required("Languages are required."),
            })
          )
          .min(1) // At least one destination is required
          .required("Destinations must have at least one entry."),
      })
    )
    .min(1) // At least one translation is required
    .required("Translations must have at least one entry."),
});

// Middleware function for validating webhook requests
const validateWebhook = (req, res, next) => {
  let requestBody;

  try {
    // Check if the request body is in plain text format and parse it if necessary
    if (req.headers["content-type"]?.includes("text/plain")) {
      requestBody = JSON.parse(req.body);
    } else {
      requestBody = req.body;
    }
  } catch (error) {
    // Return a 400 error if the JSON parsing fails
    return res.status(400).json({ error: "Invalid JSON format" });
  }

  try {
    // Validate the request body against the schema
    webhookSchema.validateSync(requestBody, { abortEarly: false }); // Collect all validation errors
    req.validatedBody = requestBody; // Attach the validated data to the request object
    console.log("Validated request body");
    next(); // Proceed to the next middleware
  } catch (validationError) {
    // Return all validation errors as a 400 response
    return res.status(400).json({ error: validationError.errors.join(", ") });
  }
};

// Export the middleware for use in routes
module.exports = validateWebhook;
