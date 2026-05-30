import * as anchor from "@coral-xyz/anchor";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";

const PROGRAM_ID = new PublicKey("AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W");
const RPC = "https://api.devnet.solana.com";

async function main() {
  console.log("Starting initialization...");
  // Load admin keypair
  const raw = readFileSync(`${homedir()}/.config/solana/id.json`, "utf8");
  const admin = Keypair.fromSecretKey(Buffer.from(JSON.parse(raw)));

  const connection = new Connection(RPC, "confirmed");
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });

  // Load IDL
  const idl = JSON.parse(readFileSync("../harvester.json", "utf8"));
  const program = new anchor.Program(idl, provider);

  // Yield mint keypair (new mint for HRVST token)
  const yieldMint = Keypair.generate();
  console.log("Yield mint:", yieldMint.publicKey.toBase58());

  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  console.log("Config PDA:", configPDA.toBase58());

  const yieldRateBps = 820; // 8.20% APY

  const tx = await program.methods
    .initialize(new anchor.BN(yieldRateBps))
    .accounts({
      admin: admin.publicKey,
      config: configPDA,
      yieldMint: yieldMint.publicKey,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([yieldMint])
    .rpc();

  console.log("✓ Initialized! tx:", tx);
  console.log("Save this yield mint:", yieldMint.publicKey.toBase58());
}

main().catch(console.error);