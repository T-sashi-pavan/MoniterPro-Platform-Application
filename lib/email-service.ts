// Email service that handles sending emails via API
interface EmailData {
  to: string
  subject: string
  message: string
  serviceName?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

interface EmailResponse {
  success: boolean
  message: string
  error?: string
  previewURL?: string
  messageId?: string
}

// Main email sending function
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  try {
    console.log('📧 EMAIL SERVICE: Sending email to:', data.to)

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.to)) {
      throw new Error('Invalid email address format')
    }

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Response Error:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ EMAIL SERVICE: Email sent successfully!')
      console.log('📧 Preview URL:', result.previewURL)
      
      return {
        success: true,
        message: result.message,
        previewURL: result.previewURL,
        messageId: result.messageId
      }
    } else {
      console.error('❌ EMAIL SERVICE: API returned error:', result)
      return {
        success: false,
        message: result.error || 'Failed to send email',
        error: result.error
      }
    }

  } catch (error) {
    console.error('❌ EMAIL SERVICE: Request failed:', error)
    return {
      success: false,
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Legacy compatibility classes for existing code
export interface EmailNotificationData {
  serviceName: string
  alertMessage: string
  severity: 'info' | 'warning' | 'error'
  timestamp: string
  recipientEmail: string
  currentValue?: number
  threshold?: number
  metricType?: string
}

export class EmailService {
  private static instance: EmailService
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    console.log('🧪 SENDING TEST EMAIL TO:', recipientEmail)
    
    const emailData: EmailData = {
      to: recipientEmail,
      subject: 'MonitorPro Test Email - Real-time Alert System',
      message: `This is a test email notification sent to ${recipientEmail}. 

If you receive this email, your MonitorPro alert system is working correctly!

This email was sent in real-time using Nodemailer SMTP. You should receive it within seconds of clicking the "Send Test Notification" button.

Key features:
✅ Real-time email delivery
✅ Beautiful HTML templates  
✅ Any email address supported
✅ Instant feedback in the UI
✅ Preview URLs for testing

Your monitoring system is ready to send alerts!`,
      serviceName: 'Test Service',
      severity: 'low'
    }

    const result = await sendEmail(emailData)
    
    if (result.success && result.previewURL) {
      console.log('🔗 Email Preview URL:', result.previewURL)
    }
    
    return result.success
  }

  async sendAlertNotification(data: EmailNotificationData): Promise<boolean> {
    console.log('🚀 SENDING ALERT EMAIL TO:', data.recipientEmail)
    
    const emailData: EmailData = {
      to: data.recipientEmail,
      subject: `[${data.severity.toUpperCase()} ALERT] ${data.serviceName} Monitoring Alert`,
      message: data.alertMessage,
      serviceName: data.serviceName,
      severity: data.severity === 'info' ? 'low' : data.severity === 'warning' ? 'medium' : 'high'
    }

    const result = await sendEmail(emailData)
    return result.success
  }

  async sendThresholdExceededAlert(
    serviceName: string,
    metricType: string,
    currentValue: number,
    threshold: number,
    severity: 'warning' | 'error' = 'warning',
    recipientEmail: string
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: recipientEmail,
      subject: `[${severity.toUpperCase()} ALERT] ${serviceName} Threshold Exceeded`,
      message: `${serviceName} ${metricType} has exceeded the threshold.

Current Value: ${currentValue}${metricType.includes('time') ? 'ms' : '%'}
Threshold: ${threshold}${metricType.includes('time') ? 'ms' : '%'}

Please investigate this issue immediately.`,
      serviceName,
      severity: severity === 'warning' ? 'medium' : 'high'
    }

    const result = await sendEmail(emailData)
    return result.success
  }

  async sendServiceOfflineAlert(serviceName: string, recipientEmail: string): Promise<boolean> {
    const emailData: EmailData = {
      to: recipientEmail,
      subject: `[CRITICAL ALERT] ${serviceName} Service Offline`,
      message: `${serviceName} has gone offline and is not responding to health checks.

This is a critical alert that requires immediate attention. Please investigate the service status and restore functionality as soon as possible.

Time: ${new Date().toLocaleString()}`,
      serviceName,
      severity: 'critical'
    }

    const result = await sendEmail(emailData)
    return result.success
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()

// Export individual functions for direct use
export { sendEmail as default }
