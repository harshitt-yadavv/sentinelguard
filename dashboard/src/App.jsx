import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import "./App.css";

const REFRESH_INTERVAL_MS = 10000; // 10 seconds

function SortableHeader({ label, sortField, sortKey, sortDir, onSort }) {
  return (
    <th onClick={() => onSort(sortField)} className="sortable">
      {label} {sortKey === sortField ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
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
        <h1>SentinelGuard</h1>
        <p className="login-subtitle">Sign in to view alerts</p>
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
        <button type="submit">Log In</button>
        <p className="login-hint">
          Demo accounts: admin / admin123 &nbsp;or&nbsp; analyst / analyst123
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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [sessionState, setSessionState] = useState({});

  const handleLogin = (newToken, newRole) => {
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setAlerts([]);
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
    return <div className="app">Loading SentinelGuard data...</div>;
  }

  return (
    <div className="app">
      <div className="header-row">
        <h1>SentinelGuard Dashboard</h1>
        <span className="last-updated">
          Logged in as <strong>{role}</strong> ·{" "}
          {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          {" · auto-refreshes every 10s"} ·{" "}
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </span>
      </div>

      <section>
        <h2>🚨 Active Alerts ({alerts.length})</h2>
        <section>
        <h2>👤 User Session Status</h2>
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
                <td>{state.status}</td>
                <td>
                  {state.triggering_event
                    ? `${state.triggering_event.action}, ${state.triggering_event.volume_mb}MB, ${new Date(state.triggering_event.timestamp).toLocaleString()}`
                    : "—"}
                </td>
                <td>
                  {state.status !== "LOGGED_ONLY" && !state.acknowledged && role === "admin" && (
                    <button className="ack-btn" onClick={() => handleAcknowledge(userId)}>
                      Acknowledge
                    </button>
                  )}
                  {state.acknowledged && <span className="ack-done">✓ Cleared</span>}
                  {role !== "admin" && state.status !== "LOGGED_ONLY" && <span>(admin only)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Volume (MB)</th>
              <th>Time</th>
              <th>Risk Score</th>
              <th>Level</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={i} className={a.level === "HIGH" ? "row-high" : "row-medium"}>
                <td>{a.user_id}</td>
                <td>{a.action}</td>
                <td>{a.volume_mb}</td>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
                <td>{a.score}</td>
                <td>{a.level}</td>
                <td>{a.reasons.join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Risk Score Over Time (most recent 60 events)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" tick={false} />
            <YAxis domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a2e", border: "none", color: "white" }}
            />
            <ReferenceLine y={70} stroke="#e74c3c" strokeDasharray="4 4" label="HIGH threshold" />
            <ReferenceLine y={35} stroke="#f1c40f" strokeDasharray="4 4" label="MEDIUM threshold" />
            <Line type="monotone" dataKey="score" stroke="#4ea8de" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section>
        <h2>All Events ({events.length})</h2>
        <p>Click column headers to sort. Showing most recent 20.</p>
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
                <td>{e.action}</td>
                <td>{e.volume_mb}</td>
                <td>{new Date(e.timestamp).toLocaleString()}</td>
                <td>{e.score}</td>
                <td>{e.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;