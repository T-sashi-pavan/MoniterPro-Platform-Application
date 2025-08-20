# MonitorPro Platform - Real-Time Monitoring System

## Prerequisites

1. **MongoDB Database**
   - Install MongoDB (version 4.4+) or use MongoDB Atlas (cloud)
   - Create a database named `monitoringplatform`
   - Note your MongoDB connection string

2. **Node.js & pnpm**
   - Node.js version 18+ 
   - pnpm package manager

3. **Email Service (Optional)**
   - Brevo SMTP account for email alerts
   - SMTP credentials for real-time notifications

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your database:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/monitoringplatform
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/monitoringplatform

# Email Service (Brevo SMTP)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_brevo_email@domain.com
EMAIL_PASS=your_brevo_smtp_key
SENDER_EMAIL=your_sender@domain.com

# Application Configuration
JWT_SECRET=your_super_secret_jwt_key_here
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 2. Database Setup

MongoDB will automatically create collections when data is first inserted. No manual schema setup required!

**For Local MongoDB:**
```bash
# Start MongoDB service
mongod

# OR use MongoDB Compass for visual management
```

**For MongoDB Atlas (Cloud):**
1. Create account at https://cloud.mongodb.com
2. Create a cluster and database
3. Get connection string and add to `.env.local`

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

### ✅ Real-Time Monitoring Dashboard
- Live service health monitoring with status indicators
- Real-time charts and metrics visualization  
- System overview with comprehensive statistics
- Responsive design for all device sizes

### ✅ Services Management
- HTTP health checks for all configured services
- Service status grid with real-time updates
- Add/remove services dynamically
- Service uptime calculations and history

### ✅ Metrics & Data Export
- Real-time metrics collection and display
- Excel export functionality for metrics data
- Historical data storage and visualization
- Performance tracking and analysis

### ✅ Analytics Dashboard
- Historical analytics with interactive charts
- Service-specific performance analysis
- Time-based data visualization
- Trend analysis and insights

### ✅ Alerts & Notifications System
- Real-time email alerts via Brevo SMTP
- Configurable alert rules and thresholds
- Professional HTML email templates
- Alert management and recipient configuration

### ✅ User Profile Management
- Real-time profile information display
- Session management and tracking
- Live statistics and account activity
- Secure logout functionality

### ✅ Database Integration
- MongoDB with flexible document storage
- Collections: users, services, metrics, alerts, logs
- Real-time data synchronization
- Automatic data persistence

### ✅ API Endpoints
- `GET /api/services` - List all services
- `POST /api/services` - Add new service  
- `DELETE /api/services/:id` - Delete service
- `GET /api/metrics/latest` - Latest metrics for all services
- `GET /api/metrics/history` - Historical metrics
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/send-alert` - Send email alerts via Brevo SMTP
- `POST /api/health-check` - Manual health check trigger

## Testing the System

1. **Add a test service**: 
   - Go to http://localhost:3000/dashboard
   - Click "Add Service" 
   - Add a service like:
     - Name: "Google"
     - URL: "https://www.google.com"

2. **Watch real-time updates**:
   - Health checks run automatically 
   - Real-time dashboard updates
   - Use "Check Now" button for manual triggers

3. **Test email alerts**:
   - Go to Alerts & Notifications tab
   - Configure email recipients  
   - Send test alerts via Brevo SMTP

4. **Export metrics data**:
   - Visit Metrics & Logs page
   - Click "Export to Excel" for real data export
   - View historical performance data

5. **Analyze trends**:
   - Check Analytics page for historical charts
   - Monitor service performance over time
   - Review system statistics in Profile

## Architecture

```
Frontend (Next.js 15.2.4 + React)
├── Real-time dashboard with live charts
├── Service monitoring and management
├── Analytics with historical data
├── Email alerts and notifications  
├── User profile with real-time stats
└── Responsive design (mobile-first)

Backend (API Routes + WebSocket)
├── HTTP health checking system
├── MongoDB integration with Mongoose
├── Real-time data synchronization  
├── Brevo SMTP email service
├── RESTful API endpoints
└── Excel export functionality

Database (MongoDB)
├── Services collection (health monitoring)
├── Metrics collection (performance data)
├── Users collection (authentication)
├── Alerts collection (notifications)
├── Logs collection (system events)
└── Flexible document-based storage

Email Service (Brevo SMTP)
├── Professional HTML email templates
├── Real-time alert notifications
├── SMTP relay integration
├── Error handling and logging
└── Configurable recipient management
```

## Troubleshooting

1. **Database Connection Issues**:
   - Verify MongoDB is running (local) or accessible (Atlas)
   - Check MONGODB_URI in `.env.local`
   - Ensure database name matches configuration
   - Test connection with MongoDB Compass

2. **Email Service Issues**:
   - Verify Brevo SMTP credentials in `.env.local`
   - Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS values
   - Test SMTP connection in Alerts page
   - Review email logs in browser console

3. **Application Issues**:
   - Ensure all dependencies installed: `pnpm install`
   - Check if ports 3000/3001 are available
   - Verify environment variables are set correctly
   - Review browser console for errors

4. **Real-time Updates Issues**:
   - Check network connectivity
   - Verify WebSocket connection in browser dev tools
   - Ensure backend server is running properly
   - Review real-time data flow in dashboard

## Production Deployment

1. **Environment Setup**:
   - Use MongoDB Atlas for production database
   - Configure production Brevo SMTP account
   - Set strong JWT_SECRET value
   - Enable HTTPS for secure communication

2. **Security Considerations**:
   - Implement rate limiting for API endpoints
   - Add input validation and sanitization
   - Use environment-specific configurations
   - Enable MongoDB authentication

3. **Performance Optimization**:
   - Implement database indexing
   - Add caching for frequently accessed data
   - Optimize email sending queue
   - Monitor system resource usage

## Tech Stack

- **Frontend**: Next.js 15.2.4, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Email**: Brevo SMTP, Nodemailer
- **Charts**: Recharts library
- **UI Components**: shadcn/ui, Radix UI
- **Authentication**: JWT tokens
- **Real-time**: WebSocket connections
- **Export**: xlsx library for Excel export
