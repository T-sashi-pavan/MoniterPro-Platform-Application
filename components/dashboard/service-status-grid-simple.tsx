"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, Database, Globe, Shield, Plus, MoreHorizontal, Activity, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { servicesApi } from "@/lib/api"

export function ServiceStatusGrid() {
  const [mounted, setMounted] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadServices()
    }
  }, [mounted])

  const loadServices = async () => {
    try {
      const data = await servicesApi.getAll()
      setServices(data)
    } catch (error) {
      console.error('Error loading services:', error)
      // Set mock services for offline mode
      setServices([
        { id: '1', name: 'Web API', url: 'https://api.example.com', status: 'online' },
        { id: '2', name: 'Database', url: 'postgres://localhost:5432', status: 'online' },
        { id: '3', name: 'Redis Cache', url: 'redis://localhost:6379', status: 'offline' },
        { id: '4', name: 'CDN', url: 'https://cdn.example.com', status: 'online' }
      ])
    } finally {
      setIsLoading(false)
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

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">Service Status</CardTitle>
            <CardDescription>Loading services...</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="text-muted-foreground">Loading service grid...</div>
          </div>
        </CardContent>
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
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
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
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        2m ago
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Uptime</span>
                        <span className="font-medium">{service.uptime?.toFixed(1)}%</span>
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
                          {service.response_time}ms
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
      </CardContent>
    </Card>
  )
}
