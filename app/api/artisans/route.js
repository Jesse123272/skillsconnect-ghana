import { NextResponse } from 'next/server';
import { isSqliteFallbackEnabled, query } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get('category_id');
    const region = searchParams.get('region');
    const min_rating = searchParams.get('min_rating');
    const keyword = searchParams.get('keyword');
    const availability = searchParams.get('availability');
    const emergency = searchParams.get('emergency');
    const sort = searchParams.get('sort');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '9';

    // 1. Setup conditional filters
    const conditions = ['u.is_active = 1', 'ap.is_approved = 1'];
    const params = [];

    if (category_id) {
      const parsedCat = parseInt(category_id, 10);
      if (!isNaN(parsedCat)) {
        conditions.push('ap.category_id = ?');
        params.push(parsedCat);
      }
    }

    if (region && region.trim() !== '') {
      conditions.push('u.region = ?');
      params.push(region.trim());
    }

    const district = searchParams.get('district') || searchParams.get('city');
    if (district && district.trim() !== '') {
      const dLk = `%${district.trim()}%`;
      conditions.push('(u.district LIKE ? OR ap.service_areas LIKE ? OR u.region LIKE ?)');
      params.push(dLk, dLk, dLk);
    }

    if (min_rating) {
      const parsedMinRating = parseFloat(min_rating);
      if (!isNaN(parsedMinRating)) {
        conditions.push('ap.average_rating >= ?');
        params.push(parsedMinRating);
      }
    }

    if (keyword && keyword.trim() !== '') {
      const lk = `%${keyword.trim()}%`;
      conditions.push(
        '(u.full_name LIKE ? OR ap.bio LIKE ? OR c.category_name LIKE ? OR u.region LIKE ? OR u.district LIKE ? OR ap.service_areas LIKE ?)'
      );
      params.push(lk, lk, lk, lk, lk, lk);
    }

    if (availability === 'available') conditions.push('ap.is_available = 1');
    if (emergency === 'true' || emergency === '1') conditions.push('ap.accepts_emergency = 1');

    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');
    const radius = parseFloat(searchParams.get('radius') || '25');
    const useLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);
    const useSqliteBackend = isSqliteFallbackEnabled;
    const useLocationSql = useLocation && !useSqliteBackend;
    const useLocationJsFallback = useLocation && useSqliteBackend;
    const canUseLocation = useLocationSql || useLocationJsFallback;
    let locationWarning = null;

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const getDistanceKm = (lat1, lng1, lat2, lng2) => {
      const deg2rad = (deg) => deg * (Math.PI / 180);
      const r = 6371;
      const dLat = deg2rad(lat2 - lat1);
      const dLng = deg2rad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return r * c;
    };

    // 3. Setup pagination variables
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 9, 100));
    const offset = Math.max(0, (parsedPage - 1) * parsedLimit);

    let orderBy = 'ap.average_rating DESC';
    if (sort === 'newest') {
      orderBy = 'ap.created_at DESC';
    } else if (sort === 'reviews') {
      orderBy = 'ap.total_reviews DESC';
    } else if (sort === 'name') {
      orderBy = 'u.full_name ASC';
    }

    let countSql;
    let querySql;
    let countParams;
    let queryParams;

    const buildDefaultPagination = (includeLocationOnly = false, noPagination = false) => {
      const locationOnlyClause = includeLocationOnly ? (whereClause ? whereClause + ' AND u.lat IS NOT NULL AND u.lng IS NOT NULL' : 'WHERE u.lat IS NOT NULL AND u.lng IS NOT NULL') : whereClause;

      countSql = `
        SELECT COUNT(*) as total 
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        INNER JOIN categories c ON ap.category_id = c.category_id
        ${locationOnlyClause}
      `;

      const safeLimit = parsedLimit;
      const safeOffset = offset;

      querySql = `
        SELECT 
          u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.is_verified, u.lat, u.lng,
          ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.starting_price, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.is_available, ap.accepts_emergency, ap.ghana_card_verified, ap.police_checked, ap.trade_certified, ap.service_areas, ap.created_at,
          c.category_name, c.icon_class,
          (SELECT COUNT(*) FROM guarantors g WHERE g.artisan_id = u.user_id AND g.status = 'approved') AS approved_guarantor_count
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        INNER JOIN categories c ON ap.category_id = c.category_id
        ${locationOnlyClause}
        ORDER BY ${orderBy}
        ${noPagination ? '' : `LIMIT ${safeLimit} OFFSET ${safeOffset}`}
      `;

      countParams = params;
      queryParams = [...params];
    };

    if (useLocationSql) {
      const locationConditions = `${whereClause ? whereClause + ' AND ' : 'WHERE '}u.lat IS NOT NULL AND u.lng IS NOT NULL`;
      const distanceFormula = `(6371 * acos(cos(radians(?)) * cos(radians(u.lat)) * cos(radians(u.lng) - radians(?)) + sin(radians(?)) * sin(radians(u.lat))))`;

      countSql = `
        SELECT COUNT(*) as total
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        INNER JOIN categories c ON ap.category_id = c.category_id
        ${locationConditions}
          AND ${distanceFormula} <= ?
      `;

      const safeLimit = parsedLimit;
      const safeOffset = offset;

      querySql = `
        SELECT
          u.user_id, u.full_name, u.email, u.phone, u.region, u.district, u.profile_photo, u.is_verified,
          ap.profile_id, ap.category_id, ap.bio, ap.years_experience, ap.starting_price, ap.average_rating, ap.total_reviews, ap.profile_views, ap.is_approved, ap.is_featured, ap.is_available, ap.accepts_emergency, ap.ghana_card_verified, ap.police_checked, ap.trade_certified, ap.service_areas, ap.created_at,
          c.category_name, c.icon_class,
          (SELECT COUNT(*) FROM guarantors g WHERE g.artisan_id = u.user_id AND g.status = 'approved') AS approved_guarantor_count,
          ${distanceFormula} AS distance_km,
          ((1 - (${distanceFormula} / ?)) * 0.40 + (ap.average_rating / 5) * 0.35 + (CASE WHEN ap.total_reviews = 0 THEN 0 ELSE LEAST(ap.total_reviews / 50, 1) END) * 0.15 + (CASE WHEN ap.profile_views = 0 THEN 0 ELSE LEAST(ap.profile_views / 200, 1) END) * 0.10) AS weighted_score
        FROM users u
        INNER JOIN artisan_profiles ap ON u.user_id = ap.user_id
        INNER JOIN categories c ON ap.category_id = c.category_id
        ${locationConditions}
          AND ${distanceFormula} <= ?
        ORDER BY weighted_score DESC, distance_km ASC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      `;

      countParams = [
        ...params,
        latitude,
        longitude,
        latitude,
        radius
      ];

      queryParams = [
        ...params,
        latitude,
        longitude,
        latitude,
        latitude,
        longitude,
        latitude,
        radius,
        latitude,
        longitude,
        latitude,
        radius
      ];
    } else if (useLocationJsFallback) {
      buildDefaultPagination(true, true);
    } else {
      buildDefaultPagination();
    }

    let countResults;
    let artisans;

    [countResults, artisans] = await Promise.all([
      query(countSql, countParams),
      query(querySql, queryParams)
    ]);

    if (useLocationJsFallback) {
      const filtered = (artisans || [])
        .map((artisan) => {
          const distance_km = artisan.lat && artisan.lng
            ? getDistanceKm(latitude, longitude, Number(artisan.lat), Number(artisan.lng))
            : Infinity;
          const weighted_score = ((1 - (distance_km / radius)) * 0.40) +
            ((artisan.average_rating || 0) / 5) * 0.35 +
            ((artisan.total_reviews || 0) === 0 ? 0 : Math.min((artisan.total_reviews || 0) / 50, 1) * 0.15) +
            ((artisan.profile_views || 0) === 0 ? 0 : Math.min((artisan.profile_views || 0) / 200, 1) * 0.10);

          return {
            ...artisan,
            distance_km,
            weighted_score,
          };
        })
        .filter((artisan) => artisan.distance_km <= radius)
        .sort((a, b) => {
          const scoreDiff = (b.weighted_score || 0) - (a.weighted_score || 0);
          if (Math.abs(scoreDiff) > 1e-6) return scoreDiff;
          return (a.distance_km || 0) - (b.distance_km || 0);
        });

      const total = filtered.length;
      const paged = filtered.slice(offset, offset + parsedLimit);
      countResults = [{ total }];
      artisans = paged;
      locationWarning = null;
    }

    const total = countResults[0]?.total || 0;
    const totalPages = Math.ceil(total / parsedLimit);

    // Format service coverage areas from string list into clean arrays for client frontend
    const formattedArtisans = artisans.map(artisan => {
      let areaArray = [];
      if (artisan.service_areas) {
        areaArray = artisan.service_areas.split(',').map(s => s.trim()).filter(Boolean);
      }
      return {
        ...artisan,
        service_areas: areaArray
      };
    });

    return NextResponse.json({
      success: true,
      warning: locationWarning,
      data: {
        artisans: formattedArtisans,
        total,
        page: parsedPage,
        totalPages,
        perPage: parsedLimit
      }
    });

  } catch (error) {
    console.error('List Artisans API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while retrieving artisans' },
      { status: 500 }
    );
  }
}
