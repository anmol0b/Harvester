"use client";

import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID_PUBKEY as PROGRAM_ID, TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  CONFIG_SEED,
  POSITION_SEED,
} from "@/lib/constants";
import { HARVESTER_IDL } from "@/lib/idl";

type TxStatus = "idle" | "signing" | "confirming" | "success" | "error";

interface TxState {
  status: TxStatus;
  signature?: string;
  error?: string;
}

function useTxState() {
  const [state, setState] = useState<TxState>({ status: "idle" });
  const reset = () => setState({ status: "idle" });
  return { state, setState, reset };
}

export function useConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
  return pda;
}

export function usePositionPDA(owner: PublicKey | null, mint: PublicKey | null): PublicKey | null {
  if (!owner || !mint) return null;
  const [pda] = PublicKey.findProgramAddressSync(
    [POSITION_SEED, owner.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

// Derive ATA
function getATA(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}

export function useHarvester() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const registerTx = useTxState();
  const claimTx = useTxState();
  const closeTx = useTxState();
  const updateTx = useTxState();

  const getProgram = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as anchor.Wallet,
      { commitment: "confirmed", preflightCommitment: "confirmed" }
    );
    return new anchor.Program(HARVESTER_IDL, provider);
  }, [connection, wallet]);

  const registerPosition = useCallback(
    async (mintStr: string, amount: number) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) {
        registerTx.setState({ status: "error", error: "Wallet not connected" });
        return;
      }

      registerTx.setState({ status: "signing" });
      try {
        const mint = new PublicKey(mintStr);
        const amountBN = new BN(amount);

        const [configPDA] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
        const [positionPDA] = PublicKey.findProgramAddressSync(
          [POSITION_SEED, wallet.publicKey.toBuffer(), mint.toBuffer()],
          PROGRAM_ID
        );

        const sig = await program.methods
          .registerPosition(mint, amountBN)
          .accounts({
            owner: wallet.publicKey,
            config: configPDA,
            position: positionPDA,
            systemProgram: SYSTEM_PROGRAM_ID,
          })
          .rpc();

        registerTx.setState({ status: "confirming", signature: sig });
        await connection.confirmTransaction(sig, "confirmed");
        registerTx.setState({ status: "success", signature: sig });
        return sig;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        registerTx.setState({ status: "error", error: msg });
        console.error("registerPosition error:", e);
      }
    },
    [getProgram, wallet.publicKey, connection, registerTx]
  );

  const claimYield = useCallback(
    async (mintStr: string, yieldMintStr: string) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) {
        claimTx.setState({ status: "error", error: "Wallet not connected" });
        return;
      }

      claimTx.setState({ status: "signing" });
      try {
        const mint = new PublicKey(mintStr);
        const yieldMint = new PublicKey(yieldMintStr);

        const [configPDA] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
        const [positionPDA] = PublicKey.findProgramAddressSync(
          [POSITION_SEED, wallet.publicKey.toBuffer(), mint.toBuffer()],
          PROGRAM_ID
        );
        const userYieldATA = getATA(wallet.publicKey, yieldMint);

        const sig = await program.methods
          .claimYield()
          .accounts({
            owner: wallet.publicKey,
            config: configPDA,
            position: positionPDA,
            yieldMint,
            userYieldAta: userYieldATA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SYSTEM_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        claimTx.setState({ status: "confirming", signature: sig });
        await connection.confirmTransaction(sig, "confirmed");
        claimTx.setState({ status: "success", signature: sig });
        return sig;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        claimTx.setState({ status: "error", error: msg });
        console.error("claimYield error:", e);
      }
    },
    [getProgram, wallet.publicKey, connection, claimTx]
  );

  const closePosition = useCallback(
    async (mintStr: string) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) {
        closeTx.setState({ status: "error", error: "Wallet not connected" });
        return;
      }

      closeTx.setState({ status: "signing" });
      try {
        const mint = new PublicKey(mintStr);
        const [positionPDA] = PublicKey.findProgramAddressSync(
          [POSITION_SEED, wallet.publicKey.toBuffer(), mint.toBuffer()],
          PROGRAM_ID
        );

        const sig = await program.methods
          .closePosition()
          .accounts({
            owner: wallet.publicKey,
            position: positionPDA,
          })
          .rpc();

        closeTx.setState({ status: "confirming", signature: sig });
        await connection.confirmTransaction(sig, "confirmed");
        closeTx.setState({ status: "success", signature: sig });
        return sig;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        closeTx.setState({ status: "error", error: msg });
        console.error("closePosition error:", e);
      }
    },
    [getProgram, wallet.publicKey, connection, closeTx]
  );

  const updateConfig = useCallback(
    async (newRateBps: number, paused: boolean) => {
      const program = getProgram();
      if (!program || !wallet.publicKey) {
        updateTx.setState({ status: "error", error: "Wallet not connected" });
        return;
      }

      updateTx.setState({ status: "signing" });
      try {
        const [configPDA] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);

        const sig = await program.methods
          .updateConfig(new BN(newRateBps), paused)
          .accounts({
            admin: wallet.publicKey,
            config: configPDA,
          })
          .rpc();

        updateTx.setState({ status: "confirming", signature: sig });
        await connection.confirmTransaction(sig, "confirmed");
        updateTx.setState({ status: "success", signature: sig });
        return sig;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        updateTx.setState({ status: "error", error: msg });
        console.error("updateConfig error:", e);
      }
    },
    [getProgram, wallet.publicKey, connection, updateTx]
  );

  return {
    registerPosition,
    claimYield,
    closePosition,
    updateConfig,
    registerTx: registerTx.state,
    claimTx: claimTx.state,
    closeTx: closeTx.state,
    updateTx: updateTx.state,
    resetRegister: registerTx.reset,
    resetClaim: claimTx.reset,
    resetClose: closeTx.reset,
    connected: !!wallet.publicKey,
    wallet,
  };
}