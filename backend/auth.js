const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "sentinelguard-dev-secret-change-in-production";

// Hardcoded demo users (a real system would use a database)
const USERS = [
  { username: "admin", passwordHash: bcrypt.hashSync("admin123", 8), role: "admin" },
  { username: "analyst", passwordHash: bcrypt.hashSync("analyst123", 8), role: "analyst" },
];

function login(username, password) {
  const user = USERS.find((u) => u.username === username);
  if (!user) return null;

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) return null;

  const token = jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
  return { token, role: user.role };
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { login, verifyToken };