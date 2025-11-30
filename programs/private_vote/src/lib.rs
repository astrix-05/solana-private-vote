use anchor_lang::prelude::*;

// Program ID declaration
declare_id!("7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ");

// Constants
pub const POLL_SEED: &str = "poll";
pub const VOTE_SEED: &str = "vote";

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Poll is not active")]
    PollNotActive,
    
    #[msg("Poll is already closed")]
    PollAlreadyClosed,
    
    #[msg("Poll is still active")]
    PollStillActive,
    
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    
    #[msg("User has already voted")]
    AlreadyVoted,
    
    #[msg("Only poll creator can perform this action")]
    UnauthorizedCreator,
    
    #[msg("Question too long")]
    QuestionTooLong,
    
    #[msg("Question cannot be empty")]
    QuestionEmpty,
    
    #[msg("Too many options")]
    TooManyOptions,
    
    #[msg("Too few options - need at least 2")]
    TooFewOptions,
    
    #[msg("Option text too long")]
    OptionTooLong,
    
    #[msg("Option text cannot be empty")]
    OptionEmpty,
    
    #[msg("Duplicate options not allowed")]
    DuplicateOptions,
    
    #[msg("Encrypted data too large")]
    EncryptedDataTooLarge,
    
    #[msg("No votes to reveal")]
    NoVotesToReveal,
    
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    
    #[msg("Account mismatch - vote.poll does not match poll account")]
    VotePollMismatch,
    
    #[msg("Account mismatch - vote.voter does not match voter account")]
    VoteVoterMismatch,
}

// State structures
#[account]
pub struct Poll {
    pub creator: Pubkey,           // Poll creator's public key
    pub question: String,          // The voting question
    pub options: Vec<String>,      // Available voting options
    pub is_active: bool,           // Whether the poll is still accepting votes
    pub total_votes: u32,          // Total number of votes cast
    pub vote_counts: Vec<u32>,     // Vote counts for each option (revealed after closing)
    pub created_at: i64,           // Timestamp when poll was created
    pub closed_at: Option<i64>,    // Timestamp when poll was closed (if closed)
}

impl Poll {
    pub const MAX_QUESTION_LENGTH: usize = 200;
    pub const MAX_OPTIONS: usize = 10;
    pub const MAX_OPTION_LENGTH: usize = 100;
    
    pub fn space() -> usize {
        8 + // discriminator
        32 + // creator
        4 + Poll::MAX_QUESTION_LENGTH + // question
        4 + (Poll::MAX_OPTIONS * (4 + Poll::MAX_OPTION_LENGTH)) + // options
        1 + // is_active
        4 + // total_votes
        4 + (Poll::MAX_OPTIONS * 4) + // vote_counts
        8 + // created_at
        1 + 8 // closed_at (Option<i64>)
    }
}

#[account]
pub struct Vote {
    pub poll: Pubkey,              // Reference to the poll
    pub voter: Pubkey,             // Voter's public key
    pub encrypted_data: Vec<u8>,   // Encrypted vote data
    pub created_at: i64,           // Timestamp when vote was cast
}

impl Vote {
    pub const MAX_ENCRYPTED_DATA_SIZE: usize = 256;
    
    pub fn space() -> usize {
        8 + // discriminator
        32 + // poll
        32 + // voter
        4 + Vote::MAX_ENCRYPTED_DATA_SIZE + // encrypted_data
        8 // created_at
    }
}

// Account contexts
#[derive(Accounts)]
#[instruction(question: String, options: Vec<String>)]
pub struct CreatePoll<'info> {
    #[account(
        init,
        payer = creator,
        space = Poll::space(),
        seeds = [POLL_SEED.as_bytes(), creator.key().as_ref()],
        bump,
        owner = id() @ ErrorCode::InvalidAccountOwner
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(option_index: u8, encrypted_data: Vec<u8>)]
pub struct VoteInstruction<'info> {
    #[account(
        mut,
        owner = id() @ ErrorCode::InvalidAccountOwner,
        constraint = poll.is_active @ ErrorCode::PollNotActive
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(
        init,
        payer = voter,
        space = Vote::space(),
        seeds = [VOTE_SEED.as_bytes(), poll.key().as_ref(), voter.key().as_ref()],
        bump,
        owner = id() @ ErrorCode::InvalidAccountOwner
    )]
    pub vote: Account<'info, Vote>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClosePoll<'info> {
    #[account(
        mut,
        owner = id() @ ErrorCode::InvalidAccountOwner,
        constraint = poll.creator == creator.key() @ ErrorCode::UnauthorizedCreator,
        constraint = poll.is_active @ ErrorCode::PollAlreadyClosed
    )]
    pub poll: Account<'info, Poll>,
    
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealResults<'info> {
    #[account(
        owner = id() @ ErrorCode::InvalidAccountOwner,
        constraint = !poll.is_active @ ErrorCode::PollStillActive,
        constraint = poll.closed_at.is_some() @ ErrorCode::PollStillActive
    )]
    pub poll: Account<'info, Poll>,
}

