use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use state::{GlobalConfig, UserPosition};

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W");

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

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = config,
    )]
    pub yield_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
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

    #[account(mut, address = config.yield_mint)]
    pub yield_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = yield_mint,
        associated_token::authority = owner,
    )]
    pub user_yield_ata: Account<'info, anchor_spl::token::TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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

#[event]
pub struct PositionRegistered {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub tier: u8,
    pub timestamp: i64,
}

#[event]
pub struct YieldClaimed {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub yield_amount: u64,
    pub total_claimed: u64,
    pub timestamp: i64,
}

#[event]
pub struct ConfigUpdated {
    pub admin: Pubkey,
    pub old_rate_bps: u64,
    pub new_rate_bps: u64,
    pub timestamp: i64,
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