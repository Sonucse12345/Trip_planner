"""Models for the ELD Trip Planner."""

import uuid
from django.db import models
from django.contrib.auth.models import User


class DriverProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    carrier_name = models.CharField(max_length=200, default='')
    main_office_address = models.CharField(max_length=500, default='')
    truck_number = models.CharField(max_length=50, default='')
    trailer_number = models.CharField(max_length=50, default='')
    home_terminal_timezone = models.CharField(max_length=50, default='US/Eastern')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Driver: {self.user.get_full_name() or self.user.username}"


class Trip(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips', null=True, blank=True)
    driver_name = models.CharField(max_length=200, default='Driver')
    carrier_name = models.CharField(max_length=200, default='')
    main_office_address = models.CharField(max_length=500, default='')
    truck_number = models.CharField(max_length=50, default='')
    trailer_number = models.CharField(max_length=50, default='')
    shipping_doc_number = models.CharField(max_length=100, default='', blank=True)

    current_location = models.CharField(max_length=500)
    current_lat = models.FloatField(default=0)
    current_lng = models.FloatField(default=0)

    pickup_location = models.CharField(max_length=500)
    pickup_lat = models.FloatField(default=0)
    pickup_lng = models.FloatField(default=0)

    dropoff_location = models.CharField(max_length=500)
    dropoff_lat = models.FloatField(default=0)
    dropoff_lng = models.FloatField(default=0)

    current_cycle_used = models.FloatField(default=0, help_text='Hours already used in 70-hr/8-day cycle')
    total_distance_miles = models.FloatField(default=0)
    estimated_duration_hours = models.FloatField(default=0)

    start_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Trip {self.id} - {self.current_location} to {self.dropoff_location}"


class TripStop(models.Model):
    STOP_TYPE_CHOICES = [
        ('start', 'Trip Start'),
        ('pickup', 'Pickup'),
        ('dropoff', 'Dropoff'),
        ('fuel', 'Fueling'),
        ('rest', 'Mandatory Rest'),
        ('break', '30-min Break'),
        ('end', 'Trip End'),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    stop_type = models.CharField(max_length=20, choices=STOP_TYPE_CHOICES)
    location_name = models.CharField(max_length=500)
    latitude = models.FloatField()
    longitude = models.FloatField()
    arrival_time = models.DateTimeField()
    departure_time = models.DateTimeField(null=True, blank=True)
    duration_hours = models.FloatField(default=0)
    miles_from_start = models.FloatField(default=0)
    sequence = models.IntegerField(default=0)
    remarks = models.TextField(default='', blank=True)

    class Meta:
        ordering = ['sequence']

    def __str__(self):
        return f"{self.stop_type} at {self.location_name}"


class DailyLog(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField()
    day_number = models.IntegerField(default=1)

    total_miles = models.FloatField(default=0)
    total_driving_hours = models.FloatField(default=0)
    total_on_duty_hours = models.FloatField(default=0)
    total_sleeper_hours = models.FloatField(default=0)
    total_off_duty_hours = models.FloatField(default=0)

    carrier_name = models.CharField(max_length=200, default='')
    main_office_address = models.CharField(max_length=500, default='')
    truck_number = models.CharField(max_length=50, default='')
    trailer_number = models.CharField(max_length=50, default='')
    driver_name = models.CharField(max_length=200, default='')
    shipping_doc = models.CharField(max_length=200, default='', blank=True)

    remarks = models.TextField(default='', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day_number']
        unique_together = ['trip', 'date']

    def __str__(self):
        return f"Log Day {self.day_number} - {self.date}"


class LogEntry(models.Model):
    STATUS_CHOICES = [
        ('OFF', 'Off Duty'),
        ('SB', 'Sleeper Berth'),
        ('D', 'Driving'),
        ('ON', 'On Duty (Not Driving)'),
    ]

    daily_log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='entries')
    status = models.CharField(max_length=3, choices=STATUS_CHOICES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_hours = models.FloatField()
    location = models.CharField(max_length=500, default='')
    remarks = models.CharField(max_length=500, default='', blank=True)
    sequence = models.IntegerField(default=0)

    class Meta:
        ordering = ['sequence']

    def __str__(self):
        return f"{self.status}: {self.start_time} - {self.end_time}"
