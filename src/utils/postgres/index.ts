import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  host: process.env.POSTGRES_HOST!,
  port: Number(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DATABASE!,
  ssl:
    process.env.APP_ENV === 'develop'
      ? false
      : {
          rejectUnauthorized: false,
        },
});

export const queryDatabase = async (query: string, values?: unknown[]) => {
  return await pool.query(query, values);
};
