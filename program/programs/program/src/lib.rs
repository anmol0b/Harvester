use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod state;

pub use state::*;

declare_id!("Ft97eZG3NrrVbdnZzn1rsDaKq8ZbFoTE3f4WZ6d8Lf1c");

#[program]
pub mod harvester {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Initializing Harvester");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}