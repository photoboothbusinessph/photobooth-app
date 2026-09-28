# Receipt Photobooth PWA — TODO

## Phase 1 — Project Setup
- [ ] Create Next.js project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Add shadcn/ui
- [ ] Add Zustand
- [ ] Add Dexie.js
- [ ] Add Serwist
- [ ] Add MongoDB dependency
- [ ] Add Cloudinary dependency
- [ ] Add QR code library
- [ ] Configure folder structure
- [ ] Configure environment variables

## Phase 2 — PWA and Offline Foundation
- [ ] Create web app manifest
- [ ] Add PWA icons
- [ ] Configure Service Worker
- [ ] Cache app shell
- [ ] Cache booth pages
- [ ] Cache required admin pages
- [ ] Add offline fallback
- [ ] Add network status detection
- [ ] Add offline indicator
- [ ] Verify installed PWA opens offline

## Phase 3 — IndexedDB Local Storage
- [ ] Create IndexedDB database
- [ ] Create local business settings table
- [ ] Create local templates table
- [ ] Create local sessions table
- [ ] Create local photos table
- [ ] Create sync queue table
- [ ] Add database versioning
- [ ] Add CRUD utilities
- [ ] Add sync status fields
- [ ] Add local reset function

## Phase 4 — MongoDB
- [ ] Configure MongoDB connection
- [ ] Create Business model/collection
- [ ] Create Template model/collection
- [ ] Create Session model/collection
- [ ] Create admin/auth data model if required
- [ ] Add database connection utility
- [ ] Add business settings persistence
- [ ] Add template persistence
- [ ] Add session metadata persistence
- [ ] Add share-token persistence

## Phase 5 — Cloudinary
- [ ] Configure Cloudinary credentials
- [ ] Create secure upload handler
- [ ] Upload captured/final images
- [ ] Upload business logo
- [ ] Upload social media QR image
- [ ] Store Cloudinary asset references in MongoDB
- [ ] Add upload error handling
- [ ] Add delete/replace asset handling

## Phase 6 — Admin Authentication
- [ ] Create admin login
- [ ] Secure admin credentials
- [ ] Create admin session handling
- [ ] Protect admin routes
- [ ] Add logout
- [ ] Add change password flow
- [ ] Cache required booth settings for offline use

## Phase 7 — Business Profile
- [ ] Create business settings page
- [ ] Add business name
- [ ] Add logo upload
- [ ] Add logo replace/remove
- [ ] Add header text
- [ ] Add footer text
- [ ] Add custom message
- [ ] Persist settings to MongoDB when online
- [ ] Cache settings in IndexedDB
- [ ] Remove hardcoded business branding

## Phase 8 — Theme Color Picker
- [ ] Add primary color picker
- [ ] Add secondary color picker
- [ ] Add background color picker
- [ ] Add text color picker
- [ ] Add accent color picker
- [ ] Add live theme preview
- [ ] Apply theme to user application
- [ ] Apply theme to admin interface
- [ ] Apply theme to supported templates
- [ ] Save theme to MongoDB
- [ ] Cache theme locally

## Phase 9 — Social Media QR Management
- [ ] Add social media QR upload
- [ ] Add QR preview
- [ ] Add QR replace/remove
- [ ] Save QR asset to Cloudinary
- [ ] Save QR settings to MongoDB
- [ ] Cache latest QR locally
- [ ] Add final social QR screen

## Phase 10 — Template / Layout Management
- [ ] Create default templates
- [ ] Create template list
- [ ] Add template
- [ ] Edit template
- [ ] Duplicate template
- [ ] Delete template
- [ ] Set default template
- [ ] Configure layout/photo slots
- [ ] Configure receipt dimensions
- [ ] Configure logo placement
- [ ] Configure template colors/theme
- [ ] Save templates to MongoDB
- [ ] Cache templates in IndexedDB
- [ ] Add live template preview

## Phase 11 — User Start Flow
- [ ] Create start screen
- [ ] Load business branding/theme
- [ ] Add template/layout selection
- [ ] Add number-of-photos selection
- [ ] Validate selected template
- [ ] Validate photo count
- [ ] Start photobooth session

## Phase 12 — Camera Module
- [ ] Request camera permission
- [ ] Detect available cameras
- [ ] Add live camera preview
- [ ] Add front/rear camera switching where supported
- [ ] Add countdown timer
- [ ] Add capture button
- [ ] Add multiple photo capture
- [ ] Add capture progress
- [ ] Add retake
- [ ] Handle denied camera permission
- [ ] Handle missing camera

## Phase 13 — Preview and Image Processing
- [ ] Create final preview screen
- [ ] Render selected template/layout
- [ ] Generate color image
- [ ] Generate black-and-white image
- [ ] Add retake/back action
- [ ] Save generated image locally
- [ ] Prepare image for Cloudinary upload

