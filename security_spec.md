
# Security Specification: Zizhi Reading App

## Data Invariants
1. A book must belong to exactly one user.
2. A quote or note must belong to exactly one user and be associated with a valid bookId.
3. Users can only read, create, update, or delete their own data.
4. Timestamps (createdAt) must be validated where possible (using request.time).
5. User streaks can only be updated by the owner.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a book for user 'A' while authenticated as user 'B'.
2. **Resource Poisoning**: Attempt to create a book with an extremely large ID (e.g. 2KB string).
3. **Ghost Field Update**: Attempt to update a book and inject a field `isVerified: true`.
4. **Orphaned Write**: Attempt to create a quote for a non-existent bookId (relational check - optional for now but recommended).
5. **PII Breach**: Attempt to read user profile of another user.
6. **State Shortcut**: Attempt to change `createdAt` of a note.
7. **Size Attack**: Attempt to save a quote text that is > 1MB.
8. **ID Injection**: Attempt to use `../` or special characters in document IDs.
9. **Blanket Read**: Attempt to list all books in the database without filtering by userId.
10. **Type Confusion**: Attempt to set `progress` to a string instead of a number.
11. **Immortal Field Update**: Attempt to change the `userId` of a book to transfer ownership.
12. **Unverified Auth**: Attempt to write data while authenticated but with an unverified email (assuming verification is forced).

## Test Runner (Logic Overview)
The `firestore.rules.test.ts` (conceptual) will verify that:
- `auth.uid == userId` for all paths under `/users/{userId}`.
- `request.resource.data.userId == auth.uid`.
- `request.resource.data.keys().hasOnly(...)` for specific update actions if applicable.
- `request.resource.data.id` is valid string size.
