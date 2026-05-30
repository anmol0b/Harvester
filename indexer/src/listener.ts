import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import WebSocket from "ws";
import { db } from "./db";
import { IDL, PROGRAM_ID_STRING } from "./idl";
import {
  PositionRegisteredEvent,
  YieldClaimedEvent,
  ConfigUpdatedEvent,
  PositionClosedEvent,
} from "./types";

const RPC_WS   = process.env.RPC_WS   ?? "wss://api.devnet.solana.com";
const RPC_HTTP = process.env.RPC_HTTP  ?? "https://api.devnet.solana.com";


const coder  = new BorshCoder(IDL);
const parser = new EventParser(new PublicKey(PROGRAM_ID_STRING), coder);

async function processLogs(
  logs: string[],
  signature: string,
  slot: number,
): Promise<void> {
  for (const event of parser.parseLogs(logs)) {
    try {
      switch (event.name) {
        case "PositionRegistered":
          await db.upsertPosition(event.data as PositionRegisteredEvent, slot);
          break;

        case "YieldClaimed":
          await db.recordClaim(event.data as YieldClaimedEvent, signature, slot);
          break;

        case "PositionClosed":
          await db.markPositionClosed(event.data as PositionClosedEvent);
          break;

        case "ConfigUpdated": {
          const e = event.data as ConfigUpdatedEvent;
          console.log(
            `[event] ConfigUpdated — rate ${e.oldRateBps} → ${e.newRateBps} bps`,
          );
          break;
        }

        default:
          console.warn("[event] Unknown event name:", event.name);
      }
    } catch (err) {
      console.error(
        `[event] Failed to handle ${event.name} in tx ${signature.slice(0, 12)}…:`,
        (err as Error).message,
      );
    }
  }
}


export class WebSocketListener {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  start(): void {
    this.connect();
  }

  private connect(): void {
    console.log("[ws] Connecting to", RPC_WS);
    this.ws = new WebSocket(RPC_WS);

    this.ws.on("open", () => {
        this.reconnectAttempts = 0;
        console.log("[ws] Connected");
        this.subscribe();
    });

    this.ws.on("message", (raw: WebSocket.RawData) => {
      try {
        this.handleMessage(JSON.parse(raw.toString()));
      } catch (err) {
        console.error("[ws] Parse error:", (err as Error).message);
      }
    });

    this.ws.on("close", () => {
        const delay = Math.min(1_000 * 2 ** this.reconnectAttempts, 30_000);
        this.reconnectAttempts++;
        console.warn(`[ws] Disconnected — reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
    });

    this.ws.on("error", (err: Error) => {
      console.error("[ws] Error:", err.message);
    });
  }

  private subscribe(): void {
    this.ws?.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "logsSubscribe",
        params: [
          { mentions: [PROGRAM_ID_STRING] },
          { commitment: "confirmed" },
        ],
      }),
    );
    console.log("[ws] Subscribed to logs for", PROGRAM_ID_STRING);
  }

  private async handleMessage(msg: Record<string, unknown>): Promise<void> {
    // Subscription confirmation — ignore
    if (msg.id === 1 && typeof msg.result === "number") return;

    const params = msg.params as Record<string, unknown> | undefined;
    if (!params) return;

    const result    = params.result as Record<string, unknown> | undefined;
    const value     = result?.value as Record<string, unknown> | undefined;
    if (!value) return;

    const logs:      string[] = (value.logs as string[]) ?? [];
    const signature: string   = (value.signature as string) ?? "";
    const slot:      number   = Number(
      (result?.context as Record<string, unknown>)?.slot ?? 0,
    );

    if (logs.length > 0) {
      await processLogs(logs, signature, slot);
    }
  }

  stop(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}


export class GrpcListener {
  async start(): Promise<void> {
    const endpoint = process.env.YELLOWSTONE_ENDPOINT;
    const token    = process.env.YELLOWSTONE_TOKEN;

    if (!endpoint) throw new Error("YELLOWSTONE_ENDPOINT is not set in .env");

    const { default: Client } = await import("@triton-one/yellowstone-grpc");

    const client = new Client(endpoint, token ?? undefined, {
      // @ts-ignore
      "grpc.max_receive_message_length": 64 * 1024 * 1024,
    });

    console.log("[grpc] Connecting to Yellowstone at", endpoint);
    const stream = await client.subscribe();

    // Send filter: all non-vote, non-failed txs that touch our program
    await new Promise<void>((resolve, reject) => {
      stream.write(
        {
          transactions: {
            harvester: {
              vote:            false,
              failed:          false,
              accountInclude:  [PROGRAM_ID_STRING],
              accountExclude:  [],
              accountRequired: [],
            },
          },
          commitment: 1, // CONFIRMED
        },
        (err: Error | null | undefined) => (err ? reject(err) : resolve()),
      );
    });

    console.log("[grpc] Subscribed — listening for program transactions");

    stream.on("data", async (update: Record<string, unknown>) => {
      const txUpdate = update.transaction as Record<string, unknown> | undefined;
      if (!txUpdate) return;

      const meta      = (txUpdate.transaction as Record<string, unknown>)
                          ?.meta as Record<string, unknown> | undefined;
      const logs:      string[]   = (meta?.logMessages as string[]) ?? [];
      const sigBytes:  Uint8Array = (txUpdate.signature as Uint8Array) ?? new Uint8Array();
      const signature: string     = Buffer.from(sigBytes).toString("base64");
      const slot:      number     = Number(txUpdate.slot ?? 0);

      if (logs.length > 0) {
        await processLogs(logs, signature, slot);
      }
    });

    stream.on("error", (err: Error) => {
      console.error("[grpc] Stream error:", err.message);
      process.exit(1); // Let supervisor restart
    });

    stream.on("end", () => {
      console.warn("[grpc] Stream ended — exiting for restart");
      process.exit(1);
    });
  }
}


export class PollingListener {
  private connection = new Connection(RPC_HTTP, "confirmed");
  private lastSig: string | null = null;
  private timer: NodeJS.Timeout | null = null;

  start(): void {
    console.log("[poll] Starting polling listener (5s interval)");
    this.poll();
  }

  private async poll(): Promise<void> {
    try {
      const sigs = await this.connection.getSignaturesForAddress(
        new PublicKey(PROGRAM_ID_STRING),
        { until: this.lastSig ?? undefined, limit: 20 },
      );

      for (const sigInfo of sigs.reverse()) {
        if (sigInfo.err) continue;

        const tx = await this.connection.getTransaction(sigInfo.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });

        const logs = tx?.meta?.logMessages ?? [];
        await processLogs(logs, sigInfo.signature, sigInfo.slot ?? 0);
        this.lastSig = sigInfo.signature;
      }
    } catch (err) {
      console.error("[poll] Error:", (err as Error).message);
    }

    this.timer = setTimeout(() => this.poll(), 5_000);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}