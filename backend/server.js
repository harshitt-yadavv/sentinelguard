const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { login, verifyToken } = require("./auth");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Public route: anyone can attempt login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const result = login(username, password);

  if (!result) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  res.json(result);
});

// Public: general event feed (read-only, low sensitivity)
app.get("/api/events", (req, res) => {
  const dataPath = path.join(__dirname, "..", "data", "scored_events.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const events = JSON.parse(raw);
  res.json(events);
});

// Protected: alerts require a valid login token
app.get("/api/alerts", verifyToken, (req, res) => {
  const dataPath = path.join(__dirname, "..", "data", "scored_events.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const events = JSON.parse(raw);
  const alerts = events.filter((e) => e.level === "HIGH" || e.level === "MEDIUM");
  res.json(alerts);
});

app.listen(PORT, () => {
  console.log(`SentinelGuard backend running at http://localhost:${PORT}`);
});