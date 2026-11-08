import crypto from "node:crypto";
import pool from "../config/database.js";

export async function createInvitation(request, response, next) {
  const { role, entityId = null } = request.body;
  if (!["hotel", "association", "individual"].includes(role)) {
    return response.status(400).json({ error: "Profil invalide" });
  }
  if (role !== "individual" && !Number.isInteger(entityId)) {
    return response.status(400).json({ error: "Un établissement est obligatoire pour ce profil" });
  }
  try {
    const table = role === "hotel" ? "hotels" : "associations";
    if (role !== "individual") {
      const entities = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [entityId]);
      if (!entities.length) return response.status(400).json({ error: "Établissement introuvable" });
    }
    const key = `${role}-${crypto.randomBytes(12).toString("base64url")}`;
    const keyHash = crypto.createHash("sha256").update(key).digest("hex");
    await pool.query(
      "INSERT INTO invitation_keys (key_hash, role, entity_id, created_by) VALUES (?, ?, ?, ?)",
      [keyHash, role, role === "individual" ? null : entityId, request.user.id],
    );
    response.status(201).json({ key });
  } catch (error) {
    next(error);
  }
}

export async function listEntities(_request, response, next) {
  try {
    const hotels = await pool.query("SELECT id, name FROM hotels ORDER BY name");
    const associations = await pool.query("SELECT id, name FROM associations ORDER BY name");
    response.json({ hotels, associations });
  } catch (error) {
    next(error);
  }
}

export async function createEntity(request, response, next) {
    const { type, name } = request.body;
    if (!["hotel", "association"].includes(type) || !name?.trim()) {
      return response.status(400).json({ error: "Type et nom sont obligatoires" });
    }
    try {
      const table = type === "hotel" ? "hotels" : "associations";
      const result = await pool.query(`INSERT INTO ${table} (name) VALUES (?)`, [name.trim()]);
      response.status(201).json({ id: Number(result.insertId), name: name.trim(), type });
    } catch (error) {
      next(error);
    }
}

export async function listAccounts(_request, response, next) {
    try {
      const accounts = await pool.query(
        `SELECT u.id, u.email, u.role, u.entity_id AS entityId,
                CASE
                  WHEN u.role = 'hotel' THEN h.name
                  WHEN u.role = 'association' THEN a.name
                  ELSE u.display_name
                END AS displayName
         FROM user_accounts u
         LEFT JOIN hotels h ON u.role = 'hotel' AND h.id = u.entity_id
         LEFT JOIN associations a ON u.role = 'association' AND a.id = u.entity_id
         ORDER BY u.role, displayName`,
      );
      response.json(accounts);
    } catch (error) {
      next(error);
    }
}

export async function deleteAccount(request, response, next) {
    const accountId = Number(request.params.accountId);
    if (!Number.isInteger(accountId) || accountId === request.user.id) {
      return response.status(400).json({ error: "Ce compte ne peut pas être supprimé" });
    }
    try {
      const result = await pool.query("DELETE FROM user_accounts WHERE id = ? AND role <> 'admin'", [accountId]);
      if (!result.affectedRows) return response.status(404).json({ error: "Compte introuvable" });
      response.status(204).end();
    } catch (error) {
      next(error);
    }
}

export async function createPasswordResetKey(request, response, next) {
    const accountId = Number(request.params.accountId);
    if (!Number.isInteger(accountId)) return response.status(400).json({ error: "Compte invalide" });
    try {
      const accounts = await pool.query("SELECT id FROM user_accounts WHERE id = ?", [accountId]);
      if (!accounts.length) return response.status(404).json({ error: "Compte introuvable" });
      const key = `reset-${crypto.randomBytes(12).toString("base64url")}`;
      const keyHash = crypto.createHash("sha256").update(key).digest("hex");
      await pool.query("UPDATE password_reset_keys SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL", [accountId]);
      await pool.query("INSERT INTO password_reset_keys (key_hash, user_id) VALUES (?, ?)", [keyHash, accountId]);
      response.status(201).json({ key });
    } catch (error) {
      next(error);
  }
}
