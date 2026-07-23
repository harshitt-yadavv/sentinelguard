import random
import datetime
import json
import os

USERS = ["u_alice", "u_bob", "u_carol"]
ACTIONS = ["file_access", "download", "usb_copy", "cloud_upload", "email_attachment"]

# Each user gets a rough "normal" active hour range and typical file size,
# so later the risk engine has real patterns to learn from.
USER_PROFILES = {
    "u_alice": {"active_hours": (9, 18), "typical_volume_mb": (0.5, 15)},
    "u_bob":   {"active_hours": (8, 17), "typical_volume_mb": (0.5, 10)},
    "u_carol": {"active_hours": (10, 19), "typical_volume_mb": (1, 20)},
}

def random_timestamp_within_hours(start_hour, end_hour):
    now = datetime.datetime.now()
    hour = random.randint(start_hour, end_hour - 1)
    minute = random.randint(0, 59)
    days_ago = random.randint(0, 29)  # spread events across the last 30 days
    return (now - datetime.timedelta(days=days_ago)).replace(
        hour=hour, minute=minute, second=random.randint(0, 59), microsecond=0
    )

def generate_event():
    user = random.choice(USERS)
    profile = USER_PROFILES[user]
    start_hour, end_hour = profile["active_hours"]
    min_vol, max_vol = profile["typical_volume_mb"]

    return {
        "user_id": user,
        "timestamp": random_timestamp_within_hours(start_hour, end_hour).isoformat(),
        "action": random.choice(ACTIONS),
        "volume_mb": round(random.uniform(min_vol, max_vol), 2),
    }

def generate_dataset(n_events=500):
    events = [generate_event() for _ in range(n_events)]
    events.sort(key=lambda e: e["timestamp"])
    return events

def generate_attack_events():
    """
    Deliberately suspicious events, used to test whether the risk engine
    correctly flags real insider-threat-style behavior.
    """
    now = datetime.datetime.now()
    return [
        {
            "user_id": "u_alice",
            "timestamp": now.replace(hour=2, minute=15, second=0, microsecond=0).isoformat(),
            "action": "usb_copy",
            "volume_mb": 480.0,  # huge, at 2am - very unusual for Alice
        },
        {
            "user_id": "u_bob",
            "timestamp": now.replace(hour=23, minute=40, second=0, microsecond=0).isoformat(),
            "action": "cloud_upload",
            "volume_mb": 320.0,  # late night, way above Bob's normal ~5MB
        },
        {
            "user_id": "u_carol",
            "timestamp": now.replace(hour=14, minute=0, second=0, microsecond=0).isoformat(),
            "action": "email_attachment",
            "volume_mb": 9.5,  # normal hours, normal size - a "control" case, should stay LOW
        },
    ]


if __name__ == "__main__":
    events = generate_dataset(500)

    output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "events.json")

    with open(output_path, "w") as f:
        json.dump(events, f, indent=2)

    print(f"Generated {len(events)} events -> {output_path}")

    attack_events = generate_attack_events()
    attack_path = os.path.join(output_dir, "attack_events.json")
    with open(attack_path, "w") as f:
        json.dump(attack_events, f, indent=2)

    print(f"Generated {len(attack_events)} attack test events -> {attack_path}")