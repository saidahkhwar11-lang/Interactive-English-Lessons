# Secure weekly backup integration — preparation

This folder documents the **planned** automated backup of the English Department Portfolio and Assessment Tracker to Ministry OneDrive.

## Current status
- The existing browser-based administrator backup buttons remain unchanged.
- The Power Automate *Recurrence* trigger by itself **does not create or upload a backup**.
- No background backup job or automated OneDrive upload has been activated.
- Do not expose student records through public GitHub Pages URLs, unauthenticated webhooks, or public GitHub Actions artifacts.

## Source systems
1. Portfolio: Supabase Postgres (including `portfolio_state`, `portfolio_uploads`, `portfolio_profiles`, meeting acknowledgements, department tasks and initiative records) **plus** Supabase Storage bucket `portfolio-files`. Verify any additional Portfolio tables that belong to this system before claiming full coverage.
2. Tracker: Firebase Firestore (`classes`, `students`, `assessments`, `scores`, `comments`) and Realtime Database (diagnostic and exam-result paths). The independently hosted exam platform may contain additional records and requires separate verification.

## Required secure connection
The destination folder is under the Ministry OneDrive user's `Documents/English Department 2026-2027/Al Reyadah School – Backups`. A browser folder link is not a credential.

A production solution needs:
- A **server-side** scheduled process with read-only credentials for the source systems and narrowly scoped OneDrive write permissions approved by the Ministry tenant administrator.
- Secrets stored in a protected secret manager, **never** in this repository, static JavaScript, a URL or Power Automate run logs.
- Encryption before upload; access-controlled OneDrive folders and documented key recovery.
- A per-run manifest with export time, counts, byte sizes, hashes, and errors. Mark a backup complete only after upload and verification.
- A restore test using an isolated environment before depending on automated backups.
- Failure notifications that include status but **no student data**.
- Retention rules consistent with school policy.

## Safe activation checklist
- [ ] Obtain Ministry authorization for a server-side OneDrive integration.
- [ ] Confirm an approved secret-storage location and source export identities.
- [ ] Build/test complete encrypted exports for **both** systems.
- [ ] Test uploads to the destination folder and verify checksums.
- [ ] Perform a non-destructive restoration test.
- [ ] Enable Friday recurrence only after all checks pass.

Until these are completed, keep manually downloading and securely storing verified backups. Do not assume the scheduled Power Automate flow protects the data.
