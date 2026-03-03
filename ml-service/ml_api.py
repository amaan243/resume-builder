from pathlib import Path
from typing import List, Tuple
import re

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from feature_extractor import extract_features

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "interview_model.pkl"

app = FastAPI(title="Interview Answer Evaluation API", version="1.0.0")

LOW_SIGNAL_PATTERNS = [
    r"\bi\s+don'?t\s+know\b",
    r"\bnot\s+sure\b",
    r"\bno\s+idea\b",
    r"\bi\s+can'?t\s+recall\b",
    r"\bi\s+don'?t\s+remember\b",
    r"\bmaybe\b",
    r"\bprobably\b",
]

GENERIC_FILLER_PATTERNS = [
    r"\bit\s+depends\b",
    r"\bwe\s+can\s+do\s+many\s+things\b",
    r"\bnot\s+much\b",
    r"\bgood\s+question\b",
]

TECH_CONCEPTS = {
    "jwt": ["token", "signature", "claim", "expiry", "refresh", "validation", "decode"],
    "authentication": ["password", "credential", "session", "identity", "verify", "secure"],
    "react": ["component", "hook", "state", "props", "render", "dom", "effect"],
    "node.js": ["event loop", "async", "callback", "promise", "non-blocking", "runtime"],
    "express": ["middleware", "routing", "handler", "request", "response", "controller"],
    "mongodb": ["collection", "document", "query", "index", "schema", "aggregation"],
    "api": ["endpoint", "request", "response", "status", "header", "payload"],
    "docker": ["container", "image", "volume", "network", "compose", "deploy"],
    "microservices": ["service", "communication", "deployment", "scalability", "independent"],
}


class PredictRequest(BaseModel):
    question: str = Field(min_length=3)
    answer: str = Field(min_length=5)


def _clamp_score(value: float) -> float:
    return round(float(max(0.0, min(10.0, value))), 1)


def _has_low_signal_answer(answer: str) -> bool:
    text = (answer or "").strip().lower()
    if not text:
        return True

    for pattern in LOW_SIGNAL_PATTERNS:
        if re.search(pattern, text):
            return True

    token_count = len(re.findall(r"\b\w+\b", text))
    if token_count <= 5:
        return True

    return False


def _is_context_mismatch(features: dict, answer: str) -> bool:
    text = (answer or "").strip().lower()
    if features["question_similarity"] < 0.035:
        return True

    if features["question_similarity"] < 0.06 and features["keyword_density"] < 0.02:
        return True

    for pattern in GENERIC_FILLER_PATTERNS:
        if re.search(pattern, text) and features["question_similarity"] < 0.08:
            return True

    return False


def _extract_topic(text: str) -> str:
    """Extract main topic/keyword from question."""
    text = (text or "").lower()
    for tech, keywords in TECH_CONCEPTS.items():
        if tech in text:
            return tech
        for kw in keywords[:2]:
            if kw in text:
                return tech
    return ""


def _extract_missing_concepts(question: str, answer: str) -> List[str]:
    """Find concepts mentioned in question but missing in answer."""
    q_text = (question or "").lower()
    a_text = (answer or "").lower()
    
    mentioned_in_q = []
    for concept, keywords in TECH_CONCEPTS.items():
        if concept in q_text or any(kw in q_text for kw in keywords[:3]):
            mentioned_in_q.append(concept)
    
    missing = []
    for concept in mentioned_in_q:
        if concept not in a_text:
            for kw in TECH_CONCEPTS[concept][:2]:
                if kw not in a_text:
                    missing.append(concept)
            break
    
    return missing[:2]


def _has_implementation_details(answer: str) -> bool:
    """Check if answer includes implementation steps or code concepts."""
    patterns = [
        r"implement", r"code", r"function", r"method", r"class", 
        r"library", r"framework", r"example", r"step", r"process",
        r"pass", r"return", r"initialize", r"create"
    ]
    text = (answer or "").lower()
    return any(re.search(p, text) for p in patterns)


def _has_trade_offs(answer: str) -> bool:
    """Check if answer mentions trade-offs, pros/cons, or alternatives."""
    patterns = [
        r"trade.?off", r"pro\b", r"con\b", r"advantage", r"disadvantage",
        r"alternative", r"instead", r"rather than", r"vs\b", r"versus"
    ]
    text = (answer or "").lower()
    return any(re.search(p, text) for p in patterns)


def _has_metrics(answer: str) -> bool:
    """Check if answer mentions numbers, performance metrics, or results."""
    text = (answer or "").lower()
    has_number = bool(re.search(r"\d+", answer or ""))
    has_metric = any(re.search(p, text) for p in [
        r"percent", r"%", r"time", r"performance", r"faster", r"improvement",
        r"reduced", r"increased", r"result", r"outcome", r"measurable"
    ])
    return has_number and has_metric


