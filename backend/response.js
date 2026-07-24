const fs = require("fs");
const path = require("path");

const AUDIT_LOG_PATH = path.join(__dirname, "..", "data", "audit_log.json");
const SESSION_STATE_PATH = path.join(__dirname, "..", "data", "session_state.json");

/**
 * Decide what automated action a given risk level triggers.
 * This is the "graded automated response" from the project proposal:
 *   LOW    -> log only
 *   MEDIUM -> alert administrator
 *   HIGH   -> simulate session flag / lock
 */
function decideAction(level) {
  if (level === "HIGH") return "SESSION_LOCKED";
  if (level === "MEDIUM") return "ADMIN_ALERTED";
  return "LOGGED_ONLY";
}

/**
 * Process every scored event, apply the response logic, and build:
 *  - a full audit log (every event + score + action taken)
 *  - a per-user session state (are they currently flagged/locked?)
 */
function processResponses(scoredEvents) {
  const auditLog = [];
  const sessionState = {};

  for (const event of scoredEvents) {
    const action = decideAction(event.level);

    auditLog.push({
      user_id: event.user_id,
      action_taken: action,
      event_action: event.action,
      volume_mb: event.volume_mb,
      timestamp: event.timestamp,
      score: event.score,
      level: event.level,
      reasons: event.reasons,
    });

    // Session state reflects each user's MOST SEVERE outstanding status.
    // A HIGH event locks the session; nothing later downgrades it automatically -
    // an admin has to acknowledge/clear it (that's the manual override piece).
    const existing = sessionState[event.user_id];
    const severityRank = { LOGGED_ONLY: 0, ADMIN_ALERTED: 1, SESSION_LOCKED: 2 };

    if (!existing || severityRank[action] >= severityRank[existing.status]) {
      sessionState[event.user_id] = {
        status: action,
        triggering_event: {
          action: event.action,
          volume_mb: event.volume_mb,
          timestamp: event.timestamp,
          score: event.score,
          level: event.level,
        },
        acknowledged: false,
      };
    }
  }

  fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(auditLog, null, 2));
  fs.writeFileSync(SESSION_STATE_PATH, JSON.stringify(sessionState, null, 2));

  return { auditLog, sessionState };
}

function loadSessionState() {
  if (!fs.existsSync(SESSION_STATE_PATH)) return {};
  return JSON.parse(fs.readFileSync(SESSION_STATE_PATH, "utf-8"));
}

function loadAuditLog() {
  if (!fs.existsSync(AUDIT_LOG_PATH)) return [];
  return JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, "utf-8"));
}

function acknowledgeUser(userId) {
  const state = loadSessionState();
  if (state[userId]) {
    state[userId].status = "LOGGED_ONLY";
    state[userId].acknowledged = true;
  }
  fs.writeFileSync(SESSION_STATE_PATH, JSON.stringify(state, null, 2));
  return state;
}

module.exports = { processResponses, loadSessionState, loadAuditLog, acknowledgeUser };