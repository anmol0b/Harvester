// src/index.ts

import "dotenv/config";
import { createApp } from "./api";
import { WebSocketListener, GrpcListener, PollingListener } from "./listener";
import { db } from "./db";

const PORT          = parseInt(process.env.PORT ?? "3001", 10);
const LISTENER_MODE = (process.env.LISTENER_MODE ?? "ws").toLowerCase();

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  🌾 Harvester Indexer  |  mode: ${LISTENER_MODE.toUpperCase()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    await db.ping();
    console.log("[main] Database connection OK");
  } catch (err) {
    console.error("[main] Cannot reach database:", (err as Error).message);
    process.exit(1);
  }

  if (LISTENER_MODE === "grpc") {
    const listener = new GrpcListener();
    await listener.start();
  } else if (LISTENER_MODE === "poll") {
    const listener = new PollingListener();
    listener.start();
  } else {
    // default: ws
    const listener = new WebSocketListener();
    listener.start();
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[api] Listening on http://localhost:${PORT}`);
    console.log(`      GET /health`);
    console.log(`      GET /portfolio/:wallet`);
    console.log(`      GET /history/:wallet?page=1&per_page=20`);
    console.log(`      GET /yields/top?limit=10`);
    console.log(`      GET /position/:wallet/:mint`);
    console.log(`      GET /stats`);
  });

  process.on("SIGTERM", () => {
    console.log("[main] SIGTERM received — shutting down");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[main] Fatal:", err);
  process.exit(1);
});