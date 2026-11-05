// Well-known subscriptions people can pick when adding one, so the name, category, billing cycle,
// and logo are filled in for them. Anything not listed is added as "Other".
//
// Logos come from Simple Icons (simple-icons on npm, CC0), so they are bundled with the app and
// show offline. Only services with an official logo there are listed: a picked service always
// shows its real logo, never a stand-in. The trademarks belong to their owners.
import {
  si1password,
  siApplearcade,
  siApplemusic,
  siAppletv,
  siAudible,
  siBitwarden,
  siClaude,
  siCrunchyroll,
  siDeezer,
  siDiscord,
  siDropbox,
  siDuolingo,
  siExpressvpn,
  siFigma,
  siFitbit,
  siGithubcopilot,
  siGooglegemini,
  siGoogledrive,
  siGrammarly,
  siHbomax,
  siHeadspace,
  siIcloud,
  siMedium,
  siNetflix,
  siNordvpn,
  siNotion,
  siParamountplus,
  siPeloton,
  siPerplexity,
  siPlaystation,
  siProton,
  siSpotify,
  siStrava,
  siTidal,
  siYoutube,
  siYoutubemusic,
} from 'simple-icons'

function service(id, name, category, icon, billingCycle = 'monthly') {
  return { id, name, category, icon, billingCycle }
}

// In the order the picker shows them: the most common first. The billing cycle is only yearly
// where the service bills that way for most people. Either can be changed in the form.
export const SERVICES = [
  service('netflix', 'Netflix', 'Streaming', siNetflix),
  service('spotify', 'Spotify', 'Music', siSpotify),
  service('youtube-premium', 'YouTube Premium', 'Streaming', siYoutube),
  service('icloud', 'iCloud+', 'Cloud Storage', siIcloud),
  service('hbo-max', 'HBO Max', 'Streaming', siHbomax),
  service('claude', 'Claude', 'Software', siClaude),
  service('google-gemini', 'Google Gemini', 'Software', siGooglegemini),
  service('apple-music', 'Apple Music', 'Music', siApplemusic),
  service('youtube-music', 'YouTube Music', 'Music', siYoutubemusic),
  service('crunchyroll', 'Crunchyroll', 'Streaming', siCrunchyroll),
  service('apple-tv', 'Apple TV+', 'Streaming', siAppletv),
  service('playstation-plus', 'PlayStation Plus', 'Gaming', siPlaystation),
  service('discord-nitro', 'Discord Nitro', 'Gaming', siDiscord),
  service('google-drive', 'Google Drive', 'Cloud Storage', siGoogledrive),
  service('dropbox', 'Dropbox', 'Cloud Storage', siDropbox),
  service('duolingo', 'Duolingo', 'Software', siDuolingo),
  service('notion', 'Notion', 'Software', siNotion),
  service('github-copilot', 'GitHub Copilot', 'Software', siGithubcopilot),
  service('perplexity', 'Perplexity', 'Software', siPerplexity),
  service('figma', 'Figma', 'Software', siFigma),
  service('grammarly', 'Grammarly', 'Software', siGrammarly),
  service('paramount-plus', 'Paramount+', 'Streaming', siParamountplus),
  service('apple-arcade', 'Apple Arcade', 'Gaming', siApplearcade),
  service('tidal', 'TIDAL', 'Music', siTidal),
  service('deezer', 'Deezer', 'Music', siDeezer),
  service('audible', 'Audible', 'Other', siAudible),
  service('medium', 'Medium', 'News', siMedium),
  service('nordvpn', 'NordVPN', 'Software', siNordvpn),
  service('expressvpn', 'ExpressVPN', 'Software', siExpressvpn),
  service('proton', 'Proton', 'Software', siProton),
  service('1password', '1Password', 'Software', si1password, 'yearly'),
  service('bitwarden', 'Bitwarden', 'Software', siBitwarden, 'yearly'),
  service('strava', 'Strava', 'Fitness', siStrava),
  service('fitbit-premium', 'Fitbit Premium', 'Fitness', siFitbit),
  service('peloton', 'Peloton', 'Fitness', siPeloton),
  service('headspace', 'Headspace', 'Fitness', siHeadspace),
]

const BY_ID = new Map(SERVICES.map((s) => [s.id, s]))

// "iCloud+", "icloud" and "I Cloud" all compare equal.
function simplify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const BY_NAME = new Map(SERVICES.map((s) => [simplify(s.name), s]))

export function findService(id) {
  return (id && BY_ID.get(id)) || null
}

// The service a subscription is named after, for ones saved before services could be picked.
// Only a name that is exactly the service's counts, so "Netflix" matches but "Not Netflix" doesn't.
export function serviceNamed(name) {
  return BY_NAME.get(simplify(name ?? '')) ?? null
}

// The picker's search: services whose name contains the text, in the usual order.
export function searchServices(text) {
  const wanted = simplify(text)
  return wanted ? SERVICES.filter((s) => simplify(s.name).includes(wanted)) : SERVICES
}

// WCAG's minimum contrast for shapes and icons.
const MIN_LOGO_CONTRAST = 3

// The color of the logo on its brand color. Most app icons put a white mark on their color, so
// white is used wherever it is readable, and black only on light colors such as Spotify's green.
export function logoInkFor(hex) {
  const channel = (start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
  const whiteContrast = 1.05 / (luminance + 0.05)
  return whiteContrast >= MIN_LOGO_CONTRAST ? '#FFFFFF' : '#000000'
}
