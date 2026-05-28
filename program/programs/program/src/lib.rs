use anchor_lang::prelude::*;
use state::{GlobalConfig, UserPosition};

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

declare_id!("BV7ScLttfAjpFG1GcgLJUi1kCW6Kd4iSDUabvdno2Bkv");

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = GlobalConfig::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(mint: Pubkey)]
pub struct RegisterPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = owner,
        space = UserPosition::LEN,
        seeds = [b"position", owner.key().as_ref(), mint.as_ref()],
        bump
    )]
    pub position: Account<'info, UserPosition>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), position.mint.as_ref()],
        bump = position.bump,
        has_one = owner
    )]
    pub position: Account<'info, UserPosition>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, GlobalConfig>,
}

#[program]
pub mod harvester {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, yield_rate_bps: u64) -> Result<()> {
        instructions::initialize::handler(ctx, yield_rate_bps)
    }

    pub fn register_position(ctx: Context<RegisterPosition>, mint: Pubkey, amount: u64) -> Result<()> {
        instructions::register_position::handler(ctx, mint, amount)
    }

    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        instructions::claim_yield::handler(ctx)
    }

    pub fn update_config(ctx: Context<UpdateConfig>, new_rate_bps: u64, paused: bool) -> Result<()> {
        instructions::update_config::handler(ctx, new_rate_bps, paused)
    }
}