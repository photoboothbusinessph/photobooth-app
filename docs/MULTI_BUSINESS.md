# Multi-business rollout

The app uses one MongoDB database per environment. Each business has a unique ID and URL slug. `MONGODB_DB` is not a business name. Business admins can access only their assigned business; the super admin manages accounts and kiosks but has no photo, session, or branding view.

## Before enabling the release

1. Rotate the MongoDB and Cloudinary credentials previously shared outside the secret manager. Set a new high-entropy `AUTH_SECRET` and server-only `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` (at least 12 characters). Do not reuse the old `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap variables.
2. Back up the existing `dev` database with MongoDB Database Tools or Atlas backup, and verify the backup can be restored. Keep the backup outside this repository.
3. Set `MIGRATION_FIRST_BUSINESS_SLUG` to the chosen permanent URL slug for the current business. Use lowercase letters, digits, and hyphens.
4. With rotated credentials loaded in the process environment, run `node scripts/migrate-multibusiness.mjs --dry-run`. Review the reported counts and slug before applying.
5. Only after backup verification, run `node scripts/migrate-multibusiness.mjs --apply --backup-confirmed`. The script is idempotent and does not change session IDs or share tokens. Do not deploy the tenant-enforcing app before this migration succeeds.
6. Sign in through `/admin/login` with the super-admin environment credentials. Change the password at the first prompt; later environment changes do not reset the account. Create additional businesses and admins in `/super-admin`.
7. Each business admin opens `/admin/kiosks` to generate a 10-minute pairing code. On the device, open `/b/[slug]/pair` and enter the code. Guests use `/b/[slug]` without admin credentials.

`node --env-file=.env.local scripts/migrate-multibusiness.mjs --dry-run` is convenient for local development, but only after replacing the exposed credentials in that local file. Never paste a live connection string into a command, log, issue, or documentation.

## Security and recovery

- A disabled admin is denied on the next server request because session validation checks the database; enabling/disabling and password resets increment the session version. Kiosk access is revoked separately.
- Revoked kiosks can capture while offline. The server rejects their later upload, retains the local item, and shows unsynced session IDs on the pairing screen for an operator. Do not clear the device's browser data before recovery.
- Existing `/share/[token]` links continue to resolve by token and load that session's business. Legacy booth URLs redirect to the migrated business slug.
- New Cloudinary uploads are stored under `receipt-photobooth/<businessId>/`. Existing legacy URLs remain usable.
- IndexedDB records and sync items are scoped by business ID and route namespace. Reset local data affects the active business only.

## Acceptance tests before production

Use at least two test businesses, two admins, and two paired devices. Test wrong-tenant admin API/session/template/upload IDs, direct booth access without pairing, cross-business pairing codes, kiosk revocation with pending offline photos, disabled-account session revocation, first-login password change, duplicate email/slug rejection, QR/share links from migrated sessions, and switching businesses on one browser without displaying the previous business's cached data. Verify production PWA offline navigation separately; a successful build is not proof of offline operation.
