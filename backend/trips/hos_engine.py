"""
HOS (Hours of Service) Compliance Engine
FMCSA Part 395 — Property-Carrying Driver, 70-hr/8-day rule.

Rules implemented:
  1. 14-Hour Driving Window (§395.3(a)(2))
  2. 11-Hour Driving Limit (§395.3(a)(3))
  3. 30-Minute Rest Break after 8 cumulative driving hours (§395.3(a)(3)(ii))
  4. 70-Hour/8-Day Rolling Limit (§395.3(b))
  5. 34-Hour Restart (§395.3(c))
  6. 10-Hour Off-Duty Reset
  7. Fueling every 1,000 miles
  8. 1 hour for pickup, 1 hour for dropoff
"""

from datetime import datetime, timedelta
from dataclasses import dataclass, field
import math


DRIVING_LIMIT_HOURS = 11.0
DRIVING_WINDOW_HOURS = 14.0
BREAK_REQUIRED_AFTER_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
OFF_DUTY_RESET_HOURS = 10.0
CYCLE_LIMIT_HOURS = 70.0
CYCLE_DAYS = 8
RESTART_HOURS = 34.0
FUELING_INTERVAL_MILES = 1000
FUELING_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
AVG_SPEED_MPH = 55.0


@dataclass
class TripSegment:
    segment_type: str          # 'drive', 'pickup', 'dropoff', 'fuel', 'break', 'rest', 'off_duty'
    start_time: datetime
    end_time: datetime
    duration_hours: float
    start_miles: float
    end_miles: float
    location_name: str = ''
    latitude: float = 0.0
    longitude: float = 0.0
    duty_status: str = 'OFF'   # OFF, SB, D, ON
    remarks: str = ''


@dataclass
class DayLog:
    date: object
    day_number: int
    entries: list = field(default_factory=list)
    total_driving: float = 0.0
    total_on_duty: float = 0.0
    total_sleeper: float = 0.0
    total_off_duty: float = 0.0
    total_miles: float = 0.0
    remarks_list: list = field(default_factory=list)


@dataclass
class HOSState:
    current_time: datetime = None
    driving_hours_used: float = 0.0
    window_start: datetime = None
    window_hours_elapsed: float = 0.0
    driving_since_break: float = 0.0
    cycle_hours_used: float = 0.0
    miles_since_fuel: float = 0.0
    total_miles: float = 0.0
    is_on_duty: bool = False


def geocode_location(location_str):
    """Use Nominatim to geocode a location string."""
    import requests
    try:
        resp = requests.get(
            'https://nominatim.openstreetmap.org/search',
            params={'q': location_str, 'format': 'json', 'limit': 1},
            headers={'User-Agent': 'ELD-Trip-Planner/1.0'},
            timeout=10,
        )
        if resp.status_code == 200 and resp.json():
            data = resp.json()[0]
            return float(data['lat']), float(data['lon']), data.get('display_name', location_str)
    except Exception:
        pass
    return 0.0, 0.0, location_str


