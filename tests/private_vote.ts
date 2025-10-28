import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PrivateVote } from "../target/types/private_vote";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

describe("private_vote", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PrivateVote as Program<PrivateVote>;
  const provider = anchor.getProvider();

  // Test accounts
  let pollCreator: Keypair;
  let voter1: Keypair;
  let voter2: Keypair;
  let voter3: Keypair;
  let pollAccount: PublicKey;
  let voteAccount1: PublicKey;
  let voteAccount2: PublicKey;
  let voteAccount3: PublicKey;

  before(async () => {
    // Generate test keypairs
    pollCreator = Keypair.generate();
    voter1 = Keypair.generate();
    voter2 = Keypair.generate();
    voter3 = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(pollCreator.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(voter1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(voter2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(voter3.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it("Creates a poll successfully", async () => {
    // Find the poll PDA
    [pollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollCreator.publicKey.toBuffer()],
      program.programId
    );

    const question = "What is your favorite programming language?";
    const options = ["Rust", "TypeScript", "Python", "Go"];

    const tx = await program.methods
      .createPoll(question, options)
      .accounts({
        poll: pollAccount,
        creator: pollCreator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([pollCreator])
      .rpc();

    console.log("Create poll transaction signature:", tx);

    // Fetch the poll account
    const pollData = await program.account.poll.fetch(pollAccount);
    
    expect(pollData.creator.toString()).to.equal(pollCreator.publicKey.toString());
    expect(pollData.question).to.equal(question);
    expect(pollData.options).to.deep.equal(options);
    expect(pollData.isActive).to.be.true;
    expect(pollData.totalVotes).to.equal(0);
    expect(pollData.voteCounts).to.deep.equal([0, 0, 0, 0]);
    expect(pollData.closedAt).to.be.null;
  });

  it("Fails to create poll with invalid inputs", async () => {
    const invalidQuestion = "A".repeat(201); // Too long
    const options = ["Option 1", "Option 2"];

    try {
      await program.methods
        .createPoll(invalidQuestion, options)
        .accounts({
          poll: PublicKey.findProgramAddressSync(
            [Buffer.from("poll"), voter1.publicKey.toBuffer()],
            program.programId
          )[0],
          creator: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();
      
      expect.fail("Should have failed with question too long error");
    } catch (error) {
      expect(error.message).to.include("Question too long");
    }
  });

  it("Fails to create poll with too many options", async () => {
    const question = "Test question";
    const tooManyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);

    try {
      await program.methods
        .createPoll(question, tooManyOptions)
        .accounts({
          poll: PublicKey.findProgramAddressSync(
            [Buffer.from("poll"), voter2.publicKey.toBuffer()],
            program.programId
          )[0],
          creator: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();
      
      expect.fail("Should have failed with too many options error");
    } catch (error) {
      expect(error.message).to.include("Too many options");
    }
  });

  it("Allows users to vote on active poll", async () => {
    // Find vote PDAs
    [voteAccount1] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollAccount.toBuffer(), voter1.publicKey.toBuffer()],
      program.programId
    );

    const encryptedData = Buffer.from("encrypted_vote_data_for_option_0", "utf8");

    const tx = await program.methods
      .vote(Array.from(encryptedData))
      .accounts({
        poll: pollAccount,
        vote: voteAccount1,
        voter: voter1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter1])
      .rpc();

    console.log("Vote 1 transaction signature:", tx);

    // Fetch the vote account
    const voteData = await program.account.vote.fetch(voteAccount1);
    
    expect(voteData.poll.toString()).to.equal(pollAccount.toString());
    expect(voteData.voter.toString()).to.equal(voter1.publicKey.toString());
    expect(voteData.encryptedData).to.deep.equal(Array.from(encryptedData));

    // Check poll was updated
    const pollData = await program.account.poll.fetch(pollAccount);
    expect(pollData.totalVotes).to.equal(1);
  });

  it("Allows multiple users to vote", async () => {
    // Voter 2 votes
    [voteAccount2] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollAccount.toBuffer(), voter2.publicKey.toBuffer()],
      program.programId
    );

    const encryptedData2 = Buffer.from("encrypted_vote_data_for_option_1", "utf8");

    await program.methods
      .vote(Array.from(encryptedData2))
      .accounts({
        poll: pollAccount,
        vote: voteAccount2,
        voter: voter2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();

    // Voter 3 votes
    [voteAccount3] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollAccount.toBuffer(), voter3.publicKey.toBuffer()],
      program.programId
    );

    const encryptedData3 = Buffer.from("encrypted_vote_data_for_option_2", "utf8");

    await program.methods
      .vote(Array.from(encryptedData3))
      .accounts({
        poll: pollAccount,
        vote: voteAccount3,
        voter: voter3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter3])
      .rpc();

    // Check poll was updated
    const pollData = await program.account.poll.fetch(pollAccount);
    expect(pollData.totalVotes).to.equal(3);
  });

  it("Prevents duplicate voting", async () => {
    try {
      await program.methods
        .vote(Array.from(Buffer.from("another_vote", "utf8")))
        .accounts({
          poll: pollAccount,
          vote: voteAccount1, // Same vote account as before
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();
      
      expect.fail("Should have failed with account already exists error");
    } catch (error) {
      expect(error.message).to.include("already in use");
    }
  });

  it("Prevents voting on inactive poll", async () => {
    // First close the poll
    await program.methods
      .closePoll()
      .accounts({
        poll: pollAccount,
        creator: pollCreator.publicKey,
      })
      .signers([pollCreator])
      .rpc();

    // Try to vote on closed poll
    const newVoter = Keypair.generate();
    await provider.connection.requestAirdrop(newVoter.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const [newVoteAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), pollAccount.toBuffer(), newVoter.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .vote(Array.from(Buffer.from("vote_on_closed_poll", "utf8")))
        .accounts({
          poll: pollAccount,
          vote: newVoteAccount,
          voter: newVoter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newVoter])
        .rpc();
      
      expect.fail("Should have failed with poll not active error");
    } catch (error) {
      expect(error.message).to.include("Poll is not active");
    }
  });

  it("Allows only creator to close poll", async () => {
    // Try to close poll with non-creator
    try {
      await program.methods
        .closePoll()
        .accounts({
          poll: pollAccount,
          creator: voter1.publicKey, // Not the creator
        })
        .signers([voter1])
        .rpc();
      
      expect.fail("Should have failed with unauthorized creator error");
    } catch (error) {
      expect(error.message).to.include("Only poll creator can perform this action");
    }
  });

  it("Reveals poll results after closing", async () => {
    const tx = await program.methods
      .revealResults()
      .accounts({
        poll: pollAccount,
      })
      .rpc();

    console.log("Reveal results transaction signature:", tx);

    // Fetch the poll account to verify it's closed
    const pollData = await program.account.poll.fetch(pollAccount);
    expect(pollData.isActive).to.be.false;
    expect(pollData.closedAt).to.not.be.null;
    expect(pollData.totalVotes).to.equal(3);
  });

  it("Fails to reveal results on active poll", async () => {
    // Create a new poll
    const newPollCreator = Keypair.generate();
    await provider.connection.requestAirdrop(newPollCreator.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const [newPollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), newPollCreator.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createPoll("Test poll", ["Option A", "Option B"])
      .accounts({
        poll: newPollAccount,
        creator: newPollCreator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([newPollCreator])
      .rpc();

    // Try to reveal results on active poll
    try {
      await program.methods
        .revealResults()
        .accounts({
          poll: newPollAccount,
        })
        .rpc();
      
      expect.fail("Should have failed with poll still active error");
    } catch (error) {
      expect(error.message).to.include("Poll is still active");
    }
  });

  it("Fails to reveal results with no votes", async () => {
    // Create and immediately close a poll with no votes
    const noVoteCreator = Keypair.generate();
    await provider.connection.requestAirdrop(noVoteCreator.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const [noVotePollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), noVoteCreator.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createPoll("No vote poll", ["Option 1", "Option 2"])
      .accounts({
        poll: noVotePollAccount,
        creator: noVoteCreator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([noVoteCreator])
      .rpc();

    await program.methods
      .closePoll()
      .accounts({
        poll: noVotePollAccount,
        creator: noVoteCreator.publicKey,
      })
      .signers([noVoteCreator])
      .rpc();

    // Try to reveal results with no votes
    try {
      await program.methods
        .revealResults()
        .accounts({
          poll: noVotePollAccount,
        })
        .rpc();
      
      expect.fail("Should have failed with no votes to reveal error");
    } catch (error) {
      expect(error.message).to.include("No votes to reveal");
    }
  });

  it("Validates encrypted data size limits", async () => {
    const newPollCreator = Keypair.generate();
    await provider.connection.requestAirdrop(newPollCreator.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const [testPollAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), newPollCreator.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createPoll("Test poll", ["Option A", "Option B"])
      .accounts({
        poll: testPollAccount,
        creator: newPollCreator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([newPollCreator])
      .rpc();

    const testVoter = Keypair.generate();
    await provider.connection.requestAirdrop(testVoter.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const [testVoteAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), testPollAccount.toBuffer(), testVoter.publicKey.toBuffer()],
      program.programId
    );

    // Try to vote with data that's too large (257 bytes, limit is 256)
    const tooLargeData = Array.from({ length: 257 }, () => 0);

    try {
      await program.methods
        .vote(tooLargeData)
        .accounts({
          poll: testPollAccount,
          vote: testVoteAccount,
          voter: testVoter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testVoter])
        .rpc();
      
      expect.fail("Should have failed with encrypted data too large error");
    } catch (error) {
      expect(error.message).to.include("Encrypted data too large");
    }
  });
});
