# SubTrack

A web app and Android app for tracking recurring subscriptions such as Netflix, Spotify, and Claude. It shows when each one is next due, which are overdue, and what they cost you per month and per year.

**Live site:** https://subscription-tracker-6f6ec.web.app

Built with React, Vite, Firebase Authentication, and Cloud Firestore. The Android app is the same code, packaged with Capacitor.

## Features

- Sign up, log in, and log out with email and password
- Add, edit, and delete subscriptions
- Pick well-known services such as Netflix and Spotify to fill in their name, category, and logo, or add any other subscription with your own picture
- Mark a billing period as paid, with a payment history and undo
- A status for each subscription: paid, due soon, overdue, or upcoming
- Estimated monthly and yearly totals, grouped by currency
- Search by name, and filter by category, status, or renewal date
- Push notification reminders 3 days before a payment, on the day it's due, and daily while it's overdue

## Running it locally

You need Node.js 20.19 or later and a Firebase project with Email/Password sign-in and Cloud Firestore turned on.

1. Install the dependencies:

   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values from the Firebase console, under **Project settings → General → Your apps → Config**.

3. Start the app:

   ```
   npm run dev
   ```

Run the tests with `npm test`.

## Deploying

```
npx firebase-tools login
npm run build
npx firebase-tools deploy
```

The login step is only needed once per computer. The deploy publishes both the site and the Firestore rules.

## Android app

The `android/` folder is a native Android project that runs the same React code. You need [Android Studio](https://developer.android.com/studio), which includes the Android SDK and the Java version the build needs.

1. Build the web code and copy it into the Android project:

   ```
   npm run android:sync
   ```

   Run this again after every change to the code in `src/`, or the app keeps showing the old version.

2. Open the project in Android Studio:

   ```
   npm run android:open
   ```

3. Choose an emulator, or a phone with USB debugging on, and press **Run** (the green ▶).

To build from the terminal with `npx cap run android` instead, set `JAVA_HOME` to Android Studio's Java first (usually `C:\Program Files\Android\Android Studio\jbr`). Newer Java versions, such as Java 25, are too new for the Gradle version the project uses.

### Sharing the app

The website offers the app for download at `/SubTrack.apk`, so anyone can install it from a link such as `https://your-site.vercel.app/SubTrack.apk`. To update that download:

1. Build a new APK: run `npm run android:sync`, then in Android Studio choose **Build → Generate App Bundles or APKs → Generate APKs**.
2. Run `npm run android:apk`. It copies the new APK to `releases/SubTrack.apk`.
3. Commit and push. Vercel redeploys and the link serves the new version.

`npm run build` adds `releases/SubTrack.apk` to the website. The APK is not kept in `public/`, because everything there is also copied into the app, and each APK would then contain the previous one.

This is a debug build, fine for sharing with friends and classmates. Publishing on Google Play needs a signed release build instead (**Build → Generate Signed App Bundle or APK**).

### Reminders in the app

The app gets reminders as native push notifications, sent by the same daily job as the website. Until the app is connected to Firebase, the **Turn on reminders** button doesn't appear in it.

1. In the Firebase console, open **Project settings → General → Your apps → Add app → Android**. Enter `com.subtrack.app` as the package name and register the app.
2. Download `google-services.json` and put it in `android/app/`. It is listed in `.gitignore`, like `.env`.
3. Run `npm run android:sync` and run the app again.
4. Publish the updated Firestore rules, which check the platform each device saves:

   ```
   npx firebase-tools deploy --only firestore:rules
   ```

5. Push to GitHub. The daily job runs `scripts/send-reminders.js` from the repository, and only the updated script words messages so Android shows them while the app is closed.

## Payment reminders

A GitHub Actions workflow runs `scripts/send-reminders.js` every day at 9:00 AM Philippine time and sends reminders through Firebase Cloud Messaging. People turn reminders on for each browser or phone with the **Turn on reminders** button on the dashboard.

To set it up:

1. In the Firebase console, open **Project settings → Cloud Messaging → Web configuration** and generate a Web Push key pair. Put the key in `.env` as `VITE_FIREBASE_VAPID_KEY`, then build and deploy again.
2. In **Project settings → Service accounts**, generate a new private key. This downloads a JSON file with full access to the project, so keep it private and never commit it.
3. In the GitHub repository, open **Settings → Secrets and variables → Actions** and add a secret named `FIREBASE_SERVICE_ACCOUNT` containing the whole JSON file. Then delete the downloaded file.
4. Test it from the **Actions** tab: choose **Send payment reminders → Run workflow**. "Check everything without sending" is ticked by default; untick it to send for real.

To change the time, edit the `cron` line in `.github/workflows/reminders.yml`. It's in UTC.

On iPhone and iPad, reminders only work after adding the site to the Home Screen (Share → Add to Home Screen), on iOS 16.4 or later. The button appears once the site is opened from there.
