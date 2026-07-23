import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import "./App.css";

const REFRESH_INTERVAL_MS = 10000; // 10 seconds

function App() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("http://localhost:4000/api/events").then((res) => res.json()),
      fetch("http://localhost:4000/api/alerts").then((res) => res.json()),
    ])
      .then(([eventsData, alertsData]) => {
        setEvents(eventsData);
        setAlerts(alertsData);
        setLoading(false);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.error("Failed to fetch from backend:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
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

  const SortableHeader = ({ label, sortField }) => (
    <th onClick={() => handleSort(sortField)} className="sortable">
      {label} {sortKey === sortField ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  if (loading) {
    return <div className="app">Loading SentinelGuard data...</div>;
  }

  return (
    <div className="app">
      <div className="header-row">
        <h1>SentinelGuard Dashboard</h1>
        <span className="last-updated">
          {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
          {" · auto-refreshes every 10s"}
        </span>
      </div>

      <section>
        <h2>🚨 Active Alerts ({alerts.length})</h2>
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
              <SortableHeader label="User" sortField="user_id" />
              <SortableHeader label="Action" sortField="action" />
              <SortableHeader label="Volume (MB)" sortField="volume_mb" />
              <SortableHeader label="Time" sortField="timestamp" />
              <SortableHeader label="Score" sortField="score" />
              <SortableHeader label="Level" sortField="level" />
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