import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ArtisanProfileClient from '@/components/ArtisanProfileClient';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const revalidate = 0; // Always serve fresh dynamic content

export default async function ArtisanProfilePage({ params }) {
  const { id } = await params;
  const artisanId = parseInt(id, 10);

  if (isNaN(artisanId) || artisanId <= 0) {
    notFound();
  }

  // 1. Fetch current logged-in user if available
  let currentUser = null;
  let cookieStore = null;

  try {
    cookieStore = await cookies();
    const tokenObj = cookieStore.get('skillsconnect_auth');
    const token = tokenObj ? tokenObj.value : null;
    if (token) {
      currentUser = await verifyToken(token);
    }
  } catch (err) {
    console.error("Auth token parse error on profile page:", err);
  }

  // 2. Fetch the artisan profile
  let artisan = null;
  try {
    const results = await query(`
      SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.created_at as joined_at,
        ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.service_areas,
        c.category_name, c.icon_class
      FROM users u
      INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
      INNER JOIN categories c ON ap.category_id = c.category_id
      WHERE u.user_id = ? AND u.role = 'artisan' AND u.is_active = 1
    `, [artisanId]);

    if (results && results.length > 0) {
      artisan = results[0];
    }
  } catch (err) {
    console.error("Failed to query artisan details:", err);
  }

  if (!artisan) {
    notFound();
  }

  // 3. Fetch portfolio/gallery items
  let gallery = [];
  try {
    gallery = await query(`
      SELECT item_id, image_path, caption, description, created_at 
      FROM portfolio_items 
      WHERE artisan_id = ? 
      ORDER BY created_at DESC
    `, [artisanId]);
  } catch (err) {
    console.error("Failed to query portfolio:", err);
  }

  // 4. Fetch client reviews
  let reviews = [];
  try {
    reviews = await query(`
      SELECT r.review_id, r.customer_id, r.rating, r.review_text, r.created_at, r.is_approved,
             u.full_name as customer_name, u.profile_photo as customer_photo
      FROM reviews r
      INNER JOIN users u ON r.customer_id = u.user_id
      WHERE r.artisan_id = ? AND r.is_approved = 1
      ORDER BY r.created_at DESC
    `, [artisanId]);
  } catch (err) {
    console.error("Failed to query reviews:", err);
  }

  // 5. Check if saved initially
  let isSaved = false;
  if (currentUser && currentUser.role === 'customer') {
    try {
      const savedCheck = await query(`
        SELECT save_id FROM saved_artisans 
        WHERE customer_id = ? AND artisan_id = ?
      `, [currentUser.user_id, artisanId]);
      isSaved = savedCheck && savedCheck.length > 0;
    } catch (err) {
      console.error("Failed to check saved status:", err);
    }
  }

  // 6. Increment profile views count and log the view (fire and forget on load)
  try {
    await query(`
      UPDATE artisan_profiles 
      SET profile_views = profile_views + 1 
      WHERE user_id = ?
    `, [artisanId]);

    const viewerId = currentUser?.user_id || null;
    const forwarded = cookieStore?.get('skillsconnect_auth')?.value || null;
    await query(`
      INSERT INTO profile_view_logs (artisan_id, viewer_id, ip_address) VALUES (?, ?, ?)
    `, [artisanId, viewerId, forwarded ? 'server' : null]);
  } catch (err) {
    console.error("Failed to increment views:", err);
  }

  return (
    <div className="d-flex flex-column min-vh-100" id={`artisan-profile-page-${artisanId}`}>
      <Navbar />
      <main className="flex-grow-1 bg-light">
        <ArtisanProfileClient 
          artisan={artisan} 
          reviews={reviews} 
          gallery={gallery} 
          isInitiallySaved={isSaved} 
          currentUser={currentUser} 
        />
      </main>
      <Footer />
    </div>
  );
}
