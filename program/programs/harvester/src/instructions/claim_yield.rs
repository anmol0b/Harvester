use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo};
use crate::{ClaimYield, errors::ErrorCode, state::UserPosition};

pub fn handler(ctx: Context<ClaimYield>) -> Result<()> {
    let config = &ctx.accounts.config;
    require!(!config.paused, ErrorCode::ProtocolPaused);

    let now = Clock::get()?.unix_timestamp;
    let pos = &ctx.accounts.position;

    let elapsed = now - pos.last_claim_timestamp;
    require!(elapsed >= UserPosition::MIN_CLAIM_INTERVAL, ErrorCode::NoYieldAccrued);

    let yield_amount = pos
        .calculate_yield(config.yield_rate_bps, now)
        .ok_or(ErrorCode::MathOverflow)?;
    require!(yield_amount > 0, ErrorCode::NoYieldAccrued);

    let bump = config.bump;
    let seeds: &[&[u8]] = &[b"config", &[bump]];
    let signer = &[seeds];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.yield_mint.to_account_info(),
        to: ctx.accounts.user_yield_ata.to_account_info(),
        authority: ctx.accounts.config.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        signer,
    );
    token::mint_to(cpi_ctx, yield_amount)?;

    let pos = &mut ctx.accounts.position;
    pos.total_claimed = pos.total_claimed
        .checked_add(yield_amount)
        .ok_or(ErrorCode::MathOverflow)?;
    pos.accrued_yield = 0;
    pos.last_claim_timestamp = now;
    emit!(crate::YieldClaimed {
        owner: pos.owner,
        mint: pos.mint,
        yield_amount,
        total_claimed: pos.total_claimed,
        timestamp: now,
    });

    msg!("Yield claimed: {} tokens", yield_amount);
    Ok(())
}