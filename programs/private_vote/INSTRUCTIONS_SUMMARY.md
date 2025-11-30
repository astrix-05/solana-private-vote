# Anchor Program Instructions Summary

## Program Overview

**Program ID:** `7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ`

**Purpose:** Private voting system on Solana with encrypted vote storage and government-sponsored transaction fees.

---

## Instructions

### 1. `create_poll`

**Description:** Creates a new poll with a question and voting options.

**Parameters:**
- `question: String` - The poll question (max 200 chars, non-empty)
- `options: Vec<String>` - Voting options (2-10 options, each max 100 chars, non-empty, no duplicates)

**Accounts:**
- `poll` (writable, init) - PDA derived from `[POLL_SEED, creator.key()]`
  - **Owner:** Program
  - **Seeds:** `["poll", creator.key()]`
- `creator` (writable, signer) - Poll creator
- `system_program` (readonly) - System program

**Validations:**
- ✅ Question not empty (after trim)
- ✅ Question length <= 200 chars
- ✅ Options count: 2-10
- ✅ Each option not empty (after trim)
- ✅ Each option length <= 100 chars
- ✅ No duplicate options (case-insensitive)
- ✅ Account ownership check

**State Changes:**
- Initializes poll account with:
  - `creator` = creator's pubkey
  - `question` = trimmed question
  - `options` = trimmed options
  - `is_active` = true
  - `total_votes` = 0
  - `vote_counts` = vec![0; options.len()]
  - `created_at` = current timestamp
  - `closed_at` = None

**Security Notes:**
- PDA ensures unique poll per creator (one poll per creator limitation)
- All inputs are trimmed and validated
- Duplicate options prevented

---

### 2. `vote`

**Description:** Allows a user to cast an encrypted vote on an active poll.

**Parameters:**
- `option_index: u8` - The index of the chosen option (0-based)
- `encrypted_data: Vec<u8>` - Encrypted vote data (1-256 bytes)

**Accounts:**
- `poll` (writable) - The poll being voted on
  - **Owner:** Program
  - **Constraint:** Must be active
- `vote` (writable, init) - PDA derived from `[VOTE_SEED, poll.key(), voter.key()]`
  - **Owner:** Program
  - **Seeds:** `["vote", poll.key(), voter.key()]`
  - **Purpose:** Ensures one vote per user per poll
- `voter` (writable, signer) - The voter
- `system_program` (readonly) - System program

**Validations:**
- ✅ Poll is active
- ✅ Option index is valid (0 <= index < options.len())
- ✅ Encrypted data not empty
- ✅ Encrypted data size <= 256 bytes
- ✅ Account ownership checks
- ✅ Vote.poll matches poll.key()
- ✅ Vote.voter matches voter.key()

**State Changes:**
- Initializes vote account with:
  - `poll` = poll's pubkey
  - `voter` = voter's pubkey
  - `encrypted_data` = provided encrypted data
  - `created_at` = current timestamp
- Updates poll:
  - `total_votes` += 1
  - `vote_counts[option_index]` += 1 ⚠️ **CRITICAL FIX**

**Security Notes:**
- PDA prevents double voting (same voter + poll = same PDA, which can only be initialized once)
- Vote counts are updated immediately (not deferred to reveal)
- Account relationships are explicitly validated

---

### 3. `close_poll`

**Description:** Closes an active poll, preventing further votes. Only the poll creator can close it.

**Parameters:** None

**Accounts:**
- `poll` (writable) - The poll to close
  - **Owner:** Program
  - **Constraint:** Must be active
  - **Constraint:** poll.creator == creator.key()
- `creator` (signer) - Poll creator (must match poll.creator)

**Validations:**
- ✅ Poll is active
- ✅ Creator matches poll.creator
- ✅ Account ownership check

**State Changes:**
- Updates poll:
  - `is_active` = false
  - `closed_at` = Some(current timestamp)

**Security Notes:**
- Only creator can close poll
- Poll cannot be reopened (one-way state transition)
- Timestamp recorded for audit trail

---

### 4. `reveal_results`

**Description:** Reveals vote counts for each option after poll is closed. Anyone can call this.

**Parameters:** None

**Accounts:**
- `poll` (readonly) - The closed poll
  - **Owner:** Program
  - **Constraint:** Must not be active
  - **Constraint:** closed_at must be Some

**Validations:**
- ✅ Poll is closed (not active)
- ✅ Poll has closed_at timestamp
- ✅ Poll has votes (total_votes > 0)
- ✅ vote_counts.len() == options.len()
- ✅ Sum of vote_counts <= total_votes (sanity check)
- ✅ Account ownership check

