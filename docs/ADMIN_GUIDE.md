# Receipt Photobooth Admin Guide

## First-time setup

1. The platform owner creates your business-admin account in `/super-admin` and gives you a temporary password through a secure channel. Open `/admin/login`, sign in, and change that password.
2. Complete the first-run business setup. Enter the business name, short logo text, social handle, receipt footer, and starting colors.
3. Open **Branding** to use an uploaded logo or styled text logo and optionally add a Tap-to-Start background image.
4. Open **Theme** to preview and save the booth color palette.
5. Open **Templates** to create a generated layout or upload a transparent PNG overlay, then select one default template. Receipt size is assigned automatically from the number of photo slots.
6. Open **Social QR** to enter the business social-media link; the QR code is generated automatically.
7. Open **Kiosks**, generate a one-time pairing code, and enter it on each device at `/b/[your-slug]/pair` before allowing guest use.

## Daily operation

1. On a new device, open the business URL while online, sign in as its business admin, and pair the kiosk. After pairing, load the booth routes so its configuration is cached.
2. Open your paired `/b/[your-slug]` booth from the admin sidebar and tap **Start session**. The app will request fullscreen when the browser supports it.
3. Guests tap a layout to open the camera, take the required photos, then use Retake, Mirror, Copies, or Print on the receipt-ready screen.
4. Android: the existing Print button selects a USB printer when necessary, saves locally, and sends the receipt directly over WebUSB. Successful transfer opens the QR/download page (check actual paper output). If USB fails, tap the same Print button again to confirm RawBT backup. Returning from RawBT opens the QR/download page. No booth browser-print dialog or extra Connect button is used. Non-Android devices show a requirement message.
5. Use **Sessions** to review synchronization status, open a session, reprint, or remove it.

## Offline and synchronization notes

- The camera, receipt preview, printing, and local session save are designed to work without internet after a successful online production load.
- Creating or replacing image-based templates and Tap-to-Start backgrounds requires internet. Saved assets are cached for subsequent offline booth use.
- Public share links, photo QR access, uploads, and admin cloud changes require internet.
- Keep the browser open until the sync indicator reports that pending sessions have uploaded.
- If a kiosk is revoked while offline, its photos remain on that device. The server will reject their sync; the pairing screen lists unsynced session IDs for an operator. Do not clear browser data.
- If a session is inactive for 60 seconds during layout selection, camera capture, or receipt review, it resets to the welcome screen.

## Installation and kiosk use

- Install the production HTTPS site from the browser's app/install menu.
- Grant camera permission to the production origin.
- Keep the device connected to power and disable operating-system sleep during the event.
- Test the exact camera and printer on the target device before guest use.
- Configure the Android tablet and USB printer for 80mm paper before the event. The booth supplies the receipt length (100mm, 150mm, or 200mm) and copy count in its ESC/POS job.
- Never share database, cloud-storage, or application secret values with booth operators.

## Troubleshooting

### Android USB/OTG printing: WebUSB primary, RawBT backup

1. Connect and power the 80mm ESC/POS USB printer through OTG. Open the updated HTTPS booth in Android Chrome or its installed PWA. Close RawBT/other printer apps so they do not hold USB ownership.
2. Choose Copies and tap Print. Select the printer in Chrome's USB chooser and allow Android USB access. There is no separate Connect button. The selected device is remembered during the current page lifetime; reload/reconnection can require selection/permission again.
3. The app sends ordered 4KB chunks, checks transfer status/byte counts, and releases/closes USB afterward. Operations time out rather than endlessly blocking. A successful transfer means bytes were accepted, not proof that paper printed.
4. If connection/permission fails, the page explains the failure. Tap Print again to confirm RawBT backup. Cancel that confirmation to retry WebUSB on the next Print click. If transfer began, the confirmation warns about partial/duplicate receipts and never silently resends. Check/clear the printer's pending job before approving a resend.
5. For backup, install and configure RawBT's USB printer beforehand, granting USB permission and testing a print. Confirming backup hands off to RawBT; Android may ask to open the app. If blocked, the same Print button offers a confirmed retry. Return to the booth for QR/download. Do not clear browser data containing unsynced receipts.

Compatibility: direct USB currently requires a single printer-class (class 7) bulk-OUT interface and ESC/POS raster support. Vendor-specific/serial interfaces and ambiguous composite devices use the RawBT backup; no arbitrary USB interfaces are written to. This must be tested on the actual Xprinter and Android tablet before event use. A broken cable, paper jam, or power problem will affect both transports.

Receipts are dithered black-and-white ESC/POS raster jobs for a 576-dot printable width on 80mm, 203dpi printers. Layout proportions are preserved with white margins. Automatic receipt lengths are 100/150/200mm plus feed/cutter allowance. Copies are included in the RawBT job; large batches are rejected with a request to reduce Copies to stay within Android handoff limits. No internet is required for the handoff once the booth is cached. RawBT permissions/prompts and printer compatibility still require a real-device test. iOS is not supported by RawBT; the booth has no browser-print fallback on non-Android devices. Admin Sessions reprinting is a separate existing browser-print action.

- **Camera unavailable:** confirm browser permission, HTTPS, and that another app is not using the camera.
- **Share QR unavailable:** reconnect to the internet and wait for the session to synchronize.
- **Pending sync remains:** confirm the kiosk is still paired, keep the page open online, then use the retry control in the admin sync panel.
- **Branding looks outdated:** reconnect, open admin once, and reload the booth before the event.
