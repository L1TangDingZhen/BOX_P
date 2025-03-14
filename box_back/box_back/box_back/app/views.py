from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserRegistrationSerializer, UserLoginSerializer, TaskCreateSerializer, TaskSerializer
from .models import User, Task
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@api_view(['GET'])
def h(request):
    return HttpResponse("Hello, this is a response from my_view!")



@swagger_auto_schema(
    method='post',  # 添加这一行，明确指定方法
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['name', 'password'],
        properties={
            'name': openapi.Schema(type=openapi.TYPE_STRING, description='用户名'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='密码'),
        }
    ),
    responses={201: "用户创建成功"}
)
# 用户注册
@api_view(['POST'])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            "id": user.id,
            "name": user.name,
            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 用户登录
@api_view(['POST'])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user_id = serializer.validated_data['id']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(id=user_id)
            if user.check_password(password):
                return Response({
                    "id": user.id,
                    "name": user.name,
                    "message": "Login successful"
                })
            else:
                return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 创建任务
@api_view(['POST'])
def create_task(request):
    serializer = TaskCreateSerializer(data=request.data)
    if serializer.is_valid():
        task = serializer.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 获取任务
@api_view(['GET'])
def get_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

# 获取用户创建的所有任务
@api_view(['GET'])
def get_user_tasks(request, user_id):
    tasks = Task.objects.filter(creator_id=user_id)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

# 获取分配给工人的所有任务
@api_view(['GET'])
def get_worker_tasks(request, worker_id):
    tasks = Task.objects.filter(worker_id=worker_id)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)