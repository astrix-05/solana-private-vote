use anchor_lang::prelude::*;

// Program ID constant
pub const ID: Pubkey = pubkey!("7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ");

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
