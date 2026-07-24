const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const dbPath = `${process.cwd()}/skillsconnect.db`;
if (!fs.existsSync(dbPath)) {
  console.error('NO_DB');
  process.exit(1);
}
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('DB_ERR', err.message);
    process.exit(1);
  }
});

const queries = [
  { name: 'USERS', sql: "SELECT user_id, full_name, email, role, region, district, is_verified, is_active FROM users ORDER BY user_id" },
  { name: 'ARTISAN_PROFILES', sql: "SELECT profile_id, user_id, category_id, average_rating, total_reviews, is_approved, is_featured, service_areas FROM artisan_profiles ORDER BY profile_id" },
  { name: 'CATEGORIES', sql: "SELECT category_id, category_name FROM categories ORDER BY category_id" },
  { name: 'TESTIMONIALS', sql: "SELECT testimonial_id, customer_id, rating, testimonial_text FROM testimonials ORDER BY testimonial_id" },
  { name: 'REVIEWS', sql: "SELECT review_id, customer_id, artisan_id, rating FROM reviews ORDER BY review_id LIMIT 10" },
];

db.serialize(() => {
  queries.forEach((q) => {
    console.log('---', q.name, '---');
    db.all(q.sql, (err, rows) => {
      if (err) {
        console.error('ERR_QUERY', q.name, err.message);
        return;
      }
      rows.forEach((row) => console.log(row));
      if (rows.length === 0) console.log('(none)');
    });
  });
});

db.close();
