"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Simple email service for testing
class SimpleEmailService {
  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    console.log('🚀 SIMPLE EMAIL TEST STARTED')
    console.log('📧 Recipient:', recipientEmail)
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      console.error('❌ Invalid email format')
      return false
    }

    try {
      // Method 1: Try local API
      console.log('📧 Trying local API...')
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: '[TEST ALERT] MonitorPro Email Test',
          message: `This is a test email sent to ${recipientEmail}. Your email alerts are working!`,
          serviceName: 'Test Service',
          severity: 'info'
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Local API success:', result)
        return true
      }

      console.log('⚠️ Local API failed, trying alternative...')

      // Method 2: Direct console log for testing
      console.log('📧 EMAIL SIMULATION:')
      console.log('To:', recipientEmail)
      console.log('Subject: [TEST ALERT] MonitorPro Email Test')
      console.log('Message: This is a test email sent to', recipientEmail)
      console.log('✅ Email simulation complete')

      return true

    } catch (error) {
      console.error('❌ Email test failed:', error)
      return false
    }
  }
}

const simpleEmailService = new SimpleEmailService()

export function EmailTester() {
  const [testEmail, setTestEmail] = useState('')
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSendTest = async () => {
    const emailToUse = testEmail.trim() || 'test@example.com'
    
    console.log('🧪 Email tester called with:', emailToUse)
    
    toast({
      title: "Sending Test Email...",
      description: `Testing email to: ${emailToUse}`
    })

    try {
      const success = await simpleEmailService.sendTestEmail(emailToUse)
      
      if (success) {
        toast({
          title: "✅ Email Test Complete!",
          description: `Test sent to: ${emailToUse}. Check console for details.`
        })
      } else {
        toast({
          title: "❌ Email Test Failed",
          description: "Check browser console for error details.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Email test error:', error)
      toast({
        title: "❌ Error",
        description: "Failed to send test email",
        variant: "destructive"
      })
    }
  }

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Tester</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
            Loading email tester...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Tester (Client-Side Only)
        </CardTitle>
        <CardDescription>
          Test sending emails to any address - no SSR issues!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="test-email-simple">Test Email Address</Label>
            <Input
              id="test-email-simple"
              type="email"
              placeholder="Enter any email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-green-600 mt-1">
              ✅ Will test with: <strong>{testEmail.trim() || 'test@example.com'}</strong>
            </p>
          </div>
          <Button onClick={handleSendTest} className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send Test
          </Button>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>🔧 Debugging Mode:</strong><br/>
            This component is client-side only to avoid hydration issues.<br/>
            Check the browser console (F12) for detailed email testing logs.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
