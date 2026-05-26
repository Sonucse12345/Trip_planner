
# ELD Trip Planner — FMCSA Part 395 Compliant

A full-stack ELD (Electronic Logging Device) trip planner with official DOT-compliant Driver's Daily Logs.

---

## Quick Start (VS Code / Local)

### Requirements
- Python 3.10+
- Node.js 18+
- npm or yarn

---

### Backend Setup (Django + SQLite)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Run database migrations (creates SQLite db.sqlite3)
python manage.py makemigrations
python manage.py migrate

# (Optional) Create admin user
python manage.py createsuperuser

# Start backend server on port 8000
python manage.py runserver
```

Backend runs at: **http://localhost:8000**  
Admin panel: **http://localhost:8000/admin**  
API base: **http://localhost:8000/api/**

---

### Frontend Setup (React)

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start React dev server on port 3000
npm start
```

Frontend runs at: **http://localhost:3000**

---

## Database

- **SQLite** is used by default (`backend/db.sqlite3` is auto-created on first migration)
- No external database setup required
- To inspect the database: use **DB Browser for SQLite** (free app) or VS Code SQLite extension

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new driver |
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/logout/` | Logout |
| GET | `/api/auth/user/` | Current user info |
| PUT | `/api/auth/profile/` | Update driver profile |
| POST | `/api/trips/plan/` | Plan a new trip (HOS engine) |
| GET | `/api/trips/` | List all trips |
| GET | `/api/trips/<id>/` | Get trip details |
| GET | `/api/geocode/?q=<query>` | Geocode a location |
| GET | `/api/dashboard/` | Dashboard statistics |

---

## Features

- **Official FMCSA Driver's Daily Log** — Matches the exact DOT form format
- **HOS Compliance Engine** — Enforces all FMCSA Part 395 rules automatically:
  - 11-Hour Driving Limit (§395.3(a)(3))
  - 14-Hour Driving Window (§395.3(a)(2))
  - 30-Minute Rest Break after 8h driving (§395.3(a)(3)(ii))
  - 70-Hour/8-Day Rolling Cycle (§395.3(b))
  - 10-Hour Off-Duty Reset
  - 34-Hour Restart (§395.3(c))
  - Fueling every 1,000 miles
  - 1-hour pickup + 1-hour dropoff
- **Interactive Route Map** — Leaflet + OpenStreetMap + OSRM routing
- **PDF Export** — Download official log as landscape PDF
- **Print Support** — Browser-native print of daily logs
- **Trip History** — Saves all planned trips with full log data
- **User Authentication** — Session-based login/register
- **Dashboard** — Statistics, charts (Recharts), recent trips

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, react-router-dom v7 |
| Map | Leaflet + react-leaflet |
| Charts | Recharts |
| PDF | jsPDF |
| Backend | Django 4.2 + Django REST Framework |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Geocoding | Nominatim (OpenStreetMap) |
| Routing | OSRM (open-source routing) |

---

## Folder Structure

```
eld-trip-planner/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ELDGrid.js       ← Official FMCSA log grid (SVG)
│       │   ├── TripMap.js       ← Leaflet route map
│       │   ├── Sidebar.js       ← Navigation with truck logo
│       │   ├── LocationInput.js ← Geocode autocomplete input
│       │   └── TruckLogo.js     ← SVG truck logo component
│       ├── pages/
│       │   ├── TripPlanner.js   ← 3-step trip wizard
│       │   ├── TripResult.js    ← Results + FMCSA rules
│       │   ├── LogViewer.js     ← Daily logs + PDF export
│       │   ├── Dashboard.js     ← Stats + charts
│       │   ├── TripHistory.js   ← Past trips
│       │   ├── LoginPage.js     ← Authentication
│       │   └── RegisterPage.js  ← Registration
│       └── utils/
│           └── api.js           ← Axios API client
└── backend/
    ├── trips/
    │   ├── models.py            ← DB models (Trip, DailyLog, etc.)
    │   ├── views.py             ← REST API views
    │   ├── serializers.py       ← DRF serializers
    │   ├── hos_engine.py        ← HOS calculation engine
    │   └── urls.py              ← URL routing
    └── eld_project/
        └── settings.py          ← Django config
```
