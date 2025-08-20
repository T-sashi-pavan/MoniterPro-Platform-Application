import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  return NextResponse.json({ 
    message: 'Email API is working!',
    timestamp: new Date().toISOString(),
    status: 'operational'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Email API called with:', body)

    // Validate required fields
    if (!body.to || !body.subject || !body.message) {
      return NextResponse.json({ 
        error: 'Missing required fields: to, subject, message' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.to)) {
      return NextResponse.json({ 
        error: 'Invalid email address format' 
      }, { status: 400 })
    }

    console.log('📧 ATTEMPTING TO SEND REAL EMAIL TO:', body.to)

    // Method 1: Try Web3Forms API (very reliable and free)
    try {
      console.log('📧 Trying Web3Forms API...')
      
      const web3FormsData = new FormData()
      web3FormsData.append('access_key', 'c1351d93-2cc5-4cfd-9dc4-5dd89d24d9bc')
      web3FormsData.append('subject', body.subject)
      web3FormsData.append('email', body.to)
      web3FormsData.append('name', 'MonitorPro Alert System')
      web3FormsData.append('message', `
🚨 MonitorPro Alert Notification

Service: ${body.serviceName || 'Test Service'}
Severity: ${body.severity || 'info'}
Time: ${new Date().toLocaleString()}

Alert Message:
${body.message}

${body.currentValue ? `Current Value: ${body.currentValue}` : ''}
${body.threshold ? `Threshold: ${body.threshold}` : ''}
${body.metricType ? `Metric Type: ${body.metricType}` : ''}

This is an automated alert from your MonitorPro monitoring system.
Visit your dashboard to view more details and manage alerts.
      `)

      const web3FormsResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: web3FormsData
      })

      const web3FormsResult = await web3FormsResponse.json()
      console.log('📧 Web3Forms response:', web3FormsResult)

      if (web3FormsResponse.ok && web3FormsResult.success) {
        console.log('✅ Web3Forms sent successfully!')
        return NextResponse.json({ 
          success: true,
          method: 'Web3Forms API',
          message: `Real email sent to ${body.to} via Web3Forms`,
          recipient: body.to,
          timestamp: new Date().toISOString()
        })
      }
    } catch (web3FormsError) {
      console.log('⚠️ Web3Forms failed:', web3FormsError)
    }

    // Method 2: Try Ethereal Email (testing service that creates real preview)
    try {
      console.log('📧 Trying Ethereal Email (test service)...')
      
      // Create test account (this creates a real test email account)
      const testAccount = await nodemailer.createTestAccount()
      
      const etherealTransporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🚨 MonitorPro Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">System Monitoring Notification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <div style="width: 8px; height: 40px; background: ${body.severity === 'critical' ? '#e74c3c' : body.severity === 'warning' ? '#f39c12' : '#27ae60'}; margin-right: 15px; border-radius: 4px;"></div>
                <div>
                  <h2 style="margin: 0; color: #2c3e50; font-size: 20px;">${body.serviceName || 'Service Alert'}</h2>
                  <span style="color: ${body.severity === 'critical' ? '#e74c3c' : body.severity === 'warning' ? '#f39c12' : '#27ae60'}; font-weight: bold; text-transform: uppercase; font-size: 12px;">${body.severity || 'info'} Alert</span>
                </div>
              </div>
              
              <div style="background: #ecf0f1; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #2c3e50; line-height: 1.6;">${body.message}</p>
              </div>
              
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                <p style="margin: 5px 0; color: #7f8c8d; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p style="margin: 5px 0; color: #7f8c8d; font-size: 14px;"><strong>Service:</strong> ${body.serviceName || 'Test Service'}</p>
                ${body.currentValue ? `<p style="margin: 5px 0; color: #7f8c8d; font-size: 14px;"><strong>Current Value:</strong> ${body.currentValue}</p>` : ''}
                ${body.threshold ? `<p style="margin: 5px 0; color: #7f8c8d; font-size: 14px;"><strong>Threshold:</strong> ${body.threshold}</p>` : ''}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #7f8c8d; font-size: 12px; margin: 0;">This is an automated alert from your MonitorPro monitoring system.</p>
              <p style="color: #7f8c8d; font-size: 12px; margin: 5px 0 0 0;">Visit your dashboard to view more details and manage alerts.</p>
            </div>
          </div>
        </div>
      `

      const mailOptions = {
        from: '"MonitorPro Alerts" <alerts@monitorpro.dev>',
        to: body.to,
        subject: body.subject,
        html: htmlContent,
        text: `
MonitorPro Alert: ${body.serviceName || 'Service Alert'}

Severity: ${body.severity || 'info'}
Message: ${body.message}
Time: ${new Date().toLocaleString()}
${body.currentValue ? `Current Value: ${body.currentValue}` : ''}
${body.threshold ? `Threshold: ${body.threshold}` : ''}

This is an automated alert from your MonitorPro monitoring system.
        `
      }

      const etherealResult = await etherealTransporter.sendMail(mailOptions)
      const previewURL = nodemailer.getTestMessageUrl(etherealResult)
      
      console.log('✅ Ethereal Email sent successfully!')
      console.log('📧 Preview URL:', previewURL)
      
      return NextResponse.json({ 
        success: true,
        method: 'Ethereal Email (Test Service)',
        message: `Test email sent to ${body.to} via Ethereal Email`,
        recipient: body.to,
        messageId: etherealResult.messageId,
        previewURL: previewURL,
        note: 'This is a test email service. Check the preview URL to see the email.',
        timestamp: new Date().toISOString()
      })

    } catch (etherealError) {
      console.log('⚠️ Ethereal Email failed:', etherealError)
    }

    // Method 3: Try FormSubmit (free email forwarding)
    try {
      console.log('📧 Trying FormSubmit...')
      
      const formData = new FormData()
      formData.append('_to', body.to)
      formData.append('_subject', body.subject)
      formData.append('_template', 'table')
      formData.append('_next', 'https://monitorpro.dev/thanks')
      formData.append('Service', body.serviceName || 'Test Service')
      formData.append('Severity', body.severity || 'info')
      formData.append('Message', body.message)
      formData.append('Time', new Date().toLocaleString())
      if (body.currentValue) formData.append('Current Value', body.currentValue)
      if (body.threshold) formData.append('Threshold', body.threshold)

      const formSubmitResponse = await fetch('https://formsubmit.co/ajax/' + body.to, {
        method: 'POST',
        body: formData
      })

      if (formSubmitResponse.ok) {
        const result = await formSubmitResponse.json()
        console.log('✅ FormSubmit sent successfully!', result)
        return NextResponse.json({ 
          success: true,
          method: 'FormSubmit',
          message: `Real email sent to ${body.to} via FormSubmit`,
          recipient: body.to,
          timestamp: new Date().toISOString()
        })
      }
    } catch (formSubmitError) {
      console.log('⚠️ FormSubmit failed:', formSubmitError)
    }

    // Method 4: Try your EmailJS service (with fixed payload)
    try {
      console.log('📧 Trying your EmailJS service...')
      
      const yourEmailJSPayload = {
        service_id: 'service_vzl70yr',
        template_id: 'template_hgqsf0u', 
        user_id: '5qTWcx4IWIcC7ZczU',
        template_params: {
          to_email: body.to,
          from_name: 'MonitorPro Alert System',
          subject: body.subject,
          service_name: body.serviceName || 'Test Service',
          alert_message: body.message,
          severity: body.severity || 'info',
          timestamp: new Date().toLocaleString(),
          current_value: body.currentValue || 'N/A',
          threshold: body.threshold || 'N/A',
          metric_type: body.metricType || 'Test'
        }
      }

      const yourEmailJSResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(yourEmailJSPayload)
      })

      if (yourEmailJSResponse.ok) {
        console.log('✅ Your EmailJS sent successfully!')
        return NextResponse.json({ 
          success: true,
          method: 'Your EmailJS',
          message: `Real email sent to ${body.to} via your EmailJS`,
          recipient: body.to,
          timestamp: new Date().toISOString()
        })
      } else {
        const errorData = await yourEmailJSResponse.text()
        console.log('❌ Your EmailJS error response:', errorData)
      }
    } catch (yourEmailJSError) {
      console.log('⚠️ Your EmailJS failed:', yourEmailJSError)
    }

    // If all methods fail, return error
    console.log('❌ All email methods failed')
    return NextResponse.json({ 
      success: false,
      error: 'All email sending methods failed',
      recipient: body.to,
      timestamp: new Date().toISOString(),
      attempted_methods: ['Web3Forms API', 'Ethereal Email', 'FormSubmit', 'Your EmailJS'],
      note: 'Please check the console for detailed error logs.'
    }, { status: 500 })

  } catch (error) {
    console.error('📧 Email API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
