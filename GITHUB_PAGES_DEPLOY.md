# Развертывание на GitHub Pages

## Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на https://github.com
2. Нажмите "New repository"
3. Назовите репозиторий (например, `order-platform`)
4. Выберите **Private** (чтобы ограничить доступ)
5. Нажмите "Create repository"

## Шаг 2: Загрузите файлы в репозиторий

### Вариант A: Через GitHub Desktop или Git

```bash
cd "C:\Users\FiatDial\Documents\COD\order-platform"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/order-platform.git
git push -u origin main
```

### Вариант B: Через веб-интерфейс GitHub

1. На странице репозитория нажмите "uploading an existing file"
2. Перетащите все файлы из папки `order-platform` (кроме `electron-setup` и `node_modules`)
3. Нажмите "Commit changes"

## Шаг 3: Настройте GitHub Pages

1. В репозитории перейдите в **Settings**
2. В левом меню найдите **Pages**
3. В разделе "Source" выберите:
   - Branch: `main` (или `master`)
   - Folder: `/ (root)`
4. Нажмите **Save**

## Шаг 4: Дождитесь публикации

GitHub Pages обычно публикует сайт за 1-2 минуты. После этого вы получите URL вида:
```
https://ВАШ_USERNAME.github.io/order-platform/
```

## Шаг 5: Дайте доступ трем пользователям

1. В репозитории перейдите в **Settings** → **Collaborators**
2. Нажмите "Add people"
3. Добавьте двух других пользователей по их GitHub username или email
4. Они получат приглашение на email

## Важные файлы для GitHub Pages

Убедитесь, что в репозитории есть:
- ✅ `index.html`
- ✅ `styles.css`
- ✅ `script.js`
- ✅ `.nojekyll` (важно! чтобы GitHub не обрабатывал файлы через Jekyll)

## Проверка

После публикации откройте URL и проверьте:
1. Открывается ли сайт
2. Работает ли Firebase (проверьте консоль F12)
3. Синхронизируются ли данные

## Обновление сайта

После изменений:
```bash
git add .
git commit -m "Update"
git push
```

Сайт обновится автоматически через 1-2 минуты.

