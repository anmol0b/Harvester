use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use state::*;

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

#[program]
pub mod harvester {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, yield_rate_bps: u64) -> Result<()> {
        instructions::initialize::handler(ctx, yield_rate_bps)
    }
}