from rest_framework import serializers
from .models import User, Task, SpaceInfo, Item

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'password']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        user = User(name=validated_data['name'])
        user.set_password(validated_data['password'])
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    password = serializers.CharField()

class SpaceInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceInfo
        fields = ['x', 'y', 'z']

class ItemSerializer(serializers.ModelSerializer):
    position = serializers.SerializerMethodField()
    dimensions = serializers.SerializerMethodField()
    special_properties = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = ['item_id', 'name', 'position', 'dimensions', 'special_properties']
    
    def get_position(self, obj):
        return obj.position
    
    def get_dimensions(self, obj):
        return obj.dimensions
    
    def get_special_properties(self, obj):
        return obj.special_properties

class ItemCreateSerializer(serializers.ModelSerializer):
    position = serializers.DictField()
    dimensions = serializers.DictField()
    special_properties = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = Item
        fields = ['item_id', 'name', 'position', 'dimensions', 'special_properties']
    
    def create(self, validated_data):
        position = validated_data.pop('position')
        dimensions = validated_data.pop('dimensions')
        special_props = validated_data.pop('special_properties', [])
        
        item = Item(
            item_id=validated_data['item_id'],
            name=validated_data['name'],
            position_x=position['x'],
            position_y=position['y'],
            position_z=position['z'],
            width=dimensions['x'],
            height=dimensions['y'],
            depth=dimensions['z'],
            face_up='Face Up' in special_props,
            fragile='Fragile (Top Layer)' in special_props,
            task=self.context['task']
        )
        item.save()
        return item

class TaskCreateSerializer(serializers.ModelSerializer):
    creator_id = serializers.IntegerField()
    worker_id = serializers.IntegerField(required=False, allow_null=True)
    space_info = SpaceInfoSerializer()
    items = ItemCreateSerializer(many=True)
    
    class Meta:
        model = Task
        fields = ['id', 'creator_id', 'worker_id', 'space_info', 'items']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        # 获取创建者
        try:
            creator = User.objects.get(id=validated_data['creator_id'])
        except User.DoesNotExist:
            raise serializers.ValidationError({"creator_id": "User not found"})
        
        # 获取工人（如果有）
        worker = None
        if 'worker_id' in validated_data and validated_data['worker_id']:
            try:
                worker = User.objects.get(id=validated_data['worker_id'])
            except User.DoesNotExist:
                raise serializers.ValidationError({"worker_id": "Worker not found"})
        
        # 创建空间信息
        space_data = validated_data.pop('space_info')
        space_info = SpaceInfo.objects.create(**space_data)
        
        # 创建任务
        items_data = validated_data.pop('items')
        task = Task.objects.create(
            creator=creator,
            worker=worker,
            space_info=space_info
        )
        
        # 创建物品
        for item_data in items_data:
            serializer = ItemCreateSerializer(data=item_data, context={'task': task})
            serializer.is_valid(raise_exception=True)
            serializer.save()
        
        # 返回完整的任务
        task.refresh_from_db()  # 刷新以获取所有相关对象
        return task

class TaskSerializer(serializers.ModelSerializer):
    creator = serializers.SerializerMethodField()
    worker = serializers.SerializerMethodField()
    space_info = SpaceInfoSerializer()
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