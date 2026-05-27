use anchor_lang::prelude::*;
use crate::{state::UserPosition, RegisterPosition};

pub fn handler(ctx: Context<RegisterPosition>, mint: Pubkey, amount: u64) -> Result<()> {
    require!(amount > 0, crate::error::ErrorCode::ZeroAmount);

    let pos = &mut ctx.accounts.position;
    pos.owner = ctx.accounts.owner.key();
    pos.mint = mint;
    pos.amount = amount;
    pos.last_claim_timestamp = Clock::get()?.unix_timestamp;
    pos.total_claimed = 0;
    pos.bump = ctx.bumps.position;

    msg!("Position registered. Owner: {}, Mint: {}, Amount: {}", 
        pos.owner, pos.mint, pos.amount);
    Ok(())
}