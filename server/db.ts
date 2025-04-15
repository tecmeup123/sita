import pg from 'pg';
import { log } from './vite';
import { drizzle } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';

const { Pool } = pg;

// Create a PostgreSQL connection pool using environment variables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Drizzle ORM with PostgreSQL
export const db = drizzle(pool);

// Initialize Neon serverless (for edge functions if needed)
const sql = neon(process.env.DATABASE_URL || '');
export const neonDb = neonDrizzle(sql);

// Test the database connection
pool.connect()
  .then(client => {
    log('Database connection established');
    client.release();
  })
  .catch(err => {
    log(`Database connection error: ${err.message}`, 'error');
    console.error('Database connection error:', err);
  });

// Handle pool errors to prevent application crashes
pool.on('error', (err) => {
  log(`Unexpected database error: ${err.message}`, 'error');
  console.error('Unexpected error on PostgreSQL client:', err);
});

export default pool;