from rest_framework import serializers


class CoordinateSerializer(serializers.Serializer):
    x = serializers.FloatField(required=True)
    y = serializers.FloatField(required=True)
    z = serializers.FloatField(required=True)

class ModelInfo(serializers.Serializer):
    space_size = CoordinateSerializer(required=True)
    order = serializers.IntegerField(min_value=0)
    width = serializers.FloatField(min_value=0)
    height = serializers.FloatField(min_value=0)
    depth = serializers.FloatField(min_value=0)

class Modellist(serializers.Serializer):
    order = serializers.IntegerField(min_value=0)
    width = serializers.FloatField(min_value=0)
    height = serializers.FloatField(min_value=0)
    depth = serializers.FloatField(min_value=0)
    start_location = CoordinateSerializer(required=True)