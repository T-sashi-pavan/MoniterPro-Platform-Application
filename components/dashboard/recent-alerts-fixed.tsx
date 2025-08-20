"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { logsApi } from "@/lib/api"
import { useWebSocket } from "@/contexts/websocket-context"

interface LogEntry {
  id: number
  service_id: number
  service_name: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}

export function RecentAlerts() {
  const [alerts, setAlerts] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { latestMetrics, isConnected } = useWebSocket()

  useEffect(() => {
    loadRecentAlerts()
  }, [])

  // Generate alerts from latest metrics when services go offline
  useEffect(() => {
    if (latestMetrics.length > 0) {
      generateAlertsFromMetrics()
    }
  }, [latestMetrics])

  const loadRecentAlerts = async () => {
    try {
      const logs = await logsApi.getRecent(10)
      setAlerts(logs)
    } catch (error) {
      console.error('Error loading alerts:', error)
      // No fallback data - show empty state instead
      setAlerts([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateAlertsFromMetrics = () => {
    const newAlerts: LogEntry[] = []
    
    latestMetrics.forEach(metric => {
      if (metric.status === 'offline') {
        newAlerts.push({
          id: Date.now() + metric.service_id,
          service_id: metric.service_id,
          service_name: `Service ${metric.service_id}`,
          level: 'error',
          message: `Service is offline${metric.error ? `: ${metric.error}` : ''}`,
          timestamp: new Date().toISOString()
        })
      } else if (metric.response_time && metric.response_time > 1000) {
        newAlerts.push({
          id: Date.now() + metric.service_id + 1000,
          service_id: metric.service_id,
          service_name: `Service ${metric.service_id}`,
          level: 'warning',
          message: `High response time: ${metric.response_time}ms`,
          timestamp: new Date().toISOString()
        })
      }
    })

    if (newAlerts.length > 0) {
      setAlerts(prevAlerts => {
        const combined = [...newAlerts, ...prevAlerts]
        return combined.slice(0, 10) // Keep only latest 10
      })
    }
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "info":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case "error":
        return AlertTriangle
      case "warning":
        return AlertCircle
      case "info":
        return Info
      default:
        return Info
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
          <CardDescription>
            Latest system notifications and alerts
            {isConnected && (
              <span className="ml-2 inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Live monitoring
              </span>
            )}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadRecentAlerts}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No recent alerts</p>
              <p className="text-sm text-gray-400">All systems are running smoothly</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const IconComponent = getSeverityIcon(alert.level)
              return (
                <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-gray-400 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.service_name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(alert.level)}>
                          {alert.level}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {alert.message}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full text-sm">
              View all alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
