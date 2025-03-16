FROM node:18 as build

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force
RUN npm install

COPY . .

# 构建生产环境静态文件
RUN npm run build

# 生产环境容器
FROM nginx:1.23-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]