use anchor_lang::prelude::*;
use crate::{RegisterPosition, errors::ErrorCode, state::YieldTier};

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
    emit!(crate::PositionRegistered {
        owner: pos.owner,
        mint: pos.mint,
        amount: pos.amount,
        tier: tier.as_u8(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Position registered. Tier: {:?}, Amount: {}", tier, amount);
    Ok(())
}