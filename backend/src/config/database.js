import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  charset: "utf8mb4",
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  bigIntAsNumber: true,
});

export default pool;
