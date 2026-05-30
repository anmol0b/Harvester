import { Idl } from "@coral-xyz/anchor";
import rawIdl from "../harvester.json";

export const IDL = rawIdl as Idl;

export const PROGRAM_ID_STRING: string =
  process.env.PROGRAM_ID ?? "AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W";