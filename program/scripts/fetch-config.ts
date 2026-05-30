import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import { readFileSync } from "fs";

const CONFIG_PDA = new PublicKey("APWzfPzKWynwhNkKnzRgv923nbzCmTcmHwKN6ephJnAG");
const idl = JSON.parse(readFileSync("../harvester.json", "utf8"));

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const info = await connection.getAccountInfo(CONFIG_PDA);
  if (!info) { console.log("Not found"); return; }
  const coder = new BorshCoder(idl);
  const decoded = coder.accounts.decode("GlobalConfig", info.data);
  console.log(JSON.stringify(decoded, null, 2));
}

main().catch(console.error);
