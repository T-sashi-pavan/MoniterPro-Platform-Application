// app/api/send-alert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, timestamp } = await request.json();

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, or message' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create SMTP transporter using Brevo configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.SENDER_EMAIL || 'PollGen Team <sessi111111@gmail.com>',
      to: to,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .alert-container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
            .alert-header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .alert-content { padding: 15px; }
            .alert-footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
            .timestamp { color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="alert-container">
            <div class="alert-header">
              <h2>🚨 Monitoring Platform Alert</h2>
            </div>
            <div class="alert-content">
              <p>${message.replace(/\n/g, '<br>')}</p>
              <p class="timestamp">Generated: ${new Date(timestamp || Date.now()).toLocaleString()}</p>
            </div>
            <div class="alert-footer">
              <p>This is an automated alert from your Monitoring Platform.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${message}\n\nGenerated: ${new Date(timestamp || Date.now()).toLocaleString()}\n\nThis is an automated alert from your Monitoring Platform.`,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Alert email sent successfully'
    });

  } catch (error) {
    console.error('Error sending alert email:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send alert email',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}