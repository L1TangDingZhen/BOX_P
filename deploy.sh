#!/bin/bash
# EC2部署脚本

# 终止脚本，如果任何命令失败
set -e

echo "开始部署流程..."

# 1. 安装必要的软件
echo "安装Docker和Docker Compose..."
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 2. 创建项目目录结构
echo "创建项目目录结构..."
mkdir -p ~/box-app/nginx

# 3. 复制配置文件
echo "配置Nginx..."
cat > ~/box-app/nginx/nginx.conf << 'EOL'
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # 启用gzip压缩
    gzip on;
    gzip_disable "msie6";
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 前端服务
    server {
        listen 80;
        server_name localhost;
        
        # 前端静态文件
        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
            try_files $uri $uri/ /index.html; # React路由支持
        }

        # 后端API代理
        location /api/ {
            proxy_pass http://backend:8000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Swagger文档
        location /swagger/ {
            proxy_pass http://backend:8000/swagger/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # 静态错误页面
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}
EOL

# 4. 创建docker-compose.yml
echo "配置Docker Compose..."
cat > ~/box-app/docker-compose.yml << 'EOL'
version: '3'

services:
  # 后端服务
  backend:
    build:
      context: ./box_back/box_back
      dockerfile: Dockerfile
    environment:
      - DEBUG=False
      - ALLOWED_HOSTS=localhost,127.0.0.1,backend,your-ec2-public-ip
    networks:
      - app-network
    restart: unless-stopped

  # 前端服务
  frontend:
    build:
      context: ./box_show
      dockerfile: Dockerfile
    environment:
      - REACT_APP_API_URL=http://localhost/api
    networks:
      - app-network
    depends_on:
      - backend

  # Nginx服务 - 作为反向代理和静态文件服务器
  nginx:
    image: nginx:1.23-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./box_show/build:/usr/share/nginx/html
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
EOL

# 5. 部署应用
echo "开始构建和部署应用..."
cd ~/box-app

# 替换docker-compose.yml中的EC2公共IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
sed -i "s/your-ec2-public-ip/$PUBLIC_IP/g" docker-compose.yml

# 构建并启动服务
sudo docker-compose up -d

echo "部署完成！应用已启动。"
echo "通过以下地址访问应用: http://$PUBLIC_IP"