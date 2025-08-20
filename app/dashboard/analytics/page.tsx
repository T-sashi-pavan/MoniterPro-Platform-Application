"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, Activity, Server, Clock, AlertCircle, BarChart3, PieChartIcon } from "lucide-react"
import { useWebSocket } from "@/contexts/websocket-context"
import { generateDeterministicSampleData, generateDeterministicSystemStats } from "@/lib/deterministic-data"

// Interface for analytics data
interface AnalyticsData {
  time: string
  cpu: number
  memory: number
  responseTime: number
  requests: number
  errors: number
  uptime: number
}

interface ServiceMetrics {
  id: string
  name: string
  status: 'online' | 'offline' | 'degraded'
  responseTime: number
  requests: number
  errors: number
  uptime: number
  trend: 'up' | 'down' | 'stable'
}

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h')
  const [selectedChart, setSelectedChart] = useState<'overview' | 'performance' | 'errors' | 'services'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  
  const { latestMetrics, isConnected } = useWebSocket()

  // Generate deterministic analytics data
  const generateAnalyticsData = (count: number = 24) => {
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60))
    const data: AnalyticsData[] = []
    
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(Date.now() - i * 10 * 60 * 1000) // Every 10 minutes
      const seed = currentHour + i
      
      // Simple seeded random for consistent data
      const random = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }
      
      data.push({
        time: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        cpu: Math.floor(random(seed) * 40) + 30,
        memory: Math.floor(random(seed + 1) * 50) + 40,
        responseTime: Math.floor(random(seed + 2) * 200) + 100,
        requests: Math.floor(random(seed + 3) * 1000) + 500,
        errors: Math.floor(random(seed + 4) * 10) + 1,
        uptime: Math.floor(random(seed + 5) * 5) + 95
      })
    }
    
    return data
  }

  // Generate deterministic service metrics
  const generateServiceMetrics = (): ServiceMetrics[] => {
    const services = [
      'Authentication API',
      'User Management',
      'Payment Gateway',
      'Email Service',
      'File Storage',
      'Analytics Engine'
    ]
    
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60))
    
    return services.map((name, index) => {
      const seed = currentHour + index
      const random = (s: number) => {
        const x = Math.sin(s) * 10000
        return x - Math.floor(x)
      }
      
      const responseTime = Math.floor(random(seed) * 300) + 50
      const status = responseTime > 250 ? 'degraded' : (random(seed + 1) > 0.9 ? 'offline' : 'online')
      
      return {
        id: `service-${index}`,
        name,
        status,
        responseTime,
        requests: Math.floor(random(seed + 2) * 5000) + 1000,
        errors: Math.floor(random(seed + 3) * 20),
        uptime: Math.floor(random(seed + 4) * 10) + 90,
        trend: random(seed + 5) > 0.6 ? 'up' : (random(seed + 6) > 0.3 ? 'down' : 'stable')
      }
    })
  }

  useEffect(() => {
    setMounted(true)
    
    // Initial data load
    const loadAnalyticsData = () => {
      const data = generateAnalyticsData(selectedTimeRange === '1h' ? 6 : selectedTimeRange === '6h' ? 36 : selectedTimeRange === '24h' ? 144 : 1008)
      setAnalyticsData(data)
      setServiceMetrics(generateServiceMetrics())
      setIsLoading(false)
    }

    loadAnalyticsData()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadAnalyticsData()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedTimeRange])

  // Update with WebSocket data when available
  useEffect(() => {
    if (latestMetrics.length > 0 && analyticsData.length > 0) {
      const newDataPoint: AnalyticsData = {
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit", 
          hour12: false,
        }),
        cpu: latestMetrics[0]?.cpu || Math.floor(Math.random() * 40) + 30,
        memory: latestMetrics[0]?.memory || Math.floor(Math.random() * 50) + 40,
        responseTime: latestMetrics[0]?.responseTime || Math.floor(Math.random() * 200) + 100,
        requests: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 10) + 1,
        uptime: 99.5
      }
      
      setAnalyticsData(prev => [...prev.slice(-35), newDataPoint])
    }
  }, [latestMetrics])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Loading analytics dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const renderOverviewCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            System Performance
          </CardTitle>
          <CardDescription>CPU, Memory & Response Time trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cpu" stroke="#ef4444" fill="url(#cpuGradient)" name="CPU %" />
                <Area type="monotone" dataKey="memory" stroke="#f59e0b" fill="url(#memoryGradient)" name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Response Time & Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Response Time & Load
          </CardTitle>
          <CardDescription>API response times and request volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="left" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} name="Response Time (ms)" />
                <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} name="Requests" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderServiceAnalytics = () => (
    <div className="space-y-6">
      {/* Service Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {serviceMetrics.map((service, index) => (
          <Card key={service.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">{service.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={service.status === 'online' ? 'default' : service.status === 'degraded' ? 'secondary' : 'destructive'}>
                    {service.status}
                  </Badge>
                  {service.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {service.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests</span>
                  <span className="font-medium">{service.requests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Errors</span>
                  <span className="font-medium text-red-500">{service.errors}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{service.uptime}%</span>
                </div>
              </div>
            </CardContent>
            <div 
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r"
              style={{
                width: `${service.uptime}%`,
                background: service.uptime > 95 ? '#10b981' : service.uptime > 90 ? '#f59e0b' : '#ef4444'
              }}
            />
          </Card>
        ))}
      </div>

      {/* Service Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-500" />
            Service Response Times
          </CardTitle>
          <CardDescription>Comparative response time analysis across services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="responseTime" name="Response Time (ms)">
                  {serviceMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance insights
            {isConnected && (
              <span className="ml-2 inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Live updates active
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">System Overview</SelectItem>
              <SelectItem value="services">Service Analytics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.length > 0 
                ? `${Math.round(analyticsData.reduce((sum, d) => sum + d.responseTime, 0) / analyticsData.length)}ms`
                : '...'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.length > 0 
                ? (analyticsData.reduce((sum, d) => sum + d.requests, 0)).toLocaleString()
                : '...'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.length > 0 
                ? `${((analyticsData.reduce((sum, d) => sum + d.errors, 0) / analyticsData.reduce((sum, d) => sum + d.requests, 0)) * 100).toFixed(2)}%`
                : '...'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              -2% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Online</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceMetrics.filter(s => s.status === 'online').length}/{serviceMetrics.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {selectedChart === 'overview' ? renderOverviewCharts() : renderServiceAnalytics()}

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Historical Trends ({selectedTimeRange})
          </CardTitle>
          <CardDescription>Long-term performance trends and patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="left" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} name="CPU %" />
                <Line yAxisId="left" type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={2} name="Memory %" />
                <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} name="Response Time (ms)" />
                <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
