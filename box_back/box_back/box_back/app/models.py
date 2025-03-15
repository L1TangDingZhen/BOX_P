from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class User(models.Model):
    """用户表，存储用户信息"""
    name = models.CharField(max_length=100)
    password_hash = models.CharField(max_length=128)  # 存储哈希后的密码
    is_manager = models.BooleanField(default=False)  # 是否为主管
    
    def __str__(self):
        return f"{self.id}: {self.name}"
    
    def set_password(self, password):
        self.password_hash = make_password(password)
    
    def check_password(self, password):
        return check_password(password, self.password_hash)

class Task(models.Model):
    """任务表，直接包含空间信息和物品"""
    # 创建者与工人
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True)
    
    # 空间信息直接作为属性
    space_x = models.FloatField()
    space_y = models.FloatField()
    space_z = models.FloatField()
    
    # 创建时间
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Task {self.id} by {self.creator.name}"
    
    @property
    def space_info(self):
        """返回空间信息的字典形式"""
        return {
            'x': self.space_x,
            'y': self.space_y,
            'z': self.space_z
        }

class Item(models.Model):
    """物品表，关联到任务"""
    # 基本信息
    order_id = models.IntegerField()  # 顺序号
    name = models.CharField(max_length=100)
    
    # 位置信息
    position_x = models.FloatField()
    position_y = models.FloatField()
    position_z = models.FloatField()
    
    # 尺寸信息
    width = models.FloatField()
    height = models.FloatField()
    depth = models.FloatField()
    
    # 特殊属性 - 直接使用布尔字段
    face_up = models.BooleanField(default=False)
    fragile = models.BooleanField(default=False)
    
    # 关联任务
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='items')
    
    def __str__(self):
        return f"{self.order_id}: {self.name}"
    
    @property
    def position(self):
        return {'x': self.position_x, 'y': self.position_y, 'z': self.position_z}
    
    @property
    def dimensions(self):
        return {'x': self.width, 'y': self.height, 'z': self.depth}
