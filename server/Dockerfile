# Dockerfile
FROM node:24.13.0-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start:dev" ]

