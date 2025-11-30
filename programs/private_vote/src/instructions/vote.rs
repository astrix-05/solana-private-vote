use anchor_lang::prelude::*;
use crate::{state::{Poll, Vote as VoteAccount}, constants::VOTE_SEED, error::ErrorCode};

/// Account context for casting a vote
#[derive(Accounts)]
#[instruction(option_index: u8, encrypted_data: Vec<u8>)]
pub struct Vote<'info> {
    /// The poll being voted on (must be active)
    #[account(
        mut,
        owner = crate::ID @ ErrorCode::InvalidAccountOwner,
        constraint = poll.is_active @ ErrorCode::PollNotActive
    )]
    pub poll: Account<'info, Poll>,
    
    /// The vote account to be initialized (PDA to ensure one vote per user per poll)
    #[account(
        init,
        payer = voter,
        space = VoteAccount::space(),
        seeds = [VOTE_SEED.as_bytes(), poll.key().as_ref(), voter.key().as_ref()],
        bump,
        owner = crate::ID @ ErrorCode::InvalidAccountOwner
    )]
    pub vote: Account<'info, VoteAccount>,
    
    /// The voter (must sign the transaction)
    #[account(mut)]
    pub voter: Signer<'info>,
    
    /// The system program for account creation
    pub system_program: Program<'info, System>,
}

/// Handler function for casting a vote
pub fn handler(
    ctx: Context<Vote>,
    option_index: u8,
    encrypted_data: Vec<u8>,
) -> Result<()> {
    let poll = &mut ctx.accounts.poll;
    
    // Validate option index
    let option_idx = option_index as usize;
    require!(
        option_idx < poll.options.len(),
        ErrorCode::InvalidOptionIndex
    );
    
    // Validate encrypted data size
    require!(
        encrypted_data.len() <= VoteAccount::MAX_ENCRYPTED_DATA_SIZE,
        ErrorCode::EncryptedDataTooLarge
    );
    
    // Ensure encrypted data is not empty
    require!(
        !encrypted_data.is_empty(),
        ErrorCode::EncryptedDataTooLarge
    );
    
    // Get current timestamp
    let clock = Clock::get()?;
    
    // Initialize the vote account
    let vote = &mut ctx.accounts.vote;
    vote.poll = poll.key();
    vote.voter = ctx.accounts.voter.key();
    vote.encrypted_data = encrypted_data;
    vote.created_at = clock.unix_timestamp;
    
    // Validate account relationships
    require!(
        vote.poll == poll.key(),
        ErrorCode::VotePollMismatch
    );
    require!(
        vote.voter == ctx.accounts.voter.key(),
        ErrorCode::VoteVoterMismatch
    );
    
    // Update poll vote counts (CRITICAL FIX)
    poll.total_votes += 1;
    poll.vote_counts[option_idx] += 1;
    
    // Emit event for vote casting
    msg!("Vote cast by: {}", ctx.accounts.voter.key());
    msg!("Poll: {}", poll.question);
    msg!("Option chosen: {} (index: {})", poll.options[option_idx], option_idx);
    msg!("Total votes: {}", poll.total_votes);
    msg!("Votes for option {}: {}", option_idx, poll.vote_counts[option_idx]);
    
    Ok(())
}