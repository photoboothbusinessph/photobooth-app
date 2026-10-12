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
4. After the native print dialog closes, the session is saved locally and the QR/download page opens. When online, pending sessions synchronize automatically.
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
- Configure the tablet and printer for 80mm paper before the event. The app supplies the automatic receipt length (100mm, 150mm, or 200mm), but the native print dialog controls the selected printer and copy count.
- Never share database, cloud-storage, or application secret values with booth operators.

## Troubleshooting

- **Camera unavailable:** confirm browser permission, HTTPS, and that another app is not using the camera.
- **Share QR unavailable:** reconnect to the internet and wait for the session to synchronize.
- **Pending sync remains:** confirm the kiosk is still paired, keep the page open online, then use the retry control in the admin sync panel.
- **Branding looks outdated:** reconnect, open admin once, and reload the booth before the event.
