// Middleware for authenticating incoming webhook requests
const authenticate = (req, res, next) => {
  // Extract the Authorization header from the request
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is missing or doesn't follow the Bearer token format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid Bearer token." });
  }
  

  // Extract the actual token (everything after "Bearer ")
  const token = authHeader.split(" ")[1];

  // Compare the provided token with the expected secret stored in environment variables
  if (token !== process.env.WEBHOOK_SECRET) {
    return res.status(403).json({ error: "Forbidden: Invalid token." });
  }
  else
  {
    console.log("Validated webhook secret");
  }

  // If the token is valid, proceed to the next middleware or route handler
  next();
};

// Export the middleware so it can be used in other parts of the application
module.exports = authenticate;
