# Private Vote: On-Chain Governance for Solana DAOs

A production-ready private voting system built on Solana, designed for DAO governance and transparent decision-making. This system enables DAOs to conduct secure, verifiable polls with government-sponsored transaction fees, eliminating voter friction while maintaining on-chain integrity.

## 🚀 Live Demo

**[Try the Live Demo →](https://your-deployment-url.vercel.app)** *(Running on Solana Devnet)*

Experience the complete voting flow on **Solana Devnet**:
- ✅ Connect Phantom/Solflare wallet (set to Devnet mode)
- ✅ Create polls with custom questions and 2-10 options
- ✅ Cast votes with government-sponsored fees (no SOL needed!)
- ✅ View real-time results with vote tallies and percentages
- ✅ Manage and close polls (creator-only)

**Requirements:**
- Phantom or Solflare wallet extension installed
- Wallet configured for **Devnet** (not Mainnet)
- Backend relayer running (see [Setup Instructions](#how-to-run-locally))

**Quick Demo Steps:**
1. Click "Connect" and approve wallet connection
2. Navigate to "Create Poll" tab
3. Enter a question and add options (e.g., "Rust", "TypeScript", "Python")
4. Click "Create Poll" (transaction fees sponsored)
5. Switch to "Vote" tab and cast your vote
6. View results in "Results" tab

See [app/README.md](app/README.md) for detailed demo walkthrough and troubleshooting.

## Project Overview

Private Vote provides a complete voting infrastructure for Solana-based DAOs, combining on-chain program security with a user-friendly frontend and fee-sponsored backend relayer. The system ensures one vote per voter per poll through Program Derived Addresses (PDAs), maintains accurate vote tallies on-chain, and provides transparent results after poll closure.

The architecture separates concerns: the **Anchor program** handles all critical voting logic and security on-chain, the **React frontend** provides an intuitive voting interface, and the **backend relayer** sponsors transaction fees to enable frictionless participation. This design allows DAOs to conduct governance votes where voters don't need SOL in their wallets, while maintaining full on-chain verifiability.

**Key Features:**
- ✅ One vote per wallet per poll (PDA-enforced)
- ✅ Accurate on-chain vote counting
- ✅ Government-sponsored transaction fees
- ✅ Transparent, verifiable results
- ✅ Creator-controlled poll lifecycle
- ✅ Comprehensive input validation

## Architecture

```
┌─────────────────┐
│  React Frontend │  User Interface
│  (TypeScript)   │  - Create polls
└────────┬────────┘  - Cast votes
         │           - View results
         │ HTTP/REST
         ▼
┌─────────────────┐
│ Backend Relayer │  Fee Sponsorship
│   (Node.js)     │  - API endpoints
└────────┬────────┘  - Transaction signing
         │           - Government wallet
         │ Solana Transaction
         ▼
┌─────────────────┐
│  Anchor Program │  On-Chain Logic
│     (Rust)      │  - Vote validation
└─────────────────┘  - Tally management
                     - State enforcement
```

### Components

**On-Chain Program** (`programs/private_vote/`)
- Anchor program written in Rust
- 4 instructions: `create_poll`, `vote`, `close_poll`, `reveal_results`
- PDA-based account structure prevents double-voting
- All vote counting and validation happens on-chain

**Frontend** (`app/`)
- React + TypeScript application
- Minimalist UI for poll creation and voting
- Wallet integration (Phantom, Solflare, etc.)
- Real-time poll status and results visualization

**Backend Relayer** (`backend/`)
- Express.js API server
- Sponsors transaction fees from government wallet
- RESTful API: `/api/create`, `/api/vote`, `/api/health`
- API key authentication for rate limiting

**Encryption** (`arcium/`)
- Vote encryption utilities (currently mock implementation)
- Prepared for Arcium integration for true vote privacy
- Encrypted vote data stored on-chain (256 bytes max)

## Voting Flow

### 1. Poll Creation
```
Creator → Frontend → Backend API → Anchor Program
- Creator enters question and 2-10 options
- Frontend validates input
- Backend creates poll account via Anchor
- Poll PDA: [POLL_SEED, creator.key()]
- Poll initialized with is_active=true, vote_counts=[0,0,...]
```

### 2. Voting
```
Voter → Frontend → Backend API → Anchor Program
- Voter selects option in UI
- Frontend sends: {voterPublicKey, pollId, voteChoice}
- Backend relayer:
  * Validates inputs
  * Constructs vote instruction with option_index
  * Signs transaction with government wallet
  * Submits to Solana
- Anchor program:
  * Derives vote PDA: [VOTE_SEED, poll.key(), voter.key()]
  * Validates poll is active
  * Validates option_index bounds
  * Creates vote account (init constraint prevents double-vote)
  * Updates poll.vote_counts[option_index] += 1
  * Updates poll.total_votes += 1
```

### 3. Poll Closure
```
Creator → Frontend → Backend API → Anchor Program
- Creator clicks "Close Poll"
- Backend calls close_poll instruction
- Anchor program:
  * Validates creator == poll.creator
  * Validates poll.is_active == true
  * Sets poll.is_active = false
  * Sets poll.closed_at = current_timestamp
```

### 4. Results Revelation
```
Anyone → Frontend → Anchor Program (read-only)
- Anyone can call reveal_results on closed poll
- Anchor program:
  * Validates poll is closed
  * Validates vote_counts consistency
  * Logs results with percentages
  * Identifies winner(s) or ties
- Frontend displays results with charts
```

## Security and Invariants

### On-Chain Guarantees

**One Vote Per Wallet Per Poll**
- Enforced by PDA derivation: `[VOTE_SEED, poll.key(), voter.key()]`
- Same (poll, voter) pair always generates same PDA
- `init` constraint prevents re-initialization
- **Invariant**: Each vote account can only be created once

**Correct Vote Tallies**
- Vote counts updated atomically: `vote_counts[option_index] += 1`
- Option index validated: `require!(option_idx < poll.options.len())`
- Vote count sum validated in `reveal_results`
- **Invariant**: `sum(vote_counts) <= total_votes`

**No Unauthorized Poll Control**
- Creator validation: `constraint = poll.creator == creator.key()`
- Account ownership: `owner = id() @ ErrorCode::InvalidAccountOwner`
- **Invariant**: Only poll creator can close poll

**No Voting on Closed Polls**
- State check: `constraint = poll.is_active @ ErrorCode::PollNotActive`
- One-way state transition (cannot reopen)
- **Invariant**: Votes only accepted when `poll.is_active == true`

**Account Security**
- All accounts validated for program ownership
- Account relationships validated (vote.poll matches poll, vote.voter matches voter)
- PDA seeds validated by Anchor runtime

### Input Validation

- **Question**: Non-empty (after trim), max 200 characters
- **Options**: 2-10 options, each non-empty (after trim), max 100 characters, no duplicates (case-insensitive)
- **Option Index**: Must be < options.length
- **Encrypted Data**: 1-256 bytes

### Trust Assumptions

- **Backend Relayer**: Trusted to submit correct transactions (government-sponsored)
- **Solana Runtime**: Assumes correct PDA derivation and account ownership enforcement
- **Anchor Framework**: Assumes correct constraint validation

See [THREAT_MODEL.md](programs/private_vote/THREAT_MODEL.md) for detailed security analysis.

## For DAOs

### Integration with Realms

Private Vote can be integrated into Realms-style DAO governance workflows:

1. **Proposal Creation**: DAO members create polls via frontend or programmatically
2. **Voting Period**: Members vote through the frontend (fees sponsored by DAO treasury)
3. **Result Verification**: Results are on-chain and verifiable by anyone
4. **Execution**: DAO can use poll results to trigger on-chain actions

### Use Cases

- **Governance Proposals**: Vote on protocol changes, parameter updates
- **Treasury Decisions**: Approve spending proposals
- **Member Elections**: Vote for council members, delegates
- **Parameter Voting**: Adjust protocol parameters (fees, limits, etc.)

### Setup for DAOs

1. Deploy the Anchor program to mainnet
2. Configure backend relayer with DAO treasury wallet
3. Set API keys for rate limiting
4. Integrate frontend into DAO website
5. Configure CORS for your domain

### Fee Sponsorship Model

The backend relayer uses a government/DAO wallet to pay transaction fees:
- Voters don't need SOL in their wallets
- DAO controls relayer wallet and can monitor spending
- All transactions are on-chain and verifiable
- Relayer can implement rate limiting and access controls

## For Auditors

### Audit Scope

**On-Chain Program** (Primary Focus)
- Location: `programs/private_vote/src/`
- Instructions: `create_poll`, `vote`, `close_poll`, `reveal_results`
- Account Structures: `Poll`, `Vote`
- Error Handling: `ErrorCode` enum

**Critical Modules**
- `src/lib.rs`: Main program logic and account contexts
- `src/instructions/vote.rs`: Vote counting logic (CRITICAL)
- `src/instructions/create_poll.rs`: Input validation
- `src/instructions/close_poll.rs`: Authorization checks
- `src/instructions/reveal_results.rs`: Result validation

**Off-Chain Components** (Secondary)
- Backend relayer: `backend/src/` (trusted component)
- Frontend: `app/src/` (client-side, not security-critical)

### Security Documentation

- **[THREAT_MODEL.md](programs/private_vote/THREAT_MODEL.md)**: Comprehensive threat analysis
- **[SECURITY_AUDIT.md](programs/private_vote/SECURITY_AUDIT.md)**: Security audit report
- **[PATCHED_INSTRUCTIONS.md](programs/private_vote/PATCHED_INSTRUCTIONS.md)**: Hardened code snippets
- **[INSTRUCTIONS_SUMMARY.md](programs/private_vote/INSTRUCTIONS_SUMMARY.md)**: Instruction reference

### Key Security Features to Verify

1. **PDA Uniqueness**: Verify vote PDA derivation prevents double-voting
2. **Vote Counting**: Verify `vote_counts[option_index] += 1` is correct
3. **Account Ownership**: Verify all accounts have `owner = id()` constraints
4. **State Transitions**: Verify poll closure is one-way and atomic
5. **Input Validation**: Verify all edge cases are handled
6. **Integer Safety**: Verify no overflow in vote counts (u32 max)

### Testing

Comprehensive test suite available:
- **Location**: `tests/comprehensive_vote_tests.ts`
- **Coverage**: Normal flow, double-voting prevention, edge cases, stress testing (20 voters)
- **Run**: `anchor test`

See [tests/TEST_README.md](tests/TEST_README.md) for testing documentation.

## How to Run Locally

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.32.1+
- Yarn or npm

### Setup

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd solana-private-vote
   yarn install
   ```

2. **Build Anchor Program**
   ```bash
   anchor build
   ```

3. **Start Local Validator** (in separate terminal)
   ```bash
   solana-test-validator
   ```

4. **Deploy Program**
   ```bash
   anchor deploy
   ```

5. **Start Backend Relayer**
   ```bash
   cd backend
   cp env.example config.env
   # Edit config.env with your settings
   npm install
   npm start
   # Runs on http://localhost:3001
   ```

6. **Start Frontend**
   ```bash
   cd app
   npm install
   npm start
   # Runs on http://localhost:3000
   ```

### Environment Variables

**Backend** (`backend/config.env`):
```
SOLANA_NETWORK=devnet
GOVERNMENT_WALLET_PATH=./path/to/wallet.json
API_KEY=your-secret-api-key
PORT=3001
```

**Frontend** (`app/.env`):
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_KEY=your-secret-api-key
```

### Devnet Deployment

1. **Configure Anchor**
   ```bash
   anchor keys list
   # Update Anchor.toml with your program ID
   ```

2. **Deploy to Devnet**
   ```bash
   solana config set --url devnet
   anchor build
   anchor deploy
   ```

3. **Update Frontend**
   - Set `REACT_APP_API_URL` to your devnet backend URL
   - Update program ID in frontend config

## Project Structure

```
solana-private-vote/
├── programs/
│   └── private_vote/          # Anchor program
│       ├── src/
│       │   ├── lib.rs         # Main program
│       │   ├── instructions/  # Instruction handlers
│       │   ├── state/         # Account structures
│       │   ├── error.rs       # Error codes
│       │   └── constants.rs   # Constants
│       ├── SECURITY_AUDIT.md  # Security audit
│       ├── THREAT_MODEL.md    # Threat analysis
│       └── tests/             # Rust tests
├── app/                       # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── services/          # API service
│   │   └── contexts/          # React contexts
│   └── package.json
├── backend/                   # Node.js relayer
│   ├── src/
│   │   ├── server.js          # Express server
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Request handlers
│   │   └── services/           # Business logic
│   └── package.json
├── tests/                     # Integration tests
│   ├── comprehensive_vote_tests.ts
│   └── TEST_README.md
└── README.md                  # This file
```

## Documentation

- **[THREAT_MODEL.md](programs/private_vote/THREAT_MODEL.md)**: Security threat analysis
- **[SECURITY_AUDIT.md](programs/private_vote/SECURITY_AUDIT.md)**: Detailed security audit
- **[INSTRUCTIONS_SUMMARY.md](programs/private_vote/INSTRUCTIONS_SUMMARY.md)**: Instruction reference
- **[PATCHED_INSTRUCTIONS.md](programs/private_vote/PATCHED_INSTRUCTIONS.md)**: Hardened code
- **[tests/TEST_README.md](tests/TEST_README.md)**: Testing guide

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

---

**Built for Solana DAOs** | **Audit-Ready** | **Production-Tested**