def _build_interviewer_feedback(
    overall: float,
    relevance: float,
    density: float,
    answer_len: float,
    low_signal: bool,
    context_mismatch: bool,
    question: str,
    answer: str,
) -> str:
    """Generate real interviewer-style feedback."""
    if low_signal:
        return (
            "This answer is not interview-ready. Saying 'I don't know' without attempting an approach "
            "shows low confidence and no technical depth. Always explain what you know about the topic."
        )

    if context_mismatch:
        topic = _extract_topic(question)
        if topic:
            return (
                f"Your answer doesn't directly address {topic}. I asked for specific explanation of that concept. "
                f"Next time, start with a clear definition and then provide implementation details."
            )
        return (
            "Answer does not address the question asked. I need direct explanation of the concept asked, "
            "not general discussion. Be specific and stay on topic."
        )

    if overall >= 8.0:
        return (
            "Strong answer. You demonstrated solid understanding with good technical depth and practical examples. "
            "You could further strengthen by mentioning trade-offs or scalability considerations."
        )
    elif overall >= 6.5:
        impl = _has_implementation_details(answer)
        tradeoff = _has_trade_offs(answer)
        if not impl:
            return (
                "Your answer shows understanding but lacks implementation details. "
                "Walk me through how you would actually code this solution."
            )
        if not tradeoff:
            return (
                "Good start, but you didn't mention any trade-offs or alternatives. "
                "In real projects, every approach has pros and cons—explain yours."
            )
        return "Answer is decent but needs more technical depth in certain areas."
    else:
        missing = _extract_missing_concepts(question, answer)
        if missing:
            topic = missing[0]
            return (
                f"Your explanation is too vague. You mentioned {topic} but didn't explain the implementation details. "
                f"What are the actual mechanisms or code patterns involved?"
            )
        metrics = _has_metrics(answer)
        if not metrics:
            return (
                "Answer lacks concrete examples or measurable outcomes. "
                "Tell me specific results or performance improvements from your experience."
            )
        return "Answer needs more technical detail and clarity to demonstrate expertise."


def _build_interviewer_suggestions(
    features: dict,
    low_signal: bool,
    context_mismatch: bool,
    question: str,
    answer: str,
) -> List[str]:
    """Generate real interviewer-style suggestions."""
    if low_signal:
        return [
            "Start with a basic definition of the concept instead of saying 'I don't know'",
            "Explain how you would approach solving or implementing it",
            "Share one concrete example from your project experience",
        ]

    if context_mismatch:
        return [
            "Read the question carefully and answer the exact thing asked",
            "Use technical terms specific to the question topic",
            "Provide a concrete implementation example, not general talk",
        ]

    suggestions = []
    
    missing = _extract_missing_concepts(question, answer)
    if missing:
        topic = missing[0]
        keywords = TECH_CONCEPTS.get(topic, [])
        if keywords:
            suggestions.append(f"Explain how {keywords[0]} works in your {topic} implementation")
    
    if not _has_implementation_details(answer):
        suggestions.append("Walk through the actual code or steps to implement this solution")
    
    if not _has_trade_offs(answer):
        suggestions.append("Discuss trade-offs: when is this approach better than alternatives?")
    
    if not _has_metrics(answer):
        suggestions.append("Include measurable results or performance metrics from real projects")
    
    if len(suggestions) < 3 and features["keyword_density"] < 0.08:
        suggestions.append("Use more technical terminology when explaining concepts")
    
    if not suggestions:
        suggestions = [
            "Structure with: problem → approach → implementation → results",
            "Provide specific architecture or design pattern examples",
            "Explain performance characteristics or scaling considerations",
        ]

    return suggestions[:3]


def _load_artifact():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Train model using train_model.py"
        )
    return joblib.load(MODEL_PATH)


@app.post("/predict")
def predict(payload: PredictRequest):
    try:
        artifact = _load_artifact()
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    features = extract_features(payload.question, payload.answer)
    feature_columns = artifact["feature_columns"]
    frame = pd.DataFrame([features])[feature_columns]

    model = artifact["model"]
    pred = model.predict(frame)[0]

    technical_depth = _clamp_score(pred[0])
    clarity = _clamp_score(pred[1])

    confidence_raw = pred[2] + (features["sentiment_score"] - 0.5) * 1.2
    confidence = _clamp_score(confidence_raw)

    relevance_adjustment = min(features["question_similarity"] * 4.0, 1.2)
    overall_raw = (technical_depth * 0.4 + clarity * 0.3 + confidence * 0.3) + relevance_adjustment
    overall_score = _clamp_score(overall_raw)

    low_signal = _has_low_signal_answer(payload.answer)
    context_mismatch = _is_context_mismatch(features, payload.answer)

    if low_signal:
        technical_depth = min(technical_depth, 2.2)
        clarity = min(clarity, 3.0)
        confidence = min(confidence, 2.3)
        overall_score = _clamp_score((technical_depth * 0.45) + (clarity * 0.25) + (confidence * 0.30))
    elif context_mismatch:
        technical_depth = min(technical_depth, 3.4)
        clarity = min(clarity, 4.0)
        confidence = min(confidence, 3.8)
        overall_score = _clamp_score((technical_depth * 0.4) + (clarity * 0.3) + (confidence * 0.3))

    feedback = _build_interviewer_feedback(
        overall_score,
        features["question_similarity"],
        features["keyword_density"],
        features["answer_length"],
        low_signal,
        context_mismatch,
        payload.question,
        payload.answer,
    )
    suggestions = _build_interviewer_suggestions(
        features, low_signal, context_mismatch, payload.question, payload.answer
    )

    return {
        "technicalDepth": technical_depth,
        "clarity": clarity,
        "confidence": confidence,
        "overallScore": overall_score,
        "feedback": feedback,
        "suggestions": suggestions,
    }
