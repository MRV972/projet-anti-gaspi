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
  const { email, password, role, displayName, entityId } = request.body;
  if (!email?.trim() || !password || password.length < 8 || !["hotel", "association", "individual"].includes(role) || !displayName?.trim()) {
    return response.status(400).json({ error: "Email, mot de passe (8 caractères minimum), profil et nom sont obligatoires" });
  }

  try {
    let linkedEntityId = null;
    if (role !== "individual") {
      if (!Number.isInteger(entityId)) return response.status(400).json({ error: "L'identifiant de votre établissement est obligatoire" });
      const table = role === "hotel" ? "hotels" : "associations";
      const entities = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [entityId]);
      if (!entities.length) return response.status(400).json({ error: "Ce profil métier n'existe pas" });
      linkedEntityId = entityId;
    }
    const result = await pool.query(
      `INSERT INTO user_accounts (email, password_hash, role, entity_id, display_name) VALUES (?, ?, ?, ?, ?)`,
      [email.trim().toLowerCase(), hashPassword(password), role, linkedEntityId, displayName.trim()],
    );
    const user = { id: Number(result.insertId), email: email.trim().toLowerCase(), role, entityId: linkedEntityId, displayName: displayName.trim() };
    response.status(201).json({ user, token: createSession(user) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return response.status(409).json({ error: "Cet email est déjà utilisé" });
    next(error);
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body;
  if (!email?.trim() || !password) return response.status(400).json({ error: "Email et mot de passe obligatoires" });
  try {
    const accounts = await pool.query("SELECT id, email, password_hash, role, entity_id AS entityId, display_name AS displayName FROM user_accounts WHERE email = ?", [email.trim().toLowerCase()]);
    if (!accounts.length || !passwordMatches(password, accounts[0].password_hash)) return response.status(401).json({ error: "Email ou mot de passe incorrect" });
    const { password_hash: _passwordHash, ...user } = accounts[0];
    response.json({ user, token: createSession(user) });
  } catch (error) { next(error); }
}

export function me(request, response) { response.json({ user: request.user }); }
export function logout(request, response) { removeSession(request); response.status(204).end(); }