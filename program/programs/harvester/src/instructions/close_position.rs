use anchor_lang::prelude::*;
use crate::ClosePosition;

pub fn handler(ctx: Context<ClosePosition>) -> Result<()> {
    msg!(
        "Position closed. Owner: {}, Total claimed: {}",
        ctx.accounts.position.owner,
        ctx.accounts.position.total_claimed
    );
    Ok(())
}