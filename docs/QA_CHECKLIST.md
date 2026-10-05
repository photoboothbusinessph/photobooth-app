# Receipt Photobooth Acceptance Checklist

Record the device, OS, browser version, production URL, tester, and date for each run.

## Responsive and accessibility

- [ ] Inspect the welcome, layout, camera, preview, QR, social, public share, login, and admin routes at 390x844, 768x1024, and 1440x900.
- [ ] Confirm there is no horizontal scrolling, clipped copy, or obscured action.
- [ ] Complete every form and dialog by keyboard; confirm focus is visible and dialogs return focus correctly.
- [ ] Confirm touch actions are at least 44x44 pixels and readable in event lighting.
- [ ] Enable reduced motion and confirm essential state changes remain understandable.

## Online booth flow

- [ ] Start a session and confirm fullscreen is requested where supported.
- [ ] Select each receipt template and verify its configured number of photos.
- [ ] Capture, retake, review, switch Color/B&W, print, and confirm a receipt.
- [ ] Confirm the 120-second timer appears only on layout, camera, and preview screens.
- [ ] Leave a timed screen inactive for 60 seconds and confirm it resets safely.
- [ ] Scan the photo QR from another phone and verify both Color and B&W versions appear.
- [ ] Download both versions from the public page.
- [ ] Confirm the social QR and configured handle are correct.

## Offline and recovery

- [ ] Complete one production load online and install the PWA.
- [ ] Disable all network connectivity and fully close the installed app.
- [ ] Reopen it offline and complete layout selection, camera capture, receipt preview, local save, and printing.
- [ ] Confirm online-only sharing is clearly unavailable while offline.
- [ ] Reconnect, keep the app open, and confirm the pending session synchronizes once without duplication.
- [ ] Scan the synchronized QR from another device.

## Admin and security

- [ ] Verify unauthenticated admin URLs redirect to login.
- [ ] Verify login validation, invalid credentials, loading feedback, and logout.
- [ ] Update business branding, theme, templates, and social QR; reload and confirm each change.
- [ ] Verify invalid/oversized uploads are rejected and destructive actions require confirmation.
- [ ] Verify repeated login/upload/share requests return HTTP 429 without exposing internal errors.

## Hardware and delivery

- [ ] Test the exact production camera and camera-switch control.
- [ ] Print every configured receipt size using the target printer.
- [ ] Confirm paper dimensions, image crop, contrast, margins, and cut position.
- [ ] Provide the admin guide and credentials through an approved secure channel.
