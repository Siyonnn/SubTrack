# Subscription Tracker: Specification

A web app and Android app for tracking recurring subscriptions (Netflix, Spotify, Claude, etc.), their billing dates, and estimated spending. Built with React, Vite, Firebase Authentication, and Cloud Firestore.

## Subscription fields

| Field | Type | Notes |
|---|---|---|
| `serviceId` | string \| null | A well-known service picked when adding, from `src/lib/services.js`. Null for "Other" |
| `image` | string (optional) | A picture the user uploaded, stored as a small `data:image/...` link (128×128, at most 100,000 characters). Older subscriptions may have a web link instead. Blank for a picked service |
| `subscriptionName` | string | Required |
| `price` | number | Required, greater than 0, at most 1,000,000. Also enforced by the Firestore rules |
| `currency` | string | ISO code, e.g. `PHP`, `USD` |
| `billingCycle` | `weekly` \| `monthly` \| `yearly` | Required |
| `category` | string | e.g. Streaming, Music, Software |
| `firstDueDate` | date | Entered by the user; anchor for all later dates. No earlier than 3 months before today |
| `lastPaidDate` | date \| null | Due date of the most recent paid period; null until first payment |

Computed, not stored: `nextPaymentDate`, status, overdue count, expense totals.

## Well-known services and logos

- Adding a subscription starts with a searchable grid of well-known services, plus **Other**.
- Picking a service fills in its name, category, and usual billing cycle, and shows its logo. The name and everything else can still be changed, and renaming keeps the logo.
- The billing cycle only offers the cycles that service really bills in, from `cycles` in `src/lib/services.js`: Netflix, iCloud+ and TIDAL are monthly only, Bitwarden is yearly only, and the rest are monthly or yearly. None bill weekly. A subscription saved earlier with another cycle keeps it as an option, so editing never changes it silently. **Other** offers weekly, monthly, and yearly.
- Price and the first payment date are always entered by the user: they depend on the plan and the day the person signed up.
- Only services with an official logo in Simple Icons are listed, so a picked service never shows a stand-in. Popular services without one (such as Disney+, Prime Video, ChatGPT, Canva, Viu) are added with **Other** and an uploaded picture.
- **Other** can have an uploaded picture. It is cropped to the middle square and shrunk to 128×128 before saving, so it is a few kilobytes and needs no separate file storage.
- What a card shows, in order: the picked service's logo; the uploaded picture; the logo of a service whose name matches exactly (for subscriptions saved before services could be picked); the first letter of the name.

## Dates

- `nextPaymentDate`: if nothing has been paid, it equals `firstDueDate`. After a payment, it is one billing cycle after `lastPaidDate`.
- Always calculated from `firstDueDate`, never by stepping from the previous result, so month-end anchors (e.g. Jan 31) do not drift.
- Dates are calendar dates without a time. Comparisons use the user's local date.

## Payments and history

- Marking a payment pays the oldest unpaid period and advances by one billing cycle.
- A subscription three cycles behind needs three payments. The card shows "3 periods overdue" until caught up.
- When more than one period is overdue, "Mark paid" asks whether to pay all of them at once or only the oldest. Either way, each period gets its own history entry.
- Each history entry (subcollection under the subscription): `dueDate` (period paid), `paidOn` (day paid), `amount`.

## Status

Evaluated in this order:

1. **Paid:** there is a payment and `nextPaymentDate` is after today. The period you're in is covered.
2. **Overdue:** `nextPaymentDate` is before today. Show the number of periods behind.
3. **Due soon:** `nextPaymentDate` is today or within the next 7 days.
4. **Upcoming:** anything later.

## Expense totals

- Only active subscriptions count. Paid status does not affect totals.
- Monthly equivalent: monthly = price, yearly = price / 12, weekly = price * 52 / 12.
- Yearly = monthly total * 12.
- Grouped by currency. No conversion. Labeled "estimated."

## Deleting

- Asks for confirmation in a dialog. Permanent. Undoing a payment asks the same way.
- Deletes the subscription and all its history entries in one batch.

## Auth and security

