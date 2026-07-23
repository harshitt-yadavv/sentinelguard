import random
import datetime

USERS = ["u_alice", "u_bob", "u_carol"]
ACTIONS = ["file_access", "download", "usb_copy", "cloud_upload", "email_attachment"]

def generate_event():
    return {
        "user_id": random.choice(USERS),
        "timestamp": datetime.datetime.now().isoformat(),
        "action": random.choice(ACTIONS),
        "volume_mb": round(random.uniform(0.1, 50), 2),
    }

if __name__ == "__main__":
    for _ in range(5):
        print(generate_event())