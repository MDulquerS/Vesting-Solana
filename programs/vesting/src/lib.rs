use anchor_lang::prelude::*;

declare_id!("BH6VL6pHv4G1xpd13nWjKh6NuAVNG8hgYrxu3Q464Bax");

#[program]
pub mod vesting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
