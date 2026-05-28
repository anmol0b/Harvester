export interface Position {
  id: number;
  owner: string;
  mint: string;
  amount: string;
  tier: "Retail" | "Institutional" | "Wholesale";
  last_claim_timestamp: Date;
  total_claimed: string;
  accrued_yield: string;
  registered_at: Date;
  updated_at: Date;
}

export interface ClaimHistory {
  id: number;
  owner: string;
  mint: string;
  yield_amount: string;
  total_claimed_after: string;
  tx_signature: string;
  slot: number;
  claimed_at: Date;
}


export interface PortfolioResponse {
  wallet: string;
  positions: Position[];
  total_value_locked: string;
  total_yield_claimed: string;
  positions_count: number;
}

export interface HistoryResponse {
  wallet: string;
  claims: ClaimHistory[];
  total_pages: number;
  page: number;
  total_claims: number;
}

export interface TopYielder {
  owner: string;
  total_claimed: string;
  position_count: number;
  rank: number;
}

export interface PositionRegisteredEvent {
  owner: string;
  mint: string;
  amount: bigint;
  tier: number;
  timestamp: bigint;
}

export interface YieldClaimedEvent {
  owner: string;
  mint: string;
  yieldAmount: bigint;
  totalClaimed: bigint;
  timestamp: bigint;
}

export interface ConfigUpdatedEvent {
  admin: string;
  oldRateBps: bigint;
  newRateBps: bigint;
  timestamp: bigint;
}

export interface PositionClosedEvent {
  owner: string;
  mint: string;
  totalClaimed: bigint;
  timestamp: bigint;
}