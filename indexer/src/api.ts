import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { db } from "./db";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    try {
      await db.ping();
      res.json({ status: "ok", service: "harvester-indexer", ts: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "degraded", db: "unreachable" });
    }
  });

  app.get("/portfolio/:wallet", async (req: Request, res: Response) => {
    try {
      const { wallet } = req.params;
      if (!wallet || wallet.length < 32) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      const portfolio = await db.getPortfolio(wallet);
      res.json(portfolio);
    } catch (err) {
      console.error("[api] /portfolio error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/history/:wallet", async (req: Request, res: Response) => {
    try {
      const { wallet }  = req.params;
      const page        = Math.max(1, parseInt(req.query.page as string) || 1);
      const perPage     = Math.min(100, parseInt(req.query.per_page as string) || 20);

      const { claims, total } = await db.getHistory(wallet, page, perPage);
      res.json({
        wallet,
        claims,
        page,
        per_page:    perPage,
        total_pages: Math.ceil(total / perPage),
        total_claims: total,
      });
    } catch (err) {
      console.error("[api] /history error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/yields/top", async (req: Request, res: Response) => {
    try {
      const limit   = Math.min(100, parseInt(req.query.limit as string) || 10);
      const leaders = await db.getTopYielders(limit);
      res.json({ leaders, retrieved_at: new Date().toISOString() });
    } catch (err) {
      console.error("[api] /yields/top error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/position/:wallet/:mint", async (req: Request, res: Response) => {
    try {
      const { wallet, mint } = req.params;
      const rows = await db.query(
        "SELECT * FROM positions WHERE owner = $1 AND mint = $2",
        [wallet, mint],
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json(rows[0]);
    } catch (err) {
      console.error("[api] /position error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/stats", async (_req: Request, res: Response) => {
    try {
      const rows = await db.query<{
        total_positions:    string;
        total_wallets:      string;
        total_yield_claimed: string;
        total_tvl:          string;
      }>(
        `SELECT
           COUNT(*)                                         AS total_positions,
           COUNT(DISTINCT owner)                            AS total_wallets,
           COALESCE(SUM(total_claimed::numeric), 0)::text  AS total_yield_claimed,
           COALESCE(SUM(amount::numeric), 0)::text         AS total_tvl
         FROM positions`,
      );
      res.json({ ...rows[0], retrieved_at: new Date().toISOString() });
    } catch (err) {
      console.error("[api] /stats error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api] Unhandled error:", err);
    res.status(500).json({ error: "Unexpected server error" });
  });

  return app;
}