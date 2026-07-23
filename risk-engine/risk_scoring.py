from baseline import load_events, build_user_baselines

def score_event(event, baseline):
    """
    Returns a risk score from 0-100 and a list of reasons contributing to it.
    Simple, explainable rules - not a black box.
    """
    score = 0
    reasons = []

    hour = event["hour"]
    volume = event["volume_mb"]

    # 1. Off-hours check
    if hour < baseline["active_hour_min"] or hour > baseline["active_hour_max"]:
        score += 30
        reasons.append(f"Activity at hour {hour} is outside normal range "
                        f"({baseline['active_hour_min']}-{baseline['active_hour_max']})")

    # 2. Volume z-score check (how unusual is this file size for this user?)
    std = baseline["volume_std"] if baseline["volume_std"] > 0 else 1
    z_score = (volume - baseline["volume_mean"]) / std

    if z_score > 3:
        score += 40
        reasons.append(f"Volume {volume}MB is far above normal (z-score {z_score:.2f})")
    elif z_score > 2:
        score += 20
        reasons.append(f"Volume {volume}MB is above normal (z-score {z_score:.2f})")

    # 3. Risky action types carry inherent extra weight
    high_risk_actions = {"usb_copy": 15, "cloud_upload": 10}
    if event["action"] in high_risk_actions:
        score += high_risk_actions[event["action"]]
        reasons.append(f"Action '{event['action']}' is inherently higher risk")

    score = min(score, 100)
    return score, reasons

def classify_risk(score):
    if score >= 70:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    else:
        return "LOW"

if __name__ == "__main__":
    df = load_events()
    baselines = build_user_baselines(df)

    print("Sample risk scores on real events:\n")
    for _, event in df.head(10).iterrows():
        baseline = baselines[event["user_id"]]
        score, reasons = score_event(event, baseline)
        level = classify_risk(score)
        print(f"{event['user_id']} | {event['action']} | {event['volume_mb']}MB | "
              f"hour {event['hour']} -> Score: {score} ({level})")
        for r in reasons:
            print(f"    - {r}")