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
- `GET /api/routes/` — маршруты
- `GET /api/analytics/` — аналитика
- `POST /api/simulation/storm/` — Demo Mode: шторм в MHK
- `POST /api/simulation/reset/` — откат Demo Mode
- `GET /api/customs/` — документы
- `POST /api/customs/verify/` — demo-проверка документов
- `GET /api/graph/` — узлы графа (fallback из PostgreSQL)

По умолчанию используется SQLite. Для PostgreSQL и Neo4j скопируйте `.env.example` в `.env` и заполните параметры.
