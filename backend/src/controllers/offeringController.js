import pool from "../config/database.js";

function validateOffering(body) {
  const { hotelId, productName, quantity, unit, availableUntil } = body;

  if (!Number.isInteger(hotelId) || !productName || !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0 || !unit || !availableUntil) {
    return "hotelId, productName, quantity, unit et availableUntil sont obligatoires";
  }

  if (Number.isNaN(Date.parse(availableUntil)) || new Date(availableUntil) <= new Date()) {
    return "availableUntil doit être une date future valide";
  }

  return null;
}

export async function listAvailableOfferings(_request, response, next) {
  try {
    const offerings = await pool.query(
      `SELECT f.id, f.hotel_id AS hotelId, h.name AS hotelName,
              f.product_name AS productName, f.quantity, f.unit,
              f.available_until AS availableUntil, f.description, f.status
       FROM food_offerings f
       INNER JOIN hotels h ON h.id = f.hotel_id
       WHERE f.status = 'available' AND f.available_until > NOW()
       ORDER BY f.available_until ASC`,
    );
    response.json(offerings);
  } catch (error) {
    next(error);
  }
}

export async function createOffering(request, response, next) {
  const validationError = validateOffering(request.body);
  if (validationError) {
    return response.status(400).json({ error: validationError });
  }

  try {
    const {
      hotelId,
      productName,
      quantity,
      unit,
      availableUntil,
      description = null,
    } = request.body;
    const result = await pool.query(
      `INSERT INTO food_offerings
       (hotel_id, product_name, quantity, unit, available_until, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [hotelId, productName, quantity, unit, availableUntil, description],
    );
    response.status(201).json({ id: Number(result.insertId), status: "available" });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return response.status(400).json({ error: "L'hôtel indiqué n'existe pas" });
    }
    next(error);
  }
}
