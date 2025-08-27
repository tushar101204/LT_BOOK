const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");

// Extract token from header/cookie/body
function extractToken(req) {
  const h1 = req.header && req.header("Authorization");
  const h2 = req.header && req.header("authorization");
  const h3 = req.header && req.header("Authorisation");
  const fromHeadersObj = req.headers && (req.headers.authorization || req.headers.Authorization || req.headers.Authorisation);
  const fromHeader = (h1 || h2 || h3 || fromHeadersObj || "").replace(/Bearer\s+/i, "").trim();
  const fromCookie = (req.cookies && (req.cookies.token || req.cookies.jwtoken)) || null;
  const fromBody = (req.body && (req.body.token || req.body.jwtoken)) || null;
  return fromHeader || fromCookie || fromBody || null;
}

// Core auth middleware similar to the shared example
async function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Token is missing" });
    }

    const secret = process.env.JWT_SECRET || process.env.SECRET_KEY;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Token is invalid or expired" });
    }

    // Load user to attach role info (friendly for downstream checks)
    const user = await User.findById(decoded._id).select("_id userType");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found for token" });
    }

    req.user = { id: String(user._id), userType: (user.userType || "").toLowerCase() };
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
}

// Role guards
function isStudent(req, res, next) {
  try {
    if (!req.user || req.user.userType !== "student") {
      return res.status(401).json({ success: false, message: "Protected route: Students only" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "User role cannot be verified, please try again" });
  }
}

function isFaculty(req, res, next) {
  try {
    if (!req.user || req.user.userType !== "faculty") {
      return res.status(401).json({ success: false, message: "Protected route: Students only" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "User role cannot be verified, please try again" });
  }
}

function isAdmin(req, res, next) {
  try {
    if (!req.user || req.user.userType !== "admin") {
      return res.status(401).json({ success: false, message: "Protected route: Admin only" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "User role cannot be verified, please try again" });
  }
}

module.exports = { auth, isStudent, isFaculty, isAdmin };
