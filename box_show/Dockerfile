# 构建阶段
FROM node:18-alpine as build
WORKDIR /app

# 环境变量设置 - 无内存限制
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# 安装依赖
COPY package.json ./
RUN npm install --only=production
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object

# 复制源码并构建
COPY public ./public
COPY src ./src
RUN CI=false npm run build

# 创建构建文件压缩包以便提取
RUN cd build && tar -czf ../build.tar.gz * && cd ..

# 最终镜像
FROM nginx:1.23-alpine
# 复制构建文件到Nginx默认目录
COPY --from=build /app/build /usr/share/nginx/html
# 同时保留压缩包，便于从容器中提取
COPY --from=build /app/build.tar.gz /build.tar.gz
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]