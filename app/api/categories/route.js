import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEFAULT_CATEGORIES = [
  { category_id: 1, category_name: 'Plumbing', icon_class: 'fa-wrench', description: 'Installation, repair, and maintenance of pipes, valves, fittings, and drainage systems.' },
  { category_id: 2, category_name: 'Electrical Work', icon_class: 'fa-bolt', description: 'Professional wiring, installations, diagnostics, and repairs of electrical systems.' },
  { category_id: 3, category_name: 'Carpentry', icon_class: 'fa-hammer', description: 'Bespoke woodwork, furniture making, roofing, and structural wooden installations.' },
  { category_id: 4, category_name: 'Masonry', icon_class: 'fa-building', description: 'Bricklaying, concrete works, plastering, tiling, and general stone work.' },
  { category_id: 5, category_name: 'Tailoring', icon_class: 'fa-scissors', description: 'Stitching and altering traditional, corporate, and formal wear.' },
  { category_id: 6, category_name: 'Hairdressing', icon_class: 'fa-cut', description: 'Braiding, weaving, washing, styling, locks, and natural hair treatment.' },
  { category_id: 7, category_name: 'Painting', icon_class: 'fa-paint-roller', description: 'Professional interior and exterior painting, wall finishing, and wallpaper installation.' },
  { category_id: 8, category_name: 'Welding', icon_class: 'fa-fire', description: 'Metal fabrication, gate construction, burglar-proof structures, and repairs.' },
  { category_id: 9, category_name: 'Mechanics', icon_class: 'fa-car', description: 'Automotive servicing, engine repair, wheel alignment, and auto-electrical repairs.' },
  { category_id: 10, category_name: 'Fashion Design', icon_class: 'fa-shirt', description: 'Creative clothing design, styling, and modern Ghanaian apparel production.' },
  { category_id: 11, category_name: 'Cleaning Services', icon_class: 'fa-broom', description: 'Professional house cleaning, office cleaning, fumigation, and sanitation services.' },
  { category_id: 12, category_name: 'Pest Control', icon_class: 'fa-bug', description: 'Termite treatment, rodent control, fumigation, and general pest management.' },
  { category_id: 13, category_name: 'Gardening & Landscaping', icon_class: 'fa-seedling', description: 'Lawn care, planting, garden maintenance, and outdoor beautification.' },
  { category_id: 14, category_name: 'Appliance Repair', icon_class: 'fa-tv', description: 'Repair and servicing of refrigerators, washing machines, microwaves, and other household appliances.' },
  { category_id: 15, category_name: 'ICT & Device Repair', icon_class: 'fa-laptop', description: 'Computer repairs, phone repairs, printer setup, and troubleshooting services.' },
  { category_id: 16, category_name: 'Event Decoration', icon_class: 'fa-ribbon', description: 'Decoration, venue styling, balloon work, and event setup services.' },
  { category_id: 17, category_name: 'Catering', icon_class: 'fa-utensils', description: 'Food preparation, event catering, and home kitchen support services.' },
  { category_id: 18, category_name: 'Beauty Services', icon_class: 'fa-spa', description: 'Makeup, nails, skincare, and beauty treatment services.' },
  { category_id: 19, category_name: 'Photography', icon_class: 'fa-camera', description: 'Event photography, portrait shoots, and professional camera services.' },
  { category_id: 20, category_name: 'Security Services', icon_class: 'fa-shield-halved', description: 'Private security, guarding, gatekeeping, and protective services.' }
];

export async function GET() {
  try {
    const existingCategories = await query(
      'SELECT category_id, category_name, icon_class, description FROM categories WHERE is_active = 1 ORDER BY category_name ASC'
    );

    const existingNames = new Set((existingCategories || []).map((category) => (category.category_name || '').trim().toLowerCase()));
    const missingCategories = DEFAULT_CATEGORIES.filter((category) => !existingNames.has(category.category_name.trim().toLowerCase()));

    if (missingCategories.length > 0) {
      for (const category of missingCategories) {
        await query(
          'INSERT INTO categories (category_id, category_name, icon_class, description, is_active) VALUES (?, ?, ?, ?, 1)',
          [category.category_id, category.category_name, category.icon_class, category.description]
        );
      }
    }

    const categories = await query(
      'SELECT category_id, category_name, icon_class, description FROM categories WHERE is_active = 1 ORDER BY category_name ASC'
    );

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Fetch Categories API Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while loading categories' },
      { status: 500 }
    );
  }
}
