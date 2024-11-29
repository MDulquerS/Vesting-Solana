import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Vesting } from "../target/types/vesting";
import {
  BanksClient,
  Clock,
  ProgramTestContext,
  startAnchor,
} from "solana-bankrun";
import {
  program,
  SYSTEM_PROGRAM_ID,
} from "@coral-xyz/anchor/dist/cjs/native/system";
import { BN, Program } from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { createMint, mintTo } from "spl-token-bankrun";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
const IDL = require("../target/idl/vesting.json");

describe("vesting", () => {
  const companyName = "companyName";
  let beneficiary: Keypair;
  let employeer: Keypair;
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let beneficiaryProvider: BankrunProvider;
  let program: Program<Vesting>;
  let program2: Program<Vesting>;
  let banksClient: BanksClient;
  let mint: PublicKey;
  let vestingAccountKey: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let employeeAccount: PublicKey;

  before(async () => {
    beneficiary = new anchor.web3.Keypair();
    context = await startAnchor(
      "",
      [{ name: "vesting", programId: new PublicKey(IDL.address) }],
      [
        {
          address: beneficiary.publicKey,
          info: {
            lamports: 1_000_000_000,
            data: Buffer.alloc(0),
            owner: SYSTEM_PROGRAM_ID,
            executable: false,
          },
        },
      ]
    );
    provider = new BankrunProvider(context);
    anchor.setProvider(provider);
    program = new Program<Vesting>(IDL as Vesting, provider);
    banksClient = context.banksClient;
    employeer = provider.wallet.payer;
    mint = await createMint(
      banksClient,
      employeer,
      employeer.publicKey,
      null,
      2
    );

    beneficiaryProvider = new BankrunProvider(context);
    beneficiaryProvider.wallet = new NodeWallet(beneficiary);

    program2 = new Program<Vesting>(IDL as Vesting, beneficiaryProvider);
    [vestingAccountKey] = await PublicKey.findProgramAddressSync(
      [Buffer.from(companyName)],
      program.programId
    );
    [treasuryTokenAccount] = await PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_treasury"), Buffer.from(companyName)],
      program.programId
    );

    [employeeAccount] = await PublicKey.findProgramAddressSync(
      [
        Buffer.from("employee_vesting"),
        beneficiary.publicKey.toBuffer(),
        vestingAccountKey.toBuffer(),
      ],
      program.programId
    );
  });

  it("should create a vesting account", async () => {
    const tx = await program.methods
      .createVestingAccount(companyName)
      .accounts({
        signer: employeer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    const vestingAccountData = await program.account.vestingAccount.fetch(
      vestingAccountKey,
      "confirmed"
    );

    console.log("Vesting account data", vestingAccountData, null, 2);
    console.log("Create vesting account", tx);
  });

  it("should fund the treasury token account", async () => {
    const amount = 10_000 * 10 ** 9;
    const mintTx = await mintTo(
      banksClient,
      employeer,
      mint,
      treasuryTokenAccount,
      employeer,
      amount
    );
    console.log("Mint treasury token", mintTx);
  });

  it("should create employee vesting account", async () => {
    const tx2 = await program.methods
      .createEmployeeAccount(new BN(0), new BN(100), new BN(100), new BN(0))
      .accounts({
        beneficiary: beneficiary.publicKey,
        vestingAccount: vestingAccountKey,
      })
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log("Create employee account TX: ", tx2);
    console.log("Employee Account: ", employeeAccount.toBase58());
  });

  it("should claim employee's vested token", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const currentclock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentclock.slot,
        currentclock.epochStartTimestamp,
        currentclock.epoch,
        currentclock.leaderScheduleEpoch,
        1000n
      )
    );

    const tx3 = await program2.methods
      .claimTokens(companyName)
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Claim Token TX: ", tx3);
  });
});
