import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
from .feature_engineering import FeatureEngineer


class MLSignalGenerator:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_engineer = FeatureEngineer()


    def train(self, df: pd.DataFrame):
        features = self.feature_engineer.create_features(df)
        # Example label: 1 if next return > 0, else 0
        features['target'] = (features['returns_1'].shift(-1) > 0).astype(int)
        features = features.dropna()
        X = features.drop('target', axis=1).values
        y = features['target'].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.scaler.fit(X_train)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        print("Train accuracy:", self.model.score(X_train_scaled, y_train))
        print("Test accuracy:", self.model.score(X_test_scaled, y_test))
        joblib.dump(self.model, "ml_model.pkl")
        joblib.dump(self.scaler, "ml_scaler.pkl")

    def load(self):
        self.model = joblib.load("ml_model.pkl")
        self.scaler = joblib.load("ml_scaler.pkl")

    def predict(self, df: pd.DataFrame):
        features = self.feature_engineer.create_features(df)
        X = features.values[-1].reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        pred = self.model.predict(X_scaled)[0]
        proba = self.model.predict_proba(X_scaled)[0]
        return {"signal": "buy" if pred == 1 else "sell", "confidence": float(np.max(proba))}