- Firebase Authentication with email and password: register, log in, log out, and a password reset email.
- Three wrong passwords in a row pause log in for 30 seconds. The count is kept in the browser, so it slows guessing on that device but is not a server-side limit.
- The Firestore rules also check each subscription's name, price, currency, billing cycle, and dates.
- Firestore rules: a user can read and write only their own data (`users/{uid}/subscriptions/...`).

## Payment reminders

- Push notifications through Firebase Cloud Messaging, turned on per browser from the dashboard.
- Sent 3 days before a payment, on the day it's due, and every day while it's overdue. One notification per subscription.
- A daily GitHub Actions job sends them at 9:00 AM Philippine time. "Today" is worked out in each browser's own time zone, using the same date rules as the dashboard.
- Each browser or phone is saved at `users/{uid}/devices/{token}` with its time zone and platform (`web` or `android`). Logging out removes the record, so the next person to use the device doesn't get the previous account's reminders.
- Browsers get data-only messages that `public/reminders-sw.js` shows. The Android app gets messages with a notification part, so Android shows them itself, even while the app is closed. Records with no platform were saved before the app existed and count as `web`.
- iPhones need the site added to the Home Screen first.

## Chloe

Chloe the dachshund is decorative: anything she shows is also written as text. She is drawn from the artwork in `art/chloe` (`src/components/Chloe.jsx`), as a head (`Chloe`) or nose to tail (`ChloePose`).

- Moods: napping, happy, sad, and thinking come from the sleeping, celebrating, crying, and thinking drawings; curious and alert are drawn from the same parts in the same style. Each has its own idle animation: blinking, head tilts, ear twitches, sniffing, breathing that blows up her snot bubble, floating Z's, bouncing thought dots, hopping with a rocking party hat and twinkling sparkles, and falling tears. The full-body poses also wag or sway her tail. Idle animations stop after about half a minute to a minute so the page isn't redrawing forever, which would drain a phone's battery.
- Her eyes follow the pointer. Tapping her makes her wiggle, sends up a heart, and restarts her idle animations.
- When her mood changes on screen, such as from alert to napping once everything is paid, she perks up into the new one.
- She reacts to actions from the bottom corner, with a speech bubble that screen readers announce:

  | Action | Mood | Effect |
  |---|---|---|
  | Add a subscription | happy | hearts |
  | Edit a subscription | curious | none |
  | Mark paid | happy | confetti |
  | Undo a payment | thinking | thought bubble |
  | Delete a subscription | sad | tears |
  | Turn reminders on / off | alert / napping | ! / none |

- If the change fails, the problem notice replaces her, so she never cheers for a change that wasn't kept.
- Her colors are fixed, as in the artwork. Lines drawn on the page around her (Z's, wag lines) and the edges of her back legs and tail turn light on the dark theme so they stay visible.
- When the device asks for reduced motion, nothing moves: she still shows her mood and message, without the animations.

## Android app

- The same React code, packaged with Capacitor as a native Android app (`android/`). `src/lib/platform.js` tells the two apart.
- Opens straight to log in instead of the landing page.
- Android's back button closes an open popup, or else sends the app to the background.
- Reminders use native push. The button only appears when the app was built with `android/app/google-services.json`.
- Follows the phone's light or dark mode, including the status and navigation bars.

## Out of scope for v1

Email reminders, currency conversion, CSV export, charts.

## Build order

1. Project setup (Vite + React, Firebase config). Verify: app runs and connects to Firebase.
2. Auth (register, log in, log out, protected routes). Verify: logged-out users cannot reach the dashboard.
3. Security rules. Verify: a second test account cannot read the first account's data.
4. Subscription CRUD with delete confirmation. Verify: data persists after refresh.
5. Date, status, and overdue logic as pure functions with unit tests. Verify: tests pass for month-end dates, late payments, and the 7-day window.
6. Mark as paid and history. Verify: history matches period and amount; next date advances.
7. Totals, search, filters (name, category, status, renewal date). Verify: totals match hand calculations.
8. Polish: empty states, error messages, phone-width layout.