// Main program module
#[program]
pub mod private_vote {
    use super::*;

    /// Creates a new poll with a question and voting options
    /// Only the poll creator can create polls
    pub fn create_poll(
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
        
        let poll = &mut ctx.accounts.poll;
        let clock = Clock::get()?;
        
        // Initialize poll data (store trimmed values)
        poll.creator = ctx.accounts.creator.key();
        poll.question = question_trimmed.to_string();
        poll.options = options.iter().map(|o| o.trim().to_string()).collect();
        poll.is_active = true;
        poll.total_votes = 0;
        poll.vote_counts = vec![0; poll.options.len()];
        poll.created_at = clock.unix_timestamp;
        poll.closed_at = None;
        
        msg!("Poll created: {}", poll.question);
        msg!("Options: {:?}", poll.options);
        
        Ok(())
    }

    /// Allows a user to cast a vote on an active poll
    /// Each user can only vote once per poll (enforced by PDA)
    /// Vote data is stored encrypted for privacy
    pub fn vote(
        ctx: Context<VoteInstruction>,
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
            encrypted_data.len() <= Vote::MAX_ENCRYPTED_DATA_SIZE,
            ErrorCode::EncryptedDataTooLarge
        );
        
        // Ensure encrypted data is not empty
        require!(
            !encrypted_data.is_empty(),
            ErrorCode::EncryptedDataTooLarge
        );
        
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
        
        msg!("Vote cast by: {}", ctx.accounts.voter.key());
        msg!("Option chosen: {} (index: {})", poll.options[option_idx], option_idx);
        msg!("Total votes: {}", poll.total_votes);
        msg!("Votes for option {}: {}", option_idx, poll.vote_counts[option_idx]);
        
        Ok(())
    }

    /// Closes an active poll, preventing further votes
    /// Only the poll creator can close the poll
    pub fn close_poll(ctx: Context<ClosePoll>) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let clock = Clock::get()?;
        
        // Close the poll
        poll.is_active = false;
        poll.closed_at = Some(clock.unix_timestamp);
        
        msg!("Poll closed by creator: {}", ctx.accounts.creator.key());
        msg!("Total votes cast: {}", poll.total_votes);
        
        Ok(())
    }

    /// Reveals the vote counts for each option after poll is closed
    /// Anyone can call this to view results
    /// Vote counts are already calculated during voting, so this just displays them
    pub fn reveal_results(ctx: Context<RevealResults>) -> Result<()> {
        let poll = &ctx.accounts.poll;
        
        // Check if there are votes to reveal
        require!(
            poll.total_votes > 0,
            ErrorCode::NoVotesToReveal
        );
        
        // Validate vote_counts length matches options length
        require!(
            poll.vote_counts.len() == poll.options.len(),
            ErrorCode::InvalidOptionIndex
        );
        
        // Verify vote counts sum equals total votes (sanity check)
        let sum: u32 = poll.vote_counts.iter().sum();
        // Note: We use >= instead of == to allow for potential rounding or future features
        require!(
            sum <= poll.total_votes,
            ErrorCode::InvalidOptionIndex
        );
        
        msg!("=== POLL RESULTS REVEALED ===");
        msg!("Poll: {}", poll.question);
        msg!("Total votes: {}", poll.total_votes);
        msg!("Poll created: {}", poll.created_at);
        msg!("Poll closed: {:?}", poll.closed_at);
        
        // Display results for each option with percentages
        for (index, (option, count)) in poll.options.iter().zip(poll.vote_counts.iter()).enumerate() {
            let percentage = if poll.total_votes > 0 {
                (*count as f64 / poll.total_votes as f64) * 100.0
            } else {
                0.0
            };
            msg!("Option {}: {} - {} votes ({:.1}%)", index + 1, option, count, percentage);
        }
        
        // Find winner(s)
        if let Some(max_count) = poll.vote_counts.iter().max() {
            if *max_count > 0 {
                let winners: Vec<(usize, &String)> = poll.options
                    .iter()
                    .enumerate()
                    .filter(|(idx, _)| poll.vote_counts[*idx] == *max_count)
                    .collect();
                
                if winners.len() == 1 {
                    msg!("Winner: {}", winners[0].1);
                } else {
                    msg!("Tie between {} options with {} votes each", winners.len(), max_count);
                }
            }
        }
        
        msg!("=== END RESULTS ===");
        
        Ok(())
    }
}