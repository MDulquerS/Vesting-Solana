use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};
declare_id!("BH6VL6pHv4G1xpd13nWjKh6NuAVNG8hgYrxu3Q464Bax");

#[program]
pub mod vesting {
    use super::*;

    pub fn create_vesting_account(ctx: Context<CreateVestingAccount>, company_name:String) -> Result<()> {
        

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(company_name)]
pub struct CreateVestingAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init, 
        space = 8 +  VestingAccount::INIT_SPACE,
        payer = signer,
        seeds = [company_name.as_ref()],
        bump,
    )]
    pub vesting_account: Account<'info, VestingAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        token::mint = mint,
        token::authority = treasury_token_account,
        payer = signer,
        seeds = ["vesting_treasury", company_name.as_bytes()],
        bump
    )]
    pub treasury_token_account:InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,

}

#[account]
#[derive(InitSpace)]
pub struct VestingAccount {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub treasury_token_account: Pubkey,
    #[max_len(50)]
    pub company_name:String,
    pub treasury_bump: u8,
    pub bump: u8,
}