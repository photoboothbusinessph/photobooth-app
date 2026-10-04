# Receipt Photobooth PWA — TODO

## Phase 1 — Existing Project Setup
- [x] Create Next.js project with TypeScript
- [x] Configure Tailwind CSS
- [x] Add shadcn/ui
- [x] Add Zustand
- [x] Add Dexie.js
- [x] Add Serwist
- [x] Add MongoDB dependency
- [x] Add Cloudinary dependency
- [x] Add QR code library
- [x] Configure project folder structure
- [x] Configure environment variables

# UI/UX IMPLEMENTATION

## Phase 2 — Design System
- [x] Review attached reference design
- [x] Review `/skills` folder for UI/UX guidance
- [x] Define typography
- [x] Define spacing system
- [x] Define border radius system
- [x] Define button styles
- [x] Define card styles
- [x] Define form/input styles
- [x] Define icon usage
- [x] Define responsive breakpoints
- [x] Create reusable page container
- [x] Create reusable header/navigation
- [x] Create reusable modal/dialog
- [x] Create reusable loading state
- [x] Create reusable empty state
- [x] Create reusable error state

## Phase 3 — Theme and Business Branding UI
- [x] Create business branding settings UI
- [x] Create business name field
- [x] Create logo upload UI
- [x] Create logo preview
- [x] Create replace/remove logo actions
- [x] Create primary color picker
- [x] Create secondary color picker
- [x] Create background color picker
- [x] Create text color picker
- [x] Create accent color picker
- [x] Create live theme preview
- [x] Apply theme variables across UI
- [x] Apply theme preview to templates

## Phase 4 — User Start UI
- [x] Create photobooth welcome/start screen
- [x] Show business logo and branding
- [x] Create Start button
- [x] Create template/layout selection screen
- [x] Create template cards
- [x] Use template photo slot count as the capture count
- [x] Create selected-state styling
- [x] Create Continue/Back navigation
- [x] Optimize screens for tablet and mobile

## Phase 5 — Camera UI
- [x] Create camera screen layout
- [x] Create camera viewport
- [x] Create countdown overlay
- [x] Create capture button
- [x] Create camera switch button
- [x] Create photo progress indicator
- [x] Create captured-photo thumbnails
- [x] Create retake action
- [x] Create camera permission state
- [x] Create camera error state

## Phase 6 — Photo Preview UI
- [x] Create final preview screen
- [x] Show selected template/layout
- [x] Show captured photos
- [x] Create Color / B&W preview toggle
- [x] Create Retake button
- [x] Create Confirm button
- [x] Create Print action UI
- [x] Create responsive preview layout

## Phase 7 — Photo Share QR UI
- [x] Create photo QR result screen
- [x] Create QR code container
- [x] Add scan instruction text
- [x] Add online-only state
- [x] Add offline unavailable state
- [x] Create Continue button

## Phase 8 — Public Photo Page UI
- [x] Create `/share/[token]` page UI
- [x] Show business branding
- [x] Create photo display area
- [x] Create Color / B&W toggle
- [x] Create Download button
- [x] Create loading state
- [x] Create expired/invalid link state
- [x] Optimize for mobile viewing

## Phase 9 — Social Media QR UI
- [x] Create final social media QR screen
- [x] Show business social QR
- [x] Add business/social CTA
- [x] Create fallback state when no QR exists
- [x] Create Finish / New Session button

## Phase 10 — Admin Layout UI
- [x] Create admin login UI
- [x] Create admin dashboard layout
- [x] Create admin sidebar/navigation
- [x] Create dashboard summary cards
- [x] Create responsive admin navigation
- [x] Create Branding page UI
- [x] Create Theme page UI
- [x] Create Templates page UI
- [x] Create Sessions page UI
- [x] Create Settings page UI

## Phase 11 — Template Management UI
- [x] Create template list/grid
- [x] Create template preview cards
- [x] Create Add Template UI
- [x] Create Edit Template UI
- [x] Create Duplicate action
- [x] Create Delete confirmation
- [x] Create Set Default action
- [x] Create photo slot configuration UI
- [x] Create receipt dimension controls
- [x] Create logo placement controls
- [x] Create template color controls
- [x] Create live template preview

## Phase 12 — Social QR Admin UI
- [x] Create social QR settings UI
- [x] Create QR upload field
- [x] Create QR preview
- [x] Create Replace action
- [x] Create Remove action
- [x] Create save state

