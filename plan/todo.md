# Receipt Photobooth PWA — TODO

## Phase 1 — Existing Project Setup
- [x] Create Next.js project with TypeScript
- [x] Configure Tailwind CSS
- [x] Add shadcn/ui
- [ ] Add Zustand
- [ ] Add Dexie.js
- [ ] Add Serwist
- [ ] Add MongoDB dependency
- [ ] Add Cloudinary dependency
- [ ] Add QR code library
- [ ] Configure project folder structure
- [ ] Configure environment variables

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
- [x] Create number-of-photos selection
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
- [x] Create photo count setting
- [x] Create countdown setting
- [x] Create default template setting
- [x] Create receipt size setting
- [x] Create fullscreen setting
- [x] Create reset settings action
- [x] Create reset local data action
- [x] Add destructive-action confirmation dialogs

# FRONTEND IMPLEMENTATION

## Phase 15 — Client State and Navigation
- [ ] Add Zustand stores
- [ ] Create booth session state
- [ ] Create selected template state
- [ ] Create photo count state
- [ ] Create captured photos state
- [ ] Create branding/theme state
- [ ] Create admin UI state
- [ ] Connect user flow navigation
- [ ] Prevent invalid step navigation
- [ ] Add session reset flow

## Phase 16 — Camera Functionality
- [ ] Request camera permission
- [ ] Detect available cameras
- [ ] Implement live camera preview
- [ ] Implement front/rear camera switching where supported
- [ ] Implement countdown
- [ ] Implement photo capture
- [ ] Implement multiple-photo capture
- [ ] Implement capture progress
- [ ] Implement retake
- [ ] Handle denied camera permission
- [ ] Handle missing camera device

## Phase 17 — Image and Template Rendering
- [ ] Render captured photos into selected template
- [ ] Generate color version
- [ ] Generate black-and-white version
- [ ] Implement Color / B&W toggle
- [ ] Render business logo
- [ ] Render business branding
- [ ] Apply selected theme
- [ ] Generate final downloadable image
- [ ] Prepare final image for printing
- [ ] Prepare final image for upload

## Phase 18 — Printing
- [ ] Build printable layout
- [ ] Add `@media print` styles
- [ ] Implement Print action
- [ ] Hide non-print UI
- [ ] Implement Reprint action
- [ ] Support configured receipt dimensions
- [ ] Test print layout on target device

## Phase 19 — IndexedDB Offline Storage
- [ ] Create IndexedDB database
- [ ] Create business settings table
- [ ] Create templates table
- [ ] Create sessions table
- [ ] Create photos table
- [ ] Create sync queue table
- [ ] Add database versioning
- [ ] Add local CRUD utilities
- [ ] Add sync status fields
- [ ] Add local reset function
- [ ] Cache latest branding locally
- [ ] Cache latest theme locally
- [ ] Cache templates locally
- [ ] Save offline sessions locally

## Phase 20 — PWA and Offline Behavior
- [ ] Configure web app manifest
- [ ] Add PWA icons
- [ ] Configure Serwist
- [ ] Configure Service Worker
- [ ] Cache app shell
- [ ] Cache booth pages
- [ ] Cache required admin pages
- [ ] Add offline fallback
- [ ] Detect network status
- [ ] Show offline indicator
- [ ] Verify installed PWA opens offline
- [ ] Verify core photobooth flow works offline

# API / SERVER IMPLEMENTATION

## Phase 21 — MongoDB Setup
- [ ] Configure MongoDB connection
- [ ] Create Business collection
- [ ] Create Template collection
- [ ] Create Session collection
- [ ] Create admin/auth data model if required
- [ ] Create database utility
- [ ] Add indexes where required

## Phase 22 — Next.js API / Server Actions
- [ ] Create business settings endpoints/actions
- [ ] Create template CRUD endpoints/actions
- [ ] Create session endpoints/actions
- [ ] Create share-token lookup endpoint/action
- [ ] Add request validation
- [ ] Add consistent API error responses
- [ ] Protect admin-only operations

## Phase 23 — Cloudinary Integration
- [ ] Configure Cloudinary credentials
- [ ] Create secure upload handler
- [ ] Upload final session images
- [ ] Upload business logo
- [ ] Upload social media QR
- [ ] Store Cloudinary asset references in MongoDB
- [ ] Implement asset replace/delete
- [ ] Add upload validation
- [ ] Add upload error handling

## Phase 24 — Admin Authentication
- [ ] Implement admin login
- [ ] Secure admin credentials
- [ ] Create admin session handling
- [ ] Protect admin routes
- [ ] Implement logout
- [ ] Implement change password flow

## Phase 25 — Business Settings Persistence
- [ ] Save business name to MongoDB
- [ ] Save logo reference
- [ ] Save header/footer/custom message
- [ ] Save theme palette
- [ ] Save social media QR reference
- [ ] Load business settings when online
- [ ] Update local cache after successful save

## Phase 26 — Template Persistence
- [ ] Save templates to MongoDB
- [ ] Load templates from MongoDB
- [ ] Update templates
- [ ] Delete templates
- [ ] Set default template
- [ ] Sync latest templates to IndexedDB

## Phase 27 — Online Session Saving
- [ ] Detect online state
- [ ] Save session metadata to MongoDB
- [ ] Upload final image to Cloudinary
- [ ] Store Cloudinary URL in session
- [ ] Generate unique share token
- [ ] Mark session as synced
- [ ] Handle partial save failures
- [ ] Queue failed cloud operations

## Phase 28 — Public Photo Sharing
- [ ] Generate public share URL
- [ ] Generate QR code from share URL
- [ ] Load session by share token
- [ ] Load Cloudinary photo
- [ ] Support Color / B&W view
- [ ] Implement photo download
- [ ] Handle invalid token
- [ ] Handle unavailable image

## Phase 29 — Sync Engine
- [ ] Create sync queue processor
- [ ] Listen for network reconnection
- [ ] Sync pending settings
- [ ] Sync pending templates
- [ ] Upload pending session images
- [ ] Sync pending session metadata
- [ ] Add retry limits
- [ ] Add failed sync state
- [ ] Add manual retry
- [ ] Prevent duplicate records/uploads

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
- [ ] Add loading states
- [ ] Add success states
- [ ] Add error states

## Phase 32 — Offline QA
- [ ] Test first install online
- [ ] Disable internet after install
- [ ] Reopen PWA offline
- [ ] Test template selection offline
- [ ] Test photo-count selection offline
- [ ] Test camera offline
- [ ] Test preview offline
- [ ] Test local session saving
- [ ] Test printing offline
- [ ] Test pending sync after reconnection

## Phase 33 — Online QA
- [ ] Test MongoDB saves
- [ ] Test Cloudinary uploads
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
- [ ] Validate uploads and file types
- [ ] Restrict upload sizes
- [ ] Protect admin routes
- [ ] Protect Cloudinary upload flow
- [ ] Validate MongoDB inputs
- [ ] Use non-guessable share tokens
- [ ] Prevent unauthorized admin changes
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
