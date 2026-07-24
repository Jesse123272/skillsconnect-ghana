#!/bin/bash
set -e

echo "MariaDB service is already running."

echo "Configuring MySQL privileges for passwordless TCP connections..."
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING '';" || true
mysql -u root -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED BY '';" || true
mysql -u root -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;" || true
mysql -u root -e "FLUSH PRIVILEGES;" || true

echo "Importing database schema and seed data..."
mysql -u root < ./database/skillsconnect.sql

echo "Database setup completed successfully!"
