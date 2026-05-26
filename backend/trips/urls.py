from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.register_view),
    path('auth/login/', views.login_view),
    path('auth/logout/', views.logout_view),
    path('auth/user/', views.current_user_view),
    path('auth/profile/', views.update_profile_view),
    path('trips/plan/', views.plan_trip_view),
    path('trips/send-report/', views.send_email_report_view),
    path('trips/<uuid:trip_id>/', views.trip_detail_view),
    path('trips/', views.trip_list_view),
    path('geocode/', views.geocode_view),
    path('dashboard/', views.dashboard_view),
]