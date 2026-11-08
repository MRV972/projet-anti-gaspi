import crypto from "node:crypto";
import pool from "../config/database.js";
import { createSession, removeSession } from "../middlewares/auth.js";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password, storedHash) {
  const [salt, expected] = storedHash.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function register(request, response, next) {
  const { email, password, role, displayName, invitationKey } = request.body;
  if (!email?.trim() || !password || password.length < 8 || !["hotel", "association", "individual"].includes(role)) {
    return response.status(400).json({ error: "Email, mot de passe (8 caractères minimum) et profil sont obligatoires" });
  }

  try {
    if (!invitationKey?.trim()) return response.status(400).json({ error: "La clé d'invitation est obligatoire" });
    const keyHash = crypto.createHash("sha256").update(invitationKey.trim()).digest("hex");
    const keys = await pool.query("SELECT id, role, entity_id AS entityId FROM invitation_keys WHERE key_hash = ? AND used_at IS NULL", [keyHash]);
    if (!keys.length || keys[0].role !== role) return response.status(400).json({ error: "Clé d'invitation invalide ou déjà utilisée" });
    const linkedEntityId = keys[0].entityId;
    let accountName = displayName?.trim();
    if (role !== "individual") {
      const table = role === "hotel" ? "hotels" : "associations";
      const entities = await pool.query(`SELECT name FROM ${table} WHERE id = ?`, [linkedEntityId]);
      if (!entities.length) return response.status(400).json({ error: "L'établissement lié à cette clé n'existe plus" });
      accountName = entities[0].name;
    }
    if (!accountName) return response.status(400).json({ error: "Le nom est obligatoire pour un particulier" });
    const result = await pool.query(
      `INSERT INTO user_accounts (email, password_hash, role, entity_id, display_name) VALUES (?, ?, ?, ?, ?)`,
      [email.trim().toLowerCase(), hashPassword(password), role, linkedEntityId, accountName],
    );
    await pool.query("UPDATE invitation_keys SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [keys[0].id]);
    const user = { id: Number(result.insertId), email: email.trim().toLowerCase(), role, entityId: linkedEntityId, displayName: accountName };
    response.status(201).json({ user, token: createSession(user) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return response.status(409).json({ error: "Cet email est déjà utilisé" });
    next(error);
  }
}

export async function resetPassword(request, response, next) {
    const { email, password, resetKey } = request.body;
    if (!email?.trim() || !password || password.length < 8 || !resetKey?.trim()) {
      return response.status(400).json({ error: "Email, clé et mot de passe (8 caractères minimum) sont obligatoires" });
    }
    try {
      const keyHash = crypto.createHash("sha256").update(resetKey.trim()).digest("hex");
      const keys = await pool.query(
        "SELECT id, user_id AS userId FROM password_reset_keys WHERE key_hash = ? AND used_at IS NULL",
        [keyHash],
      );
      if (!keys.length) return response.status(400).json({ error: "Clé de réinitialisation invalide ou déjà utilisée" });
      const result = await pool.query(
        "UPDATE user_accounts SET password_hash = ? WHERE id = ? AND email = ?",
        [hashPassword(password), keys[0].userId, email.trim().toLowerCase()],
      );
      if (!result.affectedRows) return response.status(400).json({ error: "Email incorrect pour cette clé" });
      await pool.query("UPDATE password_reset_keys SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [keys[0].id]);
      response.json({ message: "Mot de passe réinitialisé" });
    } catch (error) {
      next(error);
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body;
  if (!email?.trim() || !password) return response.status(400).json({ error: "Email et mot de passe obligatoires" });
  try {
    const accounts = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.entity_id AS entityId,
              CASE
                WHEN u.role = 'hotel' THEN h.name
                WHEN u.role = 'association' THEN a.name
                ELSE u.display_name
              END AS displayName
       FROM user_accounts u
       LEFT JOIN hotels h ON u.role = 'hotel' AND h.id = u.entity_id
       LEFT JOIN associations a ON u.role = 'association' AND a.id = u.entity_id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()],
    );
    if (!accounts.length || !passwordMatches(password, accounts[0].password_hash)) return response.status(401).json({ error: "Email ou mot de passe incorrect" });
    const { password_hash: _passwordHash, ...user } = accounts[0];
    response.json({ user, token: createSession(user) });
  } catch (error) { next(error); }
}

export function me(request, response) { response.json({ user: request.user }); }
export function logout(request, response) { removeSession(request); response.status(204).end(); }