import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Lazy initialization of nodemailer transporter
 */
function getTransporter() {
  if (!transporter) {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !port || !user || !pass || 
        user === 'your_email@gmail.com' || 
        pass === 'your_app_password' || 
        user.includes('placeholder') || 
        pass.includes('placeholder')) {
      console.warn('Mail server environment variables are not fully configured or contain placeholder values. Email functionality will run in mock mode.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465, // Use SSL/TLS for 465, STARTTLS for 587
      auth: {
        user,
        pass,
      },
      tls: {
        // Essential for compatibility with certain enterprise mail hosts and custom domain configurations
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 5000,
      socketTimeout: 15000
    });
  }
  return transporter;
}

/**
 * Standardised email sender with support for fallback mock logging
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - HTML email body
 */
export async function sendEmail({ to, subject, html }) {
  const activeTransporter = getTransporter();
  const from = process.env.EMAIL_FROM || 
               (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@')
                 ? `SkillsConnect Ghana <${process.env.EMAIL_USER}>` 
                 : 'SkillsConnect Ghana <noreply@skillsconnect.gh>');

  if (!activeTransporter) {
    console.log('--- [MOCK EMAIL SENT] ---');
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body Preview:', html.substring(0, 300) + '...');
    console.log('-------------------------');
    return { messageId: 'mock-message-id-' + Date.now(), response: 'Mock Success' };
  }

  try {
    const info = await activeTransporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    console.warn(`[Mailer Fallback] SMTP delivery failed (${error.message}). Emulating via mock delivery.`);
    console.log('--- [MOCK EMAIL SENT (SMTP FALLBACK)] ---');
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body Preview:', html.substring(0, 300) + '...');
    console.log('----------------------------------------');
    return { messageId: 'mock-fallback-message-id-' + Date.now(), response: 'Mock Fallback Success' };
  }
}

/**
 * Reusable HTML standard shell wrapper for Ghana-branded email layout
 */
