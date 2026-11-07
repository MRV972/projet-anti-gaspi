import pool from "../config/database.js";

export async function listPendingPickupRequests(_request, response, next) {
  try {
    const requests = await pool.query(
      `SELECT p.id, p.offering_id AS offeringId, p.association_id AS associationId,
              f.product_name AS productName, f.quantity, f.unit,
              h.name AS hotelName, a.name AS associationName, p.status
       FROM pickup_requests p
       INNER JOIN food_offerings f ON f.id = p.offering_id
       INNER JOIN hotels h ON h.id = f.hotel_id
       INNER JOIN associations a ON a.id = p.association_id
       WHERE p.status IN ('pending', 'accepted')
       ORDER BY p.created_at ASC`,
    );
    response.json(requests);
  } catch (error) {
    next(error);
  }
}

export async function createPickupRequest(request, response, next) {
  const { offeringId, message = null } = request.body;

  if (!Number.isInteger(offeringId)) {
    return response.status(400).json({ error: "offeringId est obligatoire" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const offerings = await connection.query(
      "SELECT id, status FROM food_offerings WHERE id = ? FOR UPDATE",
      [offeringId],
    );

    if (!offerings.length || offerings[0].status !== "available") {
      await connection.rollback();
      return response.status(409).json({ error: "Cette denrée n'est plus disponible" });
    }

    const result = await connection.query(
      `INSERT INTO pickup_requests (offering_id, association_id, message)
       VALUES (?, ?, ?)`,
      [offeringId, request.user.entityId, message],
    );
    await connection.query(
      "UPDATE food_offerings SET status = 'requested' WHERE id = ?",
      [offeringId],
    );
    await connection.commit();
    response.status(201).json({
      id: Number(result.insertId),
      status: "pending",
      offeringId,
      associationId: request.user.entityId,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return response.status(400).json({ error: "L'association indiquée n'existe pas" });
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

export async function completePickupRequest(request, response, next) {
  const requestId = Number(request.params.requestId);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return response.status(400).json({ error: "Identifiant de demande invalide" });
  }

  try {
    const result = await pool.query(
      `UPDATE pickup_requests p
       INNER JOIN food_offerings f ON f.id = p.offering_id
       SET p.status = 'completed', f.status = 'collected'
       WHERE p.id = ? AND p.status IN ('pending', 'accepted')`,
      [requestId],
    );
    if (!result.affectedRows) {
      return response.status(409).json({ error: "Cette demande ne peut pas être marquée comme récupérée" });
    }
    response.json({ status: "completed", requestId });
  } catch (error) {
    next(error);
  }
}
