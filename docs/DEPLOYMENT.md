# Production Deployment Guide

## Required environment variables

Configure these in the hosting platform for the Production environment. Use unique production credentials and never commit their values.

```text
MONGODB_URI
MONGODB_DB
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
AUTH_SECRET
SUPER_ADMIN_EMAIL
SUPER_ADMIN_PASSWORD
NEXT_PUBLIC_APP_URL
```

`NEXT_PUBLIC_APP_URL` must be the final HTTPS origin without a trailing slash. Generate `AUTH_SECRET` as a high-entropy value of at least 32 characters. Restrict MongoDB network and database access to the minimum required by the deployment.

For an existing installation, complete the credential rotation, backup, dry-run, and tenant migration in `docs/MULTI_BUSINESS.md` before deploying this version. `MONGODB_DB` remains an environment database setting.

## Vercel release procedure

1. Import the repository into the intended Vercel project without changing the package manager or build command.
2. Add every variable above to the Production environment. Do not paste secrets into source files or build logs.
3. Deploy and confirm the build completes successfully.
4. Open the production HTTPS URL once while online and confirm the service worker registers.
5. Sign in as super admin, change the temporary password, create/assign business admins, then let each business admin finish setup and pair a kiosk.
6. Run the online and offline acceptance checklist in `docs/QA_CHECKLIST.md` on the target device.

## Release checks

- `/`, `/b/[slug]`, all `/b/[slug]/booth/*` routes, `/admin/login`, `/super-admin`, and a valid `/share/[token]` load without console errors.
- Camera permission is available only on the production HTTPS origin.
- The manifest is detected and the app can be installed.
- After one successful online load, cached booth routes reopen with the network disabled.
- A confirmed session is available locally, synchronizes after reconnection, and produces a working public share link.
- Color and black-and-white images both load and download from the public share page.
- Admin routes redirect unauthenticated users to login.
- Invalid requests receive safe 4xx responses; repeated sensitive requests receive HTTP 429.

Deployment, DNS, production database configuration, device installation, and printer validation remain operator actions and must be recorded only after they are observed on the actual environment.
