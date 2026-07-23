import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:4000/api/events").then((res) => res.json()),
      fetch("http://localhost:4000/api/alerts").then((res) => res.json()),
    ])
      .then(([eventsData, alertsData]) => {
        setEvents(eventsData);
        setAlerts(alertsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch from backend:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="app">Loading SentinelGuard data...</div>;
  }

  return (
    <div className="app">
      <h1>SentinelGuard Dashboard</h1>

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
        <h2>All Events ({events.length})</h2>
        <p>Showing most recent 20 of {events.length} total events</p>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Volume (MB)</th>
              <th>Time</th>
              <th>Score</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(-20).reverse().map((e, i) => (
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