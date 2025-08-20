"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Monitor, Shield, BarChart3, Bell } from "lucide-react"

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Monitor className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">MonitorPro</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional real-time monitoring platform for your services, APIs, and infrastructure
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Features */}
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Monitor CPU, memory, and API response times with interactive charts</CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <Bell className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Smart Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Configure intelligent alerts with email and push notifications</CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <Shield className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Role-based Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Secure access control with admin, developer, and viewer roles</CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <Monitor className="h-8 w-8 text-orange-600 mb-2" />
                  <CardTitle className="text-lg">Service Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Easily add, edit, and monitor your services with status indicators</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="max-w-md mx-auto w-full">
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center">
                <div className="flex justify-center space-x-1 mb-4">
                  <Button variant={isLogin ? "default" : "ghost"} onClick={() => setIsLogin(true)} className="flex-1">
                    Sign In
                  </Button>
                  <Button variant={!isLogin ? "default" : "ghost"} onClick={() => setIsLogin(false)} className="flex-1">
                    Sign Up
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{isLogin ? <LoginForm /> : <RegisterForm />}</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
