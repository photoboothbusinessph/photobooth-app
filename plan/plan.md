# Receipt Photobooth PWA — Plan

## Project Goal
Build a reusable, business-configurable receipt photobooth Progressive Web Application using one Next.js codebase. The core photobooth must remain usable offline after the initial install, while online mode enables cloud saving, shareable photo QR codes, remote photo viewing/download, and persistent business settings.

## Core Architecture

### Offline Mode
- PWA installed after the first online load
- App shell and required assets cached by Service Worker
- Settings, templates, business branding, sessions, and photos stored locally in IndexedDB
- Core capture, preview, template, and printing flow remains available without internet
- Cloud-only features are disabled or queued while offline

### Online Mode
- Next.js Route Handlers / Server Actions in the same codebase
- MongoDB for persistent application data and settings
- Cloudinary for photo and image file storage
- Local changes sync to cloud when internet is available
- Shareable photo page generated per completed online session
- QR code points to the shareable photo page

## User Flow

```text
Start 120-second session countdown
↓
Choose Template / Layout
↓
Capture the number of photos defined by the template
↓
Preview
↓
Online?
├── Yes → Save session → Upload image → Generate Share QR
│          ↓
│       User scans QR
│          ↓
│       View Color / Black & White
│          ↓
│       Download Photo
│          ↓
│       Show Business Social Media QR
│
└── No → Save locally and continue offline flow
          Cloud sharing becomes available after sync
```

## Main Modules

### 1. PWA / Offline Module
- Installable PWA
- Service Worker
- Application shell caching
- Offline page handling
- Network status detection
- IndexedDB local persistence
- Offline session queue
- Automatic cloud sync when connection returns

### 2. Business Configuration
The application must be reusable by different businesses without changing the core code.

Business-configurable data:
- Business name
- Business logo
- Social media QR code
- Theme colors
- Receipt templates
- Default layout
- Header/footer text
- Custom messages

### 3. Admin Authentication
- Admin login
- Secure password storage/authentication
- Protected admin routes
- Logout
- Online persistence of admin/business settings
- Local cached settings for offline booth operation

### 4. Admin Dashboard
- Business profile settings
- Branding settings
- Theme color picker
- Social media QR management
- Template management
- Session/gallery management
- Storage/sync status
- Photobooth settings

### 5. Branding and Theme Customization
Admin can update:
- Logo
- Business name
- Theme primary color
- Theme secondary color
- Background color
- Text/accent colors
- Social media QR code

Theme changes apply to:
- Main application UI
- Admin UI
- Photobooth screens
- Template styling where supported

### 6. Template / Layout Management
Admin can:
- Create template
- Edit template
- Duplicate template
- Delete template
- Set default template
- Configure template theme/colors
- Configure photo slot count/layout
- Configure logo placement
- Configure business text
- Configure receipt dimensions

User can:
- Choose template/layout before capture
- Use the selected template's photo slot count as the required capture count

### 7. Camera Module
- Camera permission handling
- Live camera preview
- Camera selection where supported
- Countdown timer
- Photo capture
- Multiple photo capture
- Retake
- Capture progress

### 8. Preview and Image Processing
After capture:
- Show final photo/receipt preview
- Generate color version
- Generate black-and-white version
- Allow preview before continuing
- Save local copy to IndexedDB

Image processing:
- Canvas API / browser image processing
- Cloudinary used for online file storage

### 9. Online Session and Cloud Storage
When online:
- Save session metadata to MongoDB
- Upload generated image/photo to Cloudinary
- Store Cloudinary URL in MongoDB
- Generate unique public/share token
- Create shareable photo page
- Generate QR code for share page

MongoDB stores:
- Business settings
- Theme settings
- Templates
- Session metadata
- Share tokens
- Cloudinary asset references
- Social media QR configuration

Cloudinary stores:
- Captured/final photos
- Business logo when cloud persistence is required
- Social media QR image when uploaded by admin

### 10. Photo Share Page
Accessed by scanning the generated session QR code.

Features:
- Public session photo view
- Color version
- Black-and-white version
- Toggle between color and B&W
- Download selected image
- Mobile-friendly layout
- Session/share-token validation

Requirement:
- Requires internet/mobile data because the page and cloud image are online resources

### 11. Social Media QR Flow
After the user completes the photo viewing/download flow:
- Display business social media QR code
- Admin can replace/update the QR code
- QR configuration persists in MongoDB when online
- Last synced QR remains available locally for booth display

### 12. Local Database
Use IndexedDB through Dexie.js.

Store locally:
- Business settings cache
- Theme cache
- Templates
- Current admin/booth configuration
- Unsynced sessions
- Captured photos pending upload
- Last synced social media QR

