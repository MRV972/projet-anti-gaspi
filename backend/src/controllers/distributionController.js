import pool from "../config/database.js";

export async function listDistributableOfferings(_request, response, next) {
  try {
    const offerings = await pool.query(
      `SELECT f.id, f.product_name AS productName, f.quantity, f.unit,
              f.description, a.name AS associationName
       FROM food_offerings f
       INNER JOIN pickup_requests p ON p.offering_id = f.id AND p.status = 'completed'
       INNER JOIN associations a ON a.id = p.association_id
       WHERE f.status = 'collected'
       ORDER BY f.created_at DESC`,
    );
    response.json(offerings);
  } catch (error) {
    next(error);
  }
}

export async function createDistributionRequest(request, response, next) {
  const { offeringId, individualName, contact, message = null } = request.body;

  if (!Number.isInteger(offeringId) || !individualName?.trim() || !contact?.trim()) {
    return response.status(400).json({
      error: "offeringId, individualName et contact sont obligatoires",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO distribution_requests
       (offering_id, individual_name, contact, message)
       SELECT ?, ?, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM food_offerings WHERE id = ? AND status = 'collected'
       )`,
      [offeringId, individualName.trim(), contact.trim(), message, offeringId],
    );

    if (!result.affectedRows) {
      return response.status(409).json({ error: "Cette denrée n'est pas encore distribuable" });
    }

    response.status(201).json({
      id: Number(result.insertId),
      offeringId,
      individualName: individualName.trim(),
      contact: contact.trim(),
      status: "pending",
    });
  } catch (error) {
    next(error);
  }
}

export async function listPendingDistributionRequests(_request, response, next) {
  try {
    const requests = await pool.query(
      `SELECT d.id, d.offering_id AS offeringId,
              d.individual_name AS individualName, d.contact, d.status,
              f.product_name AS productName, f.quantity, f.unit,
              a.name AS associationName
       FROM distribution_requests d
       INNER JOIN food_offerings f ON f.id = d.offering_id
       INNER JOIN pickup_requests p ON p.offering_id = f.id AND p.status = 'completed'
       INNER JOIN associations a ON a.id = p.association_id
       WHERE d.status = 'pending'
       ORDER BY d.created_at ASC`,
    );
    response.json(requests);
  } catch (error) {
    next(error);
  }
}

export async function completeDistributionRequest(request, response, next) {
  const requestId = Number(request.params.requestId);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return response.status(400).json({ error: "Identifiant de demande invalide" });
  }

  try {
    const result = await pool.query(
      `UPDATE distribution_requests
       SET status = 'fulfilled'
       WHERE id = ? AND status = 'pending'`,
      [requestId],
    );
    if (!result.affectedRows) {
      return response.status(409).json({ error: "Cette demande ne peut pas être confirmée" });
    }
    response.json({ status: "fulfilled", requestId });
  } catch (error) {
    next(error);
  }
}
