import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import fs   from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const RPC_HTTP   = process.env.RPC_HTTP  ?? "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID ?? "AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W",
);

const walletPath = path.resolve(
  process.env.HOME ?? "~",
  ".config/solana/id.json",
);
const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8"))),
);
console.log("Wallet:", walletKeypair.publicKey.toBase58());

const connection = new Connection(RPC_HTTP, "confirmed");
const wallet     = new anchor.Wallet(walletKeypair);
const provider   = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

const idl = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../../harvester.json"), "utf-8"),
);
const program = new anchor.Program(idl, provider);

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID,
);

async function main() {
  let needsInit = false;
  try {
    await (program.account as any).globalConfig.fetch(configPda);
    console.log("✓ GlobalConfig already exists at", configPda.toBase58());
  } catch {
    needsInit = true;
    console.log("GlobalConfig not found — will initialize");
  }

  const yieldMintKp = Keypair.generate();

  if (needsInit) {
    console.log("\n── initialize ──");
    console.log("  yield_mint keypair:", yieldMintKp.publicKey.toBase58());

    const tx = await (program.methods as any)
      .initialize(new anchor.BN(500)) // 500 bps = 5% APY
      .accounts({
        admin:         walletKeypair.publicKey,
        config:        configPda,
        yieldMint:     yieldMintKp.publicKey,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([yieldMintKp])
      .rpc();

    console.log("  ✓ initialize tx:", tx);
    console.log("  Explorer: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
  }

  const config = await (program.account as any).globalConfig.fetch(configPda);
  console.log("\nGlobalConfig:");
  console.log("  admin:          ", config.admin.toBase58());
  console.log("  yield_rate_bps: ", config.yieldRateBps.toString());
  console.log("  yield_mint:     ", config.yieldMint.toBase58());
  console.log("  paused:         ", config.paused);

  const assetMint = config.yieldMint as PublicKey;
  const amount    = new anchor.BN(1_000_000);

  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position"),
      walletKeypair.publicKey.toBuffer(),
      assetMint.toBuffer(),
    ],
    PROGRAM_ID,
  );

  let positionExists = false;
  try {
    await (program.account as any).userPosition.fetch(positionPda);
    positionExists = true;
    console.log("\n✓ Position already exists at", positionPda.toBase58());
  } catch {
    positionExists = false;
  }

  if (!positionExists) {
    console.log("\n── register_position ──");
    console.log("  mint:   ", assetMint.toBase58());
    console.log("  amount: ", amount.toString());
    console.log("  pda:    ", positionPda.toBase58());

    const tx = await (program.methods as any)
      .registerPosition(assetMint, amount)
      .accounts({
        owner:         walletKeypair.publicKey,
        config:        configPda,
        position:      positionPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ register_position tx:", tx);
    console.log("  Explorer: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    console.log("\n  👀 Check indexer terminal for:");
    console.log("     [event] PositionRegistered");
    console.log("     [db] upsertPosition");
  }

  console.log("\n── Verify via API ──");
  console.log(
    `  curl http://localhost:3001/portfolio/${walletKeypair.publicKey.toBase58()}`,
  );
  console.log("  curl http://localhost:3001/stats");
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});