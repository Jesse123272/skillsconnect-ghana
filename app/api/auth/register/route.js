import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail, welcomeEmail, verificationEmail } from '@/lib/mailer';
import { sanitizeObject, sanitizeText } from '@/lib/security';
import { validateEmail, validatePassword, validatePhone } from '@/lib/validators';
import { resolveCategorySelection } from '@/lib/category-utils';

export async function POST(req) {
  try {
    let body = {};
    try {
      body = sanitizeObject(await req.json());
    } catch (parseError) {
      console.warn('Registration payload parse failed:', parseError?.message || parseError);
      body = {};
    }

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
      custom_category,
      years_experience,
      bio,
      latitude: rawLatitude,
      longitude: rawLongitude
    } = body;

    const cleanedName = sanitizeText(full_name || '').trim();
    const cleanedEmail = (email || '').trim().toLowerCase();
    const cleanedPhone = (phone || '').trim();
    const cleanedRole = (role || '').trim().toLowerCase();
    const cleanedRegion = sanitizeText(region || '').trim();
    const cleanedDistrict = sanitizeText(district || '').trim();
    const cleanedBio = sanitizeText(bio || '').trim();
    const cleanedCustomCategory = sanitizeText(custom_category || '').trim();
    const latitude = parseFloat(rawLatitude);
    const longitude = parseFloat(rawLongitude);
    const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

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
      if (!cleanedBio) {
        return NextResponse.json(
          { success: false, error: 'Artisans must provide a profile biography' },
          { status: 400 }
        );
      }
      if (!cleanedCustomCategory && !category_id) {
        return NextResponse.json(
          { success: false, error: 'Artisans must provide a trade category or custom specialty' },
          { status: 400 }
        );
      }
      parsedCategoryId = parseInt(category_id, 10);
      parsedYearsExp = parseInt(years_experience, 10);
      if (category_id && isNaN(parsedCategoryId)) {
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

      if (category_id) {
        // Check if category exists
        let catCheck = [];
        try {
          catCheck = await query('SELECT category_id FROM categories WHERE category_id = ? AND is_active = 1', [parsedCategoryId]);
        } catch (categoryError) {
          console.warn('Category validation query failed:', categoryError?.message || categoryError);
        }

        if (!catCheck || catCheck.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Selected trade category is invalid or inactive' },
            { status: 400 }
          );
        }
      }
    }

    // 6. Check unique email
    let emailCheck = [];
    try {
      emailCheck = await query('SELECT user_id FROM users WHERE email = ?', [cleanedEmail]);
    } catch (emailLookupError) {
      console.warn('Email lookup failed during registration:', emailLookupError?.message || emailLookupError);
    }

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
        `INSERT INTO users (full_name, email, phone, password_hash, role, region, district, verification_token, is_verified, is_active, lat, lng) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
        [
          cleanedName,
          cleanedEmail,
          cleanedPhone,
          passwordHash,
          cleanedRole,
          cleanedRegion,
          cleanedDistrict,
          verificationCode,
          hasValidLocation ? latitude : null,
          hasValidLocation ? longitude : null,
        ]
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
        const resolvedCategory = await resolveCategorySelection(query, parsedCategoryId, cleanedCustomCategory);
        await query(
          `INSERT INTO artisan_profiles (user_id, category_id, bio, years_experience, is_approved) 
           VALUES (?, ?, ?, ?, 0)`,
          [userId, resolvedCategory.categoryId, cleanedBio, parsedYearsExp]
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
    console.error('Registration API Error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'We could not complete your registration right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}
