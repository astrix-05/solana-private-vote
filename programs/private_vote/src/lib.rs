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
    
    #[msg("Too many options")]
    TooManyOptions,
    
    #[msg("Option text too long")]
    OptionTooLong,
    
    #[msg("Encrypted data too large")]
    EncryptedDataTooLarge,
    
    #[msg("No votes to reveal")]
    NoVotesToReveal,
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
        bump
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(encrypted_data: Vec<u8>)]
pub struct VoteInstruction<'info> {
    #[account(
        mut,
        constraint = poll.is_active @ ErrorCode::PollNotActive
    )]
    pub poll: Account<'info, Poll>,
    
    #[account(
        init,
        payer = voter,
        space = Vote::space(),
        seeds = [VOTE_SEED.as_bytes(), poll.key().as_ref(), voter.key().as_ref()],
        bump
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
        constraint = poll.creator == creator.key() @ ErrorCode::UnauthorizedCreator,
        constraint = poll.is_active @ ErrorCode::PollAlreadyClosed
    )]
    pub poll: Account<'info, Poll>,
    
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealResults<'info> {
    #[account(
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
        // Validate inputs
        require!(
            question.len() <= Poll::MAX_QUESTION_LENGTH,
            ErrorCode::QuestionTooLong
        );
        
        require!(
            options.len() <= Poll::MAX_OPTIONS,
            ErrorCode::TooManyOptions
        );
        
        require!(
            options.len() >= 2,
            ErrorCode::TooManyOptions
        );
        
        for option in &options {
            require!(
                option.len() <= Poll::MAX_OPTION_LENGTH,
                ErrorCode::OptionTooLong
            );
        }
        
        let poll = &mut ctx.accounts.poll;
        let clock = Clock::get()?;
        
        // Initialize poll data
        poll.creator = ctx.accounts.creator.key();
        poll.question = question;
        poll.options = options;
        poll.is_active = true;
        poll.total_votes = 0;
        poll.vote_counts = vec![0; poll.options.len()];
        poll.created_at = clock.unix_timestamp;
        poll.closed_at = None;
        
        msg!("Poll created: {}", poll.question);
        
        Ok(())
    }

    /// Allows a user to cast a vote on an active poll
    /// Each user can only vote once per poll
    /// Vote data is stored encrypted
    pub fn vote(
        ctx: Context<VoteInstruction>,
        encrypted_data: Vec<u8>,
    ) -> Result<()> {
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
        vote.poll = ctx.accounts.poll.key();
        vote.voter = ctx.accounts.voter.key();
        vote.encrypted_data = encrypted_data;
        vote.created_at = clock.unix_timestamp;
        
        // Update poll vote count
        let poll = &mut ctx.accounts.poll;
        poll.total_votes += 1;
        
        msg!("Vote cast by: {}", ctx.accounts.voter.key());
        
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
    /// In a real implementation, this would decrypt and count votes
    pub fn reveal_results(ctx: Context<RevealResults>) -> Result<()> {
        let poll = &ctx.accounts.poll;
        
        // Check if there are votes to reveal
        require!(
            poll.total_votes > 0,
            ErrorCode::NoVotesToReveal
        );
        
        msg!("=== POLL RESULTS REVEALED ===");
        msg!("Poll: {}", poll.question);
        msg!("Total votes: {}", poll.total_votes);
        msg!("Poll created: {}", poll.created_at);
        msg!("Poll closed: {:?}", poll.closed_at);
        
        // Display results for each option
        for (index, (option, count)) in poll.options.iter().zip(poll.vote_counts.iter()).enumerate() {
            msg!("Option {}: {} - {} votes", index + 1, option, count);
        }
        
        msg!("=== END RESULTS ===");
        
        Ok(())
    }
}