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

const EARS = {
  down: [
    'M62 60 C34 62 26 120 34 168 C38 186 60 186 64 168 C70 134 72 96 70 70 Z',
    'M138 60 C166 62 174 120 166 168 C162 186 140 186 136 168 C130 134 128 96 130 70 Z',
  ],
  up: [
    'M62 62 C36 48 14 72 18 112 C20 130 40 134 48 120 C58 102 66 84 68 70 Z',
    'M138 62 C164 48 186 72 182 112 C180 130 160 134 152 120 C142 102 134 84 132 70 Z',
  ],
}

function Eyes({ mood }) {
  if (mood === 'napping') {
    return (
      <path
        d="M72 89 Q80 95 88 89 M112 89 Q120 95 128 89"
        fill="none"
        stroke="var(--tan)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    )
  }
  const alert = mood === 'alert'
  const white = alert ? 11 : 8
  const pupil = alert ? 6 : 5.5
  return (
    <>
      {[80, 120].map((x) => (
        <g key={x}>
          <circle cx={x} cy="88" r={white} fill="var(--eye-white)" />
          <circle cx={x + (alert ? 0 : 1)} cy="89" r={pupil} fill="#0b0a0f" />
          <circle cx={x + 2.4} cy="87" r="1.9" fill="#fff" />
        </g>
      ))}
    </>
  )
}

// Chloe, the black-and-tan dachshund. mood: 'curious' | 'alert' | 'napping'.
// Decorative: the text next to her always says the same thing.
export function Chloe({ mood = 'curious', size = 72, className }) {
  const ears = mood === 'alert' ? EARS.up : EARS.down
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <g fill="var(--ear)" stroke="var(--coat-edge)" strokeWidth="2">
        <path d={ears[0]} />
        <path d={ears[1]} />
      </g>
      <path
        d="M100 40 C136 40 148 66 146 100 C144 130 128 154 100 156 C72 154 56 130 54 100 C52 66 64 40 100 40 Z"
        fill="var(--coat)"
        stroke="var(--coat-edge)"
        strokeWidth="2"
      />
      <ellipse cx="100" cy="128" rx="27" ry="25" fill="var(--tan)" />
      <ellipse cx="100" cy="112" rx="11" ry="8" fill="#0b0a0f" />
      <ellipse cx="96" cy="109.5" rx="3.4" ry="1.8" fill="#fff" opacity="0.5" />
      <path
        d="M100 119 V129 M100 129 C95 135 88 135 84 130 M100 129 C105 135 112 135 116 130"
        fill="none"
        stroke="#0b0a0f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="80" cy="73" r="4.5" fill="var(--tan)" />
      <circle cx="120" cy="73" r="4.5" fill="var(--tan)" />
      <Eyes mood={mood} />
    </svg>
  )
}
