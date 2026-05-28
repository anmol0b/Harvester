use anchor_lang::prelude::*;
use crate::{UpdateConfig, error::ErrorCode};

pub fn handler(ctx: Context<UpdateConfig>, new_rate_bps: u64, paused: bool) -> Result<()> {
    require!(new_rate_bps <= 10_000, ErrorCode::InvalidRate);

    let config = &mut ctx.accounts.config;
    config.yield_rate_bps = new_rate_bps;
    config.paused = paused;

    msg!("Config updated. Rate: {} bps, Paused: {}", new_rate_bps, paused);
    Ok(())
}