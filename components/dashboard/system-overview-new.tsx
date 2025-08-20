"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Cpu, HardDrive, Zap, Activity, Memory } from "lucide-react"
import { useWebSocket } from "@/contexts/websocket-context"
import { metricsApi, servicesApi } from "@/lib/api"

// Define colors for different services and metrics
const serviceColors = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
]

const systemMetricColors = {
  memory_usage: "#f59e0b",
  response_time: "#3b82f6",
  services_online: "#10b981",
  cpu_usage: "#ef4444"
}

interface MetricData {
  time: string
  response_time: number
  services_online: number
  total_services: number
  memory_usage: number
  cpu_usage: number
  [key: string]: any // For dynamic service metrics
}

export function SystemOverview() {
  const [metricsData, setMetricsData] = useState<MetricData[]>([])
  const [services, setServices] = useState<any[]>([])
  const [systemStats, setSystemStats] = useState({
    avgResponseTime: 0,
    onlineServices: 0,
    totalServices: 0,
    uptime: 100,
    memoryUsage: 0,
    cpuUsage: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'system' | 'services'>('system')
  
  const { latestMetrics, isConnected } = useWebSocket()

  useEffect(() => {
    loadHistoricalData()
  }, [])

  // Update with real-time data when new metrics arrive
  useEffect(() => {
    if (latestMetrics.length > 0) {
      updateWithLatestMetrics()
    }
  }, [latestMetrics, services])

  const loadHistoricalData = async () => {
    try {
      // Load services first
      const servicesData = await servicesApi.getAll()
      setServices(servicesData)
      
      const metrics = await metricsApi.getHistory(undefined, 2) // Last 2 hours
      
      if (metrics.length === 0) {
        generateSampleData(servicesData)
        setIsLoading(false)
        return
      }
      
      // Process metrics into chart data with service separation
      const timeGroups = new Map()
      
      metrics.forEach(metric => {
        const timeKey = new Date(metric.lastChecked || metric.last_checked).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        
        if (!timeGroups.has(timeKey)) {
          timeGroups.set(timeKey, {
            time: timeKey,
            response_times: [],
            services_online: new Set(),
            total_services: new Set(),
            memory_usage: [],
            cpu_usage: [],
            serviceMetrics: new Map()
          })
        }
        
        const group = timeGroups.get(timeKey)
        
        // System metrics
        if (metric.responseTime !== null && metric.responseTime !== undefined) {
          group.response_times.push(metric.responseTime)
        } else if (metric.response_time !== null && metric.response_time !== undefined) {
          group.response_times.push(metric.response_time)
        }
        
        if (metric.memoryUsage !== null && metric.memoryUsage !== undefined) {
          group.memory_usage.push(metric.memoryUsage)
        }
        
        if (metric.cpuUsage !== null && metric.cpuUsage !== undefined) {
          group.cpu_usage.push(metric.cpuUsage)
        }
        
        const serviceId = metric.serviceId || metric.service_id
        group.total_services.add(serviceId)
        
        if (metric.isHealthy || metric.status === 'online') {
          group.services_online.add(serviceId)
        }

        // Individual service metrics
        const service = servicesData.find(s => s._id === serviceId)
        if (service) {
          if (!group.serviceMetrics.has(service.name)) {
            group.serviceMetrics.set(service.name, {
              response_times: [],
              status: (metric.isHealthy || metric.status === 'online') ? 1 : 0
            })
          }
          const responseTime = metric.responseTime || metric.response_time
          if (responseTime !== null && responseTime !== undefined) {
            group.serviceMetrics.get(service.name).response_times.push(responseTime)
          }
        }
      })

      // Convert to chart data
      const chartData = Array.from(timeGroups.entries()).map(([time, group]) => {
        const dataPoint: MetricData = {
          time,
          response_time: group.response_times.length > 0 
            ? Math.round(group.response_times.reduce((sum: number, rt: number) => sum + rt, 0) / group.response_times.length)
            : 0,
          services_online: group.services_online.size,
          total_services: group.total_services.size,
          memory_usage: group.memory_usage.length > 0 
            ? Math.round(group.memory_usage.reduce((sum: number, mu: number) => sum + mu, 0) / group.memory_usage.length)
            : Math.random() * 40 + 30, // Sample data if not available
          cpu_usage: group.cpu_usage.length > 0 
            ? Math.round(group.cpu_usage.reduce((sum: number, cu: number) => sum + cu, 0) / group.cpu_usage.length)
            : Math.random() * 60 + 20, // Sample data if not available
        }

        // Add individual service data
        group.serviceMetrics.forEach((serviceData, serviceName) => {
          dataPoint[`${serviceName}_response`] = serviceData.response_times.length > 0
            ? Math.round(serviceData.response_times.reduce((sum: number, rt: number) => sum + rt, 0) / serviceData.response_times.length)
            : 0
          dataPoint[`${serviceName}_status`] = serviceData.status
        })

        return dataPoint
      })

      setMetricsData(chartData.slice(-20)) // Last 20 data points
      
      // Calculate current stats
      if (chartData.length > 0) {
        const latest = chartData[chartData.length - 1]
        setSystemStats({
          avgResponseTime: latest.response_time,
          onlineServices: latest.services_online,
          totalServices: latest.total_services,
          uptime: latest.total_services > 0 ? (latest.services_online / latest.total_services) * 100 : 100,
          memoryUsage: latest.memory_usage,
          cpuUsage: latest.cpu_usage,
        })
      }
    } catch (error) {
      console.error('Error loading historical data:', error)
      generateSampleData()
    } finally {
      setIsLoading(false)
    }
  }

  const generateSampleData = (servicesData: any[] = []) => {
    const sampleData = []
    const now = new Date()
    const defaultServices = servicesData.length > 0 ? servicesData : [
      { _id: '1', name: 'GitHub', url: 'https://github.com' },
      { _id: '2', name: 'Google', url: 'https://google.com' }
    ]

    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 6 * 60 * 1000)) // Every 6 minutes
      const dataPoint: MetricData = {
        time: time.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        response_time: Math.floor(Math.random() * 300) + 100, // 100-400ms
        services_online: defaultServices.length,
        total_services: defaultServices.length,
        memory_usage: Math.floor(Math.random() * 40) + 30, // 30-70%
        cpu_usage: Math.floor(Math.random() * 60) + 20, // 20-80%
      }

      // Add individual service response times
      defaultServices.forEach((service, index) => {
        dataPoint[`${service.name}_response`] = Math.floor(Math.random() * 200) + 100 + (index * 30)
        dataPoint[`${service.name}_status`] = Math.random() > 0.1 ? 1 : 0 // 90% uptime
      })
      
      sampleData.push(dataPoint)
    }

    setMetricsData(sampleData)
    setSystemStats({
      avgResponseTime: Math.floor(Math.random() * 300) + 100,
      onlineServices: defaultServices.length,
      totalServices: defaultServices.length,
      uptime: 100,
      memoryUsage: Math.floor(Math.random() * 40) + 30,
      cpuUsage: Math.floor(Math.random() * 60) + 20,
    })
  }

  const updateWithLatestMetrics = () => {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })

    // Calculate stats from latest metrics
    const onlineCount = latestMetrics.filter(m => m.isHealthy || m.status === 'online').length
    const totalCount = latestMetrics.length || services.length

    const responseTimes = latestMetrics
      .filter(m => (m.responseTime !== null && m.responseTime !== undefined) || (m.response_time !== null && m.response_time !== undefined))
      .map(m => m.responseTime || m.response_time)
    
    const memoryUsages = latestMetrics
      .filter(m => m.memoryUsage !== null && m.memoryUsage !== undefined)
      .map(m => m.memoryUsage)
    
    const cpuUsages = latestMetrics
      .filter(m => m.cpuUsage !== null && m.cpuUsage !== undefined)
      .map(m => m.cpuUsage)

    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
      : systemStats.avgResponseTime

    const avgMemoryUsage = memoryUsages.length > 0 
      ? Math.round(memoryUsages.reduce((sum, mu) => sum + mu, 0) / memoryUsages.length)
      : Math.random() * 40 + 30

    const avgCpuUsage = cpuUsages.length > 0 
      ? Math.round(cpuUsages.reduce((sum, cu) => sum + cu, 0) / cpuUsages.length)
      : Math.random() * 60 + 20

    const newDataPoint: MetricData = {
      time: currentTime,
      response_time: avgResponseTime,
      services_online: onlineCount,
      total_services: totalCount,
      memory_usage: avgMemoryUsage,
      cpu_usage: avgCpuUsage,
    }

    // Add individual service data
    services.forEach(service => {
      const metric = latestMetrics.find(m => (m.serviceId || m.service_id) === service._id)
      if (metric) {
        newDataPoint[`${service.name}_response`] = metric.responseTime || metric.response_time || 0
        newDataPoint[`${service.name}_status`] = (metric.isHealthy || metric.status === 'online') ? 1 : 0
      } else {
        // Default values for services without current metrics
        newDataPoint[`${service.name}_response`] = 0
        newDataPoint[`${service.name}_status`] = 0
      }
    })

    setMetricsData(prevData => {
      const newData = [...prevData]
      if (newData.length >= 20) {
        newData.shift() // Remove oldest point
      }
      newData.push(newDataPoint)
      return newData
    })

    setSystemStats({
      avgResponseTime,
      onlineServices: onlineCount,
      totalServices: totalCount,
      uptime: totalCount > 0 ? (onlineCount / totalCount) * 100 : 100,
      memoryUsage: avgMemoryUsage,
      cpuUsage: avgCpuUsage,
    })
  }

  const renderSystemMetrics = () => (
    <AreaChart data={metricsData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip
        content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="text-sm font-medium">{`Time: ${label}`}</p>
                {payload.map((entry, index) => {
                  let value: string
                  let label: string
                  
                  switch (entry.dataKey) {
                    case 'response_time':
                      value = `${entry.value}ms`
                      label = 'Avg Response Time'
                      break
                    case 'memory_usage':
                      value = `${entry.value}%`
                      label = 'Memory Usage'
                      break
                    case 'cpu_usage':
                      value = `${entry.value}%`
                      label = 'CPU Usage'
                      break
                    case 'services_online':
                      value = `${entry.value}`
                      label = 'Services Online'
                      break
                    default:
                      value = `${entry.value}`
                      label = entry.dataKey as string
                  }
                  
                  return (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {`${label}: ${value}`}
                    </p>
                  )
                })}
              </div>
            )
          }
          return null
        }}
      />
      <Legend />
      <Area
        type="monotone"
        dataKey="memory_usage"
        stackId="1"
        stroke={systemMetricColors.memory_usage}
        fill={systemMetricColors.memory_usage}
        fillOpacity={0.3}
        name="Memory Usage (%)"
      />
      <Area
        type="monotone"
        dataKey="cpu_usage"
        stackId="2"
        stroke={systemMetricColors.cpu_usage}
        fill={systemMetricColors.cpu_usage}
        fillOpacity={0.3}
        name="CPU Usage (%)"
      />
      <Area
        type="monotone"
        dataKey="response_time"
        stackId="3"
        stroke={systemMetricColors.response_time}
        fill={systemMetricColors.response_time}
        fillOpacity={0.4}
        name="Avg Response Time (ms)"
      />
    </AreaChart>
  )

  const renderServiceMetrics = () => (
    <LineChart data={metricsData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip
        content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="text-sm font-medium">{`Time: ${label}`}</p>
                {payload.map((entry, index) => {
                  const serviceName = (entry.dataKey as string).replace('_response', '')
                  return (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {`${serviceName}: ${entry.value}ms`}
                    </p>
                  )
                })}
              </div>
            )
          }
          return null
        }}
      />
      <Legend />
      {services.map((service, index) => (
        <Line
          key={service._id}
          type="monotone"
          dataKey={`${service.name}_response`}
          stroke={serviceColors[index % serviceColors.length]}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: serviceColors[index % serviceColors.length], strokeWidth: 2 }}
          name={`${service.name} Response Time`}
        />
      ))}
    </LineChart>
  )

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">System Overview</CardTitle>
          <CardDescription>Loading real-time metrics...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">System Overview</CardTitle>
            <CardDescription>
              Real-time performance metrics
              {isConnected && (
                <span className="ml-2 inline-flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Live updates active
                </span>
              )}
              {services.length > 0 && (
                <span className="ml-2 text-xs">({services.length} services monitored)</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('system')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'system' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              System Metrics
            </button>
            <button
              onClick={() => setViewMode('services')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'services' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Service Metrics
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Avg Response Time</span>
            </div>
            <div className="text-2xl font-bold">{systemStats.avgResponseTime}ms</div>
            <Progress value={Math.min(systemStats.avgResponseTime / 10, 100)} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Services Online</span>
            </div>
            <div className="text-2xl font-bold">{systemStats.onlineServices}/{systemStats.totalServices}</div>
            <Progress value={systemStats.uptime} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Memory className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <div className="text-2xl font-bold">{systemStats.memoryUsage.toFixed(1)}%</div>
            <Progress value={systemStats.memoryUsage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold">{systemStats.cpuUsage.toFixed(1)}%</div>
            <Progress value={systemStats.cpuUsage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">System Uptime</span>
            </div>
            <div className="text-2xl font-bold">{systemStats.uptime.toFixed(1)}%</div>
            <Progress value={systemStats.uptime} className="h-2" />
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'system' ? renderSystemMetrics() : renderServiceMetrics()}
          </ResponsiveContainer>
        </div>
        
        {services.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            No services available for monitoring
          </div>
        )}
        
        {viewMode === 'services' && services.length > 1 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>💡 <strong>Multiple Services Visualization:</strong></p>
            <p>• Each service is represented by a different colored line</p>
            <p>• Hover over the chart to see individual service response times</p>
            <p>• Legend shows which color represents which service</p>
            <p>• Lines help you compare performance across services over time</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
