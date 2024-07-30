# устанавливаем официальный образ Node.js
FROM node:19-alpine3.16

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Устанавливаем зависимости для Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    fontconfig \
    ttf-freefont \
    ttf-dejavu

# Копируем все файлы проекта в контейнер
COPY . .

# Указываем путь к исполняемому файлу браузера
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Указываем порт, на котором будет работать наше приложение
EXPOSE 8000

# запускаем основной скрипт в момент запуска контейнера
CMD ["npm", "start"]
