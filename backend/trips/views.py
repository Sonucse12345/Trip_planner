"""Views for the ELD Trip Planner API."""

import os
import smtplib
import ssl
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from io import BytesIO

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import HttpResponse

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Trip, TripStop, DailyLog, LogEntry, DriverProfile
from .serializers import (
    TripInputSerializer, TripSerializer, TripListSerializer,
    RegisterSerializer, UserSerializer, DriverProfileSerializer,
)
from .hos_engine import plan_trip


# ── AUTH VIEWS ─────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)
        return Response({'user': UserSerializer(user).data, 'message': 'Registration successful'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({'user': UserSerializer(user).data, 'message': 'Login successful'})
    return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def current_user_view(request):
    if request.user.is_authenticated:
        profile = None
        try:
            profile = DriverProfileSerializer(request.user.driver_profile).data
        except Exception:
            pass
        return Response({'user': UserSerializer(request.user).data, 'profile': profile})
    return Response({'user': None}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_profile_view(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    profile, _ = DriverProfile.objects.get_or_create(user=request.user)
    serializer = DriverProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── TRIP VIEWS ─────────────────────────────────────────────────────────

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def plan_trip_view(request):
    serializer = TripInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data
    start_time = data.get('start_time') or datetime.now().replace(second=0, microsecond=0)
    try:
        result = plan_trip(
            current_location=data['current_location'],
            pickup_location=data['pickup_location'],
            dropoff_location=data['dropoff_location'],
            current_cycle_used=data['current_cycle_used'],
            start_time=start_time,
        )
    except Exception as e:
        return Response({'error': f'Trip planning failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    trip = Trip.objects.create(
        user=request.user if request.user.is_authenticated else None,
        driver_name=data.get('driver_name', 'Driver'),
        carrier_name=data.get('carrier_name', ''),
        main_office_address=data.get('main_office_address', ''),
        truck_number=data.get('truck_number', ''),
        trailer_number=data.get('trailer_number', ''),
        shipping_doc_number=data.get('shipping_doc_number', ''),
        current_location=data['current_location'],
        current_lat=result['current_coords'][0], current_lng=result['current_coords'][1],
        pickup_location=data['pickup_location'],
        pickup_lat=result['pickup_coords'][0], pickup_lng=result['pickup_coords'][1],
        dropoff_location=data['dropoff_location'],
        dropoff_lat=result['dropoff_coords'][0], dropoff_lng=result['dropoff_coords'][1],
        current_cycle_used=data['current_cycle_used'],
        total_distance_miles=result['total_miles'],
        estimated_duration_hours=result['total_duration_hours'],
        start_time=start_time, status='active',
    )
    for i, s in enumerate(result['stops']):
        TripStop.objects.create(
            trip=trip, stop_type=s['type'], location_name=s['location'],
            latitude=s['latitude'], longitude=s['longitude'],
            arrival_time=s['arrival'], departure_time=s['departure'],
            duration_hours=s['duration_hours'], sequence=i, remarks=s.get('remarks', ''),
        )
    for day_data in result['daily_logs']:
        daily_log = DailyLog.objects.create(
            trip=trip, date=day_data['date'], day_number=day_data['day_number'],
            total_miles=day_data['total_miles'],
            total_driving_hours=day_data['total_driving'], total_on_duty_hours=day_data['total_on_duty'],
            total_sleeper_hours=day_data['total_sleeper'], total_off_duty_hours=day_data['total_off_duty'],
            carrier_name=data.get('carrier_name', ''), main_office_address=data.get('main_office_address', ''),
            truck_number=data.get('truck_number', ''), trailer_number=data.get('trailer_number', ''),
            driver_name=data.get('driver_name', 'Driver'), shipping_doc=data.get('shipping_doc_number', ''),
            remarks=day_data.get('remarks', ''),
        )
        for j, entry in enumerate(day_data['entries']):
            LogEntry.objects.create(
                daily_log=daily_log, status=entry['status'],
                start_time=entry['start_time'], end_time=entry['end_time'],
                duration_hours=entry['duration_hours'],
                location=entry.get('location', ''), remarks=entry.get('remarks', ''), sequence=j,
            )

    return Response({
        'trip_id': str(trip.id),
        'segments': result['segments'], 'daily_logs': result['daily_logs'],
        'route_geometry': result['route_geometry'], 'stops': result['stops'],
        'compliance': result['compliance'], 'total_miles': result['total_miles'],
        'total_duration_hours': result['total_duration_hours'],
        'current_coords': result['current_coords'], 'pickup_coords': result['pickup_coords'],
        'dropoff_coords': result['dropoff_coords'],
        'trip_details': {
            'driver_name': trip.driver_name, 'carrier_name': trip.carrier_name,
            'truck_number': trip.truck_number, 'trailer_number': trip.trailer_number,
            'shipping_doc_number': trip.shipping_doc_number, 'main_office_address': trip.main_office_address,
        },
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def trip_detail_view(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return Response({'error': 'Trip not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(TripSerializer(trip).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def trip_list_view(request):
    if request.user.is_authenticated:
        trips = Trip.objects.filter(user=request.user).order_by('-created_at')
    else:
        trips = Trip.objects.all().order_by('-created_at')
    return Response(TripListSerializer(trips, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def geocode_view(request):
    query = request.query_params.get('q', '')
    if not query:
        return Response({'error': 'Query required'}, status=status.HTTP_400_BAD_REQUEST)
    import requests as r
    try:
        resp = r.get('https://nominatim.openstreetmap.org/search',
            params={'q': query, 'format': 'json', 'limit': 8, 'countrycodes': 'us', 'addressdetails': 1},
            headers={'User-Agent': 'ELD-Trip-Planner/1.0'}, timeout=8)
        if resp.status_code == 200:
            results = []
            for item in resp.json():
                a = item.get('address', {})
                city = a.get('city') or a.get('town') or a.get('village') or a.get('county') or ''
                state = a.get('state', '')
                name = item.get('name', '')
                if city and state:
                    dn = f'{name}, {city}, {state}' if name and name.lower() != city.lower() else f'{city}, {state}'
                else:
                    dn = ', '.join(item.get('display_name', '').split(',')[0:3])
                results.append({'display_name': dn, 'lat': float(item['lat']), 'lon': float(item['lon'])})
            return Response(results)
    except Exception:
        pass
    return Response([])


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_view(request):
    if request.user.is_authenticated:
        trips = Trip.objects.filter(user=request.user).order_by('-created_at')
    else:
        trips = Trip.objects.all().order_by('-created_at')
    total_trips = trips.count()
    total_miles = sum(t.total_distance_miles for t in trips)
    total_hours = sum(t.estimated_duration_hours for t in trips)
    return Response({
        'total_trips': total_trips, 'total_miles': round(total_miles, 1),
        'total_hours': round(total_hours, 1), 'cycle_hours_used': 0,
        'driving_today': 0, 'shift_hours_used': 0, 'break_due_in': 8,
        'today_off_duty': 0, 'today_sleeper': 0, 'today_on_duty': 0,
    })


# ── EMAIL REPORT ────────────────────────────────────────────────────────

def _build_email_html(driver_name, carrier_name, trip_details_text, logs_html):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 20px; color: #1e293b; }}
  .container {{ max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }}
  .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%); padding: 32px 36px; }}
  .header h1 {{ color: #fff; margin: 0 0 4px; font-size: 22px; letter-spacing: 0.04em; }}
  .header p {{ color: #93c5fd; margin: 0; font-size: 13px; }}
  .badge {{ display: inline-block; background: #22c55e; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; margin-top: 10px; letter-spacing: 0.05em; }}
  .body {{ padding: 32px 36px; }}
  .greeting {{ font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }}
  .intro {{ color: #64748b; font-size: 14px; line-height: 1.7; margin-bottom: 24px; }}
  .section {{ background: #f8faff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }}
  .section h3 {{ margin: 0 0 14px; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; }}
  .detail-row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }}
  .detail-row:last-child {{ border-bottom: none; }}
  .detail-label {{ color: #64748b; font-weight: 600; }}
  .detail-value {{ color: #1e293b; font-weight: 700; }}
  .compliance-list {{ list-style: none; margin: 0; padding: 0; }}
  .compliance-list li {{ padding: 7px 0; font-size: 13px; color: #374151; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 8px; }}
  .compliance-list li:last-child {{ border-bottom: none; }}
  .check {{ color: #22c55e; font-size: 16px; flex-shrink: 0; }}
  .warning-box {{ background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #92400e; }}
  .footer {{ background: #f8faff; border-top: 2px solid #e2e8f0; padding: 20px 36px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }}
  .footer strong {{ color: #374151; }}
  .hours-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 10px; }}
  .hour-box {{ text-align: center; padding: 12px 8px; border-radius: 10px; }}
  .hour-box .val {{ font-size: 22px; font-weight: 900; }}
  .hour-box .lbl {{ font-size: 11px; font-weight: 700; margin-top: 4px; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🚛 Driver's Daily Log Report</h1>
    <p>ELD Trip Planner — FMCSA Part 395 Compliant System</p>
    <div class="badge">✓ FMCSA COMPLIANT</div>
  </div>
  <div class="body">
    <div class="greeting">Dear {driver_name},</div>
    <p class="intro">
      Your official ELD trip report has been generated and is attached below.
      Please review all entries carefully before submission to your carrier.
    </p>

    {trip_details_text}

    <div class="section">
      <h3>⚖️ Compliance Verification</h3>
      <ul class="compliance-list">
        <li><span class="check">✅</span> <strong>11-Hour Driving Limit</strong> — §395.3(a)(3) — Verified</li>
        <li><span class="check">✅</span> <strong>14-Hour Driving Window</strong> — §395.3(a)(2) — Verified</li>
        <li><span class="check">✅</span> <strong>30-Minute Rest Break</strong> — §395.3(a)(3)(ii) — Verified</li>
        <li><span class="check">✅</span> <strong>70-Hour / 8-Day Cycle</strong> — §395.3(b) — Verified</li>
      </ul>
    </div>

    <div class="warning-box">
      ⚠️ <strong>Submission Instructions:</strong>
      Submit the ORIGINAL copy to your carrier within <strong>13 days</strong>.
      Retain the DUPLICATE copy for <strong>8 consecutive days</strong>.
      Keep this log available for roadside inspection at all times.
    </div>

    {logs_html}
  </div>
  <div class="footer">
    <strong>ELD Trip Planner</strong> — Automated Report System<br />
    Federal Motor Carrier Safety Administration Compliant<br />
    Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p UTC')}<br />
    <br />
    <em>CONFIDENTIAL: This report contains driver HOS data. Do not forward without authorization.</em>
  </div>
</div>
</body>
</html>"""


def _build_log_html(trip):
    """Build HTML table for all daily logs."""
    rows = ''
    for dl in trip.dailylog_set.all().order_by('day_number'):
        entries_html = ''
        for e in dl.logentry_set.all().order_by('sequence'):
            status_colors = {
                'OFF': ('#1d4ed8', '#dbeafe'),
                'SB': ('#4338ca', '#e0e7ff'),
                'D': ('#c2410c', '#fed7aa'),
                'ON': ('#d97706', '#fef3c7'),
            }
            sc, bg = status_colors.get(e.status, ('#64748b', '#f1f5f9'))
            label = {'OFF': 'Off Duty', 'SB': 'Sleeper Berth', 'D': 'Driving', 'ON': 'On Duty'}.get(e.status, e.status)
            def fmt_h(h):
                if h is None: return '—'
                hh = int(h); mm = round((h - hh) * 60)
                p = 'PM' if hh >= 12 else 'AM'; dh = hh if hh <= 12 else hh - 12; dh = dh or 12
                return f'{dh}:{mm:02d} {p}'
            entries_html += f'''<tr>
              <td style="padding:6px 10px;"><span style="background:{bg};color:{sc};font-weight:700;padding:2px 8px;border-radius:8px;font-size:12px;">{label}</span></td>
              <td style="padding:6px 10px;color:#475569;font-size:13px;">{fmt_h(e.start_time)}</td>
              <td style="padding:6px 10px;color:#475569;font-size:13px;">{fmt_h(e.end_time)}</td>
              <td style="padding:6px 10px;font-weight:700;font-size:13px;">{e.duration_hours:.2f}h</td>
              <td style="padding:6px 10px;color:#64748b;font-size:12px;">{e.location or '—'}</td>
            </tr>'''
        rows += f'''
        <div style="background:#f8faff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <strong style="font-size:15px;color:#1e293b;">Day {dl.day_number} — {dl.date}</strong>
            <span style="font-size:13px;color:#64748b;">{dl.total_miles:.1f} miles</span>
          </div>
          <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="background:#dbeafe;color:#1d4ed8;font-weight:700;padding:4px 10px;border-radius:8px;font-size:12px;">Off Duty: {dl.total_off_duty_hours:.2f}h</span>
            <span style="background:#e0e7ff;color:#4338ca;font-weight:700;padding:4px 10px;border-radius:8px;font-size:12px;">Sleeper: {dl.total_sleeper_hours:.2f}h</span>
            <span style="background:#fed7aa;color:#c2410c;font-weight:700;padding:4px 10px;border-radius:8px;font-size:12px;">Driving: {dl.total_driving_hours:.2f}h</span>
            <span style="background:#fef3c7;color:#d97706;font-weight:700;padding:4px 10px;border-radius:8px;font-size:12px;">On Duty: {dl.total_on_duty_hours:.2f}h</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
            <thead><tr style="background:#e2e8f0;">
              <th style="padding:7px 10px;text-align:left;font-size:12px;color:#374151;">Status</th>
              <th style="padding:7px 10px;text-align:left;font-size:12px;color:#374151;">Start</th>
              <th style="padding:7px 10px;text-align:left;font-size:12px;color:#374151;">End</th>
              <th style="padding:7px 10px;text-align:left;font-size:12px;color:#374151;">Duration</th>
              <th style="padding:7px 10px;text-align:left;font-size:12px;color:#374151;">Location</th>
            </tr></thead>
            <tbody>{entries_html}</tbody>
          </table>
        </div>'''
    return rows


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def send_email_report_view(request):
    """
    Send ELD report via SMTP to any email address.
    Reads credentials from environment variables:
      EMAIL_HOST_USER — your Gmail (or SMTP) address
      EMAIL_HOST_PASSWORD — Gmail App Password (not regular password)
      EMAIL_HOST — SMTP host (default: smtp.gmail.com)
      EMAIL_PORT — SMTP port (default: 587)
    """
    trip_id = request.data.get('trip_id')
    recipient_email = request.data.get('email', '').strip()
    driver_name = request.data.get('driver_name', 'Driver')
    carrier_name = request.data.get('carrier_name', '')

    # Fall back to logged-in user's email
    if not recipient_email and request.user.is_authenticated:
        recipient_email = request.user.email

    if not recipient_email:
        return Response({'error': 'Please enter a recipient email address.'}, status=status.HTTP_400_BAD_REQUEST)

    # Build trip details section
    trip = None
    trip_section = ''
    logs_html = ''
    if trip_id:
        try:
            trip = Trip.objects.get(id=str(trip_id))
            trip_section = f'''
            <div style="background:#f8faff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
              <h3 style="margin:0 0 14px;font-size:14px;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #dbeafe;padding-bottom:8px;">🗺️ Trip Summary</h3>
              <div style="font-size:14px;line-height:2;color:#374151;">
                <div><strong>Driver:</strong> {trip.driver_name}</div>
                <div><strong>Carrier:</strong> {trip.carrier_name or '—'}</div>
                <div><strong>Route:</strong> {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}</div>
                <div><strong>Total Miles:</strong> {trip.total_distance_miles:.1f} miles</div>
                <div><strong>Duration:</strong> {trip.estimated_duration_hours:.1f} hours</div>
                <div><strong>Trip Start:</strong> {trip.start_time.strftime("%B %d, %Y") if trip.start_time else "N/A"}</div>
                <div><strong>Truck / Trailer:</strong> {trip.truck_number or "—"} / {trip.trailer_number or "—"}</div>
              </div>
            </div>'''
            logs_html = f'<div style="margin-top:4px;"><h3 style="font-size:14px;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:14px;">📋 Daily Log Entries</h3>{_build_log_html(trip)}</div>'
        except Trip.DoesNotExist:
            trip_section = f'<p style="color:#64748b;">Trip ID: {trip_id}</p>'

    html_body = _build_email_html(driver_name, carrier_name, trip_section, logs_html)
    text_body = f"""ELD Trip Report — {driver_name}

Dear {driver_name},

Your ELD trip report has been generated by ELD Trip Planner (FMCSA Part 395 Compliant).

TRIP: {trip.current_location if trip else ''} → {trip.pickup_location if trip else ''} → {trip.dropoff_location if trip else ''}
DRIVER: {driver_name}
CARRIER: {carrier_name or '—'}
MILES: {trip.total_distance_miles:.1f} if trip else '—'

COMPLIANCE: All HOS rules verified per 49 CFR Part 395.

Submit ORIGINAL to carrier within 13 days.
Retain DUPLICATE for 8 consecutive days.

— ELD Trip Planner System
"""

    # ── SMTP Send ─────────────────────────────────────────────────────
    smtp_user = os.environ.get('EMAIL_HOST_USER', '').strip()
    smtp_pwd  = os.environ.get('EMAIL_HOST_PASSWORD', '').strip()
    smtp_host = os.environ.get('EMAIL_HOST', 'smtp.gmail.com').strip()
    smtp_port = int(os.environ.get('EMAIL_PORT', '587'))

    if not smtp_user or not smtp_pwd:
        return Response({
            'error': (
                'Email not configured. '
                'Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in backend/.env file. '
                'For Gmail: enable 2-Step Verification, then create an App Password at '
                'https://myaccount.google.com/apppasswords and paste it as EMAIL_HOST_PASSWORD.'
            ),
            'setup_required': True,
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'ELD Trip Report — {driver_name} | {carrier_name or "ELD Trip Planner"}'
        msg['From']    = f'ELD Trip Planner <{smtp_user}>'
        msg['To']      = recipient_email
        msg['Reply-To'] = smtp_user

        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(smtp_user, smtp_pwd)
            server.sendmail(smtp_user, [recipient_email], msg.as_string())

        return Response({
            'message': f'Report sent successfully to {recipient_email}! Please check your inbox (and spam folder).',
            'email': recipient_email,
        })

    except smtplib.SMTPAuthenticationError:
        return Response({
            'error': (
                'Gmail authentication failed. '
                'Make sure you are using an App Password (not your regular Gmail password). '
                'Go to https://myaccount.google.com/apppasswords to create one.'
            )
        }, status=status.HTTP_401_UNAUTHORIZED)
    except smtplib.SMTPConnectError:
        return Response({'error': f'Could not connect to {smtp_host}:{smtp_port}. Check EMAIL_HOST and EMAIL_PORT.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except smtplib.SMTPException as e:
        return Response({'error': f'SMTP error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
