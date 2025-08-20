"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { HealthCheckResult, ServiceMetric } from '@/lib/types';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestMetrics: HealthCheckResult[];
  alertNotifications: any[];
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  latestMetrics: [],
  alertNotifications: [],
});

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestMetrics, setLatestMetrics] = useState<HealthCheckResult[]>([]);
  const [alertNotifications, setAlertNotifications] = useState<any[]>([]);

  // Sanitize data to ensure Date objects are converted to strings
  const sanitizeMetrics = (metrics: any[]): HealthCheckResult[] => {
    return metrics.map(metric => ({
      ...metric,
      lastChecked: metric.lastChecked instanceof Date ? metric.lastChecked.toISOString() : metric.lastChecked,
      last_checked: metric.last_checked instanceof Date ? metric.last_checked.toISOString() : metric.last_checked,
      createdAt: metric.createdAt instanceof Date ? metric.createdAt.toISOString() : metric.createdAt,
      created_at: metric.created_at instanceof Date ? metric.created_at.toISOString() : metric.created_at,
    }))
  }

  useEffect(() => {
    // Use mock data instead of WebSocket connection
    console.log('Using mock WebSocket data for offline mode');
    setIsConnected(false);
    
    // Set initial mock data
    const mockHealthData: HealthCheckResult[] = [
      { service_id: 1, status: 'online', response_time: 120 },
      { service_id: 2, status: 'online', response_time: 85 },
      { service_id: 3, status: 'offline', response_time: null },
      { service_id: 4, status: 'online', response_time: 95 }
    ];
    
    setLatestMetrics(mockHealthData);
    
    // Simulate periodic updates
    const interval = setInterval(() => {
      const updatedMockData = mockHealthData.map(metric => ({
        ...metric,
        response_time: metric.status === 'online' ? Math.floor(Math.random() * 200) + 50 : null,
        status: Math.random() > 0.05 ? metric.status : (metric.status === 'online' ? 'offline' : 'online') as 'online' | 'offline'
      }));
      setLatestMetrics(updatedMockData);
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, latestMetrics, alertNotifications }}>
      {children}
    </WebSocketContext.Provider>
  );
};
