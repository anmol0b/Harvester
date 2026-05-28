use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("No yield accrued yet")]
    NoYieldAccrued,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Rate cannot exceed 10000 bps")]
    InvalidRate,
}