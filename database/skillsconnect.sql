-- SkillsConnect Ghana Database Schema and Realistic Seed Data
-- Database: skillsconnect_db

-- Author: SkillsConnect Ghana contributors (human-curated seed data)
-- Note: Seed content reviewed and localized for Ghana; keep names and
-- realistic examples to maintain authenticity when running local demos.

CREATE DATABASE IF NOT EXISTS skillsconnect_db;
USE skillsconnect_db;

-- Reset all tables to ensure clean, error-free seed execution
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS portfolio_items;
DROP TABLE IF EXISTS saved_artisans;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS enquiry_messages;
DROP TABLE IF EXISTS enquiries;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS guarantors;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS artisan_profiles;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'artisan', 'admin') DEFAULT 'customer',
    region VARCHAR(100),
    district VARCHAR(100),
    profile_photo VARCHAR(255) DEFAULT NULL,
    preferences TEXT DEFAULT NULL,
    is_verified TINYINT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    reset_token VARCHAR(255) DEFAULT NULL,
    verification_token VARCHAR(255) DEFAULT NULL,
    google_id VARCHAR(255) DEFAULT NULL,
    last_login DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: categories
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    icon_class VARCHAR(50) NOT NULL,
    description TEXT,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: artisan_profiles
CREATE TABLE IF NOT EXISTS artisan_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    bio TEXT,
    years_experience INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    profile_views INT DEFAULT 0,
    is_approved TINYINT DEFAULT 0,
    is_featured TINYINT DEFAULT 0,
    is_available TINYINT DEFAULT 1,
    accepts_emergency TINYINT DEFAULT 0,
    ghana_card_verified TINYINT DEFAULT 0,
    police_checked TINYINT DEFAULT 0,
    trade_certified TINYINT DEFAULT 0,
    starting_price DECIMAL(10,2) DEFAULT NULL,
    service_areas TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3b: guarantors and professional references
CREATE TABLE IF NOT EXISTS guarantors (
    guarantor_id INT AUTO_INCREMENT PRIMARY KEY,
    artisan_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artisan_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    artisan_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reply TEXT DEFAULT NULL,
    status ENUM('pending', 'replied', 'in_progress', 'completed', 'closed', 'cancelled') DEFAULT 'pending',
    is_read_artisan TINYINT DEFAULT 0,
    is_read_customer TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    replied_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    completed_by INT DEFAULT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (artisan_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4b: enquiry_messages
CREATE TABLE IF NOT EXISTS enquiry_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 5: reviews
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    artisan_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    is_approved TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY one_review (customer_id, artisan_id),
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (artisan_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 6: saved_artisans
CREATE TABLE IF NOT EXISTS saved_artisans (
    save_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    artisan_id INT NOT NULL,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_save (customer_id, artisan_id),
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (artisan_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 7: gallery
CREATE TABLE IF NOT EXISTS gallery (
    gallery_id INT AUTO_INCREMENT PRIMARY KEY,
    artisan_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    caption VARCHAR(255) DEFAULT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artisan_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 8: transactions
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'GHS',
    channel VARCHAR(50) DEFAULT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    metadata JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 9: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(200) NOT NULL,
    entity_type VARCHAR(100) DEFAULT NULL,
    entity_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 10: notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT DEFAULT 0,
    link VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 11: portfolio_items
CREATE TABLE IF NOT EXISTS portfolio_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    artisan_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    caption VARCHAR(255) DEFAULT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artisan_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 12: testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    testimonial_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    rating INT NOT NULL,
    testimonial_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- SEED DATA INSERTION
-- ==========================================================

-- 1. SEED CATEGORIES (20 rows)
INSERT INTO categories (category_id, category_name, icon_class, description) VALUES
(1, 'Plumbing', 'fa-wrench', 'Installation, repair, and maintenance of pipes, valves, fittings, and drainage systems.'),
(2, 'Electrical Work', 'fa-bolt', 'Professional wiring, installations, diagnostics, and repairs of electrical systems.'),
(3, 'Carpentry', 'fa-hammer', 'Bespoke woodwork, furniture making, roofing, and structural wooden installations.'),
(4, 'Masonry', 'fa-building', 'Bricklaying, concrete works, plastering, tiling, and general stone work.'),
(5, 'Tailoring', 'fa-scissors', 'Stitching and altering men''s and women''s traditional, corporate, and formal wear.'),
(6, 'Hairdressing', 'fa-cut', 'Braiding, weaving, washing, styling, locks, and natural hair treatment.'),
(7, 'Painting', 'fa-paint-roller', 'Professional interior and exterior painting, wall finishing, and wallpaper installation.'),
(8, 'Welding', 'fa-fire', 'Metal fabrication, gate construction, burglar-proof structures, and repairs.'),
(9, 'Mechanics', 'fa-car', 'Automotive servicing, engine repair, wheel alignment, and auto-electrical repairs.'),
(10, 'Fashion Design', 'fa-shirt', 'Creative clothing design, styling, and modern Ghanaian apparel production.'),
(11, 'Cleaning Services', 'fa-broom', 'Professional house cleaning, office cleaning, fumigation, and sanitation services.'),
(12, 'Pest Control', 'fa-bug', 'Termite treatment, rodent control, fumigation, and general pest management.'),
(13, 'Gardening & Landscaping', 'fa-seedling', 'Lawn care, planting, garden maintenance, and outdoor beautification.'),
(14, 'Appliance Repair', 'fa-tv', 'Repair and servicing of refrigerators, washing machines, microwaves, and other household appliances.'),
(15, 'ICT & Device Repair', 'fa-laptop', 'Computer repairs, phone repairs, printer setup, and troubleshooting services.'),
(16, 'Event Decoration', 'fa-ribbon', 'Decoration, venue styling, balloon work, and event setup services.'),
(17, 'Catering', 'fa-utensils', 'Food preparation, event catering, and home kitchen support services.'),
(18, 'Beauty Services', 'fa-spa', 'Makeup, nails, skincare, and beauty treatment services.'),
(19, 'Photography', 'fa-camera', 'Event photography, portrait shoots, and professional camera services.'),
(20, 'Security Services', 'fa-shield-halved', 'Private security, guarding, gatekeeping, and protective services.');

-- 2. SEED ADMIN USER (1 row, Password is 'Admin@SkillsConnect2026')
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, region, district, is_verified, is_active) VALUES
(1, 'SkillsConnect Admin', 'admin@skillsconnect.gh', '+233302123456', '$2b$12$hFbvve3GmbFee5IQO25yquHUUAzrGVaxA.Xz0Y.6FSwJq43mTxunC', 'admin', 'Greater Accra', 'Accra Central', 1, 1);

-- No dummy customers, artisans, enquiries, reviews, or testimonials.
-- The platform is ready for real user registrations.

