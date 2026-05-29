import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { RPC_URL } from "./constants";

const KNOWN_MINTS: Record<string, { symbol: string; decimals: number }> = {
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": { symbol: "USDC",    decimals: 6  },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT",    decimals: 6  },
  "So11111111111111111111111111111111111111112":    { symbol: "SOL",     decimals: 9  },
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": { symbol: "mSOL",    decimals: 9  },
};

export interface MintInfo {
  symbol: string;
  decimals: number;
}

const cache = new Map<string, MintInfo>();

for (const [addr, info] of Object.entries(KNOWN_MINTS)) {
  cache.set(addr, info);
}

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

async function getSymbolFromMetaplex(
  connection: Connection,
  mint: PublicKey,
): Promise<string | null> {
  try {
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID,
    );

    const accountInfo = await connection.getAccountInfo(metadataPda);
    if (!accountInfo) return null;

    const data = accountInfo.data;
    const nameLen = data.readUInt32LE(69);
    const symbolOffset = 69 + 4 + nameLen;
    const symbolLen = data.readUInt32LE(symbolOffset);
    const symbol = data
      .slice(symbolOffset + 4, symbolOffset + 4 + symbolLen)
      .toString("utf8")
      .replace(/\0/g, "")
      .trim();

    return symbol.length > 0 ? symbol : null;
  } catch {
    return null;
  }
}


export async function getMintInfo(mintAddress: string): Promise<MintInfo> {

  const cached = cache.get(mintAddress);
  if (cached) return cached;

  const connection = new Connection(RPC_URL, "confirmed");
  const mintPubkey = new PublicKey(mintAddress);

  let decimals = 6;
  try {
    const mintAccount = await getMint(connection, mintPubkey);
    decimals = mintAccount.decimals;
  } catch {
  }

  const metaplexSymbol = await getSymbolFromMetaplex(connection, mintPubkey);
  const symbol = metaplexSymbol ?? shortenMint(mintAddress);

  const info: MintInfo = { symbol, decimals };
  cache.set(mintAddress, info);
  return info;
}

export async function getMintInfoBatch(
  mintAddresses: string[],
): Promise<Record<string, MintInfo>> {
  const unique = [...new Set(mintAddresses)];
  const results = await Promise.all(
    unique.map(async (addr) => ({ addr, info: await getMintInfo(addr) })),
  );
  return Object.fromEntries(results.map(({ addr, info }) => [addr, info]));
}

function shortenMint(addr: string): string {
  return addr.slice(0, 4).toUpperCase();
}