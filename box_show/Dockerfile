FROM node:18-alpine as build
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=800"
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# 分阶段复制和构建，减少内存需求
COPY package.json ./
RUN npm install --only=production
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object

# 分批复制和构建
COPY public ./public
COPY src ./src

RUN CI=false npm run build

FROM nginx:1.23-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]