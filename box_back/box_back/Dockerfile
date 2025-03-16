FROM python:3.10

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt
RUN pip install gunicorn django-cors-headers

COPY . .

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=box_back.settings

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 使用gunicorn运行应用
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "box_back.wsgi:application"]