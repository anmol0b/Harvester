use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub yield_rate_bps: u64,
    pub paused: bool,
    pub bump: u8,
}

impl GlobalConfig {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 1;
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub last_claim_timestamp: i64,
    pub total_claimed: u64,
    pub bump: u8,
}

impl UserPosition {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1;
    pub const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;
    pub const MIN_CLAIM_INTERVAL: i64 = 60;

    pub fn calculate_yield(&self, rate_bps: u64, now: i64) -> Option<u64> {
        let elapsed = now.checked_sub(self.last_claim_timestamp)? as u64;
        let result = (self.amount as u128)
            .checked_mul(rate_bps as u128)?
            .checked_mul(elapsed as u128)?
            .checked_div(10_000)?
            .checked_div(Self::SECONDS_PER_YEAR as u128)?;
        u64::try_from(result).ok()
    }
}