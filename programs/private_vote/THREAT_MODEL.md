# Threat Model: Private Vote Anchor Program

## Assets and Invariants

### Critical Assets
- **Poll accounts**: Store poll metadata, vote counts, and state
- **Vote accounts**: Store individual votes with encrypted data (one per voter per poll)
- **Vote tallies**: `vote_counts` array must accurately reflect votes cast
- **Poll state**: `is_active` flag controls voting eligibility

### Invariants (Must Never Break)
- ✅ **One vote per voter per poll**: Each (poll, voter) pair can only create one vote account
- ✅ **Correct vote tallies**: `vote_counts[option_index]` must equal actual votes for that option
- ✅ **Vote count consistency**: Sum of `vote_counts` ≤ `total_votes` (allows for future features)
- ✅ **No unauthorized poll edits**: Only poll creator can close poll
- ✅ **No voting on closed polls**: Active polls only accept votes
- ✅ **Account ownership**: All accounts must be owned by the program
- ✅ **Option index bounds**: Votes must reference valid option indices

## Actors

### Honest Actors
- **Honest voters**: Cast votes according to poll rules, one vote per poll
- **Poll creators**: Create polls and close them when appropriate
- **Result viewers**: Read-only access to poll results after closure

### Malicious Actors
- **Malicious voters**: Attempt double-voting, vote manipulation, or griefing
- **Malicious poll creators**: May attempt to manipulate poll state or close polls prematurely
- **External attackers**: Attempt to exploit program logic, account ownership, or PDA derivation
- **RPC manipulators**: May attempt to provide false account data or block transactions
- **Backend relayer operators**: Government-sponsored relayer could theoretically manipulate transactions (trusted component)

## Key Threats

### 1. Double-Voting
**Threat**: Same voter votes multiple times on same poll
- **Attack Vector**: Attempt to initialize vote account twice
- **Mitigation**: PDA derivation `[VOTE_SEED, poll.key(), voter.key()]` ensures unique account per (poll, voter) pair. `init` constraint prevents re-initialization.
- **Status**: ✅ Strong - PDA uniqueness enforced by Anchor runtime
- **Weakness**: None identified - PDA derivation is cryptographically secure

### 2. Vote Tally Manipulation
**Threat**: Vote counts don't match actual votes cast
- **Attack Vector**: 
  - Option index out of bounds
  - Vote count not incremented
  - Integer overflow in vote counts
- **Mitigation**: 
  - Option index bounds checking: `require!(option_idx < poll.options.len())`
  - Vote count update: `poll.vote_counts[option_idx] += 1` (CRITICAL FIX applied)
  - u32 type prevents overflow (max 4.2B votes)
- **Status**: ✅ Strong after fix
- **Weakness**: None - bounds checking and type safety prevent issues

### 3. Unauthorized Poll Control
**Threat**: Non-creator closes or modifies poll
- **Attack Vector**: Attempt to close poll as different signer
- **Mitigation**: 
  - Creator check: `constraint = poll.creator == creator.key()`
  - Account ownership: `owner = id() @ ErrorCode::InvalidAccountOwner`
- **Status**: ✅ Strong
- **Weakness**: None - explicit creator validation

### 4. Voting on Closed Polls
**Threat**: Votes cast after poll closure
- **Attack Vector**: Race condition or stale state
- **Mitigation**: 
  - State check: `constraint = poll.is_active @ ErrorCode::PollNotActive`
  - One-way state transition (cannot reopen)
- **Status**: ✅ Strong
- **Weakness**: Minor - race condition possible if vote tx in-flight during closure (acceptable risk)

### 5. Account Ownership Attacks
**Threat**: Malicious accounts passed instead of program-owned accounts
- **Attack Vector**: Pass accounts owned by different program
- **Mitigation**: 
  - Explicit ownership checks: `owner = id() @ ErrorCode::InvalidAccountOwner` on all accounts
- **Status**: ✅ Strong
- **Weakness**: None - Anchor enforces ownership

### 6. Invalid Option Index
**Threat**: Vote cast with option index >= options.length
- **Attack Vector**: Pass invalid option_index parameter
- **Mitigation**: 
  - Bounds check: `require!(option_idx < poll.options.len())`
- **Status**: ✅ Strong
- **Weakness**: None

### 7. Account Relationship Mismatch
**Threat**: Vote account's poll/voter fields don't match passed accounts
- **Attack Vector**: Initialize vote account with wrong poll/voter references
- **Mitigation**: 
  - Explicit validation: `require!(vote.poll == poll.key())` and `require!(vote.voter == voter.key())`
