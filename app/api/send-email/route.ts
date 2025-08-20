import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface EmailRequest {
  to: string
  subject: string
  message: string
  serviceName?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Email API is working!',
    timestamp: new Date().toISOString(),
    status: 'operational'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    console.log('📧 Email API called with:', { 
      to: body.to, 
      subject: body.subject,
      serviceName: body.serviceName 
    })

    // Validate required fields
    if (!body.to || !body.subject || !body.message) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: to, subject, message' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.to)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid email address format' 
      }, { status: 400 })
    }

    console.log('📧 Sending email to:', body.to)

    // Create Nodemailer transporter
    let transporter: nodemailer.Transporter

    // Check if we have custom SMTP settings
    if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.ethereal.email') {
      // Use custom SMTP settings from environment
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      // Use Ethereal Email for testing (auto-generates credentials)
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    }

    // Verify transporter
    await transporter.verify()
    console.log('📧 SMTP connection verified')

    // Create severity color mapping
    const severityColors = {
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e67e22',
      critical: '#e74c3c'
    }
    const severityColor = severityColors[body.severity || 'medium']

    // Create HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MonitorPro Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚨 MonitorPro Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">System Monitoring Notification</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      
      <!-- Alert Header -->
      <div style="display: flex; align-items: center; margin-bottom: 25px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 6px solid ${severityColor};">
        <div style="flex: 1;">
          <h2 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 20px;">${body.serviceName || 'Service Alert'}</h2>
          <span style="color: ${severityColor}; font-weight: bold; text-transform: uppercase; font-size: 12px; padding: 4px 8px; background-color: ${severityColor}20; border-radius: 4px;">
            ${body.severity || 'info'} Alert
          </span>
        </div>
      </div>
      
      <!-- Message -->
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
        <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">Alert Message:</h3>
        <p style="margin: 0; color: #6c757d; line-height: 1.6; font-size: 15px;">${body.message}</p>
      </div>
      
      <!-- Details -->
      <div style="margin: 25px 0; padding-top: 20px; border-top: 2px solid #e9ecef;">
        <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 16px;">Alert Details:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-weight: bold; width: 120px;">Time:</td>
            <td style="padding: 8px 0; color: #495057;">${new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Service:</td>
            <td style="padding: 8px 0; color: #495057;">${body.serviceName || 'Test Service'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Severity:</td>
            <td style="padding: 8px 0; color: ${severityColor}; font-weight: bold; text-transform: uppercase;">${body.severity || 'info'}</td>
          </tr>
        </table>
      </div>
      
      <!-- Call to Action -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="display: inline-block; background-color: ${severityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
          View Dashboard
        </a>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="margin: 0; color: #6c757d; font-size: 12px;">
        This is an automated alert from your MonitorPro monitoring system.
      </p>
      <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
        Visit your dashboard to view more details and manage alerts.
      </p>
    </div>
    
  </div>
</body>
</html>
    `

    // Create plain text version
    const textContent = `
MonitorPro Alert: ${body.serviceName || 'Service Alert'}

Severity: ${body.severity || 'info'}
Time: ${new Date().toLocaleString()}

Message:
${body.message}

This is an automated alert from your MonitorPro monitoring system.
Visit your dashboard to view more details and manage alerts.
    `

    // Send email
    const mailOptions = {
      from: '"MonitorPro Alerts" <alerts@monitorpro.dev>',
      to: body.to,
      subject: body.subject,
      html: htmlContent,
      text: textContent
    }

    const result = await transporter.sendMail(mailOptions)
    const previewURL = nodemailer.getTestMessageUrl(result)

    console.log('✅ Email sent successfully!')
    console.log('📧 Message ID:', result.messageId)
    if (previewURL) {
      console.log('📧 Preview URL:', previewURL)
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${body.to}`,
      recipient: body.to,
      messageId: result.messageId,
      previewURL: previewURL,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Email API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
