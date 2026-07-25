import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getMailerSettings, isMockEmailMode, sendEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    // 1. Authenticate user
    const payload = await getUserFromRequest(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized admin access required.' },
        { status: 403 }
      );
    }

    const { testEmail } = await req.json();
    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid recipient email address.' },
        { status: 400 }
      );
    }

    const isMock = isMockEmailMode();
    const { host, port, user: userEmail } = getMailerSettings();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 4px solid #f59e0b;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 22px;">SkillsConnect Ghana</h2>
          <span style="color: #10b981; font-size: 14px;">Live Mailer Diagnostics Check</span>
        </div>
        <div style="padding: 24px; line-height: 1.6; color: #334155;">
          <h3 style="color: #0f172a; margin-top: 0;">Congratulations! Your Mailer works. 🎉</h3>
          <p>You received this message because you triggered a live diagnostic check from the SkillsConnect Ghana Admin Dashboard.</p>
          <p>This confirms that your SMTP configurations are 100% active, authenticated, and capable of dispatching verification codes, booking alerts, and transactions to users across Ghana. 🇬🇭</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; border-radius: 4px; font-size: 13px;">
            <strong>Diagnostics Metadata:</strong><br />
            • Mail Server: ${host || 'Mock Sandbox Server'}<br />
            • Mail Port: ${port || 'N/A'}<br />
            • Username: ${userEmail || 'N/A'}<br />
            • Security: ${parseInt(port, 10) === 465 ? 'SSL/TLS' : 'STARTTLS (or None)'}<br />
            • Mode: ${isMock ? 'Mock Mode' : 'Live Delivery Mode'}
          </div>

          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">If this was a live deliverability test, users will now begin receiving verification codes and notifications directly to their inboxes!</p>
        </div>
      </div>
    `;

    // Attempt to send email
    const info = await sendEmail({
      to: testEmail,
      subject: 'SkillsConnect Ghana Live SMTP Mailer Check 🛡️🇬🇭',
      html: htmlContent
    });

    if (isMock) {
      return NextResponse.json({
        success: true,
        mode: 'mock',
        message: 'Diagnostics completed. Since SMTP server environment variables are currently in simulated mode, we emulated successful delivery to your inbox. Please check server console or configure SMTP in AI Studio Settings.'
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'live',
      message: `Success! Test email successfully sent to ${testEmail} using your SMTP credentials. Please check your inbox (and spam folder).`,
      info
    });

  } catch (error) {
    console.error('Test email route error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown SMTP validation error occurred.'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const isMock = isMockEmailMode();
    return NextResponse.json({
      success: true,
      mockMode: isMock
    });
  } catch (error) {
    console.error('SMTP diagnostics GET route error:', error);
    return NextResponse.json({ success: false, error: 'Unable to determine mailer status.' });
  }
}
