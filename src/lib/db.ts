
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool;

try {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set.');
    pool = {
      query: () => Promise.reject(new Error("DATABASE_URL environment variable is not set. Database pool not initialized.")),
    } as any;
  } else {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    pool.connect((err, client, release) => {
      if (err) {
        console.error('Error acquiring client for initial connection test:', err.stack);
      } else if (client) {
        client.query('SELECT NOW()', (err, result) => {
          release();
          if (err) {
            console.error('Error executing initial query test:', err.stack);
          } else {
            console.log('Successfully connected to PostgreSQL. Server time:', result.rows[0].now);
          }
        });
      }
    });
  }
} catch (error) {
  console.error("Failed to initialize PostgreSQL connection pool:", error);
  pool = {
    query: () => Promise.reject(new Error("Database pool not initialized due to an error during setup. Check console logs.")),
  } as any;
}


export const query = (text: string, params?: unknown[]) => {
  if (!pool || typeof pool.query !== 'function') { 
     return Promise.reject(new Error("Database pool not initialized or not configured correctly. Cannot execute query."));
  }
  return pool.query(text, params);
};
