from functools import lru_cache

import numpy as np
from sklearn.ensemble import RandomForestClassifier

FEATURES = ['weather_risk', 'port_load', 'distance_km', 'customs_check', 'sea_share']

DEMO_ROWS = np.array([
    [0.05, .30, 450, 0, .70], [0.15, .45, 700, 0, .80],
    [0.25, .60, 900, 1, .75], [0.35, .65, 1100, 0, .90],
    [0.45, .70, 1250, 1, .85], [0.60, .80, 1400, 1, .90],
    [0.72, .75, 1600, 0, .95], [0.82, .90, 1800, 1, .95],
    [0.10, .85, 1500, 1, .55], [0.55, .35, 600, 1, .60],
    [0.30, .90, 500, 0, .50], [0.78, .40, 1000, 1, .65],
], dtype=float)
DEMO_TARGET = np.array([0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1])

@lru_cache(maxsize=1)
def get_model():
    model = RandomForestClassifier(n_estimators=80, max_depth=4, random_state=42, class_weight='balanced')
    model.fit(DEMO_ROWS, DEMO_TARGET)
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
    return {'delay_probability': round(probability, 3), 'risk_level': level, 'recommendations': recommendations[level], 'feature_importance': importances, 'model': 'RandomForest demo v1'}
