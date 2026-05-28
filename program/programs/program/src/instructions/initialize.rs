use anchor_lang::prelude::*;
use crate::Initialize;

pub fn handler(ctx: Context<Initialize>, yield_rate_bps: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.yield_rate_bps = yield_rate_bps;
    config.yield_mint = ctx.accounts.yield_mint.key();
    config.paused = false;
    config.bump = ctx.bumps.config;

    msg!("Harvester initialized. Rate: {} bps, Mint: {}", 
        yield_rate_bps, config.yield_mint);
    Ok(())
}