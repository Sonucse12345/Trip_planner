"""URL configuration for eld_project."""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({'status': 'Backend is running', 'message': 'ELD Trip Planner API'})

urlpatterns = [
    path('', health_check),  # Root endpoint
    path('admin/', admin.site.urls),
    path('api/', include('trips.urls')),
]
