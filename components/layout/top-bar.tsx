"use client"

import { Bell, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center space-x-4">
        <SidebarTrigger />
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search services, metrics, logs..." className="pl-10 bg-gray-50 border-gray-200" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <DropdownMenuItem className="p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">High CPU usage detected</p>
                <p className="text-xs text-gray-500">API Gateway - 2 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Service response time increased</p>
                <p className="text-xs text-gray-500">User Service - 5 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Memory threshold exceeded</p>
                <p className="text-xs text-gray-500">Database - 10 minutes ago</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
