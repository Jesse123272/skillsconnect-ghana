import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail, welcomeEmail, verificationEmail } from '@/lib/mailer';
import { sanitizeObject, sanitizeText } from '@/lib/security';
import { validateEmail, validatePassword, validatePhone } from '@/lib/validators';

export async function POST(req) {
  try {
    const body = sanitizeObject(await req.json());
    const {
      full_name,
      email,
      phone,
      password,
      confirm_password,
      role,
      region,
      district,
      category_id,
      years_experience,
      bio
    } = body;

    const cleanedName = sanitizeText(full_name || '').trim();
    const cleanedEmail = (email || '').trim().toLowerCase();
    const cleanedPhone = (phone || '').trim();
    const cleanedRole = (role || '').trim().toLowerCase();
    const cleanedRegion = sanitizeText(region || '').trim();
    const cleanedDistrict = sanitizeText(district || '').trim();
    const cleanedBio = sanitizeText(bio || '').trim();

    // 1. Basic inputs validation
    if (!cleanedName || !cleanedEmail || !cleanedPhone || !password || !confirm_password || !cleanedRole || !cleanedRegion || !cleanedDistrict) {
      return NextResponse.json(
        { success: false, error: 'All primary registration fields are required' },
        { status: 400 }
      );
    }

    // 2. Validate role
    if (cleanedRole !== 'customer' && cleanedRole !== 'artisan') {
      return NextResponse.json(
        { success: false, error: 'Role must be either customer or artisan' },
        { status: 400 }
      );
    }

    // 3. Validate email, phone, and password strength
    if (!validateEmail(cleanedEmail)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!validatePhone(cleanedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be in the format +233XXXXXXXXX (9 digits after the country code)' },
        { status: 400 }
      );
    }

    // 4. Validate passwords match
    if (password !== confirm_password) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ success: false, error: passwordCheck.message }, { status: 400 });
    }

    // 5. Artisan specific validation
    let parsedCategoryId = null;
    let parsedYearsExp = 0;
    if (cleanedRole === 'artisan') {
      if (!category_id || !cleanedBio) {
        return NextResponse.json(
          { success: false, error: 'Artisans must provide a trade category and profile biography' },
          { status: 400 }
        );
      }
      parsedCategoryId = parseInt(category_id, 10);
      parsedYearsExp = parseInt(years_experience, 10);
      if (isNaN(parsedCategoryId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid category selection' },
          { status: 400 }
        );
      }
      if (isNaN(parsedYearsExp) || parsedYearsExp < 0) {
        return NextResponse.json(
          { success: false, error: 'Years of experience must be a non-negative number' },
          { status: 400 }
        );
      }

      // Check if category exists
      const catCheck = await query('SELECT category_id FROM categories WHERE category_id = ? AND is_active = 1', [parsedCategoryId]);
      if (!catCheck || catCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Selected trade category is invalid or inactive' },
          { status: 400 }
        );
      }
    }

    // 6. Check unique email
    const emailCheck = await query('SELECT user_id FROM users WHERE email = ?', [cleanedEmail]);
    if (emailCheck && emailCheck.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    // 7. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    let userId = null;
    try {
      const userResult = await query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, region, district, verification_token, is_verified, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
        [cleanedName, cleanedEmail, cleanedPhone, passwordHash, cleanedRole, cleanedRegion, cleanedDistrict, verificationCode]
      );
      userId = userResult?.insertId || null;
    } catch (dbError) {
      console.error('User registration insert failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'We could not create your account because the database rejected the registration request.' },
        { status: 500 }
      );
    }

    if (cleanedRole === 'artisan' && userId) {
      try {
        await query(
          `INSERT INTO artisan_profiles (user_id, category_id, bio, years_experience, is_approved) 
           VALUES (?, ?, ?, ?, 0)`,
          [userId, parsedCategoryId, cleanedBio, parsedYearsExp]
        );
      } catch (profileError) {
        console.warn('Artisan profile insert failed:', profileError?.message || profileError);
      }
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    try {
      await query(
        'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [userId, 'USER_REGISTER', 'users', userId, ip]
      );
    } catch (logError) {
      console.warn('Activity log insert failed:', logError?.message || logError);
    }

    try {
      const emailHtml = verificationEmail(cleanedName, verificationCode);
      await sendEmail({
        to: cleanedEmail,
        subject: 'Verify your SkillsConnect Ghana Account 🛡️',
        html: emailHtml
      });
    } catch (emailError) {
      console.warn('Verification email sending failed:', emailError?.message || emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        email: cleanedEmail,
        role: cleanedRole
      }
    });

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred during registration' },
      { status: 500 }
    );
  }
}
