FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY harvester.json ./

RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/src/index.js"]
