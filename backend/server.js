const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

app.use(cors());

app.get("/api/events", (req, res) => {
  const dataPath = path.join(__dirname, "..", "data", "scored_events.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const events = JSON.parse(raw);
  res.json(events);
});

app.get("/api/alerts", (req, res) => {
  const dataPath = path.join(__dirname, "..", "data", "scored_events.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const events = JSON.parse(raw);
  const alerts = events.filter(e => e.level === "HIGH" || e.level === "MEDIUM");
  res.json(alerts);
});

app.listen(PORT, () => {
  console.log(`SentinelGuard backend running at http://localhost:${PORT}`);
});