## Phase 13 — Sessions Admin UI
- [x] Create session list/table
- [x] Show session ID
- [x] Show date/time
- [x] Show template
- [x] Show photo count
- [x] Show sync status
- [x] Create session detail UI
- [x] Create photo preview
- [x] Create Reprint action
- [x] Create Delete action
- [x] Create sync-status badges

## Phase 14 — Settings UI
- [x] Create countdown setting
- [x] Create default template setting
- [x] Create receipt size setting
- [x] Create fullscreen setting
- [x] Create reset settings action
- [x] Create reset local data action
- [x] Add destructive-action confirmation dialogs

# FRONTEND IMPLEMENTATION

## Phase 15 — Client State and Navigation
- [x] Add Zustand stores
- [x] Create booth session state
- [x] Create selected template state
- [x] Derive photo count from selected template state
- [x] Create captured photos state
- [x] Create branding/theme state
- [x] Create admin UI state
- [x] Connect user flow navigation
- [x] Prevent invalid step navigation
- [x] Add session reset flow

## Phase 16 — Camera Functionality
- [x] Request camera permission
- [x] Detect available cameras
- [x] Implement live camera preview
- [x] Implement front/rear camera switching where supported
- [x] Implement countdown
- [x] Implement photo capture
- [x] Implement multiple-photo capture
- [x] Implement capture progress
- [x] Implement retake
- [x] Handle denied camera permission
- [x] Handle missing camera device

## Phase 17 — Image and Template Rendering
- [x] Render captured photos into selected template
- [x] Generate color version
- [x] Generate black-and-white version
- [x] Implement Color / B&W toggle
- [x] Render business logo
- [x] Render business branding
- [x] Apply selected theme
- [x] Generate final downloadable image
- [x] Prepare final image for printing
- [x] Prepare final image for upload

## Phase 18 — Printing
- [x] Build printable layout
- [x] Add `@media print` styles
- [x] Implement Print action
- [x] Hide non-print UI
- [x] Implement Reprint action
- [x] Support configured receipt dimensions
- [ ] Test print layout on target device

## Phase 19 — IndexedDB Offline Storage
- [x] Create IndexedDB database
- [x] Create business settings table
- [x] Create templates table
- [x] Create sessions table
- [x] Create photos table
- [x] Create sync queue table
- [x] Add database versioning
- [x] Add local CRUD utilities
- [x] Add sync status fields
- [x] Add local reset function
- [x] Cache latest branding locally
- [x] Cache latest theme locally
- [x] Cache templates locally
- [x] Save offline sessions locally

## Phase 20 — PWA and Offline Behavior
- [x] Configure web app manifest
- [x] Add PWA icons
- [x] Configure Serwist
- [x] Configure Service Worker
- [x] Cache app shell
- [x] Cache booth pages
- [x] Cache required admin pages
- [x] Add offline fallback
- [x] Detect network status
- [x] Show offline indicator
- [ ] Verify installed PWA opens offline
- [ ] Verify core photobooth flow works offline

# API / SERVER IMPLEMENTATION

## Phase 21 — MongoDB Setup
- [x] Configure MongoDB connection
- [x] Create Business collection
- [x] Create Template collection
- [x] Create Session collection
- [x] Create admin/auth data model if required
- [x] Create database utility
- [x] Add indexes where required

## Phase 22 — Next.js API / Server Actions
- [x] Create business settings endpoints/actions
- [x] Create template CRUD endpoints/actions
- [x] Create session endpoints/actions
- [x] Create share-token lookup endpoint/action
- [x] Add request validation
- [x] Add consistent API error responses
- [x] Protect admin-only operations

## Phase 23 — Cloudinary Integration
- [x] Configure Cloudinary credentials
- [x] Create secure upload handler
- [x] Upload final session images
- [x] Upload business logo
- [x] Upload social media QR
- [x] Store Cloudinary asset references in MongoDB
- [x] Implement asset replace/delete
- [x] Add upload validation
- [x] Add upload error handling

## Phase 24 — Admin Authentication
- [x] Implement admin login
- [x] Secure admin credentials
- [x] Create admin session handling
- [x] Protect admin routes
- [x] Implement logout
- [x] Implement change password flow

