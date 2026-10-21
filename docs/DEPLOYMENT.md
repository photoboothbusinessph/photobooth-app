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
SUPER_ADMIN_USERNAME
SUPER_ADMIN_PASSWORD
NEXT_APP_URL
```

`NEXT_APP_URL` must be the final HTTPS origin without a trailing slash. Generate `AUTH_SECRET` as a high-entropy value of at least 32 characters. Restrict MongoDB network and database access to the minimum required by the deployment.

Use a unique username containing only letters, numbers, periods, underscores, or hyphens for `SUPER_ADMIN_USERNAME`. Existing deployments using `SUPER_ADMIN_EMAIL` remain login-compatible during migration, but should rotate to the username variable.

Do not use the blank values in `.env.example` as production values. Generate an authentication secret in PowerShell with:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

`MIGRATION_FIRST_BUSINESS_SLUG` is used only while running the migration script and should not remain in Netlify. Remove the retired `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables as well. Netlify secret scanning should remain enabled; do not bypass a scan that identifies a placeholder being used as a production secret.

For an existing installation, complete the credential rotation, backup, dry-run, and tenant migration in `docs/MULTI_BUSINESS.md` before deploying this version. `MONGODB_DB` remains an environment database setting.

## Netlify release procedure

1. Import the repository into the intended Netlify project. The committed `netlify.toml` uses `pnpm build` and publishes `.next`; do not override these with a static-site output folder.
2. In **Project configuration > Environment variables**, add every variable above for the Production deploy context. Do not paste secrets into source files or build logs.
3. Set `NEXT_APP_URL` to the final Netlify or custom HTTPS origin without a trailing slash.
4. In **Deploys**, choose **Trigger deploy > Clear cache and deploy site**, then confirm that the deploy log identifies Next.js and creates Netlify functions.
5. Open the published deploy and use **Deploy File Explorer** to confirm that the Next.js output was included. A Netlify-branded 404 on every route indicates an incorrect publish directory or missing Next.js handler, not an application 404.
6. Open `/admin/login` and `/` on the production domain before continuing setup.
7. Open the production HTTPS URL once while online and confirm the service worker registers.
8. Sign in as super admin, change the temporary password, create/assign business admins, then let each business admin finish setup and pair a kiosk.
9. Run the online and offline acceptance checklist in `docs/QA_CHECKLIST.md` on the target device.

## Vercel release notes

Use the Vercel Next.js framework preset and configure the same required environment variables listed above. A `vercel.json` file is not required for receipt uploads. Receipt images upload directly from the paired kiosk to Cloudinary with a short-lived server-generated signature, so the image bytes do not pass through the Vercel Function request body. Keep `NEXT_APP_URL` set to the final HTTPS origin because authentication still uses it to select secure-cookie behavior.

## Release checks

New or unpaired devices open the admin sign-in screen instead of the business welcome screen. To activate a kiosk, sign in as that business's admin on the target device, open **Kiosks**, generate a code, and choose **Open photobooth**. The sidebar action with the same label opens the same pairing screen. After pairing, the business URL opens the Tap-to-Start screen directly. The pairing page and pairing API require the matching business admin. Photo sessions and uploads still require kiosk authorization.

- `/`, `/b/[slug]`, all `/b/[slug]/booth/*` routes, `/admin/login`, `/super-admin`, and a valid `/share/[token]` load without console errors.
- Camera permission is available only on the production HTTPS origin.
- The manifest is detected and the app can be installed.
- After one successful online load, cached booth routes reopen with the network disabled.
- A confirmed session is available locally, synchronizes after reconnection, and produces a working public share link.
- Color and black-and-white images both load and download from the public share page.
- Admin routes redirect unauthenticated users to login.
- Invalid requests receive safe 4xx responses; repeated sensitive requests receive HTTP 429.

Deployment, DNS, production database configuration, device installation, and printer validation remain operator actions and must be recorded only after they are observed on the actual environment.