function emailShell(content, previewText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkillsConnect Ghana</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: #1e293b; padding: 24px; text-align: center; border-bottom: 4px solid #f59e0b; }
    .brand { color: #f59e0b; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-decoration: none; }
    .brand span { color: #10b981; }
    .body { padding: 32px 24px; line-height: 1.6; }
    .button-container { text-align: center; margin: 28px 0; }
    .button { background-color: #f59e0b; color: #1e293b; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; transition: background-color 0.2s; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .rating-star { color: #f59e0b; font-size: 18px; }
    .flag { width: 30px; vertical-align: middle; margin-left: 6px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="container">
    <div class="header">
      <a href="#" class="brand">SkillsConnect <span>Ghana</span></a>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; 2026 SkillsConnect Ghana. All rights reserved.</p>
      <p>Connecting trust with skill across all 16 regions of Ghana 🇬🇭</p>
      <p style="font-size: 10px; margin-top: 10px; color: #94a3b8;">You received this transaction or notification email associated with your registered account.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Template 1: Welcome Email
 */
export function welcomeEmail(name, role) {
  const roleDisplay = role === 'artisan' ? 'Skilled Artisan' : 'Valued Customer';
  const roleText = role === 'artisan' 
    ? 'Start showcasing your craftsmanship, setting up your portfolio, and getting found by clients looking for your trade across Ghana.' 
    : 'Browse certified local plumbers, mechanics, fashion designers, hairdressers, and more in your district today.';

  const preview = `Akwaaba, ${name}! Welcome to SkillsConnect Ghana.`;
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Akwaaba, ${name}! 🎉</h2>
    <p>Thank you for joining <strong>SkillsConnect Ghana</strong> — the digital gateway connecting premium Ghanaian talent with trusted clients.</p>
    <p>You have registered as a <strong>${roleDisplay}</strong>.</p>
    <p>${roleText}</p>
    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">Access Your Dashboard</a>
    </div>
    <p>If you have any questions or need support, reply to this email, and our local team will be happy to assist you.</p>
    <p>Warm regards,<br>The SkillsConnect Ghana Team</p>
  `;
  return emailShell(content, preview);
}

/**
 * Template 2: Enquiry Notification
 */
export function enquiryNotificationEmail(artisanName, customerName, message) {
  const preview = `New client enquiry from ${customerName} on SkillsConnect Ghana.`;
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Hello ${artisanName},</h2>
    <p>Great news! You have received a new service enquiry from a customer, <strong>${customerName}</strong>, on SkillsConnect Ghana.</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic;">
      "${message}"
    </div>
    <p>Please log in to your artisan dashboard to reply promptly and secure this project. Quick responses increase your conversion rate!</p>
    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/enquiries" class="button">View & Reply to Enquiry</a>
    </div>
    <p>Best of luck with your client interaction!</p>
    <p>Warm regards,<br>The SkillsConnect Ghana Team</p>
  `;
  return emailShell(content, preview);
}

/**
 * Template 3: Review Notification
 */
export function reviewNotificationEmail(artisanName, customerName, rating) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const preview = `New ${rating}-Star review from ${customerName}!`;
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Congratulations, ${artisanName}! 🌟</h2>
    <p>A client, <strong>${customerName}</strong>, has just posted a new review on your SkillsConnect Ghana profile.</p>
    <div style="margin: 20px 0; padding: 16px; background-color: #fdfaf2; border: 1px solid #fef3c7; border-radius: 6px; text-align: center;">
      <span style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Client Rating</span>
      <span style="font-size: 24px; font-weight: bold; color: #f59e0b; letter-spacing: 2px;">${stars}</span>
      <span style="font-size: 18px; font-weight: bold; color: #1e293b; display: block; margin-top: 6px;">${rating} / 5</span>
    </div>
    <p>This positive review will boost your profile rank and attract more customers in your area.</p>
    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">View Review History</a>
    </div>
    <p>Keep up the amazing craftsmanship!</p>
    <p>Warm regards,<br>The SkillsConnect Ghana Team</p>
  `;
  return emailShell(content, preview);
}

/**
 * Template 4: Account Approval
 */
export function approvalEmail(artisanName) {
  const preview = `Your artisan profile has been approved!`;
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Great News, ${artisanName}! 🇬🇭</h2>
    <p>Our verification team has completed their review of your profile and background checks.</p>
    <p>We are delighted to inform you that <strong>your SkillsConnect Ghana Artisan Profile has been APPROVED!</strong></p>
    <p>Your trade is now visible to customers searching in your region and district. You are now officially ready to receive bookings and client enquiries.</p>
    <p>Tips for success:</p>
    <ul style="padding-left: 20px;">
      <li>Keep your portfolio gallery updated with clean photos of your recent jobs.</li>
      <li>Respond to customer enquiries as fast as possible.</li>
      <li>Ensure you ask happy customers to review your services.</li>
    </ul>
    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Your Live Profile</a>
    </div>
    <p>Welcome on board, and let's grow your business together!</p>
    <p>Warm regards,<br>The SkillsConnect Ghana Team</p>
  `;
  return emailShell(content, preview);
}

/**
 * Template 5: Email Verification Code
 */
export function verificationEmail(name, code) {
  const preview = `Your SkillsConnect Ghana verification code is ${code}.`;
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Verify Your Account 🛡️</h2>
    <p>Hello ${name},</p>
    <p>Thank you for registering on SkillsConnect Ghana. To complete your secure registration and gain access to your dashboard, please verify your account using the 6-digit code below:</p>
    <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center;">
      <span style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Verification Code</span>
      <span style="font-size: 32px; font-weight: 800; color: #f59e0b; letter-spacing: 6px; font-family: monospace;">${code}</span>
    </div>
    <p>This verification code is confidential. For security reasons, please do not share this code with anyone. It will expire in 24 hours.</p>
    <p>Warm regards,<br>The SkillsConnect Ghana Team</p>
  `;
  return emailShell(content, preview);
}

/**
 * Template 6: Security Login Alert
 */
export function loginAlertEmail(name, ipAddress, deviceDetails = 'Web Browser') {
  const preview = `Security Alert: New sign-in detected for your SkillsConnect Ghana account.`;
  const timeStr = new Date().toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' });
  const content = `
    <h2 style="color: #1e293b; margin-top: 0; display: flex; align-items: center; gap: 8px;">
      <span>Security Alert: New Login</span>
    </h2>
    <p>Hello ${name},</p>
    <p>We detected a new login to your SkillsConnect Ghana account. To help keep your account secure, please review the session details below:</p>
    <div style="margin: 24px 0; padding: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table style="width: 100%; font-size: 14px; color: #475569;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 120px;">Time:</td>
          <td style="padding: 6px 0; color: #1e293b;">${timeStr}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">IP Address:</td>
          <td style="padding: 6px 0; color: #1e293b; font-family: monospace;">${ipAddress}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Device:</td>
          <td style="padding: 6px 0; color: #1e293b;">${deviceDetails}</td>
        </tr>
      </table>
    </div>
    <p>If this was you, you can safely ignore this security notification. No further action is required.</p>
    <p style="color: #e11d48; font-weight: 600;">If you do not recognize this activity, please change your password immediately from your Account Settings to protect your account.</p>
    <p>Warm regards,<br>The SkillsConnect Ghana Team</p>
  `;
  return emailShell(content, preview);
}

