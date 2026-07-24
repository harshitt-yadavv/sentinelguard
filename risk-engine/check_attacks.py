import json
import os

path = os.path.join(os.path.dirname(__file__), "..", "data", "scored_events.json")
with open(path, "r") as f:
    data = json.load(f)

# Show the last 20 events (our attack scenarios were appended at the end)
for e in data[-20:]:
    print(f"{e['user_id']:10} {e['action']:16} {e['volume_mb']:>7} MB  {e['timestamp']}  Score:{e['score']:>3} ({e['level']})")