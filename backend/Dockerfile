FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev
RUN chown -R node:node /app
USER node
EXPOSE 5000
CMD ["node", "dist/src/server.js"]
