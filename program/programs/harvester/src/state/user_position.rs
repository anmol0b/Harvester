use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum YieldTier {
    Retail,
    Institutional,
    Wholesale,
}

impl YieldTier {
    pub fn bonus_bps(&self) -> u64 {
        match self {
            YieldTier::Retail => 0,
            YieldTier::Institutional => 20,
            YieldTier::Wholesale => 50,
        }
    }

    pub fn from_amount(amount: u64) -> Self {
        const UNIT: u64 = 1_000_000;
        if amount >= 10_000 * UNIT {
            YieldTier::Wholesale
        } else if amount >= 1_000 * UNIT {
            YieldTier::Institutional
        } else {
            YieldTier::Retail
        }
    }

    pub fn as_u8(&self) -> u8 {
        match self {
            YieldTier::Retail => 0,
            YieldTier::Institutional => 1,
            YieldTier::Wholesale => 2,
        }
    }
}

impl Default for YieldTier {
    fn default() -> Self { YieldTier::Retail }
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub last_claim_timestamp: i64,
    pub accrued_yield: u64,
    pub total_claimed: u64,
    pub tier: YieldTier,
    pub bump: u8,
}

impl UserPosition {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1;
    pub const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;
    pub const MIN_CLAIM_INTERVAL: i64 = 60;

    pub fn calculate_yield(&self, rate_bps: u64, now: i64) -> Option<u64> {
        let elapsed = now.checked_sub(self.last_claim_timestamp)? as u64;
        let effective_rate = rate_bps.checked_add(self.tier.bonus_bps())?;
        let result = (self.amount as u128)
            .checked_mul(effective_rate as u128)?
            .checked_mul(elapsed as u128)?
            .checked_div(10_000)?
            .checked_div(Self::SECONDS_PER_YEAR as u128)?;
        u64::try_from(result).ok()
    }
}