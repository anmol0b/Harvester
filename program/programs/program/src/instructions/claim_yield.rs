use anchor_lang::prelude::*;
use crate::{ClaimYield, error::ErrorCode};

pub fn handler(ctx: Context<ClaimYield>) -> Result<()> {
    let pos = &mut ctx.accounts.position;
    let config = &ctx.accounts.config;

    require!(!config.paused, ErrorCode::ProtocolPaused);

    let now = Clock::get()?.unix_timestamp;
    let elapsed = now - pos.last_claim_timestamp;

    require!(
        elapsed >= crate::state::UserPosition::MIN_CLAIM_INTERVAL,
        ErrorCode::NoYieldAccrued
    );

    let yield_amount = pos
        .calculate_yield(config.yield_rate_bps, now)
        .ok_or(ErrorCode::MathOverflow)?;

    require!(yield_amount > 0, ErrorCode::NoYieldAccrued);

    pos.total_claimed = pos.total_claimed
        .checked_add(yield_amount)
        .ok_or(ErrorCode::MathOverflow)?;
    pos.last_claim_timestamp = now;

    msg!("Yield claimed: {} tokens", yield_amount);
    Ok(())
}