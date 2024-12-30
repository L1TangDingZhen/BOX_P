from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import *


@api_view(['GET'])
def h(request):
    return HttpResponse("Hello, this is a response from my_view!")


@api_view(['POST'])
def post_coordinate(request):
    serializer = ModelInfo(data=request.data)
    if serializer.is_valid():
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
def return_coordinate(request):
    serializer = Modellist(data=request.data)
    if serializer.is_valid():
        return Response(serializer.data)
    return Response(serializer.errors, status=400)