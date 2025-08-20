"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, Database, Globe, Shield, Zap, MoreHorizontal, Activity, Clock, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { servicesApi, metricsApi } from "@/lib/api"
import { useWebSocket } from "@/contexts/websocket-context"
import { useToast } from "@/hooks/use-toast"
import { Service, ServiceMetric } from "@/lib/types"

interface ServiceWithMetrics extends Service {
  status?: string
  uptime?: number
  response_time?: number | null
  last_checked?: Date | null
}

export function ServiceStatusGrid() {
  const [services, setServices] = useState<ServiceWithMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newService, setNewService] = useState({ name: '', url: '' })
  
  const { latestMetrics } = useWebSocket()
  const { toast } = useToast()

  // Load services and their latest metrics
  useEffect(() => {
    loadServicesWithMetrics()
  }, [])

  // Update metrics when new data arrives via WebSocket
  useEffect(() => {
    if (latestMetrics.length > 0) {
      updateServiceMetrics()
    }
  }, [latestMetrics])

  const loadServicesWithMetrics = async () => {
    try {
      const [servicesData, metricsData] = await Promise.all([
        servicesApi.getAll(),
        metricsApi.getLatest()
      ])

      // Combine services with their latest metrics
      const servicesWithMetrics = servicesData.map(service => {
        const metric = metricsData.find(m => m.service_id === service.id)
        return {
          ...service,
          status: metric?.status || 'unknown',
          uptime: calculateUptime(service.id, metricsData),
          response_time: metric?.response_time || null,
          last_checked: metric?.last_checked ? new Date(metric.last_checked) : null
        }
      })

      setServices(servicesWithMetrics)
    } catch (error) {
      console.error('Error loading services:', error)
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateServiceMetrics = () => {
    setServices(prevServices => 
      prevServices.map(service => {
        const latestMetric = latestMetrics.find(m => m.service_id === service.id)
        if (latestMetric) {
          return {
            ...service,
            status: latestMetric.status,
            response_time: latestMetric.response_time,
            last_checked: new Date()
          }
        }
        return service
      })
    )
  }

  const calculateUptime = (serviceId: number, metrics: ServiceMetric[]): number => {
    const serviceMetrics = metrics.filter(m => m.service_id === serviceId)
    if (serviceMetrics.length === 0) return 0
    
    const onlineCount = serviceMetrics.filter(m => m.status === 'online').length
    return (onlineCount / serviceMetrics.length) * 100
  }

  const addService = async () => {
    if (!newService.name || !newService.url) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      await servicesApi.create({
        name: newService.name,
        url: newService.url,
        owner_id: 1 // Default owner for now
      })
      
      setNewService({ name: '', url: '' })
      setIsAddDialogOpen(false)
      loadServicesWithMetrics()
      
      toast({
        title: "Success",
        description: "Service added successfully",
      })
    } catch (error) {
      console.error('Error adding service:', error)
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      })
    }
  }

  const deleteService = async (id: number) => {
    try {
      await servicesApi.delete(id)
      loadServicesWithMetrics()
      
      toast({
        title: "Success",
        description: "Service deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'offline': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceIcon = (url: string) => {
    if (url.includes('database') || url.includes('db')) return Database
    if (url.includes('auth') || url.includes('security')) return Shield
    if (url.includes('api')) return Globe
    return Server
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Service Status</CardTitle>
          <CardDescription>Loading services...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Service Status</CardTitle>
          <CardDescription>Real-time monitoring of all services</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Add a new service to monitor its health and performance.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  className="col-span-3"
                  placeholder="e.g., API Gateway"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  URL
                </Label>
                <Input
                  id="url"
                  value={newService.url}
                  onChange={(e) => setNewService({...newService, url: e.target.value})}
                  className="col-span-3"
                  placeholder="https://api.example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addService}>Add Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const ServiceIcon = getServiceIcon(service.url)
            return (
              <Card key={service._id || service.id || `service-${service.name}`} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <ServiceIcon className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-sm">{service.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteService(service.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(service.status || 'unknown')}>
                        {service.status || 'Unknown'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {service.last_checked 
                          ? `${Math.round((Date.now() - service.last_checked.getTime()) / 60000)}m ago`
                          : 'Never'
                        }
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Uptime</span>
                        <span className="font-medium">{service.uptime?.toFixed(1) || '0.0'}%</span>
                      </div>
                      <Progress value={service.uptime || 0} className="h-1" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Response</span>
                        </div>
                        <span className="font-medium">
                          {service.response_time ? `${service.response_time}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">URL</span>
                        </div>
                        <span className="font-medium text-xs text-blue-600 truncate max-w-32" title={service.url}>
                          {service.url.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {services.length === 0 && (
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No services configured yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
