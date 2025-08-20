"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ServiceStatusGrid } from "@/components/dashboard/service-status-grid-simple"
import { SystemOverview } from "@/components/dashboard/system-overview"
import { Server, Activity, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { useWebSocket } from "@/contexts/websocket-context"
import { dashboardApi, healthCheckApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [stats, setStats] = useState({
    totalServices: 0,
    avgResponseTime: 0,
    uptime: 100,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { isConnected, latestMetrics } = useWebSocket()
  const { toast } = useToast()

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fix hydration by setting time only on client side
  useEffect(() => {
    if (!mounted) return
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }))
    }
    
    updateTime() // Set initial time
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [mounted])

  // Load initial dashboard stats
  useEffect(() => {
    if (mounted) {
      loadDashboardStats()
    }
  }, [mounted])

  // Update stats when new metrics arrive via WebSocket
  useEffect(() => {
    if (latestMetrics.length > 0) {
      updateStatsFromMetrics()
    }
  }, [latestMetrics])

  const loadDashboardStats = async () => {
    try {
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      // Set fallback data
      setStats({
        totalServices: 1,
        avgResponseTime: 250,
        uptime: 99.95,
      })
      toast({
        title: "Using Offline Data",
        description: "Unable to connect to server, showing cached data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatsFromMetrics = () => {
    if (latestMetrics.length === 0) return

    const totalServices = latestMetrics.length
    const onlineServices = latestMetrics.filter(m => m.status === 'online').length
    const avgResponseTime = latestMetrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / latestMetrics.length
    const uptime = (onlineServices / totalServices) * 100

    setStats({
      totalServices,
      avgResponseTime: Math.round(avgResponseTime),
      uptime: Math.round(uptime * 100) / 100
    })
  }

  const triggerHealthCheck = async () => {
    setIsRefreshing(true)
    try {
      await healthCheckApi.trigger()
      toast({
        title: "Health Check Started",
        description: "Manual health check has been triggered",
      })
    } catch (error) {
      console.error('Error triggering health check:', error)
      toast({
        title: "Error",
        description: "Failed to trigger health check",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const statsDisplay = [
    {
      title: "Total Services",
      value: isLoading ? "..." : stats.totalServices.toString(),
      change: "+2",
      changeType: "positive" as const,
      icon: Server,
      description: isConnected ? "Connected to real-time data" : "Offline mode",
    },
    {
      title: "Avg Response Time",
      value: isLoading ? "..." : `${stats.avgResponseTime}ms`,
      change: "-12ms",
      changeType: "positive" as const,
      icon: Activity,
      description: "Last hour average",
    },
    {
      title: "Uptime",
      value: isLoading ? "..." : `${stats.uptime.toFixed(2)}%`,
      change: `+${(stats.uptime - 99.95).toFixed(2)}%`,
      changeType: "positive" as const,
      icon: CheckCircle,
      description: "Last 24 hours",
    },
  ]

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Loading dashboard...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">...</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your services.
            {isConnected && (
              <span className="ml-2 inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Real-time monitoring active
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={triggerHealthCheck} 
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Check Now'}
          </Button>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium">{currentTime || "--:--:--"}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  variant={stat.changeType === "positive" ? "default" : "secondary"}
                  className={`text-xs ${
                    stat.changeType === "positive" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {stat.changeType === "positive" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Overview */}
        <div className="lg:col-span-2">
          <SystemOverview />
        </div>
      </div>

      {/* Service Status Grid */}
      <ServiceStatusGrid />
    </div>
  )
}
