# Публикация листа на Netlify

## Что уже настроено

- HTML лежит в `outputs/character-sheet.html`.
- Netlify Functions лежат в `netlify/functions`.
- Портрет сохраняется в Netlify Blobs.
- Для замены портрета требуется секретный пароль.

## Публикация через GitHub

1. Создай пустой репозиторий на GitHub.
2. Загрузи в него весь проект, а не только папку `outputs`.
3. На Netlify открой **Add new project → Import an existing project**.
4. Выбери GitHub и созданный репозиторий.
5. Netlify прочитает `netlify.toml` автоматически:
   - Publish directory: `outputs`
   - Functions directory: `netlify/functions`
6. Открой **Site configuration → Environment variables**.
7. Создай переменную:
   - Key: `PORTRAIT_UPLOAD_TOKEN`
   - Value: придуманный длинный пароль
8. Нажми **Deploy site** или **Trigger deploy**.
9. После публикации открой сайт и нажми **Портрет персонажа**.
10. Выбери JPG, PNG или WEBP до 4 МБ, введи пароль и нажми **Применить**.

## Важно

- Не записывай пароль в HTML или GitHub.
- Пароль хранится только в Environment variables на Netlify.
- Новый портрет заменяет старый.
- При локальном открытии HTML постоянное облачное сохранение не работает. Для полной проверки используй `npm run dev`.