- **Status**: ✅ Strong
- **Weakness**: None - redundant but safe

### 8. Input Validation Bypass
**Threat**: Invalid poll/question/option data stored
- **Attack Vector**: Empty strings, duplicates, oversized inputs
- **Mitigation**: 
  - Question: Non-empty, trimmed, max 200 chars
  - Options: Non-empty, trimmed, max 100 chars each, no duplicates (case-insensitive)
  - Option count: 2-10 options
  - Encrypted data: 1-256 bytes
- **Status**: ✅ Strong
- **Weakness**: None - comprehensive validation

### 9. Integer Overflow
**Threat**: Vote counts exceed u32 maximum (4,294,967,295)
- **Attack Vector**: Extremely popular poll with billions of votes
- **Mitigation**: 
  - u32 type provides natural limit
  - Vote count sum validation in reveal_results
- **Status**: ✅ Strong for practical purposes
- **Weakness**: Theoretical - extremely unlikely in practice, but no explicit overflow check

### 10. Griefing / DoS
**Threat**: Attackers create many polls or votes to consume resources
- **Attack Vector**: 
  - Spam poll creation
  - Spam vote creation
- **Mitigation**: 
  - Poll creation requires SOL for account rent
  - Vote creation requires SOL for account rent
  - No rate limiting (on-chain limitation)
- **Status**: ⚠️ Moderate
- **Weakness**: No rate limiting - attackers with SOL can spam. Acceptable for permissionless system.

### 11. PDA Collision
**Threat**: Two different (poll, voter) pairs generate same PDA
- **Attack Vector**: Cryptographic collision
- **Mitigation**: 
  - PDA derivation uses SHA-256 (cryptographically secure)
  - Collision probability negligible
- **Status**: ✅ Strong
- **Weakness**: None - cryptographically secure

### 12. Backend Relayer Trust
**Threat**: Government relayer manipulates vote transactions
- **Attack Vector**: Relayer submits wrong option_index or modifies encrypted_data
- **Mitigation**: 
  - Relayer is trusted component (government-sponsored)
  - On-chain validation still enforces option_index bounds
  - Encrypted data stored but not validated on-chain
- **Status**: ⚠️ Moderate - requires trust in relayer
- **Weakness**: Relayer could submit votes with wrong option_index (though bounds-checked). Consider adding off-chain verification or making relayer code auditable.

## Current Mitigations Summary

### Strong Mitigations ✅
- PDA-based double-voting prevention
- Account ownership validation
- Creator authorization checks
- State-based access control (active polls)
- Input validation (bounds, empty strings, duplicates)
- Option index bounds checking
- Vote count updates (fixed)
- Account relationship validation

### Moderate/Weak Mitigations ⚠️
- **No rate limiting**: Poll/vote spam possible (acceptable for permissionless)
- **Relayer trust**: Backend relayer is trusted component (consider making auditable)
- **No overflow protection**: u32 limit is high enough for practical purposes

## Recommendations for External Audit

### High Priority
1. **PDA derivation security**: Verify seed ordering and uniqueness
2. **Vote counting logic**: Verify `vote_counts[option_idx] += 1` correctness
3. **Account ownership checks**: Verify all accounts have `owner = id()` constraint
4. **State transition safety**: Verify poll closure is one-way and atomic

### Medium Priority
5. **Integer overflow**: Consider explicit checks for extremely large vote counts
6. **Race conditions**: Review vote + close poll timing
7. **Input validation**: Verify all edge cases (empty strings, whitespace, etc.)

### Low Priority
8. **Rate limiting**: Consider adding if spam becomes issue
9. **Relayer verification**: Consider on-chain verification of relayer signatures
10. **Error handling**: Review all error paths for consistency

## Security Assumptions

1. **Solana runtime**: Assumes Solana runtime correctly enforces PDA derivation and account ownership
2. **Anchor framework**: Assumes Anchor correctly validates constraints
3. **Backend relayer**: Assumes relayer correctly submits votes (trusted component)
4. **Clock sysvar**: Assumes Clock sysvar provides accurate timestamps

## Attack Surface

- **On-chain program**: 4 instructions (create_poll, vote, close_poll, reveal_results)
- **Account structures**: 2 account types (Poll, Vote)
- **External dependencies**: System program, Clock sysvar
- **Trusted components**: Backend relayer (off-chain)

## Conclusion

The program has **strong on-chain security** with comprehensive validation and PDA-based double-voting prevention. The main trust assumption is the **backend relayer**, which should be audited separately. All critical invariants are enforced on-chain.

**Overall Security Rating**: ✅ **Strong** (with relayer trust assumption)

