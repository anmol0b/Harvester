"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import useSWR from "swr";
import { PROGRAM_ID, PROGRAM_ID_PUBKEY, CONFIG_SEED } from "@/lib/constants";
import { HARVESTER_IDL } from "@/lib/idl";

export interface GlobalConfig {
  admin: string;
  yieldRateBps: number;
  yieldMint: string;
  paused: boolean;
  bump: number;
}

const coder = new BorshCoder(HARVESTER_IDL as any);

const [CONFIG_PDA] = PublicKey.findProgramAddressSync(
  [CONFIG_SEED],
  PROGRAM_ID_PUBKEY,
);

export function useGlobalConfig() {
  const { connection } = useConnection();

  const { data, error, isLoading } = useSWR(
    "globalConfig",
    async (): Promise<GlobalConfig> => {
      const info = await connection.getAccountInfo(CONFIG_PDA);
      if (!info) throw new Error("GlobalConfig account not found");

      const decoded = coder.accounts.decode("GlobalConfig", info.data);
      return {
        admin:        decoded.admin.toBase58(),
        yieldRateBps: decoded.yieldRateBps.toNumber(),
        yieldMint:    decoded.yieldMint.toBase58(),
        paused:       decoded.paused,
        bump:         decoded.bump,
      };
    },
    { refreshInterval: 60_000 },
  );

  return { config: data ?? null, isLoading, error };
}