# Comprehensive Test Suite for Private Vote Program

## Overview

This test suite provides comprehensive coverage for the Anchor private voting program, including normal flows, security checks, edge cases, and stress testing.

## Test Files

### 1. `comprehensive_vote_tests.ts` (NEW - Recommended)
Complete test suite with all required scenarios:
- ✅ Normal voting flow with vote counting
- ✅ Double-voting prevention
- ✅ Edge cases and error handling
- ✅ Many voters simulation (20 voters)
- ✅ Input validation

### 2. `private_vote.ts` (Legacy - Needs Update)
Original test file that needs to be updated to include the `option_index` parameter in vote calls.

## Running Tests

### Prerequisites
1. Ensure Anchor is installed: `anchor --version`
2. Start local validator: `solana-test-validator` (in separate terminal)
3. Build the program: `anchor build`
4. Deploy to localnet: `anchor deploy`

### Run Comprehensive Tests
```bash
# Run the new comprehensive test suite
anchor test --skip-local-validator tests/comprehensive_vote_tests.ts
```

### Run All Tests
```bash
anchor test
```

### Run Specific Test Suite
```bash
# Using mocha directly
yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/comprehensive_vote_tests.ts
```

## Test Coverage

### 1. Normal Voting Flow
**File:** `comprehensive_vote_tests.ts` → `describe("1. Normal Voting Flow")`

Tests:
- ✅ Poll creation with valid inputs
- ✅ First vote cast and tally update
- ✅ Second vote cast and both tallies verified
- ✅ Vote count sum equals total votes

**What it verifies:**
- Poll initializes with correct state (totalVotes=0, voteCounts=[0,0,0,0])
- Votes increment totalVotes correctly
- Votes update voteCounts[optionIndex] correctly
- Vote account stores correct poll, voter, and encrypted data

### 2. Double-Voting Prevention
**File:** `comprehensive_vote_tests.ts` → `describe("2. Double-Voting Prevention")`

Tests:
- ✅ First vote succeeds
- ✅ Second vote attempt fails (PDA already initialized)
- ✅ Double voting prevented regardless of option choice

**What it verifies:**
- PDA derivation ensures unique vote account per (poll, voter) pair
- `init` constraint prevents re-initialization
- Vote counts don't change on double-vote attempt
- Error message indicates account already exists

### 3. Edge Cases and Error Handling
**File:** `comprehensive_vote_tests.ts` → `describe("3. Edge Cases and Error Handling")`

Tests:
- ✅ Voting on closed poll rejected
- ✅ Invalid option index rejected
- ✅ Empty encrypted data rejected
- ✅ Oversized encrypted data rejected (>256 bytes)
- ✅ Non-creator cannot close poll

**What it verifies:**
- State-based access control (active polls only)
- Input validation (option index bounds, data size)
- Authorization checks (only creator can close)
- Appropriate error messages for each case

### 4. Many Voters Simulation
**File:** `comprehensive_vote_tests.ts` → `describe("4. Many Voters Simulation")`

Tests:
- ✅ 20 concurrent votes processed correctly
- ✅ Vote counts remain consistent
- ✅ No overflow (u32 limits respected)
- ✅ Votes distributed evenly across options
- ✅ All vote accounts created successfully
- ✅ No votes accepted after poll closure

**What it verifies:**
- System handles concurrent transactions
- Vote counting accuracy under load
- No integer overflow (totalVotes < 2^32)
- Vote count sum equals total votes
- State consistency maintained

### 5. Input Validation
**File:** `comprehensive_vote_tests.ts` → `describe("5. Input Validation Tests")`

Tests:
- ✅ Empty question rejected
- ✅ Duplicate options rejected
- ✅ Too few options rejected (< 2)

**What it verifies:**
- Question validation (non-empty, trimmed)
- Option validation (no duplicates, case-insensitive)
- Option count validation (2-10 options)

## Test Structure

Each test follows this pattern:
```typescript
it("describes what is being tested", async () => {
  // Setup: Create accounts, airdrop SOL, etc.
  
  // Action: Call program instruction
  
  // Assert: Verify expected state/behavior
  
  console.log("✓ Test passed message");
});
```

## Key Testing Patterns

### 1. Account Setup
```typescript
const keypair = Keypair.generate();
await airdrop(keypair.publicKey, 2); // 2 SOL
```

### 2. PDA Derivation
```typescript
const [pollAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from("poll"), creator.publicKey.toBuffer()],
  program.programId
);
```

### 3. Voting with option_index
```typescript
await program.methods
  .vote(optionIndex, Array.from(encryptedData)) // Note: optionIndex is first param
  .accounts({...})
  .signers([voter])
  .rpc();
```

### 4. Error Testing
```typescript
try {
  await program.methods.vote(...).rpc();
  expect.fail("Should have failed");
} catch (error: any) {
  expect(error.message).to.include("Expected error message");
}
```

## Expected Test Results

When all tests pass, you should see:
```
✓ Poll created successfully with correct initial state
✓ Vote tallies updated correctly: Option 0 has 1 vote
✓ Both votes recorded correctly: Rust=1, Python=1, Total=2
✓ First vote succeeded
✓ Double voting prevented - vote count unchanged
✓ Voting on closed poll correctly rejected
✓ Invalid option index correctly rejected
✓ Successfully processed 20 votes
✓ Vote distribution: A=5, B=5, C=5, D=5
✓ No overflow detected - total votes: 20
```

## Troubleshooting

### Tests Fail with "Account not found"
- Ensure local validator is running: `solana-test-validator`
- Check program is deployed: `anchor deploy`
- Verify program ID matches `Anchor.toml`

### Tests Fail with "Insufficient funds"
- Increase airdrop amounts in test setup
- Check validator has enough SOL: `solana balance`

### Tests Fail with "Transaction simulation failed"
- Check program logs: `solana logs`
- Verify instruction signatures match program
- Ensure all required accounts are provided

### Double-voting test doesn't fail
- Verify vote account PDA is computed correctly
- Check that `init` constraint is in account struct
- Ensure same voter and poll are used for both attempts

## Updating Legacy Tests

The `private_vote.ts` file needs to be updated to include `option_index`:

**Before:**
```typescript
.vote(Array.from(encryptedData))
```

**After:**
```typescript
.vote(optionIndex, Array.from(encryptedData))
```

## Next Steps

1. Run comprehensive tests: `anchor test --skip-local-validator tests/comprehensive_vote_tests.ts`
2. Review test output and fix any failures
3. Add additional edge cases as needed
4. Consider adding fuzz testing for option indices
5. Add integration tests with actual encryption/decryption

## Test Metrics

- **Total Test Cases:** 20+
- **Coverage Areas:** 5 major categories
- **Stress Test:** 20 concurrent voters
- **Edge Cases:** 8+ scenarios
- **Security Tests:** Double-voting, authorization, validation

