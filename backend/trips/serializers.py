"""Serializers for the ELD Trip Planner API."""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Trip, TripStop, DailyLog, LogEntry, DriverProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        DriverProfile.objects.create(user=user)
        return user


class DriverProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = DriverProfile
        fields = [
            'id', 'username', 'email', 'full_name',
            'carrier_name', 'main_office_address',
            'truck_number', 'trailer_number',
            'home_terminal_timezone',
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class TripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=500)
    pickup_location = serializers.CharField(max_length=500)
    dropoff_location = serializers.CharField(max_length=500)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)
    driver_name = serializers.CharField(max_length=200, required=False, default='Driver')
    carrier_name = serializers.CharField(max_length=200, required=False, default='')
    main_office_address = serializers.CharField(max_length=500, required=False, default='')
    truck_number = serializers.CharField(max_length=50, required=False, default='')
    trailer_number = serializers.CharField(max_length=50, required=False, default='')
    shipping_doc_number = serializers.CharField(max_length=100, required=False, default='')
    start_time = serializers.DateTimeField(required=False, default=None)

    def validate_current_cycle_used(self, value):
        if value > 70:
            raise serializers.ValidationError(
                "Current cycle used cannot exceed 70 hours (FMCSA 70-hr/8-day limit)."
            )
        return value


class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = '__all__'


class DailyLogSerializer(serializers.ModelSerializer):
    entries = LogEntrySerializer(many=True, read_only=True)

    class Meta:
        model = DailyLog
        fields = '__all__'


class TripStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripStop
        fields = '__all__'


class TripSerializer(serializers.ModelSerializer):
    stops = TripStopSerializer(many=True, read_only=True)
    daily_logs = DailyLogSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'


class TripListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'id', 'driver_name', 'current_location', 'pickup_location',
            'dropoff_location', 'total_distance_miles', 'status',
            'created_at', 'current_cycle_used',
        ]
