import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';

async function getAdminContactEmail() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await query(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['contact_email']
    );

    if (result && result.length > 0 && result[0].setting_value) {
      return result[0].setting_value;
    }
  } catch (err) {
    console.warn('Failed to retrieve contact email from system settings:', err);
  }

  return process.env.EMAIL_USER || 'support@skillsconnectgh.com';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // 1. Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: 'Subject is required' }, { status: 400 });
    }
    if (!message || !message.trim() || message.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Message must be at least 10 characters long' }, { status: 400 });
    }

    // 2. Ensure self-healing DB schema (create table contact_messages if not exists)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
          message_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (schemaErr) {
      console.warn("Table contact_messages initialization warning (might already exist):", schemaErr);
    }

    // 3. Insert contact message
    const insertResult = await query(
      `INSERT INTO contact_messages (name, email, subject, message) 
       VALUES (?, ?, ?, ?)`,
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    const messageId = insertResult.insertId;

    // 4. Send a copy to admin contact email
    const adminEmail = await getAdminContactEmail();
    try {
      await sendEmail({
        to: adminEmail,
        subject: `[SkillsConnect Feedback] ${subject.trim()}`,
        html: `
          <h2>New feedback received from the website</h2>
          <p><strong>Name:</strong> ${name.trim()}</p>
          <p><strong>Email:</strong> ${email.trim()}</p>
          <p><strong>Subject:</strong> ${subject.trim()}</p>
          <p><strong>Message:</strong></p>
          <p>${message.trim().replace(/\n/g, '<br/>')}</p>
          <hr />
          <p>This message was submitted through the SkillsConnect Ghana contact page.</p>
        `
      });
    } catch (emailError) {
      console.warn('Contact feedback email delivery failure:', emailError);
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      data: {
        message_id: messageId,
        message: 'Your message has been successfully recorded. Thank you!'
      }
    });

  } catch (error) {
    console.error('Contact Form API Exception:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while sending your message' },
      { status: 500 }
    );
  }
}
