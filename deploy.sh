#!/bin/bash
set -e

# 显示彩色输出的函数
function echo_color {
  local color=$1
  local message=$2
  case $color in
    "green") echo -e "\033[0;32m$message\033[0m" ;;
    "red") echo -e "\033[0;31m$message\033[0m" ;;
    "yellow") echo -e "\033[0;33m$message\033[0m" ;;
    *) echo "$message" ;;
  esac
}

# 如果目标目录不存在，则创建
mkdir -p box_show/build

# 步骤1: 确保前端文件存在并正确部署
echo_color "yellow" "===== 步骤1: 处理前端文件 ====="
if [ -f "build.tar.gz" ]; then
  echo_color "green" "发现前端构建压缩包，正在解压..."
  # 删除旧文件
  rm -rf box_show/build/*
  # 解压前端文件
  tar -xzf build.tar.gz -C box_show/build/ || {
    echo_color "yellow" "标准解压失败，尝试使用sudo..."
    sudo tar -xzf build.tar.gz -C box_show/build/
    sudo chown -R $(whoami):$(whoami) box_show/build/
  }
  
  # 设置适当的权限
  chmod -R 755 box_show/build/
  echo_color "green" "前端文件解压完成！"
elif [ -f "frontend-image.tar" ]; then
  echo_color "yellow" "未发现前端构建压缩包，尝试从Docker镜像中提取..."
  
  # 从Docker镜像中提取前端文件
  echo_color "yellow" "正在从前端Docker镜像中提取文件..."
  CONTAINER_ID=$(docker create box_p-frontend)
  
  # 清空目标目录
  rm -rf box_show/build/*
  
  # 从容器中复制文件 (尝试几个可能的路径)
  docker cp $CONTAINER_ID:/app/build/. box_show/build/ || \
  docker cp $CONTAINER_ID:/usr/src/app/build/. box_show/build/ || \
  docker cp $CONTAINER_ID:/home/node/app/build/. box_show/build/ || {
    echo_color "red" "无法从容器中找到前端构建文件！"
    echo_color "yellow" "创建一个简单的index.html文件作为临时解决方案..."
    cat > box_show/build/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Box Packing Application</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .warning { color: #c00; background: #fff0f0; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Box Packing Application</h1>
    <div class="warning">
        <h2>前端文件未正确部署</h2>
        <p>这是一个临时页面。请确保前端构建文件已正确部署到服务器。</p>
        <p>API服务器可能正常运行，但前端文件缺失。</p>
    </div>
</body>
</html>
EOL
  }
  
  # 移除临时容器
  docker rm $CONTAINER_ID
  
  # 设置权限
  chmod -R 755 box_show/build/
  echo_color "green" "前端文件处理完成！"
else
  echo_color "red" "警告：未找到前端构建文件或Docker镜像！"
  echo_color "yellow" "创建一个简单的index.html文件作为临时解决方案..."
  
  # 创建一个简单的HTML文件以验证Nginx配置
  mkdir -p box_show/build
  cat > box_show/build/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Box Packing Application</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .warning { color: #c00; background: #fff0f0; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Box Packing Application</h1>
    <div class="warning">
        <h2>前端文件未找到</h2>
        <p>这是一个临时页面。请上传前端构建文件到服务器。</p>
        <p>您可以在本地运行 <code>npm run build</code> 然后将生成的文件上传到服务器。</p>
    </div>
</body>
</html>
EOL
  chmod 755 box_show/build/index.html
  echo_color "yellow" "临时index.html文件已创建"
fi

# 检查前端文件是否存在
if [ -f "box_show/build/index.html" ]; then
  echo_color "green" "前端文件检查通过：index.html 已找到"
else
  echo_color "red" "错误：box_show/build/index.html 不存在，部署可能会失败！"
fi

# 步骤2: 加载Docker镜像
echo_color "yellow" "===== 步骤2: 加载Docker镜像 ====="
if [ -f "backend-image.tar" ]; then
  echo_color "green" "正在加载后端Docker镜像..."
  docker load -i backend-image.tar
fi

if [ -f "frontend-image.tar" ] && [ ! -f "box_show/build/index.html" ]; then
  echo_color "green" "正在加载前端Docker镜像..."
  docker load -i frontend-image.tar
fi

# 步骤3: 检查并修复Docker Compose配置
echo_color "yellow" "===== 步骤3: 检查Docker Compose配置 ====="
if [ -f "docker-compose.yml" ]; then
  # 备份原始文件
  cp docker-compose.yml docker-compose.yml.bak
  
  # 修改Docker Compose配置，确保不引用未定义的卷
  echo_color "green" "更新Docker Compose配置..."
  sed -i 's/frontend-build:/\/usr\/share\/nginx\/html/g' docker-compose.yml || echo_color "yellow" "无需修改卷配置"
  
  # 检查是否包含VM_IP变量
  if grep -q 'VM_IP' docker-compose.yml; then
    echo_color "yellow" "检测到VM_IP变量，确保它有一个默认值..."
    # 创建或更新.env文件
    echo "VM_IP=$(hostname -I | awk '{print $1}')" > .env
    echo_color "green" "已创建.env文件，设置VM_IP=$(hostname -I | awk '{print $1}')"
  fi
else
  echo_color "red" "错误：未找到docker-compose.yml文件！"
  exit 1
fi

# 步骤4: 启动Docker服务
echo_color "yellow" "===== 步骤4: 重启Docker服务 ====="
echo_color "green" "停止现有容器..."
docker-compose down

echo_color "green" "启动服务..."
docker-compose up -d

# 步骤5: 验证部署
echo_color "yellow" "===== 步骤5: 验证部署 ====="
echo_color "green" "等待服务启动..."
sleep 5

# 检查Nginx容器中的文件
NGINX_CONTAINER=$(docker ps | grep nginx | awk '{print $1}')
if [ ! -z "$NGINX_CONTAINER" ]; then
  echo_color "green" "检查Nginx容器中的文件..."
  docker exec $NGINX_CONTAINER ls -la /usr/share/nginx/html/
  
  if docker exec $NGINX_CONTAINER [ -f /usr/share/nginx/html/index.html ]; then
    echo_color "green" "√ 成功: Nginx容器中存在index.html文件"
  else
    echo_color "red" "× 错误: Nginx容器中没有index.html文件！"
  fi
else
  echo_color "red" "× 错误: 未找到Nginx容器！"
fi

# 检查容器状态
if docker ps | grep -q "nginx"; then
  echo_color "green" "√ 成功: Nginx容器正在运行"
else
  echo_color "red" "× 错误: Nginx容器未运行！"
fi

if docker ps | grep -q "backend"; then
  echo_color "green" "√ 成功: 后端容器正在运行"
else
  echo_color "red" "× 错误: 后端容器未运行！"
fi

# 显示IP和访问信息
IP_ADDRESS=$(hostname -I | awk '{print $1}')
echo_color "green" "===== 部署完成 ====="
echo_color "green" "应用已部署到 http://$IP_ADDRESS"
echo_color "green" "API地址: http://$IP_ADDRESS/api/"
echo_color "yellow" "如果遇到问题，请检查Docker日志:"
echo "  docker logs \$(docker ps | grep nginx | awk '{print \$1}')"
echo "  docker logs \$(docker ps | grep backend | awk '{print \$1}')"