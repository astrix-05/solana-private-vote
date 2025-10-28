use anchor_lang::prelude::*;
use crate::{state::Poll, error::ErrorCode};

/// Account context for closing a poll
#[derive(Accounts)]
pub struct ClosePoll<'info> {
    /// The poll to be closed (must be active and owned by creator)
    #[account(
        mut,
        constraint = poll.creator == creator.key() @ ErrorCode::UnauthorizedCreator,
        constraint = poll.is_active @ ErrorCode::PollAlreadyClosed
    )]
    pub poll: Account<'info, Poll>,
    
    /// The poll creator (must sign the transaction)
    pub creator: Signer<'info>,
}

/// Handler function for closing a poll
pub fn handler(ctx: Context<ClosePoll>) -> Result<()> {
    // Get current timestamp
    let clock = Clock::get()?;
    
    // Close the poll
    let poll = &mut ctx.accounts.poll;
    poll.is_active = false;
    poll.closed_at = Some(clock.unix_timestamp);
    
    // Emit event for poll closure
    msg!("Poll closed by creator: {}", ctx.accounts.creator.key());
    msg!("Poll question: {}", poll.question);
    msg!("Total votes cast: {}", poll.total_votes);
    msg!("Closed at: {}", clock.unix_timestamp);
    
    Ok(())
}