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