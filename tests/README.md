# Private Voting System Tests

This directory contains comprehensive tests for the private voting system smart contract.

## Test Files

### 1. `private_vote.ts` - Main Integration Tests
- **Type**: TypeScript/Anchor integration tests
- **Purpose**: Tests all program functionality with a real Solana cluster
- **Features**:
  - Poll creation and validation
  - Voting functionality
  - Poll closure
  - Result revealing
  - Error handling
  - Security constraints

### 2. `integration_test.rs` - Rust Unit Tests
- **Type**: Rust unit tests
- **Purpose**: Tests program logic without requiring a Solana cluster
- **Features**:
  - Input validation
  - State transitions
  - PDA generation
  - Space calculations
  - Error codes

### 3. `../scripts/test_simulation.js` - Simulation Script
- **Type**: Node.js simulation
- **Purpose**: Demonstrates functionality without full test environment
- **Features**:
  - Workflow simulation
  - Error case demonstration
  - Security feature overview

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure Anchor is installed
anchor --version
```

### Running Different Test Types

#### 1. Full Anchor Tests (Recommended)
```bash
# Run all tests with Anchor
anchor test

# Run with specific cluster
anchor test --cluster localnet
anchor test --cluster devnet
```

#### 2. Rust Unit Tests
```bash
# Run Rust tests
cargo test

# Run with verbose output
cargo test -- --nocapture
```

#### 3. Simulation Script
```bash
# Run simulation without Solana cluster
node scripts/test_simulation.js
```

## Test Coverage

### ✅ Core Functionality
- [x] Poll creation with validation
- [x] Multiple user voting
- [x] Poll closure by creator
- [x] Result revealing
- [x] Duplicate vote prevention
- [x] Inactive poll protection

### ✅ Input Validation
- [x] Question length limits (200 chars)
- [x] Option count limits (2-10 options)
- [x] Option text limits (100 chars each)
- [x] Encrypted data size limits (256 bytes)
- [x] Non-empty encrypted data validation

### ✅ Security Features
- [x] Creator-only poll management
- [x] PDA-based account creation
- [x] One vote per user per poll
- [x] Account constraints
- [x] Error handling

### ✅ Error Cases
- [x] Question too long
- [x] Too many options
- [x] Option text too long
- [x] Encrypted data too large
- [x] Voting on inactive poll
- [x] Non-creator closing poll
- [x] Revealing results on active poll
- [x] Revealing results with no votes

## Test Data

### Sample Poll
```typescript
const question = "What is your favorite programming language?";
const options = ["Rust", "TypeScript", "Python", "Go"];
```

### Sample Vote
```typescript
const encryptedData = Buffer.from("encrypted_vote_data_for_option_0", "utf8");
```

## Expected Test Results

### Successful Test Run
```
✅ Creates a poll successfully
✅ Fails to create poll with invalid inputs
✅ Fails to create poll with too many options
✅ Allows users to vote on active poll
✅ Allows multiple users to vote
✅ Prevents duplicate voting
✅ Prevents voting on inactive poll
✅ Allows only creator to close poll
✅ Reveals poll results after closing
✅ Fails to reveal results on active poll
✅ Fails to reveal results with no votes
✅ Validates encrypted data size limits
```

### Performance Expectations
- Poll creation: < 1 second
- Vote casting: < 1 second
- Poll closure: < 1 second
- Result revealing: < 1 second

## Troubleshooting

### Common Issues

1. **Test Timeout**
   - Increase timeout in test configuration
   - Check Solana cluster availability

2. **Account Already Exists**
   - Use unique keypairs for each test
   - Clean up test accounts between runs

3. **Insufficient Funds**
   - Ensure test accounts have enough SOL
   - Check airdrop limits

4. **Program Not Deployed**
   - Run `anchor build` first
   - Deploy program with `anchor deploy`

### Debug Mode
```bash
# Run tests with debug output
RUST_LOG=debug anchor test

# Run specific test
anchor test -- --grep "Creates a poll successfully"
```

## Contributing

When adding new tests:
1. Follow the existing naming convention
2. Include both positive and negative test cases
3. Add appropriate error message assertions
4. Update this README with new test coverage
5. Ensure tests are deterministic and isolated