## Phase 25 — Business Settings Persistence
- [x] Save business name to MongoDB
- [x] Save logo reference
- [x] Save header/footer/custom message
- [x] Save theme palette
- [x] Save social media QR reference
- [x] Load business settings when online
- [x] Update local cache after successful save

## Phase 26 — Template Persistence
- [x] Save templates to MongoDB
- [x] Load templates from MongoDB
- [x] Update templates
- [x] Delete templates
- [x] Set default template
- [x] Sync latest templates to IndexedDB

## Phase 27 — Online Session Saving
- [x] Detect online state
- [x] Save session metadata to MongoDB
- [x] Upload final image to Cloudinary
- [x] Store Cloudinary URL in session
- [x] Generate unique share token
- [x] Mark session as synced
- [x] Handle partial save failures
- [x] Queue failed cloud operations

## Phase 28 — Public Photo Sharing
- [x] Generate public share URL
- [x] Generate QR code from share URL
- [x] Load session by share token
- [x] Load Cloudinary photo
- [x] Show both color and black-and-white photo versions on the scanned QR page
- [x] Support Color / B&W view
- [x] Implement photo download
- [x] Handle invalid token
- [x] Handle unavailable image

## Phase 29 — Sync Engine
- [x] Create sync queue processor
- [x] Listen for network reconnection
- [x] Sync pending settings
- [x] Sync pending templates
- [x] Upload pending session images
- [x] Sync pending session metadata
- [x] Add retry limits
- [x] Add failed sync state
- [x] Add manual retry
- [x] Prevent duplicate records/uploads

# REUSABILITY, QA, AND DELIVERY

## Phase 30 — Reusable Business Configuration
- [ ] Remove hardcoded business name
- [ ] Remove hardcoded logo
- [ ] Remove hardcoded theme
- [ ] Remove hardcoded social QR
- [ ] Make templates business-configurable
- [ ] Add initial business configuration flow
- [ ] Verify a new business can reuse the app without code changes

## Phase 31 — UX and Kiosk Optimization
- [ ] Optimize user flow for tablet
- [ ] Optimize for mobile
- [ ] Add large touch targets
- [ ] Add fullscreen-friendly booth UI
- [ ] Prevent accidental navigation during session
- [ ] Add inactivity reset
- [x] Add 120-second session countdown
- [ ] Add loading states
- [ ] Add success states
- [ ] Add error states

## Phase 32 — Offline QA
- [ ] Test first install online
- [ ] Disable internet after install
- [ ] Reopen PWA offline
- [ ] Test template selection offline
- [ ] Test template-derived photo count offline
- [ ] Test camera offline
- [ ] Test preview offline
- [ ] Test local session saving
- [ ] Test printing offline
- [ ] Test pending sync after reconnection

## Phase 33 — Online QA
- [x] Test MongoDB saves
- [x] Test Cloudinary uploads
- [ ] Test share QR generation
- [ ] Test QR scanning from another phone
- [ ] Test public share page
- [ ] Test Color / B&W toggle
- [ ] Test photo download
- [ ] Test social media QR flow
- [ ] Test admin social QR update
- [ ] Test theme update
- [ ] Test business settings update

## Phase 34 — Security and Validation
- [x] Validate uploads and file types
- [x] Restrict upload sizes
- [x] Protect admin routes
- [x] Protect Cloudinary upload flow
- [x] Validate MongoDB inputs
- [x] Use non-guessable share tokens
- [x] Prevent unauthorized admin changes
- [ ] Add basic rate/error protection where required

## Phase 35 — Production Deployment
- [ ] Configure production Vercel project
- [ ] Configure MongoDB production environment
- [ ] Configure Cloudinary production environment
- [ ] Configure environment variables
- [ ] Verify HTTPS
- [ ] Verify camera access
- [ ] Verify Service Worker registration
- [ ] Verify PWA installation
- [ ] Verify offline launch
- [ ] Verify online cloud workflow
- [ ] Verify share links and QR codes

## Phase 36 — Client Handover
- [ ] Configure client business profile
- [ ] Upload client logo
- [ ] Configure client theme
- [ ] Configure social media QR
- [ ] Configure templates
- [ ] Install PWA on target device
- [ ] Complete first online load
- [ ] Test offline flow
- [ ] Test online sharing flow
- [ ] Test printer
- [ ] Provide admin credentials
- [ ] Provide basic admin guide
