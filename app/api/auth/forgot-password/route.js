import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    // 1. Validate email input
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // 2. SELECT user by email
    const users = await query('SELECT user_id, full_name, email FROM users WHERE email = ?', [email]);

    // Mask response: always return success message even if email doesn't exist
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

    if (!users || users.length === 0) {
      return successResponse;
    }

    const user = users[0];

    // 3. Generate reset token: crypto.randomBytes(32).toString('hex')
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Store hashed token and expiry (1 hour from now) as 'hash:expiry'
    const expiry = Date.now() + 3600000; // 1 hour in ms
    const resetTokenValue = `${hashedToken}:${expiry}`;

    // 4. Store in users.reset_token
    await query('UPDATE users SET reset_token = ? WHERE user_id = ?', [resetTokenValue, user.user_id]);

    // 5. Send reset email via mailer
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - SkillsConnect Ghana</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f9f9f9; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
          .button { display: inline-block; padding: 12px 24px; margin: 20px 0; font-weight: bold; color: #1e293b; background-color: #f59e0b; text-decoration: none; border-radius: 6px; }
          .footer { margin-top: 30px; font-size: 12px; color: #777777; border-top: 1px solid #e0e0e0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #1e293b;">Password Reset Request</h2>
          <p>Hello ${user.full_name},</p>
          <p>We received a request to reset your password for your SkillsConnect Ghana account. Click the button below to set a new password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button" target="_blank">Reset Password</a>
          </p>
          <p>This password reset link will expire in 1 hour. If you did not request this password reset, please ignore this email.</p>
          <div class="footer">
            <p>Best regards,<br>The SkillsConnect Ghana Team</p>
            <p>If you're having trouble clicking the password reset button, copy and paste the URL below into your web browser:</p>
            <p style="word-break: break-all; color: #f59e0b;">${resetLink}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your SkillsConnect Ghana password 🔐',
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Password reset email sending failed:', emailError);
      // We still return success to the client so as not to leak any detail or break the masked response
    }

    return successResponse;

  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred' },
      { status: 500 }
    );
  }
}
