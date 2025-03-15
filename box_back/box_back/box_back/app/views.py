from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import *
from .models import User, Task, Item
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@api_view(['GET'])
def h(request):
    return HttpResponse("Hello, this is a response from my_view!")

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['name', 'password'],
        properties={
            'name': openapi.Schema(type=openapi.TYPE_STRING, description='用户名'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='密码'),
            'is_manager': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='是否为主管')
        }
    ),
    responses={201: UserRegistrationSerializer}
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
            "is_manager": user.is_manager,
            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['id', 'password'],
        properties={
            'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='用户ID'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='密码'),
        }
    ),
    responses={
        200: openapi.Response(description="登录成功", 
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'name': openapi.Schema(type=openapi.TYPE_STRING),
                    'is_manager': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    'message': openapi.Schema(type=openapi.TYPE_STRING),
                }
            )),
        401: "用户名或密码错误",
        404: "用户不存在"
    }
)
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
                    "is_manager": user.is_manager,
                    "message": "Login successful"
                })
            else:
                return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 创建任务 - 更新为两阶段处理
@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'creator_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            'worker_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            'space_info': openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'x': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'y': openapi.Schema(type=openapi.TYPE_NUMBER),
                    'z': openapi.Schema(type=openapi.TYPE_NUMBER),
                },
            ),
            'items': openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'name': openapi.Schema(type=openapi.TYPE_STRING),
                        'dimensions': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'x': openapi.Schema(type=openapi.TYPE_NUMBER),
                                'y': openapi.Schema(type=openapi.TYPE_NUMBER),
                                'z': openapi.Schema(type=openapi.TYPE_NUMBER),
                            },
                        ),
                        'face_up': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'fragile': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    },
                ),
            ),
        },
    ),
    responses={201: TaskSerializer}
)
@api_view(['POST'])
def create_task(request):
    # 使用输入序列化器验证数据
    input_serializer = TaskInputSerializer(data=request.data)
    if input_serializer.is_valid():
        # 获取验证后的数据
        validated_data = input_serializer.validated_data
        
        # 获取创建者
        try:
            creator = User.objects.get(id=validated_data['creator_id'])
        except User.DoesNotExist:
            return Response({"error": "Creator not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # 获取工人（如果有）
        worker = None
        if 'worker_id' in validated_data and validated_data['worker_id']:
            try:
                worker = User.objects.get(id=validated_data['worker_id'])
            except User.DoesNotExist:
                return Response({"error": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # 获取空间信息
        space_data = validated_data['space_info']
        
        # 获取物品信息
        items_data = validated_data['items']
        
        # 创建任务
        task = Task.objects.create(
            creator=creator,
            worker=worker,
            space_x=space_data['x'],
            space_y=space_data['y'],
            space_z=space_data['z']
        )
        
        # 这里应该有算法计算物品的最佳位置和顺序
        # 暂时使用简单规则：按输入顺序排列，简单摆放
        current_x = 0
        for index, item_data in enumerate(items_data):
            # 分配顺序号（从1开始）
            order_id = index + 1
            
            # 获取尺寸
            dimensions = item_data['dimensions']
            
            # 计算位置（简单示例：沿X轴顺序排列）
            position = {
                'x': current_x,
                'y': 0,
                'z': 0
            }
            
            # 更新下一个物品的X起始位置
            current_x += dimensions['x']
            
            # 创建完整的物品数据（添加位置和顺序）
            complete_item_data = {
                'order_id': order_id,
                'name': item_data['name'],
                'position': position,
                'dimensions': dimensions,
                'face_up': item_data.get('face_up', False),
                'fragile': item_data.get('fragile', False)
            }
            
            # 保存物品到数据库
            item = Item.objects.create(
                task=task,
                order_id=order_id,
                name=item_data['name'],
                position_x=position['x'],
                position_y=position['y'],
                position_z=position['z'],
                width=dimensions['x'],
                height=dimensions['y'],
                depth=dimensions['z'],
                face_up=item_data.get('face_up', False),
                fragile=item_data.get('fragile', False)
            )
        
        # 返回完整的任务信息
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    
    return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 获取任务
@swagger_auto_schema(
    method='get',
    responses={
        200: TaskSerializer,
        404: "任务不存在"
    }
)
@api_view(['GET'])
def get_task(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

# 获取用户创建的所有任务
@swagger_auto_schema(
    method='get',
    responses={200: TaskSerializer(many=True)}
)
@api_view(['GET'])
def get_user_tasks(request, user_id):
    tasks = Task.objects.filter(creator_id=user_id)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

# 获取分配给工人的所有任务
@swagger_auto_schema(
    method='get',
    responses={200: TaskSerializer(many=True)}
)
@api_view(['GET'])
def get_worker_tasks(request, worker_id):
    tasks = Task.objects.filter(worker_id=worker_id)
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)