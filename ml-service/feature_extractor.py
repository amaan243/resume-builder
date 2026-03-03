import re
from typing import Dict

from textblob import TextBlob

TECHNICAL_KEYWORDS = {
    "node", "node.js", "express", "middleware", "api", "rest", "mongodb", "mongoose",
    "react", "hooks", "state", "component", "docker", "container", "jwt", "oauth",
    "authentication", "authorization", "microservices", "scalability", "redis", "kafka",
    "queue", "load balancer", "index", "aggregation", "caching", "ci/cd", "kubernetes",
}


def _tokenize(text: str):
    return re.findall(r"\b[a-zA-Z0-9.+/-]+\b", (text or "").lower())


def keyword_density(answer: str) -> float:
    tokens = _tokenize(answer)
    if not tokens:
        return 0.0

    hits = sum(1 for token in tokens if token in TECHNICAL_KEYWORDS)

    answer_lower = (answer or "").lower()
    for multi_word in ["event loop", "virtual dom", "refresh token", "service discovery", "message queue"]:
        if multi_word in answer_lower:
            hits += 1

    return hits / len(tokens)


def sentiment_score(answer: str) -> float:
    if not answer:
        return 0.0
    polarity = TextBlob(answer).sentiment.polarity
    return float((polarity + 1) / 2)


def question_similarity(question: str, answer: str) -> float:
    q_tokens = set(_tokenize(question))
    a_tokens = set(_tokenize(answer))

    if not q_tokens or not a_tokens:
        return 0.0

    intersection = len(q_tokens.intersection(a_tokens))
    union = len(q_tokens.union(a_tokens))
    return intersection / union if union else 0.0


def extract_features(question: str, answer: str) -> Dict[str, float]:
    answer_tokens = _tokenize(answer)
    return {
        "answer_length": float(len(answer_tokens)),
        "keyword_density": float(keyword_density(answer)),
        "sentiment_score": float(sentiment_score(answer)),
        "question_similarity": float(question_similarity(question, answer)),
    }
