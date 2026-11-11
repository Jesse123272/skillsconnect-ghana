-- SkillsConnect Ghana — PostgreSQL Schema (Supabase)
-- Run this in your Supabase SQL Editor to set up the database.

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'artisan', 'admin')),
    region        VARCHAR(100),
    district      VARCHAR(100),
    profile_photo VARCHAR(255) DEFAULT NULL,
    preferences   TEXT DEFAULT NULL,
    is_verified   SMALLINT DEFAULT 0,
    is_active     SMALLINT DEFAULT 1,
    reset_token   VARCHAR(255) DEFAULT NULL,
    verification_token VARCHAR(255) DEFAULT NULL,
    google_id     VARCHAR(255) DEFAULT NULL,
    last_login    TIMESTAMPTZ DEFAULT NULL,
    lat           DECIMAL(10, 8) DEFAULT NULL,
    lng           DECIMAL(11, 8) DEFAULT NULL,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    icon_class    VARCHAR(50) NOT NULL,
    description   TEXT,
    is_active     SMALLINT DEFAULT 1,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artisan_profiles (
    profile_id        SERIAL PRIMARY KEY,
    user_id           INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id       INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    bio               TEXT,
    years_experience  INT DEFAULT 0,
    average_rating    DECIMAL(3,2) DEFAULT 0.00,
    total_reviews     INT DEFAULT 0,
    profile_views     INT DEFAULT 0,
    is_approved       SMALLINT DEFAULT 0,
    is_featured       SMALLINT DEFAULT 0,
    is_available      SMALLINT DEFAULT 1,
    accepts_emergency SMALLINT DEFAULT 0,
    ghana_card_verified SMALLINT DEFAULT 0,
    police_checked    SMALLINT DEFAULT 0,
    trade_certified   SMALLINT DEFAULT 0,
    starting_price    DECIMAL(10,2) DEFAULT NULL,
    service_areas     TEXT DEFAULT NULL,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guarantors (
    guarantor_id  SERIAL PRIMARY KEY,
    artisan_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    relationship  VARCHAR(100) NOT NULL,
    phone         VARCHAR(30) DEFAULT NULL,
    email         VARCHAR(150) DEFAULT NULL,
    notes         TEXT DEFAULT NULL,
    status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
    enquiry_id       SERIAL PRIMARY KEY,
    customer_id      INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    artisan_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject          VARCHAR(200) NOT NULL,
    message          TEXT NOT NULL,
    reply            TEXT DEFAULT NULL,
    status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','replied','in_progress','completed','closed','cancelled')),
    is_read_artisan  SMALLINT DEFAULT 0,
    is_read_customer SMALLINT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    replied_at       TIMESTAMPTZ DEFAULT NULL,
    completed_at     TIMESTAMPTZ DEFAULT NULL,
    completed_by     INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS enquiry_messages (
    message_id   SERIAL PRIMARY KEY,
    enquiry_id   INT NOT NULL REFERENCES enquiries(enquiry_id) ON DELETE CASCADE,
    sender_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id   SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    artisan_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    is_approved SMALLINT DEFAULT 1,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (customer_id, artisan_id)
);

CREATE TABLE IF NOT EXISTS saved_artisans (
    save_id     SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    artisan_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    saved_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (customer_id, artisan_id)
);

CREATE TABLE IF NOT EXISTS gallery (
    gallery_id  SERIAL PRIMARY KEY,
    artisan_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    image_path  VARCHAR(255) NOT NULL,
    caption     VARCHAR(255) DEFAULT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reference      VARCHAR(100) UNIQUE NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    currency       VARCHAR(10) DEFAULT 'GHS',
    channel        VARCHAR(50) DEFAULT NULL,
    status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
    metadata       JSONB DEFAULT NULL,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verified_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    log_id      SERIAL PRIMARY KEY,
    user_id     INT DEFAULT NULL,
    action      VARCHAR(200) NOT NULL,
    entity_type VARCHAR(100) DEFAULT NULL,
    entity_id   INT DEFAULT NULL,
    ip_address  VARCHAR(45) DEFAULT NULL,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type            VARCHAR(100) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    is_read         SMALLINT DEFAULT 0,
    link            VARCHAR(255) DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_items (
    item_id    SERIAL PRIMARY KEY,
    artisan_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    image_path VARCHAR(255) NOT NULL,
    caption    VARCHAR(255) DEFAULT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
    testimonial_id SERIAL PRIMARY KEY,
    customer_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating         INT NOT NULL,
    testimonial_text TEXT NOT NULL,
    status         VARCHAR(50) DEFAULT 'approved',
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_view_logs (
    log_id     SERIAL PRIMARY KEY,
    artisan_id INT NOT NULL,
    viewer_id  INT DEFAULT NULL,
    viewed_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS job_milestones (
    milestone_id SERIAL PRIMARY KEY,
    enquiry_id   INT NOT NULL REFERENCES enquiries(enquiry_id) ON DELETE CASCADE,
    title        VARCHAR(180) NOT NULL,
    description  TEXT DEFAULT NULL,
    amount       DECIMAL(10,2) DEFAULT 0.00,
    status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','released','cancelled')),
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key   TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_metrics (
    metric_id    SERIAL PRIMARY KEY,
    metric_name  TEXT NOT NULL,
    metric_value DECIMAL DEFAULT 0.00,
    recorded_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role       ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_ap_approved      ON artisan_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_ap_user          ON artisan_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ap_category      ON artisan_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_artisan  ON reviews(artisan_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ─── Seed: 20 Categories ─────────────────────────────────────────────────────
INSERT INTO categories (category_id, category_name, icon_class, description) VALUES
(1,  'Plumbing',              'fa-wrench',         'Installation, repair, and maintenance of pipes, valves, fittings, and drainage systems.'),
(2,  'Electrical Work',       'fa-bolt',           'Professional wiring, installations, diagnostics, and repairs of electrical systems.'),
(3,  'Carpentry',             'fa-hammer',         'Bespoke woodwork, furniture making, roofing, and structural wooden installations.'),
(4,  'Masonry',               'fa-building',       'Bricklaying, concrete works, plastering, tiling, and general stone work.'),
(5,  'Tailoring',             'fa-scissors',       'Stitching and altering men''s and women''s traditional, corporate, and formal wear.'),
(6,  'Hairdressing',          'fa-cut',            'Braiding, weaving, washing, styling, locks, and natural hair treatment.'),
(7,  'Painting',              'fa-paint-roller',   'Professional interior and exterior painting, wall finishing, and wallpaper installation.'),
(8,  'Welding',               'fa-fire',           'Metal fabrication, gate construction, burglar-proof structures, and repairs.'),
(9,  'Mechanics',             'fa-car',            'Automotive servicing, engine repair, wheel alignment, and auto-electrical repairs.'),
(10, 'Fashion Design',        'fa-shirt',          'Creative clothing design, styling, and modern Ghanaian apparel production.'),
(11, 'Cleaning Services',     'fa-broom',          'Professional house cleaning, office cleaning, fumigation, and sanitation services.'),
(12, 'Pest Control',          'fa-bug',            'Termite treatment, rodent control, fumigation, and general pest management.'),
(13, 'Gardening & Landscaping','fa-seedling',      'Lawn care, planting, garden maintenance, and outdoor beautification.'),
(14, 'Appliance Repair',      'fa-tv',             'Repair of refrigerators, washing machines, microwaves, and household appliances.'),
(15, 'ICT & Device Repair',   'fa-laptop',         'Computer repairs, phone repairs, printer setup, and troubleshooting.'),
(16, 'Event Decoration',      'fa-ribbon',         'Decoration, venue styling, balloon work, and event setup services.'),
(17, 'Catering',              'fa-utensils',       'Food preparation, event catering, and home kitchen support services.'),
(18, 'Beauty Services',       'fa-spa',            'Makeup, nails, skincare, and beauty treatment services.'),
(19, 'Photography',           'fa-camera',         'Event photography, portrait shoots, and professional camera services.'),
(20, 'Security Services',     'fa-shield-halved',  'Private security, guarding, gatekeeping, and protective services.')
ON CONFLICT (category_id) DO NOTHING;

-- Reset sequence after manual IDs
SELECT setval('categories_category_id_seq', 20);

-- ─── Seed: Admin user (Password: Admin@SkillsConnect2026) ─────────────────────
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, region, district, is_verified, is_active)
VALUES (1, 'SkillsConnect Admin', 'admin@skillsconnect.gh', '+233302123456',
        '$2b$12$hFbvve3GmbFee5IQO25yquHUUAzrGVaxA.Xz0Y.6FSwJq43mTxunC',
        'admin', 'Greater Accra', 'Accra Central', 1, 1)
ON CONFLICT (email) DO NOTHING;

-- Reset users sequence so new registrations start from 2
SELECT setval('users_user_id_seq', 1);

-- ─── System settings ──────────────────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('platform_name',        'SkillsConnect Ghana'),
  ('contact_email',        'skillsconnectgh@zohomail.com'),
  ('contact_phone',        '+233 530 600 127'),
  ('artisan_approval_mode','manual')
ON CONFLICT (setting_key) DO NOTHING;