## Phase 14 — Online Session Saving
- [ ] Detect online state before cloud workflow
- [ ] Save session metadata to MongoDB
- [ ] Upload final image to Cloudinary
- [ ] Store Cloudinary URL in session
- [ ] Generate unique share token
- [ ] Mark session as synced
- [ ] Handle failed upload/save
- [ ] Queue failed cloud operations

## Phase 15 — Offline Session Handling
- [ ] Save session locally when offline
- [ ] Save captured photos locally
- [ ] Mark session as pending sync
- [ ] Continue core photobooth flow offline
- [ ] Show cloud-sharing unavailable state while offline
- [ ] Retry pending sync when internet returns
- [ ] Prevent duplicate cloud uploads
- [ ] Update local sync status after success

## Phase 16 — Session Share QR
- [ ] Create public share URL format
- [ ] Generate QR code from share URL
- [ ] Show QR after successful online save/upload
- [ ] Add QR scan instructions
- [ ] Handle expired/invalid share token
- [ ] Handle unavailable cloud image

## Phase 17 — Public Photo Share Page
- [ ] Create `/share/[token]` page
- [ ] Load session by share token
- [ ] Show business branding
- [ ] Show color photo
- [ ] Show black-and-white photo
- [ ] Add Color / B&W toggle
- [ ] Add download button
- [ ] Optimize for mobile
- [ ] Prevent access to invalid sessions
- [ ] Add loading/error states

## Phase 18 — Social Media QR User Flow
- [ ] Show social media QR after photo view/download flow
- [ ] Load current business social QR
- [ ] Add business/social CTA
- [ ] Ensure QR is mobile-scannable
- [ ] Add fallback when no QR is configured

## Phase 19 — Receipt / Print Flow
- [ ] Build printable receipt/photo layout
- [ ] Add print preview
- [ ] Add `@media print` styles
- [ ] Add Print button
- [ ] Hide non-print UI
- [ ] Add reprint
- [ ] Test configured receipt sizes
- [ ] Test printing offline

## Phase 20 — Admin Dashboard
- [ ] Create dashboard layout
- [ ] Show total sessions
- [ ] Show synced sessions
- [ ] Show pending sessions
- [ ] Show active template
- [ ] Show storage/sync status
- [ ] Add Branding navigation
- [ ] Add Theme navigation
- [ ] Add Templates navigation
- [ ] Add Sessions navigation
- [ ] Add Settings navigation

## Phase 21 — Session Management
- [ ] Create session list
- [ ] Show session ID/date
- [ ] Show template/photo count
- [ ] Show sync status
- [ ] Open session details
- [ ] Preview saved image
- [ ] Reprint session
- [ ] Delete local session
- [ ] Delete cloud session where applicable

## Phase 22 — Cloud Sync Engine
- [ ] Create sync queue processor
- [ ] Listen for network reconnection
- [ ] Sync pending business settings
- [ ] Sync pending templates
- [ ] Upload pending session images
- [ ] Sync pending session metadata
- [ ] Add retry limits
- [ ] Add failed sync state
- [ ] Add manual retry action
- [ ] Prevent duplicate records/uploads

## Phase 23 — Reusable Business Configuration
- [ ] Ensure no business name is hardcoded
- [ ] Ensure no logo is hardcoded
- [ ] Ensure no theme is hardcoded
- [ ] Ensure no social QR is hardcoded
- [ ] Ensure templates are business-configurable
- [ ] Add initial business setup flow
- [ ] Verify new business can be configured without code changes

## Phase 24 — UX and Kiosk Mode
- [ ] Optimize for tablet
- [ ] Optimize for mobile
- [ ] Add large touch targets
- [ ] Add fullscreen-friendly booth UI
- [ ] Prevent accidental navigation during active session
- [ ] Add inactivity reset
- [ ] Add loading states
- [ ] Add success states
- [ ] Add error states

## Phase 25 — Offline QA
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

## Phase 26 — Online QA
- [ ] Test MongoDB saves
- [ ] Test Cloudinary uploads
- [ ] Test share QR generation
- [ ] Test QR scanning on another phone
- [ ] Test public share page
- [ ] Test Color / B&W toggle
- [ ] Test image download
- [ ] Test social media QR screen
- [ ] Test admin QR update
- [ ] Test theme update
- [ ] Test business settings update

## Phase 27 — Security and Validation
- [ ] Validate uploads and file types
- [ ] Restrict upload sizes
- [ ] Protect admin routes
- [ ] Protect Cloudinary upload flow
- [ ] Validate MongoDB inputs
- [ ] Use non-guessable share tokens
- [ ] Prevent unauthorized admin data changes
- [ ] Add basic rate/error protection where required

## Phase 28 — Production Deployment
- [ ] Create production Vercel project
- [ ] Configure MongoDB production environment
- [ ] Configure Cloudinary production environment
- [ ] Configure environment variables
- [ ] Verify HTTPS
- [ ] Verify camera access
- [ ] Verify Service Worker registration
- [ ] Verify PWA install
- [ ] Verify offline launch
- [ ] Verify online cloud workflow
- [ ] Verify share links and QR codes

## Phase 29 — Client Handover
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
