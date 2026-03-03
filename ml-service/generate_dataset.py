import random
import re
from pathlib import Path

import pandas as pd

DATASET_PATH = Path(__file__).resolve().parent / "dataset.csv"
TARGET_ROWS = 2000

TECH_TOPICS = [
    "Node.js",
    "Express",
    "MongoDB",
    "React",
    "APIs",
    "Docker",
    "Authentication",
    "Microservices",
]

KEYWORDS = {
    "node.js": ["event loop", "non-blocking", "async", "npm", "runtime"],
    "express": ["middleware", "routing", "error handling", "rest", "controller"],
    "mongodb": ["index", "aggregation", "schema", "replica set", "sharding"],
    "react": ["hooks", "state", "props", "virtual dom", "component"],
    "apis": ["rest", "http", "status code", "pagination", "validation"],
    "docker": ["container", "image", "compose", "kubernetes", "deployment"],
    "authentication": ["jwt", "oauth", "refresh token", "hashing", "authorization"],
    "microservices": ["service discovery", "message queue", "scalability", "circuit breaker", "observability"],
}

OPENERS = [
    "In my implementation",
    "At production scale",
    "In one backend project",
    "During system design",
    "When building a distributed platform",
]

OUTCOMES = [
    "improved latency by 25%",
    "reduced API failures by 30%",
    "cut deployment time from 20 minutes to 5 minutes",
    "increased throughput during peak traffic",
    "improved reliability for authentication flows",
]


def tokenize(text: str):
    return re.findall(r"\b[a-zA-Z0-9.+-]+\b", text.lower())


def keyword_density(answer: str) -> float:
    tokens = tokenize(answer)
    if not tokens:
        return 0.0
    keyword_list = [kw for group in KEYWORDS.values() for kw in group]
    hits = 0
    lower_answer = answer.lower()
    for keyword in keyword_list:
        if keyword in lower_answer:
            hits += 1
    return hits / max(len(tokens), 1)


def generate_answer() -> str:
    topic = random.choice(TECH_TOPICS)
    topic_key = topic.lower()
    selected_keywords = random.sample(KEYWORDS[topic_key], k=random.randint(2, 4))
    opener = random.choice(OPENERS)
    outcome = random.choice(OUTCOMES)

    sentence_count = random.randint(2, 5)
    base = [
        f"{opener}, I used {topic} with {selected_keywords[0]} and {selected_keywords[1]} to build reliable services.",
        f"I focused on clean architecture, observability, and API stability while handling edge cases.",
        f"We validated changes with logs, metrics, and integration tests which {outcome}.",
        f"I also documented trade-offs and explained why the chosen approach fit the product constraints.",
        f"Security concerns were handled with rate limiting, input validation, and least-privilege access.",
    ]

    answer = " ".join(base[:sentence_count])

    if random.random() < 0.2:
        answer = f"I know {topic} and can use it."

    return answer


def label_answer(answer: str):
    length = len(tokenize(answer))
    density = keyword_density(answer)

    technical_depth = 3.8 + density * 75 + min(length / 40, 2.5) + random.uniform(-1.1, 1.1)
    clarity = 4.1 + min(length / 55, 2.6) + random.uniform(-1.2, 1.2)
    confidence = 4.0 + min(length / 60, 2.1) + density * 40 + random.uniform(-1.5, 1.5)

    technical_depth = max(1.0, min(10.0, technical_depth))
    clarity = max(1.0, min(10.0, clarity))
    confidence = max(1.0, min(10.0, confidence))

    return round(technical_depth, 2), round(clarity, 2), round(confidence, 2)


def main():
    rows = []
    for _ in range(TARGET_ROWS):
        answer = generate_answer()
        technical_depth, clarity, confidence = label_answer(answer)
        rows.append(
            {
                "answer": answer,
                "technical_depth": technical_depth,
                "clarity": clarity,
                "confidence": confidence,
            }
        )

    df = pd.DataFrame(rows)
    df.to_csv(DATASET_PATH, index=False)
    print(f"Generated dataset with {len(df)} rows at: {DATASET_PATH}")


if __name__ == "__main__":
    random.seed(42)
    main()
