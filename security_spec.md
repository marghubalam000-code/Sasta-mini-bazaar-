# Security Specification & Threat Model

## 1. Core Data Invariants & Authorization Model
- **Master Admin Primary Gate**: Only `marghubalam000@gmail.com` is the Master Administrator.
- **Whitelist Access Control**: Any other user can ONLY authenticate and access the application if their email address has been explicitly added to the `/authorized_users` collection by the master admin.
- **Immediate Session Revocation**: Any unauthenticated or non-whitelisted user attempting sign-in via Google or Email/Password is rejected, signed out from Firebase Auth, and blocked from reading/writing any data.
- **Zero-Bypass Backend Rules**: Firestore security rules verify `isAuthorizedUser()` on all collections (`products`, `sales`, `settings`, `users`). Even if someone bypasses the client code, raw Firestore requests fail with `PERMISSION_DENIED`.
- **ID Poisoning Protection**: All document IDs (`userId`, `productId`, `saleId`, `settingId`, `userEmail`) must conform to length ≤ 128 characters and valid identifier characters.
- **Permanent Data Protection**: Products and Sales can only be explicitly deleted by authorized administrators; automated background purges are strictly prohibited.
- **Payload Validation**: Products require valid names and non-negative selling prices. Sales require an invoice number and valid numerical grand totals.

## 2. The Dirty Dozen Threat Vectors & Mitigations
1. **Unauthenticated Public Read**: Attempting to read `/products` or `/sales` without Firebase Auth token -> Blocked (`PERMISSION_DENIED`).
2. **Unauthenticated Invoice Deletion**: Public POST/DELETE to `/sales/{id}` -> Blocked (`PERMISSION_DENIED`).
3. **Identity Impersonation in Users**: User A creating a user document under User B's UID -> Blocked (`request.auth.uid == userId`).
4. **ID Injection Attack**: Attempting to insert a 2MB string or malicious script tag as a document ID -> Blocked (`isValidId()` regex and length guard).
5. **Negative Pricing Exploit**: Attempting to create a product with negative `sellingPrice` (-500) -> Blocked (`sellingPrice >= 0`).
6. **Negative Sales Exploit**: Writing a transaction with corrupted negative total amounts -> Blocked by validation rules.
7. **Cross-Tenant Document Crawl**: Crawling unknown collections -> Blocked by `match /{document=**} { allow read, write: if false; }`.
8. **Settings Tampering**: Modifying store UPI payment ID or GSTIN without Firebase Auth -> Blocked.
9. **User Deletion**: Attempting to delete a user profile document -> Blocked (`allow delete: if false`).
10. **Malicious Oversized Product Names**: Pushing strings larger than 250 characters -> Blocked.
11. **Client-Side Cache Poisoning**: Offline injection of unauthenticated data -> Blocked on cloud sync.
12. **DDoS through ID Space Poisoning**: Blocked by length limits and strict ID characters.
