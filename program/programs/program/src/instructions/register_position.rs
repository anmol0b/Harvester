use anchor_lang::prelude::*;
use crate::{RegisterPosition, error::ErrorCode, state::YieldTier};

pub fn handler(ctx: Context<RegisterPosition>, mint: Pubkey, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::ZeroAmount);

    let tier = YieldTier::from_amount(amount);
    let pos = &mut ctx.accounts.position;
    pos.owner = ctx.accounts.owner.key();
    pos.mint = mint;
    pos.amount = amount;
    pos.last_claim_timestamp = Clock::get()?.unix_timestamp;
    pos.accrued_yield = 0;
    pos.total_claimed = 0;
    pos.tier = tier;
    pos.bump = ctx.bumps.position;

    msg!("Position registered. Tier: {:?}, Amount: {}", tier, amount);
    Ok(())
}