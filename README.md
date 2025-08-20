# Real-Time Monitoring Platform Setup Guide

## Prerequisites

1. **PostgreSQL Database**
   - Install PostgreSQL (version 12+)
   - Create a database named `monitoringdb`
   - Note your postgres user credentials

2. **Node.js & pnpm**
   - Node.js version 18+ 
   - pnpm package manager

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your database:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_NAME=monitoringdb

JWT_SECRET=your_super_secret_jwt_key_here
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 2. Database Setup

Create the database schema:

```bash
# Using psql command line
psql -U postgres -c "CREATE DATABASE monitoringdb;"
psql -U postgres -d monitoringdb -f database/schema.sql

# OR using npm script (after setting up .env.local)
npm run setup:db
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

**Option 1: Run both frontend and backend together (Recommended)**
```bash
pnpm run dev:full
```

**Option 2: Run separately**

Terminal 1 (Backend API + WebSocket server):
```bash
pnpm run dev:server
```

Terminal 2 (Next.js frontend):
```bash
pnpm run dev
```

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## Features Implemented

### ✅ Real-Time Monitoring
- HTTP health checks for all configured services
- Real-time WebSocket updates to dashboard
- Automated health checks every minute
- Manual health check trigger

### ✅ Database Integration
- PostgreSQL with full schema (users, services, metrics, alerts, logs)
- Historical metrics storage
- Service uptime calculations

### ✅ Dashboard Features
- Real-time service status grid
- Live response time charts
- Service management (add/delete services)
- Dashboard statistics

### ✅ API Endpoints
- `GET /api/services` - List all services
- `POST /api/services` - Add new service
- `DELETE /api/services/:id` - Delete service
- `GET /api/metrics/latest` - Latest metrics for all services
- `GET /api/metrics/history` - Historical metrics
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/health-check` - Manual health check trigger

## Testing the System

1. **Add a test service**: 
   - Go to http://localhost:3000/dashboard
   - Click "Add Service" 
   - Add a service like:
     - Name: "Google"
     - URL: "https://www.google.com"

2. **Watch real-time updates**:
   - Health checks run automatically every minute
   - WebSocket updates appear in real-time
   - Use "Check Now" button for manual triggers

3. **View metrics**:
   - Response time charts update with real data
   - Service status cards show actual health status
   - Uptime percentages calculated from historical data

## Architecture

```
Frontend (Next.js + React)
├── Real-time WebSocket connection
├── REST API calls
└── Responsive dashboard

Backend (Express + Socket.IO)
├── HTTP health checking
├── PostgreSQL integration  
├── WebSocket broadcasting
├── Cron-based automation
└── RESTful API

Database (PostgreSQL)
├── Services configuration
├── Metrics history
├── User management
├── Alerts & notifications
└── System logs
```

## Troubleshooting

1. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check credentials in `.env.local`
   - Ensure database `monitoringdb` exists

2. **WebSocket Connection Issues**:
   - Check if port 3001 is available
   - Verify backend server is running
   - Check browser console for connection errors

3. **Health Check Issues**:
   - Ensure services have accessible URLs
   - Check network connectivity
   - Review logs in browser console

## Next Steps for Production

1. **Authentication**: Implement JWT-based user authentication
2. **Alert System**: Email/SMS notifications for service failures
3. **Advanced Metrics**: CPU/Memory monitoring for servers with metrics endpoints
4. **Scaling**: Load balancing and horizontal scaling
5. **Security**: Rate limiting, input validation, HTTPS
