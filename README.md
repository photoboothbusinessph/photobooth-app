# Receipt Photobooth

A reusable, touch-first receipt photobooth built with Next.js, TypeScript, Tailwind CSS, MongoDB, Cloudinary, IndexedDB, and Serwist.

## Local development

1. Copy `.env.example` to `.env.local` and supply development credentials.
2. Install dependencies with `pnpm install`.
3. Start development with `pnpm dev`.
4. Open `http://localhost:3000`.

The service worker is intentionally disabled in development. Use `pnpm preview:pwa` to build and run a local production preview for PWA/offline testing.

## Quality checks

```powershell
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

## Operations

- [Admin guide](docs/ADMIN_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [QA checklist](docs/QA_CHECKLIST.md)

Do not commit `.env.local`, production credentials, generated build output, or customer photos.
