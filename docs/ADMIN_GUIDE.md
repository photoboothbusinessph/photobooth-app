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
4. Android: the existing Print button opens the Android share sheet. Choose Easy Thermal Print, confirm the configured USB/OTG printer and requested copy count, then print. A completed share saves the session and opens the QR/download page. RawBT remains available in the codebase but is not called during this client test. No browser-print dialog, WebUSB chooser, or extra Connect button is used.
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

### Android USB/OTG printing through Easy Thermal Print

1. Install Easy Thermal Print, configure its USB printer, grant Android USB permission, and verify an app test print before opening the booth.
2. Connect and power the 80mm ESC/POS USB printer through OTG. Open the updated HTTPS booth in Android Chrome or its installed PWA.
3. Choose Copies and tap Print. Select Easy Thermal Print from Android's share sheet, then use the displayed copy count when printing the shared PNG receipt.
4. After the share is accepted, the booth saves/synchronizes the session and opens the QR/download page when the browser becomes active again.
5. If Easy Thermal Print cannot find the printer, check that Android OTG is still enabled, reconnect the USB cable, approve USB permission again, and test from Easy Thermal Print itself. Do not clear browser data containing unsynced receipts.

Compatibility depends on Android file sharing, Easy Thermal Print, Android USB host/OTG support, and printer compatibility. The workflow must be tested on the actual Xprinter and Android tablet before event use. A disabled OTG setting, missing USB permission, broken cable, paper jam, or power problem cannot be fixed by the booth web app.

The booth shares the generated PNG receipt while preserving the selected 80x100mm, 80x150mm, or 80x200mm layout proportions. The operator selects the requested copy count inside Easy Thermal Print because Android sharing cannot force printer copies. No internet is required for the handoff once the booth is cached. Android sharing, Easy Thermal Print permissions, and printer compatibility still require a real-device test. The booth has no browser-print fallback on non-Android devices. Admin Sessions reprinting is a separate existing browser-print action.

- **Camera unavailable:** confirm browser permission, HTTPS, and that another app is not using the camera.
- **Share QR unavailable:** reconnect to the internet and wait for the session to synchronize.
- **Pending sync remains:** confirm the kiosk is still paired, keep the page open online, then use the retry control in the admin sync panel.
- **Branding looks outdated:** reconnect, open admin once, and reload the booth before the event.
