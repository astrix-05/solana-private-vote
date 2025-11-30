# Security Audit Report: Private Vote Anchor Program

## Executive Summary

This audit reviews the Anchor program for a private voting system on Solana. The program implements poll creation, voting, poll closure, and result revelation. Several critical security issues and bugs were identified that need to be addressed before production deployment.

---

## Program Structure

### Instructions Overview

1. **`create_poll`** - Creates a new poll with a question and voting options
2. **`vote`** - Allows users to cast encrypted votes on active polls
3. **`close_poll`** - Closes an active poll (creator only)
4. **`reveal_results`** - Reveals vote counts after poll closure

---

## Detailed Instruction Analysis

### 1. `create_poll` Instruction

**Purpose:** Initialize a new poll account with question and options.

**Accounts:**
- `poll` (writable, init) - PDA derived from `[POLL_SEED, creator.key()]`
- `creator` (writable, signer) - Poll creator
- `system_program` (readonly) - System program

**Security Analysis:**

✅ **Strengths:**
- Uses PDA derivation to ensure unique poll accounts per creator
- Validates question length (max 200 chars)
- Validates option count (2-10 options)
- Validates option length (max 100 chars each)
- Initializes vote_counts vector correctly

❌ **Vulnerabilities:**
1. **Missing Empty String Validation:** No check for empty question or empty option strings
2. **No Duplicate Option Check:** Users can create polls with duplicate options
3. **Single Poll Per Creator Limitation:** PDA seed only uses creator key, meaning each creator can only create one poll (may be intentional but limits functionality)
4. **No Poll Account Validation:** While Anchor handles PDA derivation, there's no explicit constraint checking the poll account matches the expected PDA

**Recommendations:**
- Add validation for non-empty question and options
- Add duplicate option detection
- Consider adding a nonce or counter to allow multiple polls per creator
- Add explicit PDA constraint validation

---

### 2. `vote` Instruction

**Purpose:** Cast an encrypted vote on an active poll.

**Accounts:**
- `poll` (writable) - The poll being voted on
- `vote` (writable, init) - PDA derived from `[VOTE_SEED, poll.key(), voter.key()]`
- `voter` (writable, signer) - The voter
- `system_program` (readonly) - System program

**Security Analysis:**

✅ **Strengths:**
- Uses PDA derivation to prevent double voting (same voter + poll = same PDA)
- Validates poll is active
- Validates encrypted data size (max 256 bytes)
- Validates encrypted data is not empty
- Increments total_votes counter

❌ **Critical Vulnerabilities:**

1. **CRITICAL BUG: Vote Counts Never Updated**
   - The `vote_counts` vector is initialized but **never updated** when votes are cast
   - Only `total_votes` is incremented
   - This means `reveal_results` will always show 0 votes for all options
   - **Impact:** Results are completely broken

2. **Missing Account Relationship Validation**
   - No check that `vote.poll` matches `poll.key()` after initialization
   - No check that `vote.voter` matches `voter.key()`
   - While PDA derivation prevents most issues, explicit validation is safer

3. **No Vote Data Validation**
   - Encrypted data is stored but never validated for format/structure
   - No way to verify the encrypted data contains a valid option index

4. **Missing Poll Account Ownership Check**
   - No explicit check that poll account is owned by the program
   - Anchor's `Account` type provides some protection, but explicit ownership check is better

**Recommendations:**
- **URGENT:** Fix vote counting logic to update `vote_counts` based on decrypted vote data
- Add explicit account relationship constraints
- Add poll account ownership validation
- Consider adding vote data structure validation

---

### 3. `close_poll` Instruction

**Purpose:** Close an active poll to prevent further voting.

**Accounts:**
- `poll` (writable) - The poll to close
- `creator` (signer) - Poll creator (must match poll.creator)

**Security Analysis:**

✅ **Strengths:**
- Validates creator matches poll.creator
- Validates poll is active before closing
- Sets closed_at timestamp
- Prevents closing already-closed polls

❌ **Vulnerabilities:**

