# Security Specification for Zizhi

## Data Invariants
1. A book document must belong to the user who created it and must have a valid title.
2. Quoting/Note taking is only allowed for the user's own books.
3. Users cannot modify other users' profile data.
4. Timestamps must be strictly controlled (server-provided).

## Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a book in `users/alice/books/1` while authenticated as Bob.
2. **PII Leak**: Authenticated user trying to read `users/alice`.
3. **Shadow Field Injection**: Adding an `isAdmin: true` field to a user profile update.
4. **Massive Payload**: Attempt to write a 1.5MB string into a book's description to exhaust storage.
5. **Orphaned Writes**: Creating a note for a book that doesn't exist.
6. **Past Timestamp**: Setting `createdAt` to a date in 1990.
7. **Cross-User Migration**: Authenticated user trying to update `ownerId` of a book they didn't create.
8. **Invalid State Transition**: Moving a book progress to -1.
9. **Regex Bypass**: Using "!!$$##" as a book ID.
10. **Array Poisoning**: Injecting 10,000 tags into a book.
11. **Bulk Delete**: Attempting to delete the entire `library` root if it existed.
12. **System Field Modification**: Changing a system-generated summary.

## Test Runner
(Implementation of tests would go into `firestore.rules.test.ts` if environment supported it).
