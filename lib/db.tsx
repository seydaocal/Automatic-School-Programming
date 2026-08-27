import { Pool, types } from 'pg';

types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export default pool;
