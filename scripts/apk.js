// Shares the Android app from the website, at /SubTrack.apk.
//
//   node scripts/apk.js save   Copies the APK Android Studio or Gradle last built into releases/,
//                              the copy that is committed to git and put on the website.
//   node scripts/apk.js site   Copies releases/SubTrack.apk into dist/ after the website is built.
//                              Run by `npm run build`, which is what Vercel runs.
//
// The APK is kept out of public/ on purpose: everything in public/ is also copied into the
// Android app itself, so each new APK would contain the previous one.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'

const BUILT = 'android/app/build/outputs/apk/debug/app-debug.apk'
const SAVED = 'releases/SubTrack.apk'
const ON_SITE = 'dist/SubTrack.apk'

const mode = process.argv[2]

if (mode === 'save') {
  if (!existsSync(BUILT)) {
    console.error(`No APK at ${BUILT}. Build one first (see "Android app" in README.md).`)
    process.exit(1)
  }
  mkdirSync('releases', { recursive: true })
  copyFileSync(BUILT, SAVED)
  console.log(`Saved ${SAVED}. Commit and push it to update the download on the website.`)
} else if (mode === 'site') {
  // A site without a saved APK still builds; it just has no download.
  if (existsSync(SAVED)) {
    copyFileSync(SAVED, ON_SITE)
    console.log(`Added ${ON_SITE} to the website.`)
  }
} else {
  console.error('Use "node scripts/apk.js save" or "node scripts/apk.js site".')
  process.exit(1)
}
