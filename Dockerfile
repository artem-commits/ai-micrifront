FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build || npx vite build --emptyOutDir

RUN ls -la /app/dist/

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN ls -la /usr/share/nginx/html/ && \
    cat /etc/nginx/conf.d/default.conf | head -20

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]