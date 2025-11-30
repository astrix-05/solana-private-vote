import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PrivateVote } from "../target/types/private_vote";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("Comprehensive Private Vote Tests", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.PrivateVote as Program<PrivateVote>;
  const provider = anchor.getProvider();

  // Helper function to wait for confirmation
  const waitForConfirmation = async (ms: number = 1000) => {
    await new Promise(resolve => setTimeout(resolve, ms));
  };

  // Helper function to airdrop SOL
  const airdrop = async (pubkey: PublicKey, sol: number = 2) => {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      sol * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
    await waitForConfirmation(500);
  };

  describe("1. Normal Voting Flow - Create Poll → Cast Vote → Verify Tallies", () => {
    let pollCreator: Keypair;
    let voter1: Keypair;
    let voter2: Keypair;
    let pollAccount: PublicKey;

    before(async () => {
      pollCreator = Keypair.generate();
      voter1 = Keypair.generate();
      voter2 = Keypair.generate();

      await airdrop(pollCreator.publicKey);
      await airdrop(voter1.publicKey);
      await airdrop(voter2.publicKey);
    });

    it("Creates a poll with valid inputs and initializes correctly", async () => {
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

      console.log("✓ Create poll transaction:", tx);

      // Fetch and verify poll account
      const pollData = await program.account.poll.fetch(pollAccount);
      
      expect(pollData.creator.toString()).to.equal(pollCreator.publicKey.toString());
      expect(pollData.question).to.equal(question);
      expect(pollData.options).to.deep.equal(options);
      expect(pollData.isActive).to.be.true;
      expect(pollData.totalVotes).to.equal(0);
      expect(pollData.voteCounts).to.deep.equal([0, 0, 0, 0]);
      expect(pollData.closedAt).to.be.null;
      
      console.log("✓ Poll created successfully with correct initial state");
    });

    it("Allows voter1 to cast vote for option 0 (Rust) and updates tallies correctly", async () => {
      // Find vote PDA for voter1
      const [voteAccount1] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), pollAccount.toBuffer(), voter1.publicKey.toBuffer()],
        program.programId
      );

      const optionIndex = 0; // Voting for "Rust"
      const encryptedData = Buffer.from("encrypted_vote_data_voter1", "utf8");

      const tx = await program.methods
        .vote(optionIndex, Array.from(encryptedData))
        .accounts({
          poll: pollAccount,
          vote: voteAccount1,
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      console.log("✓ Vote 1 transaction:", tx);

      // Verify vote account was created correctly
      const voteData = await program.account.vote.fetch(voteAccount1);
      expect(voteData.poll.toString()).to.equal(pollAccount.toString());
      expect(voteData.voter.toString()).to.equal(voter1.publicKey.toString());
      expect(voteData.encryptedData).to.deep.equal(Array.from(encryptedData));

      // Verify poll tallies were updated correctly
      const pollData = await program.account.poll.fetch(pollAccount);
      expect(pollData.totalVotes).to.equal(1);
      expect(pollData.voteCounts[0]).to.equal(1); // Option 0 (Rust) should have 1 vote
      expect(pollData.voteCounts[1]).to.equal(0); // Other options should be 0
      expect(pollData.voteCounts[2]).to.equal(0);
      expect(pollData.voteCounts[3]).to.equal(0);
      
      console.log("✓ Vote tallies updated correctly: Option 0 has 1 vote");
    });

    it("Allows voter2 to cast vote for option 2 (Python) and verifies both tallies", async () => {
      // Find vote PDA for voter2
      const [voteAccount2] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), pollAccount.toBuffer(), voter2.publicKey.toBuffer()],
        program.programId
      );

      const optionIndex = 2; // Voting for "Python"
      const encryptedData = Buffer.from("encrypted_vote_data_voter2", "utf8");

      await program.methods
        .vote(optionIndex, Array.from(encryptedData))
        .accounts({
          poll: pollAccount,
          vote: voteAccount2,
          voter: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      // Verify poll tallies show both votes correctly
      const pollData = await program.account.poll.fetch(pollAccount);
      expect(pollData.totalVotes).to.equal(2);
      expect(pollData.voteCounts[0]).to.equal(1); // Rust: 1 vote
      expect(pollData.voteCounts[1]).to.equal(0); // TypeScript: 0 votes
      expect(pollData.voteCounts[2]).to.equal(1); // Python: 1 vote
      expect(pollData.voteCounts[3]).to.equal(0); // Go: 0 votes
      
      // Verify vote count sum equals total votes
      const sum = pollData.voteCounts.reduce((a, b) => a + b, 0);
      expect(sum).to.equal(pollData.totalVotes);
      
      console.log("✓ Both votes recorded correctly: Rust=1, Python=1, Total=2");
    });
  });

  describe("2. Double-Voting Prevention", () => {
    let pollCreator: Keypair;
    let voter: Keypair;
    let pollAccount: PublicKey;
    let voteAccount: PublicKey;

    before(async () => {
      pollCreator = Keypair.generate();
      voter = Keypair.generate();

      await airdrop(pollCreator.publicKey);
      await airdrop(voter.publicKey);

      // Create a poll
      [pollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), pollCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Double vote test poll", ["Option A", "Option B"])
        .accounts({
          poll: pollAccount,
          creator: pollCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([pollCreator])
        .rpc();

      // Find vote PDA
      [voteAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), pollAccount.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );
    });

    it("Allows first vote to succeed", async () => {
      const optionIndex = 0;
      const encryptedData = Buffer.from("first_vote", "utf8");

      await program.methods
        .vote(optionIndex, Array.from(encryptedData))
        .accounts({
          poll: pollAccount,
          vote: voteAccount,
          voter: voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      const pollData = await program.account.poll.fetch(pollAccount);
      expect(pollData.totalVotes).to.equal(1);
      expect(pollData.voteCounts[0]).to.equal(1);
      
      console.log("✓ First vote succeeded");
    });

    it("Prevents the same voter from voting twice (PDA already initialized)", async () => {
      const optionIndex = 1; // Try to vote for different option
      const encryptedData = Buffer.from("second_vote_attempt", "utf8");

      try {
        await program.methods
          .vote(optionIndex, Array.from(encryptedData))
          .accounts({
            poll: pollAccount,
            vote: voteAccount, // Same vote account (same PDA)
            voter: voter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter])
          .rpc();
        
        expect.fail("Should have failed - account already initialized");
      } catch (error: any) {
        // Should fail because vote account already exists (PDA prevents double voting)
        expect(error.message).to.satisfy((msg: string) => 
          msg.includes("already in use") || 
          msg.includes("AccountDiscriminatorAlreadyExists") ||
          msg.includes("0x0") // Anchor error code for account already exists
        );
        
        // Verify vote count didn't change
        const pollData = await program.account.poll.fetch(pollAccount);
        expect(pollData.totalVotes).to.equal(1);
        expect(pollData.voteCounts[0]).to.equal(1);
        expect(pollData.voteCounts[1]).to.equal(0); // Second vote didn't go through
        
        console.log("✓ Double voting prevented - vote count unchanged");
      }
    });

    it("Prevents double voting even with different option index", async () => {
      // Try to vote again with different option
      const optionIndex = 1;
      const encryptedData = Buffer.from("another_vote_attempt", "utf8");

      try {
        await program.methods
          .vote(optionIndex, Array.from(encryptedData))
          .accounts({
            poll: pollAccount,
            vote: voteAccount,
            voter: voter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter])
          .rpc();
        
        expect.fail("Should have failed - cannot vote twice");
      } catch (error: any) {
        expect(error.message).to.satisfy((msg: string) => 
          msg.includes("already in use") || 
          msg.includes("AccountDiscriminatorAlreadyExists")
        );
        
        console.log("✓ Double voting prevented regardless of option choice");
      }
    });
  });

  describe("3. Edge Cases and Error Handling", () => {
    let pollCreator: Keypair;
    let voter: Keypair;
    let pollAccount: PublicKey;

    before(async () => {
      pollCreator = Keypair.generate();
      voter = Keypair.generate();

      await airdrop(pollCreator.publicKey);
      await airdrop(voter.publicKey);
    });

    it("Rejects vote on closed poll", async () => {
      // Create and close a poll
      [pollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), pollCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Closed poll test", ["Option 1", "Option 2"])
        .accounts({
          poll: pollAccount,
          creator: pollCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([pollCreator])
        .rpc();

      // Close the poll
      await program.methods
        .closePoll()
        .accounts({
          poll: pollAccount,
          creator: pollCreator.publicKey,
        })
        .signers([pollCreator])
        .rpc();

      // Try to vote on closed poll
      const [voteAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), pollAccount.toBuffer(), voter.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .vote(0, Array.from(Buffer.from("vote_on_closed", "utf8")))
          .accounts({
            poll: pollAccount,
            vote: voteAccount,
            voter: voter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter])
          .rpc();
        
        expect.fail("Should have failed - poll is closed");
      } catch (error: any) {
        expect(error.message).to.include("Poll is not active");
        console.log("✓ Voting on closed poll correctly rejected");
      }
    });

    it("Rejects vote with invalid option index", async () => {
      // Create a new poll with 2 options (indices 0 and 1)
      const newCreator = Keypair.generate();
      await airdrop(newCreator.publicKey);

      const [newPollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), newCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Invalid index test", ["Option A", "Option B"])
        .accounts({
          poll: newPollAccount,
          creator: newCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newCreator])
        .rpc();

      const newVoter = Keypair.generate();
      await airdrop(newVoter.publicKey);

      const [newVoteAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), newPollAccount.toBuffer(), newVoter.publicKey.toBuffer()],
        program.programId
      );

      // Try to vote with invalid option index (2, but only 0 and 1 exist)
      try {
        await program.methods
          .vote(2, Array.from(Buffer.from("invalid_index_vote", "utf8")))
          .accounts({
            poll: newPollAccount,
            vote: newVoteAccount,
            voter: newVoter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newVoter])
          .rpc();
        
        expect.fail("Should have failed - invalid option index");
      } catch (error: any) {
        expect(error.message).to.include("Invalid option index");
        console.log("✓ Invalid option index correctly rejected");
      }
    });

    it("Rejects vote with empty encrypted data", async () => {
      const newCreator = Keypair.generate();
      await airdrop(newCreator.publicKey);

      const [newPollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), newCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Empty data test", ["Option 1", "Option 2"])
        .accounts({
          poll: newPollAccount,
          creator: newCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newCreator])
        .rpc();

      const newVoter = Keypair.generate();
      await airdrop(newVoter.publicKey);

      const [newVoteAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), newPollAccount.toBuffer(), newVoter.publicKey.toBuffer()],
        program.programId
      );

      // Try to vote with empty encrypted data
      try {
        await program.methods
          .vote(0, []) // Empty array
          .accounts({
            poll: newPollAccount,
            vote: newVoteAccount,
            voter: newVoter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newVoter])
          .rpc();
        
        expect.fail("Should have failed - empty encrypted data");
      } catch (error: any) {
        expect(error.message).to.include("Encrypted data too large");
        console.log("✓ Empty encrypted data correctly rejected");
      }
    });

    it("Rejects vote with encrypted data exceeding size limit", async () => {
      const newCreator = Keypair.generate();
      await airdrop(newCreator.publicKey);

      const [newPollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), newCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Size limit test", ["Option 1", "Option 2"])
        .accounts({
          poll: newPollAccount,
          creator: newCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newCreator])
        .rpc();

      const newVoter = Keypair.generate();
      await airdrop(newVoter.publicKey);

      const [newVoteAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), newPollAccount.toBuffer(), newVoter.publicKey.toBuffer()],
        program.programId
      );

      // Try to vote with data exceeding 256 bytes (limit is 256)
      const tooLargeData = Array.from({ length: 257 }, () => 42);

      try {
        await program.methods
          .vote(0, tooLargeData)
          .accounts({
            poll: newPollAccount,
            vote: newVoteAccount,
            voter: newVoter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newVoter])
          .rpc();
        
        expect.fail("Should have failed - data too large");
      } catch (error: any) {
        expect(error.message).to.include("Encrypted data too large");
        console.log("✓ Oversized encrypted data correctly rejected");
      }
    });

    it("Prevents non-creator from closing poll", async () => {
      const newCreator = Keypair.generate();
      const nonCreator = Keypair.generate();
      await airdrop(newCreator.publicKey);
      await airdrop(nonCreator.publicKey);

      const [newPollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), newCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Authorization test", ["Option 1", "Option 2"])
        .accounts({
          poll: newPollAccount,
          creator: newCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newCreator])
        .rpc();

      // Try to close poll as non-creator
      try {
        await program.methods
          .closePoll()
          .accounts({
            poll: newPollAccount,
            creator: nonCreator.publicKey, // Not the creator
          })
          .signers([nonCreator])
          .rpc();
        
        expect.fail("Should have failed - unauthorized creator");
      } catch (error: any) {
        expect(error.message).to.include("Only poll creator can perform this action");
        console.log("✓ Unauthorized poll closure correctly rejected");
      }
    });
  });

  describe("4. Many Voters Simulation - Stress Test", () => {
    let pollCreator: Keypair;
    let pollAccount: PublicKey;
    const NUM_VOTERS = 20; // Simulate 20 voters
    const voters: Keypair[] = [];
    const voteAccounts: PublicKey[] = [];

    before(async () => {
      pollCreator = Keypair.generate();
      await airdrop(pollCreator.publicKey, 5); // Extra SOL for creator

      // Generate voters
      for (let i = 0; i < NUM_VOTERS; i++) {
        voters.push(Keypair.generate());
        await airdrop(voters[i].publicKey);
      }

      // Create poll with 4 options
      [pollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), pollCreator.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createPoll("Many voters test poll", ["Option A", "Option B", "Option C", "Option D"])
        .accounts({
          poll: pollAccount,
          creator: pollCreator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([pollCreator])
        .rpc();

      // Pre-compute vote PDAs
      for (let i = 0; i < NUM_VOTERS; i++) {
        const [voteAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from("vote"), pollAccount.toBuffer(), voters[i].publicKey.toBuffer()],
          program.programId
        );
        voteAccounts.push(voteAccount);
      }
    });

    it("Handles many concurrent votes without overflow or incorrect tallies", async () => {
      // Distribute votes across options: A=5, B=5, C=5, D=5
      const expectedCounts = [5, 5, 5, 5];
      let actualCounts = [0, 0, 0, 0];

      // Cast votes in parallel batches to simulate real-world usage
      const batchSize = 5;
      for (let batch = 0; batch < NUM_VOTERS / batchSize; batch++) {
        const promises = [];
        
        for (let i = 0; i < batchSize; i++) {
          const voterIndex = batch * batchSize + i;
          const optionIndex = voterIndex % 4; // Distribute evenly: 0,1,2,3,0,1,2,3...
          actualCounts[optionIndex]++;
          
          const encryptedData = Buffer.from(`vote_${voterIndex}_option_${optionIndex}`, "utf8");
          
          promises.push(
            program.methods
              .vote(optionIndex, Array.from(encryptedData))
              .accounts({
                poll: pollAccount,
                vote: voteAccounts[voterIndex],
                voter: voters[voterIndex].publicKey,
                systemProgram: SystemProgram.programId,
              })
              .signers([voters[voterIndex]])
              .rpc()
          );
        }
        
        await Promise.all(promises);
        await waitForConfirmation(200); // Small delay between batches
      }

      // Verify final poll state
      const pollData = await program.account.poll.fetch(pollAccount);
      
      // Check total votes
      expect(pollData.totalVotes).to.equal(NUM_VOTERS);
      expect(pollData.totalVotes).to.be.lessThan(2**32); // No overflow (u32 max)
      
      // Check vote counts match expected distribution
      expect(pollData.voteCounts[0]).to.equal(expectedCounts[0]);
      expect(pollData.voteCounts[1]).to.equal(expectedCounts[1]);
      expect(pollData.voteCounts[2]).to.equal(expectedCounts[2]);
      expect(pollData.voteCounts[3]).to.equal(expectedCounts[3]);
      
      // Verify vote count sum equals total votes
      const sum = pollData.voteCounts.reduce((a, b) => a + b, 0);
      expect(sum).to.equal(pollData.totalVotes);
      expect(sum).to.equal(NUM_VOTERS);
      
      // Verify all vote accounts were created
      for (let i = 0; i < NUM_VOTERS; i++) {
        const voteData = await program.account.vote.fetch(voteAccounts[i]);
        expect(voteData.poll.toString()).to.equal(pollAccount.toString());
        expect(voteData.voter.toString()).to.equal(voters[i].publicKey.toString());
      }
      
      console.log(`✓ Successfully processed ${NUM_VOTERS} votes`);
      console.log(`✓ Vote distribution: A=${pollData.voteCounts[0]}, B=${pollData.voteCounts[1]}, C=${pollData.voteCounts[2]}, D=${pollData.voteCounts[3]}`);
      console.log(`✓ No overflow detected - total votes: ${pollData.totalVotes}`);
    });

    it("Verifies vote counts remain consistent after all votes", async () => {
      const pollData = await program.account.poll.fetch(pollAccount);
      
      // Verify vote counts array length matches options length
      expect(pollData.voteCounts.length).to.equal(pollData.options.length);
      
      // Verify no negative counts (shouldn't happen, but good to check)
      for (let i = 0; i < pollData.voteCounts.length; i++) {
        expect(pollData.voteCounts[i]).to.be.at.least(0);
        expect(pollData.voteCounts[i]).to.be.lessThan(2**32); // No overflow
      }
      
      // Verify sum consistency
      const sum = pollData.voteCounts.reduce((a, b) => a + b, 0);
      expect(sum).to.equal(pollData.totalVotes);
      expect(sum).to.equal(NUM_VOTERS);
      
      console.log("✓ Vote counts remain consistent and valid");
    });

    it("Prevents additional votes after poll closure", async () => {
      // Close the poll
      await program.methods
        .closePoll()
        .accounts({
          poll: pollAccount,
          creator: pollCreator.publicKey,
        })
        .signers([pollCreator])
        .rpc();

      // Verify poll is closed
      const pollDataBefore = await program.account.poll.fetch(pollAccount);
      expect(pollDataBefore.isActive).to.be.false;
      expect(pollDataBefore.closedAt).to.not.be.null;

      // Try to add a new vote after closure
      const newVoter = Keypair.generate();
      await airdrop(newVoter.publicKey);

      const [newVoteAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), pollAccount.toBuffer(), newVoter.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .vote(0, Array.from(Buffer.from("vote_after_close", "utf8")))
          .accounts({
            poll: pollAccount,
            vote: newVoteAccount,
            voter: newVoter.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newVoter])
          .rpc();
        
        expect.fail("Should have failed - poll is closed");
      } catch (error: any) {
        expect(error.message).to.include("Poll is not active");
        
        // Verify vote count didn't change
        const pollDataAfter = await program.account.poll.fetch(pollAccount);
        expect(pollDataAfter.totalVotes).to.equal(pollDataBefore.totalVotes);
        expect(pollDataAfter.voteCounts).to.deep.equal(pollDataBefore.voteCounts);
        
        console.log("✓ No votes accepted after poll closure");
      }
    });
  });

  describe("5. Input Validation Tests", () => {
    let pollCreator: Keypair;

    before(async () => {
      pollCreator = Keypair.generate();
      await airdrop(pollCreator.publicKey);
    });

    it("Rejects poll creation with empty question", async () => {
      const [pollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), pollCreator.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createPoll("", ["Option 1", "Option 2"])
          .accounts({
            poll: pollAccount,
            creator: pollCreator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([pollCreator])
          .rpc();
        
        expect.fail("Should have failed - empty question");
      } catch (error: any) {
        expect(error.message).to.include("Question cannot be empty");
        console.log("✓ Empty question correctly rejected");
      }
    });

    it("Rejects poll creation with duplicate options", async () => {
      const newCreator = Keypair.generate();
      await airdrop(newCreator.publicKey);

      const [pollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), newCreator.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createPoll("Duplicate test", ["Option A", "Option A"]) // Duplicate
          .accounts({
            poll: pollAccount,
            creator: newCreator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newCreator])
          .rpc();
        
        expect.fail("Should have failed - duplicate options");
      } catch (error: any) {
        expect(error.message).to.include("Duplicate options not allowed");
        console.log("✓ Duplicate options correctly rejected");
      }
    });

    it("Rejects poll creation with too few options", async () => {
      const newCreator = Keypair.generate();
      await airdrop(newCreator.publicKey);

      const [pollAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), newCreator.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createPoll("Too few test", ["Only One Option"]) // Only 1 option
          .accounts({
            poll: pollAccount,
            creator: newCreator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([newCreator])
          .rpc();
        
        expect.fail("Should have failed - too few options");
      } catch (error: any) {
        expect(error.message).to.include("Too few options");
        console.log("✓ Too few options correctly rejected");
      }
    });
  });
});

