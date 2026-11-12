# Smart Caspian Transit — backend MVP

## Быстрый запуск

```powershell
cd snigerz
..\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

API: `http://127.0.0.1:8000/api/`  
Админка: `http://127.0.0.1:8000/admin/`

Основные endpoints:

- `GET /api/` — dashboard KPI
- `GET /api/ports/` — порты
- `GET /api/cargo/` — грузы
- `GET /api/cargo/MSKU1234567/route/` — маршрут контейнера
- `GET /api/cargo/MSKU1234567/location/` — приблизительная позиция
- `POST /api/cargo/MSKU1234567/location/` — обновить координаты груза
- `GET /api/routes/` — маршруты
- `GET /api/analytics/` — аналитика
- `POST /api/simulation/storm/` — Demo Mode: шторм в MHK
- `POST /api/simulation/reset/` — откат Demo Mode
- `GET /api/customs/` — документы
- `POST /api/customs/verify/` — demo-проверка документов
- `GET /api/graph/` — узлы графа (fallback из PostgreSQL)
- `POST /api/auth/register/` — регистрация
- `POST /api/auth/login/` — вход и получение JWT
- `POST /api/auth/refresh/` — обновление access-токена
- `GET/PATCH /api/auth/me/` — текущий пользователь
- `POST /api/auth/logout/` — выход и blacklist refresh-токена

По умолчанию используется SQLite. Для PostgreSQL и Neo4j скопируйте `.env.example` в `.env` и заполните параметры.

## Frontend и ML

Frontend находится в `frontend/`. Запустите backend в одном терминале:

```powershell
python manage.py runserver
```

А в другом терминале из папки `snigerz` поднимите простой статический сервер:

```powershell
python -m http.server 5500 --directory frontend
```

После этого откройте `http://127.0.0.1:5500/`.

Карта в dashboard использует Leaflet и OpenStreetMap. Она показывает порты, маршрут между узлами и приблизительную позицию первого активного контейнера.

Все API, кроме `/api/health/` и endpoints авторизации, требуют заголовок:

```text
Authorization: Bearer <access-token>
```

ML endpoint:

- `GET /api/ml/health/`
- `POST /api/ml/predict/`
- `POST /api/ml/predict-cargo/` — прогноз по реальному контейнеру и его маршруту

Пример запроса:

```json
{
  "weather_risk": 0.7,
  "port_load": 0.8,
  "distance_km": 1400,
  "customs_check": true,
  "sea_share": 0.9
}
```
