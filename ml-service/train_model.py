from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor

from feature_extractor import extract_features

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"
MODEL_PATH = BASE_DIR / "interview_model.pkl"

TARGET_COLUMNS = ["technical_depth", "clarity", "confidence"]
FEATURE_COLUMNS = [
    "answer_length",
    "keyword_density",
    "sentiment_score",
    "question_similarity",
]


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATASET_PATH}. Run generate_dataset.py first."
        )

    df = pd.read_csv(DATASET_PATH)

    feature_rows = [extract_features("", answer) for answer in df["answer"].fillna("")]
    feature_df = pd.DataFrame(feature_rows)[FEATURE_COLUMNS]
    y = df[TARGET_COLUMNS]

    base_estimator = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        min_samples_leaf=2,
        n_jobs=-1,
    )

    model = MultiOutputRegressor(base_estimator)
    model.fit(feature_df, y)

    artifact = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "target_columns": TARGET_COLUMNS,
    }

    joblib.dump(artifact, MODEL_PATH)
    print(f"Model trained and saved to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
