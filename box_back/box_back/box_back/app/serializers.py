from rest_framework import serializers
from .models import User, Task, Item

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=True)
    is_manager = serializers.BooleanField(default=False)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'password', 'is_manager']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        user = User(
            name=validated_data['name'],
            is_manager=validated_data.get('is_manager', False)
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    password = serializers.CharField()

# 输出用序列化器
class ItemSerializer(serializers.ModelSerializer):
    position = serializers.SerializerMethodField()
    dimensions = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = ['order_id', 'name', 'position', 'dimensions', 'face_up', 'fragile']
    
    def get_position(self, obj):
        return obj.position
    
    def get_dimensions(self, obj):
        return obj.dimensions

# 存储用序列化器
class ItemCreateSerializer(serializers.ModelSerializer):
    position = serializers.DictField()
    dimensions = serializers.DictField()
    
    class Meta:
        model = Item
        fields = ['order_id', 'name', 'position', 'dimensions', 'face_up', 'fragile']
    
    def create(self, validated_data):
        position = validated_data.pop('position')
        dimensions = validated_data.pop('dimensions')
        
        item = Item(
            order_id=validated_data['order_id'],
            name=validated_data['name'],
            position_x=position['x'],
            position_y=position['y'],
            position_z=position['z'],
            width=dimensions['x'],
            height=dimensions['y'],
            depth=dimensions['z'],
            face_up=validated_data.get('face_up', False),
            fragile=validated_data.get('fragile', False),
            task=self.context['task']
        )
        item.save()
        return item

# 输入用序列化器 - 不包含位置和顺序
class ItemInputSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    dimensions = serializers.DictField()
    face_up = serializers.BooleanField(default=False)
    fragile = serializers.BooleanField(default=False)

# 输入处理序列化器
class TaskInputSerializer(serializers.Serializer):
    creator_id = serializers.IntegerField()
    worker_id = serializers.IntegerField(required=False, allow_null=True)
    space_info = serializers.DictField()
    items = ItemInputSerializer(many=True)

# 输出完整任务序列化器
class TaskSerializer(serializers.ModelSerializer):
    creator = serializers.SerializerMethodField()
    worker = serializers.SerializerMethodField()
    space_info = serializers.SerializerMethodField()
    items = ItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'creator', 'worker', 'space_info', 'items', 'created_at']
    
    def get_creator(self, obj):
        return {
            "id": obj.creator.id,
            "name": obj.creator.name
        }
    
    def get_worker(self, obj):
        if obj.worker:
            return {
                "id": obj.worker.id,
                "name": obj.worker.name
            }
        return None
    
    def get_space_info(self, obj):
        return {
            'x': obj.space_x,
            'y': obj.space_y,
            'z': obj.space_z
        }