### 13. Cloud Sync
Sync rules:
- Local data is always written first where appropriate
- If online, persist/sync to MongoDB and Cloudinary
- If offline, mark cloud-dependent records as pending
- Retry pending uploads when connection returns
- Prevent duplicate session uploads
- Track sync state: local / pending / synced / failed

### 14. Printing
- Receipt/photo print layout
- Print preview
- `window.print()`
- `@media print`
- Reprint previous sessions
- Thermal-printer-friendly receipt sizing where browser/printer supports it

### 15. Session Management
Admin can:
- View sessions
- View sync status
- Open session details
- Preview images
- Reprint
- Delete local session
- Delete cloud session where applicable

### 16. Reusable Business Setup
The application must avoid hardcoded business branding.

A new business should be configurable through admin settings by changing:
- Business identity
- Logo
- Theme
- Social media QR
- Templates
- Photo count defaults
- Receipt text/content

## Tech Stack

### Application
- Next.js
- TypeScript
- Next.js Route Handlers / Server Actions

### UI
- Tailwind CSS
- shadcn/ui

### PWA / Offline
- Serwist
- Service Worker
- Cache Storage API
- Web App Manifest

### Local Database
- IndexedDB
- Dexie.js

### Cloud Database
- MongoDB
- MongoDB Node.js Driver or Mongoose

### Cloud File Storage
- Cloudinary

### State Management
- Zustand

### Camera
- MediaDevices API
- `getUserMedia()`

### Image Processing
- HTML Canvas API
- File API
- Blob API

### QR Codes
- `qrcode` or `react-qr-code`

### Printing
- `window.print()`
- CSS `@media print`

### Deployment
- Vercel

## Suggested Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── booth/
│   ├── preview/
│   ├── share/[token]/
│   ├── print/
│   ├── admin/
│   │   ├── login/
│   │   ├── branding/
│   │   ├── theme/
│   │   ├── templates/
│   │   ├── sessions/
│   │   └── settings/
│   └── api/
│       ├── auth/
│       ├── business/
│       ├── sessions/
│       ├── templates/
│       ├── upload/
│       └── share/
│
├── components/
│   ├── camera/
│   ├── receipt/
│   ├── qr/
│   ├── admin/
│   └── ui/
│
├── lib/
│   ├── db/
│   │   ├── indexed-db.ts
│   │   └── mongodb.ts
│   ├── cloudinary/
│   ├── auth/
│   ├── sync/
│   ├── camera/
│   ├── image/
│   ├── qr/
│   ├── receipt/
│   └── printing/
│
├── stores/
├── types/
└── public/
    ├── icons/
    └── manifest.webmanifest
```

## Core Data Models

### Business
- id
- businessName
- logoUrl
- socialQrUrl
- theme
- headerText
- footerText
- customMessage
- createdAt
- updatedAt

### Theme
- primaryColor
- secondaryColor
- backgroundColor
- textColor
- accentColor

### Template
- id
- businessId
- name
- layout
- photoSlots
- receiptWidth
- receiptHeight
- themeOverrides
- isDefault

### Session
- id
- businessId
- templateId
- photoCount
- createdAt
- syncStatus
- shareToken
- cloudImageUrl
- localImageId

### Local Photo
- id
- sessionId
- imageBlob
- order
- syncStatus

## MVP Completion Criteria
- PWA installs and reopens offline
- User starts a 120-second session and selects a layout/template
- Selected template determines the required photo count
- User captures and retakes photos
- User sees final preview
- Online sessions upload successfully to Cloudinary
- Online session metadata saves to MongoDB
- Session share QR is generated
- QR opens a mobile share page
- User can toggle Color / Black & White
- User can download the image
- Business social media QR is shown after the share/download flow
- Admin can update social media QR
- Admin can upload/replace logo
- Admin can change application theme colors
- Admin can manage templates
- Settings persist in MongoDB online and remain cached locally
- Offline sessions remain usable locally and can sync later
- Business branding is configuration-based and reusable for another business

## Out of Scope
- Separate Express.js backend
- PostgreSQL
- Prisma
- Native Android/iOS application
- Hardware procurement
- Printer hardware/supplies
- Tablet/phone/computer hardware
- Photobooth casing/enclosure
- Guaranteed silent printing where browser/OS does not support it
- QR cloud sharing/download when the booth or viewing device has no internet connection

## Deployment Plan
1. Configure MongoDB
2. Configure Cloudinary
3. Configure production environment variables
4. Deploy Next.js application to Vercel
5. Verify PWA installation
6. Configure first business profile
7. Configure logo/theme/social QR
8. Configure templates
9. Test complete offline capture flow
10. Test complete online cloud flow
11. Test QR share page
12. Test Color/B&W toggle and download
13. Test sync after offline session
14. Test printing
15. Complete client handover
