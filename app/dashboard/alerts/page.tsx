"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  Bell, 
  Mail, 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Send,
  UserPlus,
  Activity
} from "lucide-react"

interface AlertRule {
  id: string
  name: string
  metric: string
  condition: string
  threshold: number
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  service?: string
}

interface NotificationRecipient {
  id: string
  email: string
  name?: string
}

export default function AlertsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  
  // Configure Rules Section
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [newRule, setNewRule] = useState({
    name: "",
    metric: "",
    condition: "greater_than",
    threshold: 0,
    severity: "medium" as const,
    description: "",
    service: ""
  })
  const [showAddRule, setShowAddRule] = useState(false)
  
  // Real-Time Notification Section
  const [notificationEmail, setNotificationEmail] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [savedRecipients, setSavedRecipients] = useState<NotificationRecipient[]>([])

  useEffect(() => {
    setMounted(true)
    // Load saved alert rules from localStorage
    const savedRules = localStorage.getItem('monitoring_alert_rules')
    if (savedRules) {
      try {
        setAlertRules(JSON.parse(savedRules))
      } catch (error) {
        console.error('Error loading alert rules:', error)
      }
    }

    // Load saved recipients
    const savedRecipientsData = localStorage.getItem('monitoring_recipients')
    if (savedRecipientsData) {
      try {
        setSavedRecipients(JSON.parse(savedRecipientsData))
      } catch (error) {
        console.error('Error loading recipients:', error)
      }
    }
  }, [])

  // Save alert rules to localStorage whenever they change
  useEffect(() => {
    if (mounted && alertRules.length > 0) {
      localStorage.setItem('monitoring_alert_rules', JSON.stringify(alertRules))
    }
  }, [alertRules, mounted])

  // Save recipients to localStorage
  useEffect(() => {
    if (mounted && savedRecipients.length > 0) {
      localStorage.setItem('monitoring_recipients', JSON.stringify(savedRecipients))
    }
  }, [savedRecipients, mounted])

  const addAlertRule = () => {
    if (!newRule.name || !newRule.metric || !newRule.threshold) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const rule: AlertRule = {
      id: Date.now().toString(),
      name: newRule.name,
      metric: newRule.metric,
      condition: newRule.condition,
      threshold: newRule.threshold,
      enabled: true,
      severity: newRule.severity,
      description: newRule.description,
      service: newRule.service
    }

    setAlertRules(prev => [...prev, rule])
    setNewRule({
      name: "",
      metric: "",
      condition: "greater_than",
      threshold: 0,
      severity: "medium",
      description: "",
      service: ""
    })
    setShowAddRule(false)

    toast({
      title: "Success",
      description: "Alert rule created successfully"
    })
  }

  const deleteAlertRule = (id: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== id))
    toast({
      title: "Success",
      description: "Alert rule deleted successfully"
    })
  }

  const toggleAlertRule = (id: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const addRecipient = () => {
    if (!notificationEmail) return

    const recipient: NotificationRecipient = {
      id: Date.now().toString(),
      email: notificationEmail,
      name: notificationEmail.split('@')[0]
    }

    setSavedRecipients(prev => [...prev, recipient])
    setNotificationEmail("")

    toast({
      title: "Success",
      description: "Recipient added successfully"
    })
  }

  const removeRecipient = (id: string) => {
    setSavedRecipients(prev => prev.filter(recipient => recipient.id !== id))
  }

  const sendAlert = async () => {
    if (!notificationEmail || !notificationMessage) {
      toast({
        title: "Validation Error",
        description: "Please provide both email address and message",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/send-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: notificationEmail,
          subject: 'Monitoring Platform Alert',
          message: notificationMessage,
          timestamp: new Date().toISOString()
        })
      })

      const result = await response.json()
      console.log('API Response:', result)
      console.log('Response Status:', response.status)

      if (response.ok && result.success) {
        toast({
          title: "✅ Alert Sent Successfully!",
          description: `Email delivered to ${notificationEmail}`,
        })
        setNotificationMessage("")
        if (!savedRecipients.find(r => r.email === notificationEmail)) {
          addRecipient()
        }
      } else {
        throw new Error(result.error || `HTTP ${response.status}: Failed to send alert`)
      }
    } catch (error) {
      console.error('Email sending error:', error)
      toast({
        title: "❌ Failed to Send Alert",
        description: error instanceof Error ? error.message : "Please check your email configuration and try again",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'cpu_usage': return <Activity className="h-4 w-4" />
      case 'memory_usage': return <Activity className="h-4 w-4" />
      case 'response_time': return <Clock className="h-4 w-4" />
      case 'uptime': return <CheckCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground">
            Configure alert rules and send real-time notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {alertRules.filter(rule => rule.enabled).length} Active Rules
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configure Rules Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configure Rules
                  </CardTitle>
                  <CardDescription>
                    Set up alert rules based on metric conditions
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddRule(!showAddRule)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Rule Form */}
              {showAddRule && (
                <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <h4 className="font-medium">Create New Alert Rule</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rule-name">Rule Name *</Label>
                      <Input
                        id="rule-name"
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="High CPU Usage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rule-service">Service (Optional)</Label>
                      <Input
                        id="rule-service"
                        value={newRule.service}
                        onChange={(e) => setNewRule(prev => ({ ...prev, service: e.target.value }))}
                        placeholder="Web Server"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rule-metric">Metric *</Label>
                      <Select
                        value={newRule.metric}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, metric: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpu_usage">CPU Usage (%)</SelectItem>
                          <SelectItem value="memory_usage">Memory Usage (%)</SelectItem>
                          <SelectItem value="response_time">Response Time (ms)</SelectItem>
                          <SelectItem value="uptime">Uptime (%)</SelectItem>
                          <SelectItem value="disk_usage">Disk Usage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rule-condition">Condition</Label>
                      <Select
                        value={newRule.condition}
                        onValueChange={(value) => setNewRule(prev => ({ ...prev, condition: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rule-threshold">Threshold *</Label>
                      <Input
                        id="rule-threshold"
                        type="number"
                        value={newRule.threshold}
                        onChange={(e) => setNewRule(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                        placeholder="80"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rule-severity">Severity</Label>
                      <Select
                        value={newRule.severity}
                        onValueChange={(value: any) => setNewRule(prev => ({ ...prev, severity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      value={newRule.description}
                      onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Alert when CPU usage exceeds 80%"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addAlertRule} size="sm">
                      Create Rule
                    </Button>
                    <Button onClick={() => setShowAddRule(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Rules List */}
              <div className="space-y-3">
                {alertRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No alert rules configured</p>
                    <p className="text-sm">Click "Add Rule" to create your first alert rule</p>
                  </div>
                ) : (
                  alertRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getMetricIcon(rule.metric)}
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleAlertRule(rule.id)}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{rule.name}</h4>
                            <Badge 
                              className={`${getSeverityColor(rule.severity)} text-white text-xs`}
                            >
                              {rule.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rule.metric.replace('_', ' ')} {rule.condition.replace('_', ' ')} {rule.threshold}
                            {rule.service && ` • ${rule.service}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteAlertRule(rule.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Notification Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Real-Time Notifications
              </CardTitle>
              <CardDescription>
                Send instant alert notifications via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Input */}
              <div>
                <Label htmlFor="notification-email">Email Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="notification-email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                  <Button
                    onClick={addRecipient}
                    variant="outline"
                    size="sm"
                    disabled={!notificationEmail}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <Label htmlFor="notification-message">Alert Message *</Label>
                <Textarea
                  id="notification-message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your alert message here..."
                  rows={4}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={sendAlert}
                disabled={!notificationEmail || !notificationMessage || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Alert
                  </>
                )}
              </Button>

              {/* Saved Recipients */}
              {savedRecipients.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Recent Recipients</h4>
                    <div className="space-y-2">
                      {savedRecipients.slice(0, 5).map((recipient) => (
                        <div key={recipient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{recipient.email}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => setNotificationEmail(recipient.email)}
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                            >
                              Use
                            </Button>
                            <Button
                              onClick={() => removeRecipient(recipient.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Alert Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Alert Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{alertRules.length}</div>
                  <div className="text-sm text-blue-600">Total Rules</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {alertRules.filter(rule => rule.enabled).length}
                  </div>
                  <div className="text-sm text-green-600">Active Rules</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
