"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Search, Download, RefreshCw, Calendar, Clock, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react"
import { generateDeterministicSampleData, generateDeterministicLogData, generateDeterministicMetricPoint, generateDeterministicLogEntry } from "@/lib/deterministic-data"
import * as XLSX from 'xlsx'

export default function MetricsPage() {
  const [mounted, setMounted] = useState(false)
  const [metricsData, setMetricsData] = useState<
    Array<{ time: string; cpu: number; memory: number; responseTime: number }>
  >([])
  const [logData, setLogData] = useState<
    Array<{ id: number; timestamp: string; level: string; service: string; message: string }>
  >([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedService, setSelectedService] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")

  useEffect(() => {
    setMounted(true)
    
    // Use deterministic data generation to prevent hydration issues
    const initialMetrics = generateDeterministicSampleData(50)
    setMetricsData(initialMetrics)

    // Generate deterministic log data
    const initialLogs = generateDeterministicLogData(100)
    setLogData(initialLogs)

    // Update metrics every 5 seconds with deterministic data
    const interval = setInterval(() => {
      setMetricsData((prevData) => {
        const newData = [...prevData.slice(1)]
        newData.push(generateDeterministicMetricPoint())
        return newData
      })

      // Add new log entry occasionally (deterministic probability)
      const currentMinute = Math.floor(Date.now() / (1000 * 60));
      if (currentMinute % 3 === 0) { // Add log every 3 minutes deterministically
        const newLog = generateDeterministicLogEntry()
        setLogData((prevLogs) => [newLog, ...prevLogs.slice(0, 99)])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Export function to download metrics and logs as Excel
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new()

      // Prepare metrics data for export
      const metricsExportData = metricsData.map((metric, index) => ({
        'Time': metric.time,
        'CPU Usage (%)': metric.cpu,
        'Memory Usage (%)': metric.memory,
        'Response Time (ms)': metric.responseTime,
        'Timestamp': new Date().toISOString(),
        'Data Point': index + 1
      }))

      // Get current filtered logs for export
      const currentFilteredLogs = logData.filter((log) => {
        const matchesSearch =
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.service.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesService = selectedService === "all" || log.service === selectedService
        const matchesLevel = selectedLevel === "all" || log.level === selectedLevel
        return matchesSearch && matchesService && matchesLevel
      })

      // Prepare logs data for export
      const logsExportData = currentFilteredLogs.map((log, index) => ({
        'ID': log.id,
        'Timestamp': log.timestamp,
        'Level': log.level.toUpperCase(),
        'Service': log.service,
        'Message': log.message,
        'Export Time': new Date().toISOString(),
        'Record Number': index + 1
      }))

      // Create summary data
      const summaryData = [
        { 'Metric': 'Total Metrics Data Points', 'Value': metricsData.length },
        { 'Metric': 'Total Log Entries', 'Value': logData.length },
        { 'Metric': 'Filtered Log Entries', 'Value': currentFilteredLogs.length },
        { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
        { 'Metric': 'Average CPU Usage (%)', 'Value': metricsData.length > 0 ? (metricsData.reduce((sum, m) => sum + m.cpu, 0) / metricsData.length).toFixed(2) : '0' },
        { 'Metric': 'Average Memory Usage (%)', 'Value': metricsData.length > 0 ? (metricsData.reduce((sum, m) => sum + m.memory, 0) / metricsData.length).toFixed(2) : '0' },
        { 'Metric': 'Average Response Time (ms)', 'Value': metricsData.length > 0 ? (metricsData.reduce((sum, m) => sum + m.responseTime, 0) / metricsData.length).toFixed(2) : '0' },
        { 'Metric': 'Error Log Count', 'Value': currentFilteredLogs.filter(log => log.level === 'error').length },
        { 'Metric': 'Warning Log Count', 'Value': currentFilteredLogs.filter(log => log.level === 'warning').length },
        { 'Metric': 'Info Log Count', 'Value': currentFilteredLogs.filter(log => log.level === 'info').length },
        { 'Metric': 'Search Filter', 'Value': searchTerm || 'None' },
        { 'Metric': 'Service Filter', 'Value': selectedService === 'all' ? 'All Services' : selectedService },
        { 'Metric': 'Level Filter', 'Value': selectedLevel === 'all' ? 'All Levels' : selectedLevel }
      ]

      // Convert data to worksheets
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      const metricsSheet = XLSX.utils.json_to_sheet(metricsExportData)
      const logsSheet = XLSX.utils.json_to_sheet(logsExportData)

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics Data')
      XLSX.utils.book_append_sheet(workbook, logsSheet, 'Logs Data')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `monitoring-data-${timestamp}.xlsx`

      // Download the file
      XLSX.writeFile(workbook, filename)

      // Log success (you can add toast notification here if needed)
      console.log(`Successfully exported data to ${filename}`)
      
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const filteredLogs = logData.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.service.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesService = selectedService === "all" || log.service === selectedService
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel
    return matchesSearch && matchesService && matchesLevel
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "info":
        return "bg-blue-100 text-blue-800"
      case "debug":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "debug":
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Metrics...</CardTitle>
            <CardDescription>Initializing metrics and logs data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metrics & Logs</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and log analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 24h
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics">Real-time Metrics</TabsTrigger>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Metrics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">CPU Usage</CardTitle>
                <CardDescription>Real-time CPU utilization across services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="text-sm font-medium">{`Time: ${label}`}</p>
                                <p className="text-sm text-blue-600">{`CPU: ${payload[0].value}%`}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cpu"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Memory Usage</CardTitle>
                <CardDescription>Memory consumption patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricsData}>
                      <defs>
                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="text-sm font-medium">{`Time: ${label}`}</p>
                                <p className="text-sm text-green-600">{`Memory: ${payload[0].value}%`}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="memory"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorMemory)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Response Time</CardTitle>
              <CardDescription>API response time distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}ms`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="text-sm font-medium">{`Time: ${label}`}</p>
                              <p className="text-sm text-purple-600">{`Response Time: ${payload[0].value}ms`}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="responseTime" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Log Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="API Gateway">API Gateway</SelectItem>
                    <SelectItem value="User Service">User Service</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Auth Service">Auth Service</SelectItem>
                    <SelectItem value="Payment Gateway">Payment Gateway</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Live Logs */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Live Logs</CardTitle>
                  <CardDescription>Real-time log stream ({filteredLogs.length} entries)</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-gray-500">Live</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">{getLevelIcon(log.level)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Badge className={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                            <span className="text-sm font-medium text-gray-900">{log.service}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
