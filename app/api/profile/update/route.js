import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest, clearAuthCookie } from '@/lib/auth';
import { sanitizeObject, sanitizeText } from '@/lib/security';
import { validateEmail, validatePhone } from '@/lib/validators';
import { resolveCategorySelection } from '@/lib/category-utils';

export async function PUT(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = sanitizeObject(await req.json());
    const {
      full_name,
      email,
      phone,
      region,
      district,
      profile_photo,
      category_id,
      custom_category,
      years_experience,
      starting_price,
      bio,
      service_areas
    } = body;

    const cleanedName = sanitizeText(full_name || '').trim();
    const cleanedEmail = (email || '').trim().toLowerCase();
    const cleanedPhone = (phone || '').trim();
    const cleanedRegion = sanitizeText(region || '').trim();
    const cleanedDistrict = sanitizeText(district || '').trim();
    const cleanedBio = sanitizeText(bio || '').trim();
    const cleanedCustomCategory = sanitizeText(custom_category || '').trim();
    const parsedStartingPrice = starting_price === '' || starting_price === null || starting_price === undefined
      ? null
      : Number(starting_price);

    // 1. Validate primary fields
    if (!cleanedName || !cleanedEmail || !cleanedPhone || !cleanedRegion || !cleanedDistrict) {
      return NextResponse.json(
        { success: false, error: 'Primary profile details are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(cleanedEmail)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // 2. Validate phone number (+233 format)
    if (!validatePhone(cleanedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be in the format +233XXXXXXXXX' },
        { status: 400 }
      );
    }

    if (parsedStartingPrice !== null && (!Number.isFinite(parsedStartingPrice) || parsedStartingPrice < 0)) {
      return NextResponse.json({ success: false, error: 'Starting price must be a valid non-negative amount.' }, { status: 400 });
    }

    // 3. Email collision check excluding the current user
    const emailCheck = await query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [cleanedEmail, payload.user_id]
    );
    if (emailCheck && emailCheck.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This email address is already registered to another account' },
        { status: 400 }
      );
    }

    // 4. Update core users fields
    await query(
      `UPDATE users 
           SET full_name = ?, email = ?, phone = ?, region = ?, district = ?, profile_photo = ? 
       WHERE user_id = ?`,
      [cleanedName, cleanedEmail, cleanedPhone, cleanedRegion, cleanedDistrict, profile_photo || null, payload.user_id]
    );

    // 5. If artisan, handle optional artisan_profiles updates
    if (payload.role === 'artisan') {
      if (!cleanedBio) {
        return NextResponse.json(
          { success: false, error: 'Biography is required for artisans' },
          { status: 400 }
        );
      }

      if (!cleanedCustomCategory && !category_id) {
        return NextResponse.json(
          { success: false, error: 'Trade category or custom specialty is required for artisans' },
          { status: 400 }
        );
      }

      const parsedYearsExp = parseInt(years_experience, 10);
      if (isNaN(parsedYearsExp) || parsedYearsExp < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid years of experience' },
          { status: 400 }
        );
      }

      let parsedCatId = null;
      if (category_id) {
        parsedCatId = parseInt(category_id, 10);
        if (isNaN(parsedCatId)) {
          return NextResponse.json(
            { success: false, error: 'Invalid trade category' },
            { status: 400 }
          );
        }

        // Verify category exists
        const categoryCheck = await query(
          'SELECT category_id FROM categories WHERE category_id = ? AND is_active = 1',
          [parsedCatId]
        );
        if (!categoryCheck || categoryCheck.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Selected category is invalid or inactive' },
            { status: 400 }
          );
        }
      }

      // Format service coverage areas (either array or comma-delimited string)
      let flattenedAreas = '';
      if (Array.isArray(service_areas)) {
        flattenedAreas = service_areas.join(', ');
      } else if (typeof service_areas === 'string') {
        flattenedAreas = service_areas;
      }

      // Check if artisan profile row already exists (upsert logic for safety)
      const profileCheck = await query(
        'SELECT profile_id FROM artisan_profiles WHERE user_id = ?',
        [payload.user_id]
      );

      const resolvedCategory = await resolveCategorySelection(query, parsedCatId, cleanedCustomCategory);

      if (profileCheck && profileCheck.length > 0) {
        await query(
          `UPDATE artisan_profiles 
           SET category_id = ?, bio = ?, years_experience = ?, starting_price = ?, service_areas = ? 
           WHERE user_id = ?`,
          [resolvedCategory.categoryId, cleanedBio, parsedYearsExp, parsedStartingPrice, flattenedAreas.trim(), payload.user_id]
        );
      } else {
        const initialApprovalState = await getInitialArtisanApprovalState(query);
        await query(
          `INSERT INTO artisan_profiles (user_id, category_id, bio, years_experience, starting_price, service_areas, is_approved) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payload.user_id, resolvedCategory.categoryId, cleanedBio, parsedYearsExp, parsedStartingPrice, flattenedAreas.trim(), initialApprovalState]
        );
      }
    }

    // 6. Log the action to activity_logs table
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'UPDATE_PROFILE', 'users', payload.user_id, ip]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update Profile API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while updating your profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Deactivate user in database
    await query('UPDATE users SET is_active = 0 WHERE user_id = ?', [payload.user_id]);

    // Log the deactivation action
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [payload.user_id, 'DEACTIVATE_ACCOUNT', 'users', payload.user_id, ip]
    );

    const response = NextResponse.json({
      success: true,
      message: 'Your account has been deactivated successfully.'
    });

    // Clear auth cookies to log user out
    clearAuthCookie(response, {
      secure: req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https://'),
    });
    return response;

  } catch (error) {
    console.error('Delete Account API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while deactivating your account.' },
      { status: 500 }
    );
  }
}
