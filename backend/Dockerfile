FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npm run db:init && npm run db:seed && npm run dev"]
