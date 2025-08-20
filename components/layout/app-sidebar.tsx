"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Server,
  BarChart3,
  Bell,
  FileText,
  Settings,
  User,
  LogOut,
  Monitor,
  ChevronUp,
  TrendingUp,
} from "lucide-react"

const navigation = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Monitoring",
    items: [
      { title: "Services", url: "/dashboard/services", icon: Server },
      { title: "Metrics & Logs", url: "/dashboard/metrics", icon: BarChart3 },
      { title: "Analytics", url: "/dashboard/analytics", icon: TrendingUp },
      { title: "Alerts & Notifications", url: "/dashboard/alerts", icon: Bell },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Profile", url: "/dashboard/profile", icon: User },
     
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()

  const handleLogout = () => {
    logout()
    // Redirect to login page
    window.location.href = '/'
  }

  // Provide safe fallbacks for user data
  const userName = user?.name || 'User'
  const userEmail = user?.email || 'user@example.com'
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <Sidebar className="border-r border-gray-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">MonitorPro</h2>
            <p className="text-xs text-gray-500">v2.1.0</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="w-full justify-start px-3 py-2 text-sm font-medium"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-gray-500">{user?.role || 'Member'}</p>
                    </div>
                  </div>
                  <ChevronUp className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
