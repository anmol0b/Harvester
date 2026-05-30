import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import { readFileSync } from "fs";

// Replace with your wallet address
const OWNER = new PublicKey("BSKVVJLS4jTXyjKSqmSeQ7VWkM1Bq6w4HiGETmfaahWY");
const MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const PROGRAM_ID = new PublicKey("AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W");
const idl = JSON.parse(readFileSync("../harvester.json", "utf8"));

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const [positionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), OWNER.toBuffer(), MINT.toBuffer()],
    PROGRAM_ID
  );
  
  console.log("Position PDA:", positionPDA.toBase58());
  const info = await connection.getAccountInfo(positionPDA);
  if (!info) { console.log("Position not found"); return; }
  
  const coder = new BorshCoder(idl);
  const decoded = coder.accounts.decode("UserPosition", info.data);
  console.log(JSON.stringify(decoded, null, 2));
}

main().catch(console.error);
