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
    
    #[msg("Too many options")]
    TooManyOptions,
    
    #[msg("Option text too long")]
    OptionTooLong,
    
    #[msg("Encrypted data too large")]
    EncryptedDataTooLarge,
    
    #[msg("No votes to reveal")]
    NoVotesToReveal,
}
