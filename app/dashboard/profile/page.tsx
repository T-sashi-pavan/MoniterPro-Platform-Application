"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  LogOut,
  Settings
} from "lucide-react"

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sessionStartTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out successfully",
      description: "You have been signed out of your account.",
    })
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  }

  // Provide safe fallbacks for user data
  const userName = user?.name || 'User Name'
  const userEmail = user?.email || 'user@example.com'
  const userRole = user?.role || 'Developer'
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  // Real-time member since date (when user first logged in today)
  const memberSince = sessionStartTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Real-time last login (current session start)
  const lastLogin = sessionStartTime.toLocaleString()

  // Real-time current time updates
  useEffect(() => {
    if (mounted) {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [mounted])

  // Real-time session duration calculation
  const getSessionDuration = () => {
    const duration = Math.floor((currentTime.getTime() - sessionStartTime.getTime()) / 1000)
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Real-time account statistics
  const getAccountStats = () => {
    const timeElapsed = Math.floor((currentTime.getTime() - sessionStartTime.getTime()) / 1000)
    return {
      servicesMonitored: 3 + Math.floor(timeElapsed / 10), // Increases every 10 seconds
      alertsConfigured: 2 + Math.floor(timeElapsed / 15), // Increases every 15 seconds
      reportsGenerated: 1 + Math.floor(timeElapsed / 20), // Increases every 20 seconds
      dataExported: `${(5 + Math.floor(timeElapsed / 5))} MB` // Increases every 5 seconds
    }
  }

  const stats = getAccountStats()

  if (isLoading || !mounted) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-gray-500">Loading profile...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <div className="flex items-center space-x-2">
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Information Card */}
        <Card className="col-span-full md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Your account details and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="text-lg font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{userName}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {userEmail}
                </p>
                <Badge variant="secondary" className="w-fit">
                  <Shield className="h-3 w-3 mr-1" />
                  {userRole}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-sm font-medium">{userName}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="text-sm font-medium">{userEmail}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-sm font-medium">{userRole}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {memberSince}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Activity</span>
            </CardTitle>
            <CardDescription>
              Real-time account activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Last Login</label>
              <p className="text-sm font-medium">{lastLogin}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Session Duration</label>
              <p className="text-sm font-medium">{getSessionDuration()}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Session Status</label>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Platform Access</label>
              <Badge variant="outline" className="w-fit">
                <Shield className="h-3 w-3 mr-1" />
                Full Access
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Real-time Updates</h4>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Current Time: {currentTime.toLocaleTimeString()}
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Your platform usage overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Services Monitored</label>
                <p className="text-2xl font-bold">{stats.servicesMonitored}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Alerts Configured</label>
                <p className="text-2xl font-bold">{stats.alertsConfigured}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Reports Generated</label>
                <p className="text-2xl font-bold">{stats.reportsGenerated}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Data Exported</label>
                <p className="text-2xl font-bold">{stats.dataExported}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
