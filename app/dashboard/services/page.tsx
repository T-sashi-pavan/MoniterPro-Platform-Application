"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Server,
  Database,
  Globe,
  Shield,
  Zap,
  Activity,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

const getStatusColor = (status: string) => {
  switch (status) {
    case "online":
      return "bg-green-100 text-green-800"
    case "warning":
      return "bg-yellow-100 text-yellow-800"
    case "critical":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusDot = (status: string) => {
  switch (status) {
    case "online":
      return "bg-green-500"
    case "warning":
      return "bg-yellow-500"
    case "critical":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isMetricsDialogOpen, setIsMetricsDialogOpen] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [serviceMetrics, setServiceMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newService, setNewService] = useState({
    name: "",
    type: "",
    url: "",
    description: "",
  })
  const [editService, setEditService] = useState({
    name: "",
    url: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:3333/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      } else {
        console.error('Failed to load services')
        setServices([])
      }
    } catch (error) {
      console.error('Error loading services:', error)
      setServices([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.url.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddService = async () => {
    if (!newService.name || !newService.url) {
      toast({
        title: "Error",
        description: "Name and URL are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('http://localhost:3333/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newService.name,
          url: newService.url,
          ownerId: user?.id,
          userName: user?.name
        }),
      })

      if (response.ok) {
        toast({
          title: "Service added",
          description: `${newService.name} has been added successfully.`,
        })
        setIsAddDialogOpen(false)
        setNewService({ name: "", type: "", url: "", description: "" })
        loadServices() // Reload services
      } else {
        throw new Error('Failed to add service')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    try {
      const response = await fetch(`http://localhost:3333/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: user?.name
        }),
      })

      if (response.ok) {
        toast({
          title: "Service deleted",
          description: `${serviceName} has been deleted successfully.`,
        })
        loadServices() // Reload services
      } else {
        throw new Error('Failed to delete service')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = async (service: any) => {
    try {
      const response = await fetch(`http://localhost:3333/api/services/${service._id}`)
      if (response.ok) {
        const serviceDetails = await response.json()
        setSelectedService(serviceDetails)
        setIsDetailsDialogOpen(true)
      } else {
        throw new Error('Failed to fetch service details')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load service details.",
        variant: "destructive",
      })
    }
  }

  const handleEditService = (service: any) => {
    setSelectedService(service)
    setEditService({
      name: service.name,
      url: service.url,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateService = async () => {
    if (!editService.name || !editService.url) {
      toast({
        title: "Error",
        description: "Name and URL are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`http://localhost:3333/api/services/${selectedService._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editService.name,
          url: editService.url,
          userName: user?.name
        }),
      })

      if (response.ok) {
        toast({
          title: "Service updated",
          description: `${editService.name} has been updated successfully.`,
        })
        setIsEditDialogOpen(false)
        loadServices() // Reload services
      } else {
        throw new Error('Failed to update service')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewMetrics = async (service: any) => {
    try {
      const response = await fetch(`http://localhost:3333/api/services/${service._id}/metrics?hours=24`)
      if (response.ok) {
        const metrics = await response.json()
        setSelectedService(service)
        setServiceMetrics(metrics)
        setIsMetricsDialogOpen(true)
      } else {
        throw new Error('Failed to fetch service metrics')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load service metrics.",
        variant: "destructive",
      })
    }
  }

  const triggerHealthCheck = async (service: any) => {
    try {
      const response = await fetch(`http://localhost:3333/api/services/${service._id}/health-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "Health check started",
          description: `Health check for ${service.name} has been triggered.`,
        })
        // Reload services after a short delay to show updated status
        setTimeout(() => loadServices(), 2000)
      } else {
        throw new Error('Failed to trigger health check')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger health check.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading services...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all your services and APIs</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Add a new service to monitor. Fill in the details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Service name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={newService.type}
                  onValueChange={(value) => setNewService({ ...newService, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Microservice">Microservice</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  URL
                </Label>
                <Input
                  id="url"
                  value={newService.url}
                  onChange={(e) => setNewService({ ...newService, url: e.target.value })}
                  className="col-span-3"
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Service description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddService}>
                Add Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>All Services ({filteredServices.length})</CardTitle>
          <CardDescription>Monitor the health and performance of your services</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No services found. Add your first service to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          {service.type === "API" && <Globe className="h-5 w-5 text-gray-600" />}
                          {service.type === "Microservice" && <Server className="h-5 w-5 text-gray-600" />}
                          {service.type === "Database" && <Database className="h-5 w-5 text-gray-600" />}
                          {service.type === "Security" && <Shield className="h-5 w-5 text-gray-600" />}
                          {service.type === "External" && <Zap className="h-5 w-5 text-gray-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500">{service.type || 'Unknown'}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{service.url}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusDot(service.status || 'unknown')}`} />
                        <Badge className={getStatusColor(service.status || 'unknown')}>
                          {service.status ? service.status.charAt(0).toUpperCase() + service.status.slice(1) : 'Unknown'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{service.uptime || 0}%</div>
                        <Progress value={service.uptime || 0} className="h-1 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Activity className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">{service.responseTime || 0}ms</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{service.lastCheck || 'Never'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(service)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditService(service)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Service
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewMetrics(service)}>
                            <Activity className="h-4 w-4 mr-2" />
                            View Metrics
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => triggerHealthCheck(service)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Check Health
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteService(service._id, service.name)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service information below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editService.name}
                onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                className="col-span-3"
                placeholder="Service name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-url" className="text-right">
                URL
              </Label>
              <Input
                id="edit-url"
                value={editService.url}
                onChange={(e) => setEditService({ ...editService, url: e.target.value })}
                className="col-span-3"
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateService}>
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>Detailed information about {selectedService?.name}</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Service Name</Label>
                  <p className="text-sm text-gray-600">{selectedService.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">URL</Label>
                  <p className="text-sm text-gray-600 break-all">{selectedService.url}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`h-2 w-2 rounded-full ${getStatusDot(selectedService.status)}`} />
                    <Badge className={getStatusColor(selectedService.status)}>
                      {selectedService.status?.charAt(0).toUpperCase() + selectedService.status?.slice(1) || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Response Time</Label>
                  <p className="text-sm text-gray-600">{selectedService.responseTime || 0}ms</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Last Check</Label>
                  <p className="text-sm text-gray-600">{selectedService.lastCheck || 'Never'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner</Label>
                  <p className="text-sm text-gray-600">{selectedService.ownerId?.name || 'Unknown'}</p>
                </div>
              </div>
              {selectedService.recentMetrics && selectedService.recentMetrics.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Recent Metrics</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {selectedService.recentMetrics.slice(0, 5).map((metric: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-1 text-xs">
                        <span>{new Date(metric.lastChecked).toLocaleString()}</span>
                        <span className={metric.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                          {metric.status} ({metric.responseTime}ms)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Metrics Dialog */}
      <Dialog open={isMetricsDialogOpen} onOpenChange={setIsMetricsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Service Metrics</DialogTitle>
            <DialogDescription>24-hour metrics history for {selectedService?.name}</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="py-4">
              {serviceMetrics.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No metrics data available for this service.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(serviceMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / serviceMetrics.length)}ms
                      </div>
                      <div className="text-sm text-gray-500">Avg Response Time</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((serviceMetrics.filter(m => m.status === 'online').length / serviceMetrics.length) * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Uptime</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {serviceMetrics.length}
                      </div>
                      <div className="text-sm text-gray-500">Total Checks</div>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Time</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Response Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceMetrics.map((metric, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{new Date(metric.lastChecked).toLocaleString()}</td>
                            <td className="py-2">
                              <Badge className={getStatusColor(metric.status)}>
                                {metric.status}
                              </Badge>
                            </td>
                            <td className="py-2">{metric.responseTime || 0}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
