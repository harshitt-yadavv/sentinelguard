import json
import os
import pandas as pd

def load_events():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "events.json")
    with open(data_path, "r") as f:
        events = json.load(f)
    df = pd.DataFrame(events)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["hour"] = df["timestamp"].dt.hour
    return df

def build_user_baselines(df):
    """
    For each user, learn what 'normal' looks like:
    - typical active hour range
    - average and typical spread of file volume (MB)
    - how often each action type occurs
    """
    baselines = {}

    for user_id, user_df in df.groupby("user_id"):
        hours = user_df["hour"]
        volumes = user_df["volume_mb"]
        action_counts = user_df["action"].value_counts(normalize=True).to_dict()

        baselines[user_id] = {
            "active_hour_min": int(hours.min()),
            "active_hour_max": int(hours.max()),
            "volume_mean": round(volumes.mean(), 2),
            "volume_std": round(volumes.std(), 2),
            "action_distribution": {k: round(v, 3) for k, v in action_counts.items()},
            "event_count": len(user_df),
        }

    return baselines

if __name__ == "__main__":
    df = load_events()
    baselines = build_user_baselines(df)

    for user_id, profile in baselines.items():
        print(f"\n{user_id}:")
        for key, value in profile.items():
            print(f"  {key}: {value}")