import { query } from '../lib/db.js';

(async ()=>{
  try {
    const artisanId = 7;
    const artisans = await query(`SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.is_verified, u.is_active, u.created_at as user_created_at,
        ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.service_areas, ap.created_at
       FROM users u
       LEFT JOIN artisan_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN categories c ON ap.category_id = c.category_id
       WHERE u.user_id = ? AND u.role = 'artisan'`, [artisanId]);

    console.log('artisan rows:', artisans.length);
    const reviews = await query(`SELECT r.review_id, r.customer_id, r.rating, r.review_text, r.is_approved, r.created_at, u.full_name as customer_name
       FROM reviews r
       INNER JOIN users u ON r.customer_id = u.user_id
       WHERE r.artisan_id = ?
       ORDER BY r.created_at DESC`, [artisanId]);

    console.log('reviews count:', reviews.length);

    const portfolio = await query(`SELECT item_id, image_path, caption, description, created_at 
       FROM portfolio_items 
       WHERE artisan_id = ? 
       ORDER BY created_at DESC`, [artisanId]);
    console.log('portfolio count:', portfolio.length);

    const gallery = await query(`SELECT gallery_id, image_path, caption, uploaded_at 
       FROM gallery 
       WHERE artisan_id = ? 
       ORDER BY uploaded_at DESC`, [artisanId]);
    console.log('gallery count:', gallery.length);

    const artisan = artisans[0];
    artisan.service_areas = artisan.service_areas ? artisan.service_areas.split(',').map(s=>s.trim()).filter(Boolean) : [];
    artisan.reviews = reviews;
    artisan.portfolio = portfolio;
    artisan.gallery = gallery;

    console.log('fullProfile preview:', {
      user_id: artisan.user_id,
      full_name: artisan.full_name,
      reviews_count: reviews.length,
      portfolio_count: portfolio.length,
      gallery_count: gallery.length
    });

  } catch (e) {
    console.error('simulate get artisan error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
