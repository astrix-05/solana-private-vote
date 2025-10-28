use anchor_lang::prelude::*;

// Program ID declaration
declare_id!("7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ");

// Simple test program
#[program]
pub mod private_vote {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, World!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
