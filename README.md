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
pnpm test:offline
pnpm build
```

## Operations

Guest booth steps are bundled together and navigate locally without server-component
requests. Production service workers cache paired business HTML by URL; admin,
pairing and share pages are not offline entry points. Open the paired business
booth online after an update before disconnecting. Missing business configuration
or unavailable browser storage is shown as an error, not a working offline booth.

`pnpm test:offline` checks routing, draft recovery/isolation, and document-cache
rules with infrastructure doubles. It does not replace an installed-browser test
of camera capture, an offline reload, receipt saving, and reconnect/sync.

- [Admin guide](docs/ADMIN_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Multi-business rollout](docs/MULTI_BUSINESS.md)
- [QA checklist](docs/QA_CHECKLIST.md)

Do not commit `.env.local`, production credentials, generated build output, or customer photos.
