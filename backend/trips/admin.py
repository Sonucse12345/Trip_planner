"""Admin configuration for trips app."""

from django.contrib import admin
from .models import Trip, TripStop, DailyLog, LogEntry, DriverProfile


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'carrier_name', 'truck_number']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['id', 'driver_name', 'current_location', 'dropoff_location', 'status', 'created_at']
    list_filter = ['status']


@admin.register(TripStop)
class TripStopAdmin(admin.ModelAdmin):
    list_display = ['trip', 'stop_type', 'location_name', 'sequence']


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ['trip', 'date', 'day_number', 'total_driving_hours']


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ['daily_log', 'status', 'start_time', 'end_time', 'duration_hours']
