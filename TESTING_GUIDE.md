# Alert System Testing Guide

## Overview
Your monitoring platform's alert system has been fully implemented with real-time monitoring, email notifications, and comprehensive alert management. Here's how to test each feature:

## EmailJS Configuration
Your EmailJS is configured with:
- **Service ID**: service_vzl70yr
- **Template ID**: template_hgqsf0u  
- **Public Key**: 5qTWcx4IWIcC7ZczU

## How to Test Each Feature

### 1. Test Email Functionality
**Location**: Dashboard → Alerts Tab → Test Email Configuration Card

**Steps**:
1. Navigate to `http://localhost:3000/dashboard/alerts`
2. In the "Test Email Configuration" section:
   - Enter your email address in the "Test Email Address" field
   - Click "Send Test Email" button
3. **Expected Result**: You should receive a test email notification
4. **If email fails**: Check browser console (F12) for detailed error messages

**Debugging Tips**:
- Open browser developer tools (F12) → Console tab
- Look for EmailJS loading messages and error details
- Verify your EmailJS template has the correct parameter names

### 2. Create Alert Rules
**Location**: Dashboard → Alerts Tab → Create Alert Rule Button

**Steps**:
1. Click "Create Alert Rule" button
2. Fill in the form:
   - **Service**: Select a service from dropdown
   - **Metric Type**: Choose CPU, Memory, Response Time, or Status
   - **Threshold**: Set a value (e.g., 80 for CPU %, 1000 for response time ms)
   - **Operator**: Choose >, <, >=, or <=
   - **Notification**: Select Email or Push
3. Click "Create Rule"
4. **Expected Result**: New rule appears in Alert Rules section

### 3. Test Real-Time Alert Monitoring
**How it works**: The system automatically checks all services every 30 seconds and triggers alerts when thresholds are exceeded.

**Steps**:
1. Create an alert rule with a low threshold (e.g., CPU > 10%)
2. Wait for the next health check cycle (max 30 seconds)
3. **Expected Result**: 
   - Alert appears in "Recent Notifications" section
   - Email notification sent (if configured)
   - Real-time WebSocket notification

### 4. View Alert History
**Location**: Dashboard → Alerts Tab → Recent Notifications Card

**Features**:
- Shows last 10 alert notifications
- Displays severity badges (INFO, WARNING, ERROR)
- Shows timestamp in consistent format
- Service name and alert message

### 5. Manage Alert Rules
**Location**: Dashboard → Alerts Tab → Alert Rules Section

**Features**:
- **View Rules**: See all configured alert rules
- **Toggle Rules**: Use switch to enable/disable rules
- **Delete Rules**: Click trash icon to remove rules
- **Rule Details**: See service, metric, threshold, and notification method

### 6. Notification Settings
**Location**: Dashboard → Alerts Tab → Notification Settings Card

**Features**:
- Configure global notification preferences
- Set default email addresses
- Enable/disable notification types

## Testing Different Alert Types

### CPU Threshold Alert
1. Create rule: `CPU Usage > 50%`
2. Monitor a service with high CPU usage
3. Alert triggers when CPU exceeds 50%

### Memory Threshold Alert
1. Create rule: `Memory Usage > 70%`
2. Monitor a service with high memory usage
3. Alert triggers when memory exceeds 70%

### Response Time Alert
1. Create rule: `Response Time > 2000ms`
2. Monitor a slow service
3. Alert triggers when response time exceeds 2 seconds

### Service Status Alert
1. Create rule: `Service Status = Offline`
2. Stop a monitored service
3. Alert triggers when service goes offline

## Real-Time Features

### WebSocket Integration
- **Auto-refresh**: Service metrics update every 30 seconds
- **Live notifications**: Alerts appear instantly without page refresh
- **Connection status**: Shows connected/disconnected status

### Automated Health Checking
- **Frequency**: Every 30 seconds
- **Metrics checked**: CPU, Memory, Response Time, Status
- **Alert evaluation**: Compares current values against all rule thresholds

## Troubleshooting

### Email Not Sending
1. **Check console logs**: Look for EmailJS errors
2. **Verify template**: Ensure your EmailJS template expects these parameters:
   - `to_email`, `from_name`, `subject`, `service_name`, `alert_message`, `severity`, `timestamp`
3. **Test template**: Go to EmailJS dashboard and test your template directly
4. **Check credentials**: Verify Service ID, Template ID, and Public Key are correct

### Hydration Mismatch Errors
- **Fixed**: Date formatting now uses consistent ISO format
- **Fixed**: Random ID generation replaced with deterministic IDs

### Alert Rules Not Triggering
1. **Check rule status**: Ensure rule is enabled (switch is ON)
2. **Verify threshold**: Make sure threshold can actually be exceeded
3. **Wait for health check**: Next check happens within 30 seconds
4. **Check service metrics**: Verify service is reporting the expected metric values

### No Services Available
1. **Backend connection**: Ensure backend server is running on port 3333
2. **Database**: MongoDB should be connected and contain sample services
3. **CORS**: Check for any CORS errors in browser console

## Sample Test Scenarios

### Scenario 1: High CPU Alert
1. Create rule: "API Server CPU > 30%"
2. Wait 30 seconds for health check
3. If CPU is above 30%, alert triggers and email is sent

### Scenario 2: Service Offline Alert
1. Create rule: "Database Service Status = Offline"
2. The system detects if database service is unreachable
3. Immediate alert and email notification

### Scenario 3: Response Time Alert
1. Create rule: "Web Server Response Time > 1000ms"
2. System measures actual response times
3. Alert triggers if response exceeds 1 second

## Expected Email Template
Your test email should contain:
- **Subject**: [INFO ALERT] Test Service Monitoring Alert
- **Service**: Test Service  
- **Message**: Test email notification message
- **Severity**: INFO
- **Timestamp**: Current date/time
- **Dashboard Link**: Link back to your monitoring dashboard

## Next Steps
1. **Test each feature** following the steps above
2. **Check browser console** for any errors during testing
3. **Verify email delivery** in your email inbox
4. **Report any issues** with specific error messages from console
