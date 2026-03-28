FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Set build-time env vars for Vite
ENV VITE_API_URL=/api
ENV VITE_APP_NAME=Code829
ENV VITE_DEFAULT_THEME=system

RUN npm run build

# Serve with nginx
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