1. **Missing Poll Account Validation**
   - No explicit check that poll account matches expected PDA derivation
   - No ownership check (though Anchor's Account type provides some protection)

2. **No Reopen Protection**
   - Once closed, poll cannot be reopened (may be intentional)
   - No explicit state machine enforcement

3. **Race Condition Potential**
   - If a vote transaction is in-flight when poll is closed, behavior is undefined
   - Should check poll status atomically

**Recommendations:**
- Add explicit poll account PDA validation
- Add poll account ownership check
- Consider adding a state machine enum instead of boolean flag

---

### 4. `reveal_results` Instruction

**Purpose:** Reveal vote counts for each option after poll closure.

**Accounts:**
- `poll` (readonly) - The closed poll

**Security Analysis:**

✅ **Strengths:**
- Validates poll is closed (not active)
- Validates poll has closed_at timestamp
- Validates poll has votes (total_votes > 0)

❌ **Critical Vulnerabilities:**

1. **CRITICAL BUG: No Actual Vote Decryption/Counting**
   - The instruction only displays `vote_counts` which are **always zero** (never updated)
   - Comment says "TODO: Implement actual vote decryption and counting"
   - **Impact:** Results are completely broken - always shows 0 votes

2. **No Vote Account Iteration**
   - Does not iterate through vote PDAs to decrypt and count votes
   - Cannot access vote accounts without passing them as accounts

3. **Read-Only Limitation**
   - Poll account is readonly, so cannot update vote_counts even if counting was implemented
   - Would need to make poll writable to store results

4. **No Result Finalization**
   - Results are not stored or finalized
   - Anyone can call this multiple times (though harmless)

**Recommendations:**
- **URGENT:** Implement actual vote decryption and counting
- Make poll account writable to store final vote_counts
- Iterate through vote accounts (may require off-chain indexing or passing vote accounts)
- Consider emitting results as events instead of just logs

---

## Cross-Cutting Security Issues

### 1. **Account Ownership Validation**
- Missing explicit `owner` constraints on all account validations
- Should add: `constraint = poll.owner == program_id @ ErrorCode::InvalidAccountOwner`

### 2. **PDA Seed Validation**
- No explicit validation that PDAs match expected seeds
- Anchor handles this automatically, but explicit constraints are clearer

### 3. **State Machine**
- Using boolean `is_active` instead of enum-based state machine
- More error-prone than explicit states (Active, Closed, Revealed)

### 4. **Replay Protection**
- PDA derivation provides some replay protection
- But no explicit nonce or sequence number
- Consider adding vote timestamps for ordering

### 5. **Input Sanitization**
- Missing checks for:
  - Empty strings
  - Whitespace-only strings
  - Duplicate options
  - Invalid UTF-8 (though Rust handles this)

### 6. **Error Codes**
- `TooManyOptions` error code used for both "too many" and "too few" options (line 187 in lib.rs)
- Should have separate error codes

---

## Summary of Critical Issues

### 🔴 CRITICAL (Must Fix Before Production)

1. **Vote counts never updated** - `vote_counts` vector remains all zeros
2. **Results reveal broken** - `reveal_results` shows incorrect (zero) counts
3. **No vote decryption logic** - Encrypted votes are never decrypted or counted

### 🟡 HIGH (Should Fix)

4. Missing empty string validation
5. No duplicate option detection
6. Missing account relationship validations
7. No explicit account ownership checks

### 🟢 MEDIUM (Nice to Have)

8. Single poll per creator limitation
9. Boolean state instead of enum state machine
10. Error code reuse (TooManyOptions for both cases)

---

## Recommended Fix Priority

1. **Priority 1:** Fix vote counting in `vote` instruction
2. **Priority 2:** Implement vote decryption in `reveal_results`
3. **Priority 3:** Add input validation (empty strings, duplicates)
4. **Priority 4:** Add explicit account constraints
5. **Priority 5:** Improve state management and error codes

---

## Testing Recommendations

1. Test double-voting prevention (should fail on second vote)
2. Test vote counting accuracy
3. Test result revelation with multiple votes
4. Test poll closure prevents new votes
5. Test creator-only actions (close_poll)
6. Test input validation edge cases
7. Test account ownership validation
8. Test PDA derivation uniqueness

---

## Conclusion

The program has a solid foundation with good use of PDAs for preventing double voting. However, **critical bugs in vote counting and result revelation must be fixed** before the program can be used in production. The vote counting logic is completely non-functional, and results will always show zero votes.

The recommended fixes will transform this from a non-functional prototype into a production-ready voting system.

