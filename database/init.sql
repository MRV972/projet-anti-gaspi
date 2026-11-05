CREATE DATABASE IF NOT EXISTS anti_gaspillage
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE anti_gaspillage;

-- Les tables métier seront ajoutées via les futures migrations.
CREATE TABLE IF NOT EXISTS hotels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS associations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_offerings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  available_until DATETIME NOT NULL,
  description TEXT NULL,
  status ENUM('available', 'requested', 'collected', 'cancelled') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_offering_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  INDEX idx_offerings_status_until (status, available_until)
);

CREATE TABLE IF NOT EXISTS pickup_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  offering_id INT UNSIGNED NOT NULL,
  association_id INT UNSIGNED NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_request_offering FOREIGN KEY (offering_id) REFERENCES food_offerings(id),
  CONSTRAINT fk_request_association FOREIGN KEY (association_id) REFERENCES associations(id),
  UNIQUE KEY unique_pending_request (offering_id, association_id)
);

CREATE TABLE IF NOT EXISTS distribution_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  offering_id INT UNSIGNED NOT NULL,
  individual_name VARCHAR(150) NOT NULL,
  contact VARCHAR(150) NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_distribution_offering FOREIGN KEY (offering_id) REFERENCES food_offerings(id),
  INDEX idx_distribution_status (offering_id, status)
);

INSERT INTO hotels (name)
SELECT 'Hôtel des Lumières'
WHERE NOT EXISTS (
  SELECT 1 FROM hotels WHERE name = 'Hôtel des Lumières'
);

INSERT INTO associations (name)
SELECT 'Association du Quartier'
WHERE NOT EXISTS (
  SELECT 1 FROM associations WHERE name = 'Association du Quartier'
);

INSERT INTO food_offerings
  (hotel_id, product_name, quantity, unit, available_until, description)
SELECT h.id, 'Plateaux-repas végétariens', 12, 'portions',
       '2030-12-31 22:00:00',
       'Exemple de denrée signalée par un hôtel.'
FROM hotels h
WHERE h.name = 'Hôtel des Lumières'
  AND NOT EXISTS (
    SELECT 1
    FROM food_offerings f
    WHERE f.hotel_id = h.id
      AND f.product_name = 'Plateaux-repas végétariens'
  );

INSERT INTO food_offerings
  (hotel_id, product_name, quantity, unit, available_until, description)
SELECT h.id, examples.product_name, examples.quantity, examples.unit,
       examples.available_until, examples.description
FROM hotels h
CROSS JOIN (
  SELECT 'Salades fraiches' AS product_name, 8 AS quantity, 'barquettes' AS unit,
         '2030-12-31 20:00:00' AS available_until,
         'Salades preparees le jour meme.' AS description
  UNION ALL
  SELECT 'Pains assortis', 15, 'pieces', '2030-12-31 21:00:00',
         'Pains et viennoiseries disponibles.'
  UNION ALL
  SELECT 'Fruits de saison', 10, 'kg', '2030-12-31 21:00:00',
         'Fruits frais a distribuer rapidement.'
  UNION ALL
  SELECT 'Desserts lactes', 20, 'portions', '2030-12-31 19:00:00',
         'Desserts conserves au frais.'
) AS examples
WHERE h.name = 'Hôtel des Lumières'
  AND NOT EXISTS (
    SELECT 1
    FROM food_offerings f
    WHERE f.hotel_id = h.id
      AND f.product_name = examples.product_name
  );

INSERT INTO food_offerings
  (hotel_id, product_name, quantity, unit, available_until, description)
SELECT h.id, examples.product_name, examples.quantity, examples.unit,
       examples.available_until, examples.description
FROM hotels h
CROSS JOIN (
  SELECT 'TEST - Lasagnes vegetariennes' AS product_name, 10 AS quantity, 'portions' AS unit,
         '2030-12-31 22:00:00' AS available_until,
         'Donnee de test disponible pour le parcours hotel-association.' AS description
  UNION ALL
  SELECT 'TEST - Paniers de fruits', 6, 'paniers', '2030-12-31 22:00:00',
         'Donnee de test disponible pour une association.'
  UNION ALL
  SELECT 'TEST - Soupes maison', 8, 'litres', '2030-12-31 21:00:00',
         'Donnee de test a recuperer rapidement.'
  UNION ALL
  SELECT 'TEST - Sandwichs frais', 14, 'pieces', '2030-12-31 20:00:00',
         'Donnee de test disponible aujourd hui.'
) AS examples
WHERE h.name = 'Hôtel des Lumières'
  AND NOT EXISTS (
    SELECT 1
    FROM food_offerings f
    WHERE f.hotel_id = h.id
      AND f.product_name = examples.product_name
  );
