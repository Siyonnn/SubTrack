import { useId } from 'react'

const TICKET_PATH =
  'M12 14 H52 a6 6 0 0 1 6 6 V26 a6 6 0 0 0 0 12 V44 a6 6 0 0 1 -6 6 H12 a6 6 0 0 1 -6 -6 V38 a6 6 0 0 0 0 -12 V20 a6 6 0 0 1 6 -6 Z'

// A ticket stub with a repeat arrow punched through it: a charge that comes back.
// Drawn in currentColor, so the parent's text color sets it.
export function LogoMark({ size = 40, className }) {
  // React's ids contain characters that are awkward inside url(#...), so keep only safe ones.
  const maskId = 'logo-mask-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="#fff" />
        <path
          d="M30.5 32 A7.5 7.5 0 1 1 22.5 24.5"
          fill="none"
          stroke="#000"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path d="M28.6 24.5 L22 19.8 L22 29.2 Z" fill="#000" />
        <line
          x1="41"
          y1="18"
          x2="41"
          y2="46"
          stroke="#000"
          strokeWidth="2.4"
          strokeDasharray="3.2 3"
          strokeLinecap="round"
        />
      </mask>
      <path mask={`url(#${maskId})`} fill="currentColor" d={TICKET_PATH} />
    </svg>
  )
}

// The full logo. The tagline says what the site is, which the mark alone can't.
export function Logo({ size = 40, tagline = true }) {
  return (
    <span className="logo">
      <LogoMark size={size} className="logo-mark" />
      <span className="logo-text">
        <span className="wordmark">
          Sub<b>Track</b>
        </span>
        {tagline && <span className="tagline">Subscription tracker</span>}
      </span>
    </span>
  )
}

// Chloe the dachshund lives in Chloe.jsx. Exported here too, where the rest of the brand is.
export { Chloe, ChloePose } from './Chloe.jsx'
