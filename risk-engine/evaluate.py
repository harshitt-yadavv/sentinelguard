import json
import os

def load_scored_events():
    path = os.path.join(os.path.dirname(__file__), "..", "data", "scored_events.json")
    with open(path, "r") as f:
        return json.load(f)

def evaluate():
    events = load_scored_events()

    # We know from how the data was built: the last 15 events are the injected
    # attack scenarios (14 attacks + 1 control case), everything before that is normal.
    normal_events = events[:-15]
    attack_events = events[-15:-1]   # exclude the final control case
    control_event = events[-1]       # the one normal-looking event mixed into the attack batch

    # Ground truth: attack_events should be flagged (MEDIUM or HIGH).
    # normal_events and the control_event should NOT be flagged (should be LOW).

    true_positives = sum(1 for e in attack_events if e["level"] in ("MEDIUM", "HIGH"))
    false_negatives = sum(1 for e in attack_events if e["level"] == "LOW")

    false_positives_normal = sum(1 for e in normal_events if e["level"] in ("MEDIUM", "HIGH"))
    true_negatives_normal = sum(1 for e in normal_events if e["level"] == "LOW")

    control_correct = control_event["level"] == "LOW"

    total_attacks = len(attack_events)
    total_normal = len(normal_events)

    detection_rate = true_positives / total_attacks * 100
    false_positive_rate = false_positives_normal / total_normal * 100

    print("=" * 60)
    print("SentinelGuard - Detection Evaluation Report")
    print("=" * 60)
    print(f"\nTotal normal events evaluated:  {total_normal}")
    print(f"Total attack events evaluated:  {total_attacks}")
    print(f"\n--- Detection Performance ---")
    print(f"True Positives (attacks correctly flagged):  {true_positives} / {total_attacks}")
    print(f"False Negatives (attacks missed):             {false_negatives} / {total_attacks}")
    print(f"Detection Rate:                                {detection_rate:.1f}%")
    print(f"\n--- False Alarm Performance ---")
    print(f"False Positives (normal events wrongly flagged): {false_positives_normal} / {total_normal}")
    print(f"True Negatives (normal events correctly ignored): {true_negatives_normal} / {total_normal}")
    print(f"False Positive Rate:                              {false_positive_rate:.3f}%")
    print(f"\n--- Control Case ---")
    print(f"Normal-looking event embedded in attack batch scored LOW: {control_correct}")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    evaluate()