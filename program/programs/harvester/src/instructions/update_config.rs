use anchor_lang::prelude::*;
use crate::{UpdateConfig, errors::ErrorCode};

pub fn handler(ctx: Context<UpdateConfig>, new_rate_bps: u64, paused: bool) -> Result<()> {
    require!(new_rate_bps <= 10_000, ErrorCode::InvalidRate);

    let old_rate = ctx.accounts.config.yield_rate_bps;
    let config = &mut ctx.accounts.config;
    config.yield_rate_bps = new_rate_bps;
    config.paused = paused;

    emit!(crate::ConfigUpdated {
        admin: ctx.accounts.admin.key(),
        old_rate_bps: old_rate,
        new_rate_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Config updated. Rate: {} bps, Paused: {}", new_rate_bps, paused);
    Ok(())
}