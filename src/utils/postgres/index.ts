import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_CONNECTION_STRING!,
});

export const queryDatabase = async (query: string, values?: unknown[]) => {
  return await pool.query(query, values);
};
