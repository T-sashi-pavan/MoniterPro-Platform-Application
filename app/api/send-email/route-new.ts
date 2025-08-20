import { NextRequest, NextResponse } from 'next/server'

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

    // Method 2: Simple email logging for testing
    console.log('📧 Email would be sent to:', body.to)
    console.log('📧 Subject:', body.subject)
    console.log('📧 Message:', body.message)
    
    return NextResponse.json({ 
      success: true,
      method: 'Console Logging (Fallback)',
      message: `Email logged for ${body.to} - check console`,
      recipient: body.to,
      timestamp: new Date().toISOString(),
      note: 'This is a fallback method. Check console for email details.'
    })

  } catch (error) {
    console.error('📧 Email API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
