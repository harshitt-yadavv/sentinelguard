const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { login, verifyToken } = require("./auth");
const { processResponses, loadSessionState, loadAuditLog, acknowledgeUser } = require("./response");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function getScoredEvents() {
  const dataPath = path.join(__dirname, "..", "data", "scored_events.json");
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

// Run the response engine once at startup so audit log / session state exist
processResponses(getScoredEvents());

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const result = login(username, password);
  if (!result) return res.status(401).json({ error: "Invalid username or password" });
  res.json(result);
});

app.get("/api/events", (req, res) => {
  res.json(getScoredEvents());
});

app.get("/api/alerts", verifyToken, (req, res) => {
  const events = getScoredEvents();
  const alerts = events.filter((e) => e.level === "HIGH" || e.level === "MEDIUM");
  res.json(alerts);
});

// Per-user current session state (flagged/locked/normal)
app.get("/api/session-state", verifyToken, (req, res) => {
  res.json(loadSessionState());
});

// Full audit trail - every event, score, and action taken
app.get("/api/audit-log", verifyToken, (req, res) => {
  res.json(loadAuditLog());
});

// Manual override: admin acknowledges/clears a flagged user
app.post("/api/acknowledge/:userId", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can acknowledge alerts" });
  }
  const updatedState = acknowledgeUser(req.params.userId);
  res.json(updatedState);
});

app.listen(PORT, () => {
  console.log(`SentinelGuard backend running at http://localhost:${PORT}`);
});