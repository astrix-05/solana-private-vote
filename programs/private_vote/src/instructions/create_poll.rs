use anchor_lang::prelude::*;
use crate::{state::Poll, constants::POLL_SEED, error::ErrorCode};

/// Account context for creating a new poll
#[derive(Accounts)]
#[instruction(question: String, options: Vec<String>)]
pub struct CreatePoll<'info> {
    /// The poll account to be initialized
    #[account(
        init,
        payer = creator,
        space = Poll::space(),
        seeds = [POLL_SEED.as_bytes(), creator.key().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    
    /// The creator of the poll (must sign the transaction)
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// The system program for account creation
    pub system_program: Program<'info, System>,
}

/// Handler function for creating a new poll
pub fn handler(
    ctx: Context<CreatePoll>,
    question: String,
    options: Vec<String>,
) -> Result<()> {
    // Validate question length
    require!(
        question.len() <= Poll::MAX_QUESTION_LENGTH,
        ErrorCode::QuestionTooLong
    );
    
    // Validate number of options
    require!(
        options.len() <= Poll::MAX_OPTIONS,
        ErrorCode::TooManyOptions
    );
    
    // Require at least 2 options for a valid poll
    require!(
        options.len() >= 2,
        ErrorCode::TooManyOptions
    );
    
    // Validate each option length
    for option in &options {
        require!(
            option.len() <= Poll::MAX_OPTION_LENGTH,
            ErrorCode::OptionTooLong
        );
    }
    
    // Get current timestamp
    let clock = Clock::get()?;
    
    // Initialize the poll account
    let poll = &mut ctx.accounts.poll;
    poll.creator = ctx.accounts.creator.key();
    poll.question = question;
    poll.options = options;
    poll.is_active = true;
    poll.total_votes = 0;
    poll.vote_counts = vec![0; poll.options.len()];
    poll.created_at = clock.unix_timestamp;
    poll.closed_at = None;
    
    // Emit event for poll creation
    msg!("Poll created by: {}", ctx.accounts.creator.key());
    msg!("Question: {}", poll.question);
    msg!("Options: {:?}", poll.options);
    
    Ok(())
}