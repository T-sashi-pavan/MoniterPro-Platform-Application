-- Create database (run this first)
-- CREATE DATABASE monitoringdb;

-- Connect to monitoringdb and run the following:

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'developer', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    owner_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service metrics table
CREATE TABLE IF NOT EXISTS service_metrics (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    response_time NUMERIC,
    cpu_usage NUMERIC,
    memory_usage NUMERIC,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL, -- 'cpu', 'memory', 'response_time', 'status'
    threshold NUMERIC,
    comparison_operator TEXT CHECK (comparison_operator IN ('>', '<', '>=', '<=')),
    notification_method TEXT CHECK (notification_method IN ('email', 'push')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    alert_id INT REFERENCES alerts(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('sent', 'failed')) DEFAULT 'sent'
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    level TEXT CHECK (level IN ('info', 'warning', 'error')) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_metrics_service_id ON service_metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_service_metrics_last_checked ON service_metrics(last_checked);
CREATE INDEX IF NOT EXISTS idx_logs_service_id ON logs(service_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

-- Insert sample data
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2b$10$example_hashed_password', 'admin'),
('Developer User', 'dev@example.com', '$2b$10$example_hashed_password', 'developer'),
('Viewer User', 'viewer@example.com', '$2b$10$example_hashed_password', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample services
INSERT INTO services (name, url, owner_id) VALUES 
('Google', 'https://www.google.com', 1),
('GitHub', 'https://github.com', 1),
('Stack Overflow', 'https://stackoverflow.com', 2),
('MDN Docs', 'https://developer.mozilla.org', 2),
('JSON Placeholder API', 'https://jsonplaceholder.typicode.com', 1),
('Example API', 'https://httpbin.org/status/200', 3)
ON CONFLICT DO NOTHING;
