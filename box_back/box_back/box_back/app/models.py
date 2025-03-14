from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import json

class User(models.Model):
    """用户表，存储用户信息"""
    name = models.CharField(max_length=100)
    password_hash = models.CharField(max_length=128)  # 存储哈希后的密码
    
    def __str__(self):
        return f"{self.id}: {self.name}"
    
    def set_password(self, password):
        """设置密码，会自动哈希"""
        self.password_hash = make_password(password)
    
    def check_password(self, password):
        """验证密码是否正确"""
        return check_password(password, self.password_hash)

class SpaceInfo(models.Model):
    """空间信息"""
    x = models.FloatField()
    y = models.FloatField()
    z = models.FloatField()
    
    def __str__(self):
        return f"({self.x}, {self.y}, {self.z})"
    
    @property
    def as_dict(self):
        return {'x': self.x, 'y': self.y, 'z': self.z}

class Item(models.Model):
    """物品表"""
    item_id = models.CharField(max_length=50)  # 物品序列号
    name = models.CharField(max_length=100)    # 物品名称
    
    # 位置信息
    position_x = models.FloatField()
    position_y = models.FloatField()
    position_z = models.FloatField()
    
    # 尺寸信息
    width = models.FloatField()    # x方向尺寸
    height = models.FloatField()   # y方向尺寸
    depth = models.FloatField()    # z方向尺寸
    
    # 特殊属性
    face_up = models.BooleanField(default=False)       # 是否必须面朝上
    fragile = models.BooleanField(default=False)       # 是否易碎(顶层)
    
    # 外键关联到任务表
    task = models.ForeignKey('Task', on_delete=models.CASCADE, related_name='items')
    
    def __str__(self):
        return f"{self.item_id}: {self.name}"
    
    @property
    def position(self):
        return {'x': self.position_x, 'y': self.position_y, 'z': self.position_z}
    
    @property
    def dimensions(self):
        return {'x': self.width, 'y': self.height, 'z': self.depth}
    
    @property
    def special_properties(self):
        props = []
        if self.face_up:
            props.append("Face Up")
        if self.fragile:
            props.append("Fragile (Top Layer)")
        return props

class Task(models.Model):
    """任务表，存储装箱任务"""
    # 创建者信息
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    
    # 工人信息
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True)
    
    # 空间信息
    space_info = models.OneToOneField(SpaceInfo, on_delete=models.CASCADE)
    
    # 创建时间
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Task {self.id} by {self.creator.name}"