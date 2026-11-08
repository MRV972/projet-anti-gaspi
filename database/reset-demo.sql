SET NAMES utf8mb4;

DROP DATABASE IF EXISTS anti_gaspillage;
CREATE DATABASE anti_gaspillage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE anti_gaspillage;

CREATE TABLE hotels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE associations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_accounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hotel', 'association', 'individual') NOT NULL,
  entity_id INT UNSIGNED NULL,
  display_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE invitation_keys (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_hash CHAR(64) NOT NULL UNIQUE,
  role ENUM('hotel', 'association', 'individual') NOT NULL,
  entity_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE password_reset_keys (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_hash CHAR(64) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE food_offerings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  available_until DATETIME NOT NULL,
  description TEXT NULL,
  status ENUM('available', 'requested', 'collected', 'cancelled') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pickup_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  offering_id INT UNSIGNED NOT NULL,
  association_id INT UNSIGNED NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_pending_request (offering_id, association_id)
);
CREATE TABLE distribution_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  offering_id INT UNSIGNED NOT NULL,
  individual_name VARCHAR(150) NOT NULL,
  contact VARCHAR(150) NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hotels (name) VALUES (CONVERT(0x48C3B474656C20646573204C756D69C3A8726573 USING utf8mb4));
INSERT INTO associations (name) VALUES (CONVERT(0x4173736F63696174696F6E206475205175617274696572 USING utf8mb4));
INSERT INTO user_accounts (email, password_hash, role, entity_id, display_name) VALUES
('admin@anti-gaspi.local', '83c2f20c151813e17a72bc9e406ed26a:5a901fbb34ef9c8ba98c6771197088e2fbde217d631345cbaa196fdd2e3eb1170a5ef3c6750326083ca6a5fde36f8510d65a5e58ac371db738a5680d4dce4c5d', 'admin', NULL, 'Administrateur'),
('hotel@anti-gaspi.local', 'f23bfeab7a415d97ecc4605820b22302:e00b8037b0e025c15385c6f582e99c9e2e35314a31eb2186281dbfd4a418f06d2c93871067fee3a3d231ec619dc4003564d6d3e27d4cdb821cd755f8f934eb44', 'hotel', 1, (SELECT name FROM hotels WHERE id = 1)),
('association@anti-gaspi.local', '8ad9bf85d55aef0719689abce5db62cb:82c4f88b2eac5cbf9a44ff292f4f739e0b78c33d1d1eef910bc29c170470cc6c7181c83d6a1570b431914045a74d0aab6727561bdfd1871d79a1415113d16179', 'association', 1, (SELECT name FROM associations WHERE id = 1)),
('particulier@anti-gaspi.local', '232eb2e710635860c7e22ea1d2e72fb3:4cc33fdd0321ae4fa79758b3ecf2d84d714963c1647db15631a2f54bcf5a1ff25dda821fbdc36a973981868615bb71b2e80a1612100bc76ef458833f2014198e', 'individual', NULL, 'Camille Martin');
INSERT INTO food_offerings (hotel_id, product_name, quantity, unit, available_until, description)
VALUES (1, 'Paniers de fruits', 10, 'paniers', '2030-12-31 22:00:00', 'Donnée de démonstration.');
