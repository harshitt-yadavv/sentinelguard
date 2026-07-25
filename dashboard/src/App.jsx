import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import "./App.css";

const REFRESH_INTERVAL_MS = 10000; // 10 seconds

function LevelBadge({ level }) {
  const cls = level === "HIGH" ? "badge-high" : level === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{level}</span>;
}

function StatusBadge({ status }) {
  const cls =
    status === "SESSION_LOCKED" ? "badge-locked" :
    status === "ADMIN_ALERTED" ? "badge-alerted" : "badge-normal";
  const label =
    status === "SESSION_LOCKED" ? "LOCKED" :
    status === "ADMIN_ALERTED" ? "ALERTED" : "NORMAL";
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ActionIcon({ action }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", className: "action-icon" };
  switch (action) {
    case "usb_copy":
      return (
        <svg {...common}>
          <rect x="8" y="2" width="8" height="6" rx="1" stroke="#ff3b4e" strokeWidth="1.6" />
          <path d="M12 8v8" stroke="#ff3b4e" strokeWidth="1.6" />
          <rect x="7" y="16" width="10" height="6" rx="2" stroke="#ff3b4e" strokeWidth="1.6" />
        </svg>
      );
    case "cloud_upload":
      return (
        <svg {...common}>
          <path d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16.9 9.1 4.5 4.5 0 0 1 16.5 18H7Z" stroke="#ffb020" strokeWidth="1.6" />
          <path d="M12 15V9m0 0l-2.5 2.5M12 9l2.5 2.5" stroke="#ffb020" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 4v10m0 0l-3.5-3.5M12 14l3.5-3.5" stroke="#4ee2ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="#4ee2ff" strokeWidth="1.6" />
        </svg>
      );
    case "email_attachment":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#00ff9c" strokeWidth="1.6" />
          <path d="M3 7l9 6 9-6" stroke="#00ff9c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "file_access":
    default:
      return (
        <svg {...common}>
          <path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" stroke="#7fa8a0" strokeWidth="1.6" />
        </svg>
      );
  }
}

function SortableHeader({ label, sortField, sortKey, sortDir, onSort }) {
  return (
    <th onClick={() => onSort(sortField)} className="sortable">
      {label} {sortKey === sortField ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );
}

function BrandIcon() {
  return (
    <svg className="brand-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 3 L34 9 V19 C34 27.5 28 33.5 20 37 C12 33.5 6 27.5 6 19 V9 Z"
        stroke="#4ee2ff" strokeWidth="2" fill="rgba(78,226,255,0.05)"
      />
      <path d="M13 20 L18 25 L27 14" stroke="#00ff9c" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }
      const data = await res.json();
      onLogin(data.token, data.role);
    } catch {
      setError("Could not reach backend server");
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="brand" style={{ justifyContent: "center", marginBottom: 10 }}>
          <BrandIcon />
        </div>
        <h1>SENTINELGUARD</h1>
        <p className="login-subtitle">Secure Access Required</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit">Authenticate</button>
        <p className="login-hint">
          Demo: admin / admin123 &nbsp;or&nbsp; analyst / analyst123
        </p>
      </form>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sessionState, setSessionState] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const handleLogin = (newToken, newRole) => {
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setAlerts([]);
    setSessionState({});
  };

  const fetchData = () => {
    const eventsPromise = fetch("http://localhost:4000/api/events").then((res) => res.json());
    const alertsPromise = fetch("http://localhost:4000/api/alerts", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    });
    const sessionPromise = fetch("http://localhost:4000/api/session-state", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    });

    Promise.all([eventsPromise, alertsPromise, sessionPromise])
      .then(([eventsData, alertsData, sessionData]) => {
        setEvents(eventsData);
        setAlerts(alertsData);
        setSessionState(sessionData);
        setLoading(false);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.error("Failed to fetch from backend:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleAcknowledge = async (userId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/acknowledge/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to acknowledge");
        return;
      }
      const updated = await res.json();
      setSessionState(updated);
    } catch {
      alert("Could not reach backend server");
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (sortKey === "timestamp") {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const chartData = [...events]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-60)
    .map((e) => ({
      time: new Date(e.timestamp).toLocaleString(),
      score: e.score,
      user: e.user_id,
    }));

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (loading) {
    return <div className="loading-screen">// Establishing secure connection...</div>;
  }

  return (
    <div className="app">
      <div className="header-row">
        <div className="brand">
          <BrandIcon />
          <div>
            <h1>SENTINELGUARD</h1>
            <div className="brand-subtitle">Insider Threat Detection Console</div>
          </div>
        </div>
        <div className="status-strip">
          <span><span className="status-dot"></span>OPERATIONAL</span>
          <span className="role-pill">{role}</span>
          <span>{lastUpdated && lastUpdated.toLocaleTimeString()} · refresh 10s</span>
          <button className="logout-btn" onClick={handleLogout}>Disconnect</button>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="hud-panel">
          <p className="eyebrow">// User Session Status</p>
          <h2>Session Monitor</h2>
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Triggering Event</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sessionState).map(([userId, state]) => (
                <tr key={userId} className={
                  state.status === "SESSION_LOCKED" ? "row-high" :
                  state.status === "ADMIN_ALERTED" ? "row-medium" : ""
                }>
                  <td>{userId}</td>
                  <td><StatusBadge status={state.status} /></td>
                  <td>
                    {state.triggering_event ? (
                      <div className="action-cell">
                        <ActionIcon action={state.triggering_event.action} />
                        {`${state.triggering_event.action}, ${state.triggering_event.volume_mb}MB`}
                      </div>
                    ) : "—"}
                  </td>
                  <td>
                    {state.status !== "LOGGED_ONLY" && !state.acknowledged && role === "admin" && (
                      <button className="ack-btn" onClick={() => handleAcknowledge(userId)}>
                        Acknowledge
                      </button>
                    )}
                    {state.acknowledged && <span className="ack-done">✓ Cleared</span>}
                    {role !== "admin" && state.status !== "LOGGED_ONLY" && <span className="panel-note" style={{ margin: 0 }}>(admin only)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>

        <section className="hud-panel">
          <p className="eyebrow">// Threat Alerts</p>
          <h2>Active Alerts ({alerts.length})</h2>
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Volume</th>
                <th>Time</th>
                <th>Score</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} className={a.level === "HIGH" ? "row-high" : "row-medium"}>
                  <td>{a.user_id}</td>
                  <td>
                    <div className="action-cell">
                      <ActionIcon action={a.action} />
                      {a.action}
                    </div>
                  </td>
                  <td>{a.volume_mb} MB</td>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                  <td>{a.score}</td>
                  <td><LevelBadge level={a.level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      </div>

      <section className="hud-panel">
        <p className="eyebrow">// Risk Telemetry</p>
        <h2>Risk Score Over Time</h2>
        <p className="panel-note">Most recent 60 events, with HIGH/MEDIUM detection thresholds marked.</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2528" />
            <XAxis dataKey="time" tick={false} stroke="#23343a" />
            <YAxis domain={[0, 100]} stroke="#7fa8a0" tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f1517", border: "1px solid #23343a", color: "#e8f4ef", fontFamily: "JetBrains Mono", fontSize: 12 }}
            />
            <ReferenceLine y={70} stroke="#ff3b4e" strokeDasharray="4 4" label={{ value: "HIGH", fill: "#ff3b4e", fontSize: 11 }} />
            <ReferenceLine y={35} stroke="#ffb020" strokeDasharray="4 4" label={{ value: "MEDIUM", fill: "#ffb020", fontSize: 11 }} />
            <Line type="monotone" dataKey="score" stroke="#4ee2ff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="hud-panel">
        <p className="eyebrow">// Event Log</p>
        <h2>All Events ({events.length})</h2>
        <p className="panel-note">Click column headers to sort. Showing most recent 20.</p>
        <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <SortableHeader label="User" sortField="user_id" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Action" sortField="action" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Volume (MB)" sortField="volume_mb" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Time" sortField="timestamp" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Score" sortField="score" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Level" sortField="level" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sortedEvents.slice(0, 20).map((e, i) => (
              <tr key={i}>
                <td>{e.user_id}</td>
                <td>
                  <div className="action-cell">
                    <ActionIcon action={e.action} />
                    {e.action}
                  </div>
                </td>
                <td>{e.volume_mb}</td>
                <td>{new Date(e.timestamp).toLocaleString()}</td>
                <td>{e.score}</td>
                <td><LevelBadge level={e.level} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}

export default App;