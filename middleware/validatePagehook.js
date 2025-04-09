// Middleware function for enforcing header presence and attaching parsed body
const validatePagehook = (req, res, next) => {
  // Check if Content-Type is present and correct
  if (!req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
    return res.status(400).json({ error: "Missing or invalid Content-Type header" });
  }

  try {
    // Attach the already-parsed body to validatedBody
    req.validatedBody = req.body;
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(400).json({ error: "Invalid request format" });
  }
};

// Export the middleware for use in routes
module.exports = validatePagehook;
