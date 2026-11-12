import csv
from functools import lru_cache
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier

FEATURES = ['weather_risk', 'port_load', 'distance_km', 'customs_check', 'sea_share']

DATASET = Path(__file__).resolve().parent / 'data' / 'delay_history.csv'

def load_training_data():
    with DATASET.open(newline='', encoding='utf-8') as source:
        rows = list(csv.DictReader(source))
    features = np.array([[float(row[key]) for key in FEATURES] for row in rows], dtype=float)
    target = np.array([int(row['delayed']) for row in rows])
    return features, target

@lru_cache(maxsize=1)
def get_model():
    training_rows, training_target = load_training_data()
    model = RandomForestClassifier(n_estimators=80, max_depth=4, random_state=42, class_weight='balanced')
    model.fit(training_rows, training_target)
    return model

def predict_delay(payload):
    values = {
        'weather_risk': float(payload.get('weather_risk', 0.25)),
        'port_load': float(payload.get('port_load', 0.60)),
        'distance_km': float(payload.get('distance_km', 1200)),
        'customs_check': int(bool(payload.get('customs_check', False))),
        'sea_share': float(payload.get('sea_share', 0.80)),
    }
    vector = np.array([[values[key] for key in FEATURES]])
    model = get_model()
    probability = float(model.predict_proba(vector)[0][1])
    level = 'high' if probability >= .67 else 'medium' if probability >= .34 else 'low'
    recommendations = {
        'high': ['Проверить альтернативный порт', 'Заложить буфер минимум 12 часов', 'Запустить повторный прогноз через 6 часов'],
        'medium': ['Контролировать загрузку портов', 'Проверить комплектность документов'],
        'low': ['Маршрут можно оставить без изменений'],
    }
    importances = dict(zip(FEATURES, [round(float(value), 3) for value in model.feature_importances_]))
    return {'delay_probability': round(probability, 3), 'risk_level': level, 'recommendations': recommendations[level], 'feature_importance': importances, 'model': 'RandomForest trained on delay_history.csv'}

def predict_cargo(cargo, payload=None):
    """Build real features from a Cargo record and run the trained model."""
    from math import asin, cos, radians, sin, sqrt
    from apps.routes.models import Route
    payload = payload or {}
    lat1, lon1 = radians(cargo.origin.latitude), radians(cargo.origin.longitude)
    lat2, lon2 = radians(cargo.destination.latitude), radians(cargo.destination.longitude)
    distance_km = 6371 * 2 * asin(sqrt(sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2))
    port_load = min(1.0, (cargo.origin.outgoing_cargo.count() + cargo.destination.incoming_cargo.count()) / 10)
    documents_pending = cargo.documents.filter(is_verified=False).exists()
    route = Route.objects.filter(cargo=cargo).prefetch_related('steps').first()
    sea_steps = sum(step.transport_type == 'sea' for step in route.steps.all()) if route else 1
    total_steps = route.steps.count() if route else 1
    result = predict_delay({'weather_risk': payload.get('weather_risk', .75 if cargo.status == 'delayed' else .22), 'port_load': port_load, 'distance_km': round(distance_km), 'customs_check': documents_pending, 'sea_share': sea_steps / total_steps})
    result['cargo'] = cargo.container_number
    result['features_used'] = {'distance_km': round(distance_km), 'port_load': round(port_load, 2), 'customs_check': documents_pending, 'sea_share': round(sea_steps / total_steps, 2)}
    return result
