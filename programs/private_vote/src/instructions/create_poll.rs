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
        bump,
        owner = crate::ID @ ErrorCode::InvalidAccountOwner
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
    // Validate question
    let question_trimmed = question.trim();
    require!(
        !question_trimmed.is_empty(),
        ErrorCode::QuestionEmpty
    );
    require!(
        question_trimmed.len() <= Poll::MAX_QUESTION_LENGTH,
        ErrorCode::QuestionTooLong
    );
    
    // Validate option count
    require!(
        options.len() >= 2,
        ErrorCode::TooFewOptions
    );
    require!(
        options.len() <= Poll::MAX_OPTIONS,
        ErrorCode::TooManyOptions
    );
    
    // Validate each option
    let mut seen_options = std::collections::HashSet::new();
    for option in &options {
        let option_trimmed = option.trim();
        require!(
            !option_trimmed.is_empty(),
            ErrorCode::OptionEmpty
        );
        require!(
            option_trimmed.len() <= Poll::MAX_OPTION_LENGTH,
            ErrorCode::OptionTooLong
        );
        // Check for duplicates (case-insensitive)
        let option_lower = option_trimmed.to_lowercase();
        require!(
            seen_options.insert(option_lower),
            ErrorCode::DuplicateOptions
        );
    }
    
    // Get current timestamp
    let clock = Clock::get()?;
    
    // Initialize the poll account (store trimmed values)
    let poll = &mut ctx.accounts.poll;
    poll.creator = ctx.accounts.creator.key();
    poll.question = question_trimmed.to_string();
    poll.options = options.iter().map(|o| o.trim().to_string()).collect();
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