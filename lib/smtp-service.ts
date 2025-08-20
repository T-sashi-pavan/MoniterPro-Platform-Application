// SMTP Email Service for sending real emails
// Note: In production, you'd need to configure environment variables for security

export interface EmailData {
  to: string
  subject: string
  message: string
  serviceName?: string
  severity?: string
}

export class SMTPEmailService {
  
  // Method 1: Try Gmail SMTP (requires app password)
  static async sendViaGmailSMTP(emailData: EmailData): Promise<boolean> {
    try {
      console.log('📧 Attempting Gmail SMTP...')
      
      // This would require the 'nodemailer' package in a real implementation
      // For now, we'll use a REST API approach
      
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">🚨 MonitorPro Alert</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${emailData.serviceName || 'Unknown Service'}</p>
            <p><strong>Severity:</strong> <span style="color: ${emailData.severity === 'critical' ? '#e74c3c' : emailData.severity === 'warning' ? '#f39c12' : '#27ae60'};">${emailData.severity || 'info'}</span></p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin-top: 20px; padding: 15px; background: white; border-left: 4px solid #3498db;">
              ${emailData.message}
            </div>
          </div>
          <p style="color: #7f8c8d; font-size: 12px;">This is an automated alert from your MonitorPro monitoring system.</p>
        </div>
      `

      // Use a Gmail API service (simplified approach)
      return await this.sendViaEmailService(emailData, emailHTML)
      
    } catch (error) {
      console.error('❌ Gmail SMTP failed:', error)
      return false
    }
  }

  // Method 2: Use a reliable email API service
  static async sendViaEmailService(emailData: EmailData, htmlContent?: string): Promise<boolean> {
    try {
      console.log('📧 Trying email service APIs...')

      // Try Resend API (very reliable)
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer re_demo_key' // Demo key - replace with real one
          },
          body: JSON.stringify({
            from: 'alerts@monitorpro.dev',
            to: [emailData.to],
            subject: emailData.subject,
            html: htmlContent || `
              <h2>🚨 MonitorPro Alert</h2>
              <p><strong>Service:</strong> ${emailData.serviceName}</p>
              <p><strong>Message:</strong> ${emailData.message}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            `
          })
        })

        if (resendResponse.ok) {
          console.log('✅ Resend API success!')
          return true
        }
      } catch (resendError) {
        console.log('⚠️ Resend failed:', resendError)
      }

      // Try Mailgun API
      try {
        const mailgunData = new FormData()
        mailgunData.append('from', 'MonitorPro Alerts <alerts@mg.monitorpro.dev>')
        mailgunData.append('to', emailData.to)
        mailgunData.append('subject', emailData.subject)
        mailgunData.append('html', htmlContent || emailData.message)

        const mailgunResponse = await fetch('https://api.mailgun.net/v3/sandbox123.mailgun.org/messages', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa('api:demo-key') // Demo auth
          },
          body: mailgunData
        })

        if (mailgunResponse.ok) {
          console.log('✅ Mailgun API success!')
          return true
        }
      } catch (mailgunError) {
        console.log('⚠️ Mailgun failed:', mailgunError)
      }

      return false
    } catch (error) {
      console.error('❌ Email service failed:', error)
      return false
    }
  }

  // Method 3: Use SMTP.js (browser-based SMTP)
  static async sendViaSMTPJS(emailData: EmailData): Promise<boolean> {
    try {
      console.log('📧 Trying SMTP.js...')
      
      // This would work if SMTP.js library is loaded
      // @ts-ignore
      if (typeof Email !== 'undefined') {
        // @ts-ignore
        const result = await Email.send({
          SecureToken: "your-secure-token", // Would need to be configured
          To: emailData.to,
          From: "alerts@monitorpro.dev",
          Subject: emailData.subject,
          Body: `
            <h2>🚨 MonitorPro Alert</h2>
            <p><strong>Service:</strong> ${emailData.serviceName}</p>
            <p><strong>Severity:</strong> ${emailData.severity}</p>
            <p><strong>Message:</strong> ${emailData.message}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          `
        })
        
        if (result === 'OK') {
          console.log('✅ SMTP.js success!')
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('❌ SMTP.js failed:', error)
      return false
    }
  }

  // Master method to try all SMTP approaches
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    console.log('🚀 SMTP SERVICE: Attempting to send real email to:', emailData.to)

    // Try multiple methods in order
    const methods = [
      () => this.sendViaEmailService(emailData),
      () => this.sendViaGmailSMTP(emailData),
      () => this.sendViaSMTPJS(emailData)
    ]

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`📧 Trying SMTP method ${i + 1}...`)
        const success = await methods[i]()
        if (success) {
          console.log(`✅ SMTP method ${i + 1} succeeded!`)
          return true
        }
      } catch (error) {
        console.log(`⚠️ SMTP method ${i + 1} failed:`, error)
      }
    }

    console.log('❌ All SMTP methods failed')
    return false
  }
}
