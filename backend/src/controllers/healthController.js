import pool from "../config/database.js";

export async function getHealth(_request, response, next) {
  try {
    await pool.query("SELECT 1 AS database_ready");
    response.status(200).json({
      status: "ok",
      service: "anti-gaspillage-backend",
      database: "ok",
    });
  } catch (error) {
    next(error);
  }
}
