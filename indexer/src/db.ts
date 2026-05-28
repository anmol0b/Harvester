import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ...(process.env.DATABASE_URL?.includes(':6543')
    ? { query_timeout: 10_000 }
    : {}),
});

pool.on('error', (err) => {
  console.error('[db] Idle client error:', err.message);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const ms = Date.now() - start;
    if (ms > 1_000) {
      console.warn(`[db] Slow query (${ms}ms): ${text.slice(0, 80)}`);
    }
    return result;
  } catch (err) {
    console.error('[db] Query error:', (err as Error).message, '\n', text);
    throw err;
  }
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function ping(): Promise<void> {
  await pool.query('SELECT 1');
}

export default pool;