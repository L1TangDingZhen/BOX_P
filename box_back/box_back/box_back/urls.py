"""
URL configuration for box_back project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls import re_path  # 添加这个导入
from .app import views

# 导入Swagger所需的库
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

# 创建Swagger视图
schema_view = get_schema_view(
    openapi.Info(
        title="Box Packing API",
        default_version='v1',
        description="API for box packing application",
        terms_of_service="https://www.yourapp.com/terms/",
        contact=openapi.Contact(email="contact@yourapp.com"),
        license=openapi.License(name="Your License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=(),  # 重要！禁用所有认证类

)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('h/', views.h),
    
    # 用户相关API
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user),
    
    # 任务相关API
    path('api/tasks/create/', views.create_task),
    path('api/tasks/<int:task_id>/', views.get_task),
    path('api/users/<int:user_id>/tasks/', views.get_user_tasks),
    path('api/workers/<int:worker_id>/tasks/', views.get_worker_tasks),
    
    # alg api
    path('api/algorithm/upload/', views.upload_algorithm, name='upload_algorithm'),

    # Swagger URLs
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]