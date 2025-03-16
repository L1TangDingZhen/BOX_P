# 使用更轻量级的Alpine基础镜像
FROM node:18-alpine as build

# 设置工作目录
WORKDIR /app

# 增加Node.js内存限制并设置生产模式
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NODE_ENV=production

# 只复制package文件
COPY package*.json ./

# 安装依赖 - 只安装生产依赖项以减少内存使用
RUN npm install --only=production

# 复制源代码
COPY . .

# 跳过测试，直接构建
RUN CI=false npm run build

# 第二阶段: 只使用Nginx托管静态文件
FROM nginx:1.23-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]