**State Changes:**
- None (read-only operation)
- Logs results to program logs

**Output:**
- Logs poll question, total votes, timestamps
- Logs each option with vote count and percentage
- Logs winner(s) or tie information

**Security Notes:**
- Read-only operation (no state changes)
- Validates vote count consistency
- Results are calculated from vote_counts (updated during voting)

---

## Account Structures

### `Poll` Account

```rust
pub struct Poll {
    pub creator: Pubkey,           // Poll creator's public key
    pub question: String,          // The voting question (max 200 chars)
    pub options: Vec<String>,      // Available voting options (2-10, each max 100 chars)
    pub is_active: bool,           // Whether the poll is still accepting votes
    pub total_votes: u32,          // Total number of votes cast
    pub vote_counts: Vec<u32>,     // Vote counts for each option
    pub created_at: i64,           // Timestamp when poll was created
    pub closed_at: Option<i64>,    // Timestamp when poll was closed (if closed)
}
```

**PDA Derivation:** `[POLL_SEED, creator.key()]`

**Space:** ~2,200 bytes (calculated based on max sizes)

---

### `Vote` Account

```rust
pub struct Vote {
    pub poll: Pubkey,              // Reference to the poll
    pub voter: Pubkey,             // Voter's public key
    pub encrypted_data: Vec<u8>,   // Encrypted vote data (max 256 bytes)
    pub created_at: i64,           // Timestamp when vote was cast
}
```

**PDA Derivation:** `[VOTE_SEED, poll.key(), voter.key()]`

**Space:** ~320 bytes

**Purpose:** Ensures one vote per user per poll (PDA uniqueness)

---

## Security Features

### Double-Voting Prevention
- ✅ PDA derivation ensures unique vote account per (poll, voter) pair
- ✅ `init` constraint prevents re-initialization
- ✅ Explicit account relationship validation

### Access Control
- ✅ Only poll creator can close poll
- ✅ Account ownership checks on all accounts
- ✅ State-based access (active polls only accept votes)

### Input Validation
- ✅ Length limits on all strings
- ✅ Empty string rejection
- ✅ Duplicate option detection
- ✅ Option index bounds checking
- ✅ Encrypted data size limits

### State Safety
- ✅ Explicit state transitions (active → closed)
- ✅ One-way state changes (cannot reopen poll)
- ✅ Vote count consistency checks

---

## Known Limitations

1. **One Poll Per Creator:** PDA seed only uses creator key, limiting each creator to one poll
   - **Workaround:** Add nonce/counter to PDA seed

2. **Privacy Trade-off:** `option_index` is passed in plaintext for vote counting
   - **Alternative:** Decrypt votes off-chain during reveal phase

3. **Vote Account Iteration:** `reveal_results` doesn't iterate through vote accounts
   - **Current Approach:** Vote counts updated during voting
   - **Alternative:** Pass vote accounts as remaining accounts for verification

---

## Testing Checklist

- [ ] Create poll with valid inputs
- [ ] Reject empty question
- [ ] Reject empty options
- [ ] Reject duplicate options
- [ ] Reject too many/few options
- [ ] Vote on active poll
- [ ] Reject vote on closed poll
- [ ] Prevent double voting (same voter, same poll)
- [ ] Verify vote counts increment correctly
- [ ] Close poll as creator
- [ ] Reject close poll as non-creator
- [ ] Reject close already-closed poll
- [ ] Reveal results after closing
- [ ] Reject reveal on active poll
- [ ] Verify vote count accuracy
- [ ] Verify winner detection
- [ ] Handle ties correctly

---

## Error Codes Reference

| Code | Message |
|------|---------|
| `PollNotActive` | Poll is not active |
| `PollAlreadyClosed` | Poll is already closed |
| `PollStillActive` | Poll is still active |
| `InvalidOptionIndex` | Invalid option index |
| `AlreadyVoted` | User has already voted |
| `UnauthorizedCreator` | Only poll creator can perform this action |
| `QuestionTooLong` | Question too long |
| `QuestionEmpty` | Question cannot be empty |
| `TooManyOptions` | Too many options |
| `TooFewOptions` | Too few options - need at least 2 |
| `OptionTooLong` | Option text too long |
| `OptionEmpty` | Option text cannot be empty |
| `DuplicateOptions` | Duplicate options not allowed |
| `EncryptedDataTooLarge` | Encrypted data too large |
| `NoVotesToReveal` | No votes to reveal |
| `InvalidAccountOwner` | Invalid account owner |
| `VotePollMismatch` | Account mismatch - vote.poll does not match poll account |
| `VoteVoterMismatch` | Account mismatch - vote.voter does not match voter account |

