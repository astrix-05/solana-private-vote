use anchor_lang::prelude::*;

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