def get_route(origin_lat, origin_lng, dest_lat, dest_lng):
    """Get route from OSRM."""
    import requests
    try:
        url = (
            f"http://router.project-osrm.org/route/v1/driving/"
            f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
            f"?overview=full&geometries=geojson&steps=true"
        )
        resp = requests.get(url, timeout=15, headers={'User-Agent': 'ELD-Trip-Planner/1.0'})
        if resp.status_code == 200:
            data = resp.json()
            if data.get('routes'):
                route = data['routes'][0]
                distance_miles = route['distance'] * 0.000621371
                duration_hours = route['duration'] / 3600.0
                geometry = route['geometry']
                steps = []
                for leg in route.get('legs', []):
                    for step in leg.get('steps', []):
                        steps.append({
                            'distance_miles': step['distance'] * 0.000621371,
                            'duration_hours': step['duration'] / 3600.0,
                            'name': step.get('name', ''),
                            'maneuver': step.get('maneuver', {}),
                            'geometry': step.get('geometry', {}),
                        })
                return {
                    'distance_miles': distance_miles,
                    'duration_hours': duration_hours,
                    'geometry': geometry,
                    'steps': steps,
                }
    except Exception:
        pass
    dist = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
    return {
        'distance_miles': dist,
        'duration_hours': dist / AVG_SPEED_MPH,
        'geometry': {
            'type': 'LineString',
            'coordinates': [[origin_lng, origin_lat], [dest_lng, dest_lat]],
        },
        'steps': [],
    }


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in miles between two coordinates."""
    R = 3958.8
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def interpolate_point(coords, fraction):
    """Get lat/lng at a fraction of the way along a route geometry."""
    if not coords or len(coords) < 2:
        return (0, 0)
    if fraction <= 0:
        return (coords[0][1], coords[0][0])
    if fraction >= 1:
        return (coords[-1][1], coords[-1][0])

    total_dist = 0
    seg_dists = []
    for i in range(len(coords) - 1):
        d = haversine_distance(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0])
        seg_dists.append(d)
        total_dist += d

    if total_dist == 0:
        return (coords[0][1], coords[0][0])

    target_dist = fraction * total_dist
    accumulated = 0
    for i, d in enumerate(seg_dists):
        if accumulated + d >= target_dist:
            seg_frac = (target_dist - accumulated) / d if d > 0 else 0
            lat = coords[i][1] + seg_frac * (coords[i + 1][1] - coords[i][1])
            lng = coords[i][0] + seg_frac * (coords[i + 1][0] - coords[i][0])
            return (lat, lng)
        accumulated += d
    return (coords[-1][1], coords[-1][0])


def reverse_geocode(lat, lng):
    """Get city, state from coordinates."""
    import requests
    try:
        resp = requests.get(
            'https://nominatim.openstreetmap.org/reverse',
            params={'lat': lat, 'lon': lng, 'format': 'json', 'zoom': 10},
            headers={'User-Agent': 'ELD-Trip-Planner/1.0'},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get('address', {})
            city = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('county', '')
            state = addr.get('state', '')
            if city and state:
                state_abbr = get_state_abbr(state)
                return f"{city}, {state_abbr}"
            return data.get('display_name', f"{lat:.4f}, {lng:.4f}")[:60]
    except Exception:
        pass
    return f"{lat:.4f}, {lng:.4f}"


US_STATES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI',
    'Wyoming': 'WY', 'District of Columbia': 'DC',
}


def get_state_abbr(state_name):
    """Convert full state name to abbreviation."""
    return US_STATES.get(state_name, state_name[:2].upper() if len(state_name) >= 2 else state_name)


def plan_trip(current_location, pickup_location, dropoff_location,
              current_cycle_used, start_time=None,
              current_coords=None, pickup_coords=None, dropoff_coords=None):
    """
    Main trip planning function.
    Returns segments, daily logs, route geometry, stops, and compliance info.
    """
    import time as time_mod

    if start_time is None:
        start_time = datetime.now().replace(second=0, microsecond=0)

    if current_coords is None:
        lat, lng, name = geocode_location(current_location)
        current_coords = (lat, lng)
        time_mod.sleep(1.1)
    if pickup_coords is None:
        lat, lng, name = geocode_location(pickup_location)
        pickup_coords = (lat, lng)
        time_mod.sleep(1.1)
    if dropoff_coords is None:
        lat, lng, name = geocode_location(dropoff_location)
        dropoff_coords = (lat, lng)
        time_mod.sleep(1.1)

    route_to_pickup = get_route(current_coords[0], current_coords[1],
                                pickup_coords[0], pickup_coords[1])
    time_mod.sleep(0.5)
    route_to_dropoff = get_route(pickup_coords[0], pickup_coords[1],
                                 dropoff_coords[0], dropoff_coords[1])

    leg1_miles = route_to_pickup['distance_miles']
    leg2_miles = route_to_dropoff['distance_miles']
    total_miles = leg1_miles + leg2_miles

    leg1_coords = route_to_pickup['geometry'].get('coordinates', [])
    leg2_coords = route_to_dropoff['geometry'].get('coordinates', [])

    state = HOSState(
        current_time=start_time,
        cycle_hours_used=current_cycle_used,
        miles_since_fuel=0,
        total_miles=0,
    )

    segments = []
    all_coords = []

    segments, state = _generate_drive_segments(
        segments, state, leg1_miles, leg1_coords,
        current_location, pickup_location,
        'leg1', all_coords,
    )

    pickup_seg = TripSegment(
        segment_type='pickup',
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=PICKUP_DURATION_HOURS),
        duration_hours=PICKUP_DURATION_HOURS,
        start_miles=state.total_miles,
        end_miles=state.total_miles,
        location_name=pickup_location,
        latitude=pickup_coords[0],
        longitude=pickup_coords[1],
        duty_status='ON',
        remarks=f"Pickup: {_get_short_location(pickup_location)}",
    )
    segments.append(pickup_seg)
    state.current_time = pickup_seg.end_time
    state.cycle_hours_used += PICKUP_DURATION_HOURS
    state.window_hours_elapsed += PICKUP_DURATION_HOURS

    segments, state = _generate_drive_segments(
        segments, state, leg2_miles, leg2_coords,
        pickup_location, dropoff_location,
        'leg2', all_coords,
    )

    dropoff_seg = TripSegment(
        segment_type='dropoff',
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=DROPOFF_DURATION_HOURS),
        duration_hours=DROPOFF_DURATION_HOURS,
        start_miles=state.total_miles,
        end_miles=state.total_miles,
        location_name=dropoff_location,
        latitude=dropoff_coords[0],
        longitude=dropoff_coords[1],
        duty_status='ON',
        remarks=f"Dropoff: {_get_short_location(dropoff_location)}",
    )
    segments.append(dropoff_seg)
    state.current_time = dropoff_seg.end_time

    daily_logs = _build_daily_logs(segments, start_time)

    combined_geometry = {
        'type': 'LineString',
        'coordinates': leg1_coords + leg2_coords,
    }

    stops = _extract_stops(segments)

    compliance = _build_compliance_summary(segments, current_cycle_used, total_miles)

    return {
        'segments': [_segment_to_dict(s) for s in segments],
        'daily_logs': [_day_log_to_dict(d) for d in daily_logs],
        'route_geometry': combined_geometry,
        'stops': stops,
        'compliance': compliance,
        'total_miles': total_miles,
        'total_duration_hours': (state.current_time - start_time).total_seconds() / 3600,
        'current_coords': list(current_coords),
        'pickup_coords': list(pickup_coords),
        'dropoff_coords': list(dropoff_coords),
    }


def _generate_drive_segments(segments, state, leg_miles, leg_coords,
                              origin_name, dest_name, leg_id, all_coords):
    """Generate driving segments with mandatory stops for a leg."""
    remaining_miles = leg_miles
    miles_driven_this_leg = 0

    while remaining_miles > 0.5:
        if state.window_start is None:
            state.window_start = state.current_time
            state.window_hours_elapsed = 0
            state.driving_hours_used = 0
            state.driving_since_break = 0

        miles_until_fuel = FUELING_INTERVAL_MILES - state.miles_since_fuel
        hours_until_fuel = miles_until_fuel / AVG_SPEED_MPH if miles_until_fuel > 0 else float('inf')

        hours_until_break = max(0, BREAK_REQUIRED_AFTER_HOURS - state.driving_since_break)
        hours_until_drive_limit = max(0, DRIVING_LIMIT_HOURS - state.driving_hours_used)
        hours_until_window_close = max(0, DRIVING_WINDOW_HOURS - state.window_hours_elapsed)
        hours_until_cycle_limit = max(0, CYCLE_LIMIT_HOURS - state.cycle_hours_used)

        hours_to_finish_leg = remaining_miles / AVG_SPEED_MPH

        max_drive_hours = min(
            hours_until_fuel,
            hours_until_break if hours_until_break > 0 else float('inf'),
            hours_until_drive_limit,
            hours_until_window_close,
            hours_until_cycle_limit,
            hours_to_finish_leg,
        )

        if max_drive_hours <= 0.01:
            if hours_until_drive_limit <= 0.01 or hours_until_window_close <= 0.01 or hours_until_cycle_limit <= 0.01:
                segments, state = _add_rest_period(segments, state, leg_coords, leg_miles, miles_driven_this_leg)
                continue
            elif hours_until_break <= 0.01:
                segments, state = _add_break(segments, state, leg_coords, leg_miles, miles_driven_this_leg)
                continue
            else:
                segments, state = _add_fuel_stop(segments, state, leg_coords, leg_miles, miles_driven_this_leg)
                continue

        drive_miles = max_drive_hours * AVG_SPEED_MPH
        drive_miles = min(drive_miles, remaining_miles)
        drive_hours = drive_miles / AVG_SPEED_MPH

        frac_start = miles_driven_this_leg / leg_miles if leg_miles > 0 else 0
        frac_end = (miles_driven_this_leg + drive_miles) / leg_miles if leg_miles > 0 else 1

        start_point = interpolate_point(leg_coords, frac_start)
        end_point = interpolate_point(leg_coords, frac_end)

        start_loc = _get_location_name(start_point[0], start_point[1], origin_name, dest_name, frac_start)
        end_loc = _get_location_name(end_point[0], end_point[1], origin_name, dest_name, frac_end)

        drive_seg = TripSegment(
            segment_type='drive',
            start_time=state.current_time,
            end_time=state.current_time + timedelta(hours=drive_hours),
            duration_hours=drive_hours,
            start_miles=state.total_miles,
            end_miles=state.total_miles + drive_miles,
            location_name=end_loc,
            latitude=end_point[0],
            longitude=end_point[1],
            duty_status='D',
            remarks=f"Driving: {start_loc} to {end_loc}",
        )
        segments.append(drive_seg)

        state.current_time = drive_seg.end_time
        state.total_miles += drive_miles
        state.miles_since_fuel += drive_miles
        state.driving_hours_used += drive_hours
        state.driving_since_break += drive_hours
        state.cycle_hours_used += drive_hours
        state.window_hours_elapsed += drive_hours
        miles_driven_this_leg += drive_miles
        remaining_miles -= drive_miles

        if remaining_miles > 0.5:
            if state.miles_since_fuel >= FUELING_INTERVAL_MILES - 1:
                segments, state = _add_fuel_stop(segments, state, leg_coords, leg_miles, miles_driven_this_leg)
            elif state.driving_since_break >= BREAK_REQUIRED_AFTER_HOURS - 0.01:
                segments, state = _add_break(segments, state, leg_coords, leg_miles, miles_driven_this_leg)

    return segments, state


def _add_fuel_stop(segments, state, leg_coords, leg_miles, miles_driven):
    """Add a fueling stop."""
    frac = miles_driven / leg_miles if leg_miles > 0 else 0.5
    point = interpolate_point(leg_coords, frac)
    loc = reverse_geocode(point[0], point[1])

    fuel_seg = TripSegment(
        segment_type='fuel',
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=FUELING_DURATION_HOURS),
        duration_hours=FUELING_DURATION_HOURS,
        start_miles=state.total_miles,
        end_miles=state.total_miles,
        location_name=loc,
        latitude=point[0],
        longitude=point[1],
        duty_status='ON',
        remarks=f"Fueling: {loc}",
    )
    segments.append(fuel_seg)
    state.current_time = fuel_seg.end_time
    state.cycle_hours_used += FUELING_DURATION_HOURS
    state.window_hours_elapsed += FUELING_DURATION_HOURS
    state.miles_since_fuel = 0
    return segments, state


def _add_break(segments, state, leg_coords, leg_miles, miles_driven):
    """Add a 30-minute rest break."""
    frac = miles_driven / leg_miles if leg_miles > 0 else 0.5
    point = interpolate_point(leg_coords, frac)
    loc = reverse_geocode(point[0], point[1])

    break_seg = TripSegment(
        segment_type='break',
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=BREAK_DURATION_HOURS),
        duration_hours=BREAK_DURATION_HOURS,
        start_miles=state.total_miles,
        end_miles=state.total_miles,
        location_name=loc,
        latitude=point[0],
        longitude=point[1],
        duty_status='OFF',
        remarks=f"30-min break: {loc}",
    )
    segments.append(break_seg)
    state.current_time = break_seg.end_time
    state.window_hours_elapsed += BREAK_DURATION_HOURS
    state.driving_since_break = 0
    return segments, state


def _add_rest_period(segments, state, leg_coords, leg_miles, miles_driven):
    """Add a 10-hour mandatory rest period."""
    frac = miles_driven / leg_miles if leg_miles > 0 else 0.5
    point = interpolate_point(leg_coords, frac)
    loc = reverse_geocode(point[0], point[1])

    rest_seg = TripSegment(
        segment_type='rest',
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=OFF_DUTY_RESET_HOURS),
        duration_hours=OFF_DUTY_RESET_HOURS,
        start_miles=state.total_miles,
        end_miles=state.total_miles,
        location_name=loc,
        latitude=point[0],
        longitude=point[1],
        duty_status='SB',
        remarks=f"10-hr rest: {loc}",
    )
    segments.append(rest_seg)
    state.current_time = rest_seg.end_time
    state.window_start = None
    state.window_hours_elapsed = 0
    state.driving_hours_used = 0
    state.driving_since_break = 0
    return segments, state


def _get_location_name(lat, lng, origin, dest, fraction):
    """Get a descriptive location name."""
    if fraction <= 0.02:
        return _get_short_location(origin)
    if fraction >= 0.98:
        return _get_short_location(dest)
    return reverse_geocode(lat, lng)


def _get_short_location(loc_str):
    """Shorten location to city, state format."""
    parts = loc_str.split(',')
    if len(parts) >= 2:
        return f"{parts[0].strip()}, {parts[1].strip()}"
    return loc_str[:40]


def _build_daily_logs(segments, trip_start):
    """Split segments into 24-hour daily log sheets."""
    if not segments:
        return []

    first_day = trip_start.date()
    last_time = max(s.end_time for s in segments)
    last_day = last_time.date()
    num_days = (last_day - first_day).days + 1

    daily_logs = []

    for day_idx in range(num_days):
        current_date = first_day + timedelta(days=day_idx)
        day_start = datetime.combine(current_date, datetime.min.time())
        day_end = day_start + timedelta(hours=24)

        day_log = DayLog(
            date=current_date,
            day_number=day_idx + 1,
        )

        day_entries = []

        for seg in segments:
            if seg.end_time <= day_start or seg.start_time >= day_end:
                continue

            entry_start = max(seg.start_time, day_start)
            entry_end = min(seg.end_time, day_end)
            duration = (entry_end - entry_start).total_seconds() / 3600

            if duration < 0.001:
                continue

            day_entries.append({
                'status': seg.duty_status,
                'start_time': entry_start.isoformat(),
                'end_time': entry_end.isoformat(),
                'start_hour': (entry_start - day_start).total_seconds() / 3600,
                'end_hour': (entry_end - day_start).total_seconds() / 3600,
                'duration_hours': round(duration, 4),
                'location': seg.location_name,
                'remarks': seg.remarks,
            })

            if seg.duty_status == 'D':
                day_log.total_driving += duration
                day_log.total_miles += (seg.end_miles - seg.start_miles) * (duration / seg.duration_hours) if seg.duration_hours > 0 else 0
            elif seg.duty_status == 'ON':
                day_log.total_on_duty += duration
            elif seg.duty_status == 'SB':
                day_log.total_sleeper += duration
            elif seg.duty_status == 'OFF':
                day_log.total_off_duty += duration

            if seg.remarks:
                day_log.remarks_list.append(seg.remarks)

        accounted = day_log.total_driving + day_log.total_on_duty + day_log.total_sleeper + day_log.total_off_duty
        remaining = 24.0 - accounted
        if remaining > 0.001:
            if day_entries:
                last_entry = day_entries[-1]
                last_end_hour = last_entry['end_hour']
            else:
                last_end_hour = 0

            if last_end_hour < 24:
                day_entries.append({
                    'status': 'OFF',
                    'start_time': (day_start + timedelta(hours=last_end_hour)).isoformat(),
                    'end_time': day_end.isoformat(),
                    'start_hour': last_end_hour,
                    'end_hour': 24.0,
                    'duration_hours': round(remaining, 4),
                    'location': day_entries[-1]['location'] if day_entries else '',
                    'remarks': 'Off Duty',
                })
                day_log.total_off_duty += remaining

            if not day_entries and remaining > 23.9:
                day_entries.append({
                    'status': 'OFF',
                    'start_time': day_start.isoformat(),
                    'end_time': day_end.isoformat(),
                    'start_hour': 0,
                    'end_hour': 24.0,
                    'duration_hours': 24.0,
                    'location': '',
                    'remarks': 'Off Duty',
                })
                day_log.total_off_duty = 24.0

        if day_entries and day_entries[0]['start_hour'] > 0.001:
            gap_hours = day_entries[0]['start_hour']
            day_entries.insert(0, {
                'status': 'OFF',
                'start_time': day_start.isoformat(),
                'end_time': day_entries[0]['start_time'],
                'start_hour': 0,
                'end_hour': gap_hours,
                'duration_hours': round(gap_hours, 4),
                'location': day_entries[0]['location'] if day_entries else '',
                'remarks': 'Off Duty',
            })
            day_log.total_off_duty += gap_hours

        day_log.total_driving = round(day_log.total_driving, 2)
        day_log.total_on_duty = round(day_log.total_on_duty, 2)
        day_log.total_sleeper = round(day_log.total_sleeper, 2)
        day_log.total_off_duty = round(day_log.total_off_duty, 2)
        day_log.total_miles = round(day_log.total_miles, 1)

        total = day_log.total_driving + day_log.total_on_duty + day_log.total_sleeper + day_log.total_off_duty
        if abs(total - 24.0) > 0.01:
            diff = 24.0 - total
            day_log.total_off_duty = round(day_log.total_off_duty + diff, 2)

        day_log.entries = day_entries
        daily_logs.append(day_log)

    return daily_logs


def _extract_stops(segments):
    """Extract notable stops from segments."""
    stops = []
    for seg in segments:
        if seg.segment_type in ('pickup', 'dropoff', 'fuel', 'break', 'rest'):
            stops.append({
                'type': seg.segment_type,
                'location': seg.location_name,
                'latitude': seg.latitude,
                'longitude': seg.longitude,
                'arrival': seg.start_time.isoformat(),
                'departure': seg.end_time.isoformat(),
                'duration_hours': seg.duration_hours,
                'remarks': seg.remarks,
            })
    return stops


def _build_compliance_summary(segments, cycle_used, total_miles):
    """Build HOS compliance summary."""
    total_driving = sum(s.duration_hours for s in segments if s.duty_status == 'D')
    total_on_duty = sum(s.duration_hours for s in segments if s.duty_status in ('D', 'ON'))
    total_rest = sum(s.duration_hours for s in segments if s.segment_type == 'rest')
    total_breaks = sum(s.duration_hours for s in segments if s.segment_type == 'break')
    num_fuel_stops = sum(1 for s in segments if s.segment_type == 'fuel')
    num_rest_stops = sum(1 for s in segments if s.segment_type == 'rest')
    num_breaks = sum(1 for s in segments if s.segment_type == 'break')

    warnings = []
    if cycle_used + total_on_duty > CYCLE_LIMIT_HOURS:
        warnings.append({
            'rule': '70-Hour/8-Day Limit',
            'message': f'Trip requires {total_on_duty:.1f} on-duty hours. '
                       f'With {cycle_used:.1f} cycle hours used, total would exceed 70-hour limit.',
            'severity': 'warning',
        })

    return {
        'total_driving_hours': round(total_driving, 2),
        'total_on_duty_hours': round(total_on_duty, 2),
        'total_rest_hours': round(total_rest, 2),
        'total_break_hours': round(total_breaks, 2),
        'cycle_hours_used': round(cycle_used, 2),
        'cycle_hours_remaining': round(max(0, CYCLE_LIMIT_HOURS - cycle_used - total_on_duty), 2),
        'num_fuel_stops': num_fuel_stops,
        'num_rest_stops': num_rest_stops,
        'num_breaks': num_breaks,
        'total_miles': round(total_miles, 1),
        'warnings': warnings,
        'rules_applied': [
            '14-Hour Driving Window (§395.3(a)(2))',
            '11-Hour Driving Limit (§395.3(a)(3))',
            '30-Minute Rest Break after 8hrs driving (§395.3(a)(3)(ii))',
            '70-Hour/8-Day Rolling Limit (§395.3(b))',
            '10-Hour Off-Duty Reset',
            'Fueling every 1,000 miles',
            '1-hour pickup / 1-hour dropoff',
        ],
    }


def _segment_to_dict(seg):
    return {
        'segment_type': seg.segment_type,
        'start_time': seg.start_time.isoformat(),
        'end_time': seg.end_time.isoformat(),
        'duration_hours': round(seg.duration_hours, 4),
        'start_miles': round(seg.start_miles, 1),
        'end_miles': round(seg.end_miles, 1),
        'location_name': seg.location_name,
        'latitude': seg.latitude,
        'longitude': seg.longitude,
        'duty_status': seg.duty_status,
        'remarks': seg.remarks,
    }


def _day_log_to_dict(day_log):
    return {
        'date': day_log.date.isoformat(),
        'day_number': day_log.day_number,
        'entries': day_log.entries,
        'total_driving': day_log.total_driving,
        'total_on_duty': day_log.total_on_duty,
        'total_sleeper': day_log.total_sleeper,
        'total_off_duty': day_log.total_off_duty,
        'total_miles': day_log.total_miles,
        'remarks': '; '.join(day_log.remarks_list),
    }
