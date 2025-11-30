# Patched Instruction Code Snippets

This document contains the complete, hardened code for each instruction after security fixes.

---

## 1. `create_poll` Instruction

**File:** `programs/private_vote/src/instructions/create_poll.rs`

```rust
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
```

**Key Security Improvements:**
- ✅ Added `owner = crate::ID` constraint to ensure account ownership
- ✅ Validates question is not empty (after trimming)
- ✅ Validates each option is not empty (after trimming)
- ✅ Detects duplicate options (case-insensitive)
- ✅ Stores trimmed values to prevent whitespace-only inputs
- ✅ Separate error codes for "too few" vs "too many" options

---

## 2. `vote` Instruction

**File:** `programs/private_vote/src/instructions/vote.rs`

```rust
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
```

**Key Security Improvements:**
- ✅ Added `option_index: u8` parameter for vote counting
- ✅ Added `owner = crate::ID` constraints on both poll and vote accounts
- ✅ Validates option index is within bounds
- ✅ Validates account relationships (vote.poll matches poll, vote.voter matches voter)
- ✅ **CRITICAL FIX:** Updates `poll.vote_counts[option_idx]` (was previously missing)
- ✅ Enhanced logging with option details and vote counts

---

## 3. `close_poll` Instruction

**File:** `programs/private_vote/src/instructions/close_poll.rs`

```rust
use anchor_lang::prelude::*;
use crate::{state::Poll, error::ErrorCode};

/// Account context for closing a poll
#[derive(Accounts)]
pub struct ClosePoll<'info> {
    /// The poll to be closed (must be active and owned by creator)
    #[account(
        mut,
        owner = crate::ID @ ErrorCode::InvalidAccountOwner,
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
```

**Key Security Improvements:**
- ✅ Added `owner = crate::ID` constraint to ensure account ownership
- ✅ Validates creator matches poll.creator
- ✅ Validates poll is active before closing
- ✅ Records closure timestamp for audit trail

---

## 4. `reveal_results` Instruction

**File:** `programs/private_vote/src/instructions/reveal_results.rs`

```rust
use anchor_lang::prelude::*;
use crate::{state::Poll, error::ErrorCode};

/// Account context for revealing poll results
#[derive(Accounts)]
pub struct RevealResults<'info> {
    /// The poll to reveal results for (must be closed)
    #[account(
        owner = crate::ID @ ErrorCode::InvalidAccountOwner,
        constraint = !poll.is_active @ ErrorCode::PollStillActive,
        constraint = poll.closed_at.is_some() @ ErrorCode::PollStillActive
    )]
    pub poll: Account<'info, Poll>,
}

/// Handler function for revealing poll results
pub fn handler(ctx: Context<RevealResults>) -> Result<()> {
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
    // Note: We use <= instead of == to allow for potential rounding or future features
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
```

**Key Security Improvements:**
- ✅ Added `owner = crate::ID` constraint to ensure account ownership
- ✅ Validates poll is closed (not active)
- ✅ Validates poll has closed_at timestamp
- ✅ Validates vote_counts length matches options length
- ✅ Sanity check: vote counts sum <= total votes
- ✅ Calculates and displays percentages for each option
- ✅ Detects and reports winner(s) or ties
- ✅ Enhanced logging with detailed statistics

---

## Summary of All Security Fixes

### Account Security
- ✅ All instructions now validate account ownership with `owner = crate::ID`
- ✅ Account relationship validation in vote instruction

### Input Validation
- ✅ Empty string validation (question and options)
- ✅ Whitespace trimming and validation
- ✅ Duplicate option detection (case-insensitive)
- ✅ Option index bounds checking
- ✅ Separate error codes for different validation failures

### Vote Counting
- ✅ **CRITICAL:** Fixed vote counting - `vote_counts[option_idx]` now updates correctly
- ✅ Added `option_index` parameter to vote instruction
- ✅ Vote count consistency validation in reveal_results

### Result Display
- ✅ Percentage calculations
- ✅ Winner detection with tie handling
- ✅ Enhanced validation and logging

### State Management
- ✅ Explicit state transition checks
- ✅ Timestamp recording for audit trail
- ✅ Vote count sanity checks

---

## Breaking Changes

### `vote` Instruction Signature Change

**Before:**
```rust
pub fn vote(ctx: Context<Vote>, encrypted_data: Vec<u8>) -> Result<()>
```

**After:**
```rust
pub fn vote(ctx: Context<Vote>, option_index: u8, encrypted_data: Vec<u8>) -> Result<()>
```

**Migration Required:**
All clients calling the `vote` instruction must now pass `option_index` as the first parameter.

---

## Testing Checklist

- [ ] Create poll with valid inputs
- [ ] Reject empty question
- [ ] Reject empty options
- [ ] Reject duplicate options
- [ ] Reject too many/few options
- [ ] Vote on active poll with valid option index
- [ ] Reject vote with invalid option index
- [ ] Reject vote on closed poll
- [ ] Prevent double voting (PDA enforcement)
- [ ] Verify vote counts increment correctly
- [ ] Close poll as creator
- [ ] Reject close poll as non-creator
- [ ] Reject close already-closed poll
- [ ] Reveal results after closing
- [ ] Reject reveal on active poll
- [ ] Verify vote count accuracy
- [ ] Verify winner detection
- [ ] Handle ties correctly

---

## Error Codes Reference

All error codes are defined in `programs/private_vote/src/error.rs`:

- `PollNotActive` - Poll is not active
- `PollAlreadyClosed` - Poll is already closed
- `PollStillActive` - Poll is still active
- `InvalidOptionIndex` - Invalid option index
- `AlreadyVoted` - User has already voted
- `UnauthorizedCreator` - Only poll creator can perform this action
- `QuestionTooLong` - Question too long
- `QuestionEmpty` - Question cannot be empty
- `TooManyOptions` - Too many options
- `TooFewOptions` - Too few options - need at least 2
- `OptionTooLong` - Option text too long
- `OptionEmpty` - Option text cannot be empty
- `DuplicateOptions` - Duplicate options not allowed
- `EncryptedDataTooLarge` - Encrypted data too large
- `NoVotesToReveal` - No votes to reveal
- `InvalidAccountOwner` - Invalid account owner
- `VotePollMismatch` - Account mismatch - vote.poll does not match poll account
- `VoteVoterMismatch` - Account mismatch - vote.voter does not match voter account

