import pandas as pd
from sklearn.ensemble import IsolationForest
from baseline import load_events

def prepare_features(df):
    """
    Turn raw events into numbers a model can learn from.
    We one-hot encode the action type and keep hour + volume as-is.
    """
    features = df[["hour", "volume_mb"]].copy()
    action_dummies = pd.get_dummies(df["action"], prefix="action")
    features = pd.concat([features, action_dummies], axis=1)
    return features

def train_isolation_forest(df):
    features = prepare_features(df)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.01,  # we expect roughly 1% of events to be anomalous
        random_state=42,
    )
    model.fit(features)
    return model, features

def score_with_ml(model, features):
    """
    Returns -1 for anomalies, 1 for normal, plus a continuous anomaly score
    (lower = more anomalous).
    """
    predictions = model.predict(features)
    anomaly_scores = model.decision_function(features)
    return predictions, anomaly_scores
if __name__ == "__main__":
    import json
    import os

    df = load_events()
    model, features = train_isolation_forest(df)
    predictions, anomaly_scores = score_with_ml(model, features)

    df["ml_prediction"] = predictions
    df["ml_anomaly_score"] = anomaly_scores

    anomalies = df[df["ml_prediction"] == -1]
    print(f"Isolation Forest flagged {len(anomalies)} anomalies out of {len(df)} normal events:\n")
    print(anomalies[["user_id", "action", "volume_mb", "timestamp", "ml_anomaly_score"]])

    print("\n" + "="*60)
    print("Testing ML model on INJECTED ATTACK events:\n")

    attack_path = os.path.join(os.path.dirname(__file__), "..", "data", "attack_events.json")
    with open(attack_path, "r") as f:
        attack_events = json.load(f)

    attack_df = pd.DataFrame(attack_events)
    attack_df["timestamp"] = pd.to_datetime(attack_df["timestamp"])
    attack_df["hour"] = attack_df["timestamp"].dt.hour

    attack_features = prepare_features(attack_df)
    # Make sure attack events have the same columns as training data
    # (in case an action type appears in one but not the other)
    attack_features = attack_features.reindex(columns=features.columns, fill_value=0)

    attack_predictions, attack_scores = score_with_ml(model, attack_features)
    attack_df["ml_prediction"] = attack_predictions
    attack_df["ml_anomaly_score"] = attack_scores

    print(attack_df[["user_id", "action", "volume_mb", "timestamp", "ml_prediction", "ml_anomaly_score"]])