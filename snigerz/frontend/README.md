# Smart Caspian Transit — frontend

Адаптивный интерфейс на чистых HTML, CSS и JavaScript. Фронтенд подключается к существующему Django REST API из `../` и не требует npm или сборки.

## Запуск

1. В терминале запустите backend из папки `snigerz`:

   ```powershell
   python manage.py migrate
   python manage.py seed_demo
   python manage.py runserver
   ```

2. Откройте `frontend/index.html` через VS Code Live Server. Стандартный адрес Live Server — `http://127.0.0.1:5500`.

3. Убедитесь, что Django доступен по `http://127.0.0.1:8000/api/`.

В `snigerz/snigerz/settings.py` уже настроен CORS для `http://127.0.0.1:5500` и `http://localhost:5500`.

## Настройка API

По умолчанию используется `http://127.0.0.1:8000/api`. Можно передать другой адрес параметром URL:

```text
http://127.0.0.1:5500/?api=http://localhost:8000/api
```

## Возможности

- KPI из `/api/` и операционная аналитика из `/api/analytics/`.
- Порты и грузы из `/api/ports/` и `/api/cargo/`.
- Маршрут выбранного контейнера из `/api/cargo/<container_number>/route/`.
- Документы из `/api/customs/`, demo-верификация через `/api/customs/verify/`.
- Demo-сценарий шторма через `/api/simulation/storm/` и сброс через `/api/simulation/reset/`.
- Карта Каспийского региона на Leaflet с режимами «Схема», «Спутник» и «Гибрид».

Если API недоступен, интерфейс показывает явно обозначенный демонстрационный набор, чтобы можно было посмотреть внешний вид. Действия, изменяющие backend, в этом режиме не выполняются.

## Внешние ресурсы

Карта использует Leaflet, тайлы OpenStreetMap и Esri; шрифт DM Sans/Manrope загружается с Google Fonts. Для их отображения требуется подключение к интернету.
