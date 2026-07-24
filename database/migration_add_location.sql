ALTER TABLE users ADD COLUMN lat DECIMAL(10,7) DEFAULT NULL;
ALTER TABLE users ADD COLUMN lng DECIMAL(10,7) DEFAULT NULL;
CREATE INDEX idx_user_location ON users(lat, lng);

UPDATE users SET lat = 5.5502, lng = -0.2174 WHERE user_id = 7;
UPDATE users SET lat = 5.6698, lng = -0.0166 WHERE user_id = 8;
UPDATE users SET lat = 5.5364, lng = -0.2637 WHERE user_id = 9;
UPDATE users SET lat = 5.5629, lng = -0.1827 WHERE user_id = 10;
UPDATE users SET lat = 6.6885, lng = -1.6244 WHERE user_id = 11;
UPDATE users SET lat = 4.9343, lng = -1.7042 WHERE user_id = 12;
