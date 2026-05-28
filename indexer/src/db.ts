import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import {
  PositionRegisteredEvent,
  YieldClaimedEvent,
  PositionClosedEvent,
  PortfolioResponse,
  TopYielder,
} from "./types";


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[db] Idle client error:", err.message);
});


function toTimestamp(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "bigint") return Number(val);
  // BN object
  if (typeof (val as any).toNumber === "function") return (val as any).toNumber();
  // Fallback: parse string — handle both decimal and hex
  const s = String(val);
  return s.startsWith("0x") || /^[0-9a-f]+$/i.test(s)
    ? parseInt(s, 16)
    : parseInt(s, 10);
}

function toAmountString(val: unknown): string {
  if (val === null || val === undefined) return "0";
  if (typeof val === "bigint") return val.toString();
  if (typeof val === "number") return val.toString();
  // BN object
  if (typeof (val as any).toString === "function") {
    const s = (val as any).toString();
    // If BN gave us hex, convert to decimal
    if (/^[0-9a-f]+$/i.test(s) && !/^\d+$/.test(s)) {
      return BigInt("0x" + s).toString();
    }
    return s;
  }
  return String(val);
}


async function rawQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result: QueryResult<T> = await pool.query<T>(text, params);
  return result.rows;
}

async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function tierName(tier: number | string): "Retail" | "Institutional" | "Wholesale" {
  if (typeof tier === "string" && ["Retail", "Institutional", "Wholesale"].includes(tier)) {
    return tier as "Retail" | "Institutional" | "Wholesale";
  }
  const map: Record<number, "Retail" | "Institutional" | "Wholesale"> = {
    0: "Retail",
    1: "Institutional",
    2: "Wholesale",
  };
  return map[Number(tier)] ?? "Retail";
}

async function upsertPosition(
  event: PositionRegisteredEvent,
  _slot: number,
): Promise<void> {
  await rawQuery(
    `INSERT INTO positions
       (owner, mint, amount, tier, last_claim_timestamp, registered_at, updated_at)
     VALUES ($1, $2, $3, $4, to_timestamp($5), NOW(), NOW())
     ON CONFLICT (owner, mint) DO UPDATE SET
       amount               = EXCLUDED.amount,
       tier                 = EXCLUDED.tier,
       last_claim_timestamp = EXCLUDED.last_claim_timestamp,
       updated_at           = NOW()`,
    [
      event.owner.toString(),
      event.mint.toString(),
      toAmountString(event.amount),
      tierName(event.tier),
      toTimestamp(event.timestamp),
    ],
  );
  console.log(`[db] upsertPosition owner=${event.owner.toString().slice(0, 8)}… mint=${event.mint.toString().slice(0, 8)}…`);
}

async function recordClaim(
  event: YieldClaimedEvent,
  txSignature: string,
  slot: number,
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO claim_history
         (owner, mint, yield_amount, total_claimed_after, tx_signature, slot, claimed_at)
       VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7))
       ON CONFLICT (tx_signature) DO NOTHING`,
       [
        event.owner.toString(),
        event.mint.toString(),
        toAmountString(event.yieldAmount),
        toAmountString(event.totalClaimed),
        txSignature,
        slot,
        toTimestamp(event.timestamp),
    ],
    );

    await client.query(
      `UPDATE positions SET
         total_claimed        = $3,
         last_claim_timestamp = to_timestamp($4),
         updated_at           = NOW()
       WHERE owner = $1 AND mint = $2`,
      [event.owner, event.mint, event.totalClaimed.toString(), event.timestamp],
    );
  });
  console.log(`[db] recordClaim owner=${event.owner.slice(0, 8)}… yield=${event.yieldAmount}`);
}

async function markPositionClosed(event: PositionClosedEvent): Promise<void> {
  await rawQuery(`DELETE FROM positions WHERE owner = $1 AND mint = $2`, [
    event.owner,
    event.mint,
  ]);
  console.log(`[db] markPositionClosed owner=${event.owner.slice(0, 8)}…`);
}


async function getPortfolio(wallet: string): Promise<PortfolioResponse> {
  const rows = await rawQuery(
    `SELECT * FROM positions WHERE owner = $1 ORDER BY registered_at DESC`,
    [wallet],
  );

  let tvl = BigInt(0);
  let totalYield = BigInt(0);
  for (const row of rows) {
    tvl += BigInt(row.amount ?? "0");
    totalYield += BigInt(row.total_claimed ?? "0");
  }

  return {
    wallet,
    positions: rows as any,
    total_value_locked: tvl.toString(),
    total_yield_claimed: totalYield.toString(),
    positions_count: rows.length,
  };
}

async function getHistory(
  wallet: string,
  page: number,
  perPage: number,
): Promise<{ claims: unknown[]; total: number }> {
  const offset = (page - 1) * perPage;
  const [claims, countRows] = await Promise.all([
    rawQuery(
      `SELECT * FROM claim_history WHERE owner = $1 ORDER BY claimed_at DESC LIMIT $2 OFFSET $3`,
      [wallet, perPage, offset],
    ),
    rawQuery<{ count: string }>(
      `SELECT COUNT(*) AS count FROM claim_history WHERE owner = $1`,
      [wallet],
    ),
  ]);
  return { claims, total: parseInt(countRows[0]?.count ?? "0", 10) };
}

async function getTopYielders(limit: number): Promise<TopYielder[]> {
  const rows = await rawQuery<{
    owner: string;
    total_claimed: string;
    position_count: string;
  }>(
    `SELECT
       owner,
       SUM(total_claimed::numeric)::text AS total_claimed,
       COUNT(*) AS position_count
     FROM positions
     GROUP BY owner
     ORDER BY SUM(total_claimed::numeric) DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((row, i) => ({
    owner: row.owner,
    total_claimed: row.total_claimed,
    position_count: parseInt(row.position_count, 10),
    rank: i + 1,
  }));
}

async function ping(): Promise<void> {
  await pool.query("SELECT 1");
}

export const db = {
  query: rawQuery,
  upsertPosition,
  recordClaim,
  markPositionClosed,
  getPortfolio,
  getHistory,
  getTopYielders,
  ping,
};

export default db;