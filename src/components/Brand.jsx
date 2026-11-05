import { useEffect, useId, useRef, useState } from 'react'

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

// Chloe's ears hang down, or stand up when she is alert. Sad ears are the down ones, turned
// outward by the stylesheet.
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

const HEART = 'M150 62 C138 52 136 44 142 40 C146 37 150 40 150 44 C150 40 154 37 158 40 C164 44 162 52 150 62 Z'

// How far her pupils move toward the pointer, in the drawing's units.
const LOOK_REACH = 2.6

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
  if (mood === 'happy') {
    // Squeezed shut with joy.
    return (
      <path
        d="M71 92 Q80 81 89 92 M111 92 Q120 81 129 92"
        fill="none"
        stroke="var(--eye-white)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    )
  }
  const alert = mood === 'alert'
  const sad = mood === 'sad'
  const white = alert ? 11 : 8
  const pupil = alert ? 6 : 5.5
  return (
    <>
      {[80, 120].map((x) => (
        <g key={x} className="chloe-eye">
          <circle cx={x} cy="88" r={white} fill="var(--eye-white)" />
          <g className="chloe-pupil">
            <circle cx={x + (alert ? 0 : 1)} cy={sad ? 91 : 89} r={pupil} fill="#0b0a0f" />
            <circle cx={x + 2.4} cy={sad ? 89 : 87} r="1.9" fill="#fff" />
          </g>
          {/* Heavy lids that slope down toward the outside of each eye. */}
          {sad && (
            <path
              d={x < 100 ? 'M70 79 H91 V86 Q80 81 70 88 Z' : 'M109 79 H130 V88 Q120 81 109 86 Z'}
              fill="var(--coat)"
            />
          )}
        </g>
      ))}
    </>
  )
}

function Mouth({ mood }) {
  if (mood === 'happy') {
    return (
      <>
        <path d="M100 119 V127" stroke="#0b0a0f" strokeWidth="3" strokeLinecap="round" />
        <path d="M85 128 Q100 147 115 128 Z" fill="#0b0a0f" />
        <ellipse cx="100" cy="139" rx="6.5" ry="5" fill="#e8707e" />
      </>
    )
  }
  const d =
    mood === 'sad'
      ? 'M100 119 V128 M100 128 C95 126 88 128 85 134 M100 128 C105 126 112 128 115 134'
      : 'M100 119 V129 M100 129 C95 135 88 135 84 130 M100 129 C105 135 112 135 116 130'
  return <path d={d} fill="none" stroke="#0b0a0f" strokeWidth="3" strokeLinecap="round" />
}

// Moves her pupils toward the pointer, wherever it is on the page. Skipped when reduced motion
// is asked for, and in moods where her eyes are closed.
function useLookAtPointer(ref, enabled) {
  useEffect(() => {
    if (!enabled || !window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches) {
      return
    }
    const svg = ref.current
    let frame = 0
    let pointer = null

    function update() {
      frame = 0
      const box = svg.getBoundingClientRect()
      if (!pointer || box.width === 0) return
      const dx = pointer.x - (box.left + box.width / 2)
      const dy = pointer.y - (box.top + box.height * 0.44)
      const distance = Math.hypot(dx, dy) || 1
      // Close to her face she only glances; further away she looks all the way over.
      const reach = Math.min(1, distance / 160) * LOOK_REACH
      svg.style.setProperty('--look-x', `${(dx / distance) * reach}px`)
      svg.style.setProperty('--look-y', `${(dy / distance) * reach}px`)
    }
    function onMove(event) {
      pointer = { x: event.clientX, y: event.clientY }
      if (!frame) frame = requestAnimationFrame(update)
    }
    function lookAhead() {
      svg.style.removeProperty('--look-x')
      svg.style.removeProperty('--look-y')
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', lookAhead)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', lookAhead)
      cancelAnimationFrame(frame)
      lookAhead()
    }
  }, [ref, enabled])
}

// Chloe, the black-and-tan dachshund.
// mood: 'curious' | 'alert' | 'napping' | 'happy' | 'sad'. Each has its own idle animation in
// index.css. Tapping her makes her wiggle. Decorative: the text next to her always says the same.
export function Chloe({ mood = 'curious', size = 72, className = '' }) {
  const ref = useRef(null)
  const eyesOpen = mood !== 'napping' && mood !== 'happy'
  useLookAtPointer(ref, eyesOpen)

  // Counts taps, so each one draws a fresh heart. Resets once she has finished wiggling.
  const [boops, setBoops] = useState(0)
  // Each tap also wakes her idle animations, which stop after a while (see index.css).
  const [wakes, setWakes] = useState(0)
  useEffect(() => {
    if (!boops) return
    const timer = setTimeout(() => setBoops(0), 900)
    return () => clearTimeout(timer)
  }, [boops])

  // When her mood changes on screen (such as from alert to napping once everything is paid),
  // she perks up into the new one. Not on the first drawing, so pages don't open with a jump.
  const firstMood = useRef(mood)
  const moodChanged = mood !== firstMood.current

  const ears = mood === 'alert' ? EARS.up : EARS.down
  return (
    <svg
      ref={ref}
      className={`chloe chloe-${mood} ${boops ? 'is-booped' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      onPointerDown={() => {
        setBoops((count) => count + 1)
        setWakes((count) => count + 1)
      }}
    >
      <g
        key={moodChanged ? mood : 'first'}
        className={`chloe-stage ${moodChanged ? 'is-entering' : ''}`}
      >
        <g key={wakes} className="chloe-body">
          <g fill="var(--ear)" stroke="var(--coat-edge)" strokeWidth="2">
            <path className="chloe-ear chloe-ear-left" d={ears[0]} />
            <path className="chloe-ear chloe-ear-right" d={ears[1]} />
          </g>
          <path
            d="M100 40 C136 40 148 66 146 100 C144 130 128 154 100 156 C72 154 56 130 54 100 C52 66 64 40 100 40 Z"
            fill="var(--coat)"
            stroke="var(--coat-edge)"
            strokeWidth="2"
          />
          <ellipse cx="100" cy="128" rx="27" ry="25" fill="var(--tan)" />
          <g className="chloe-nose">
            <ellipse cx="100" cy="112" rx="11" ry="8" fill="#0b0a0f" />
            <ellipse cx="96" cy="109.5" rx="3.4" ry="1.8" fill="#fff" opacity="0.5" />
          </g>
          <Mouth mood={mood} />
          <g className="chloe-brows" fill="var(--tan)">
            <circle cx="80" cy={mood === 'sad' ? 71 : 73} r="4.5" />
            <circle cx="120" cy={mood === 'sad' ? 71 : 73} r="4.5" />
          </g>
          <Eyes mood={mood} />
          {mood === 'sad' && (
            <path className="chloe-tear" d="M86 99 Q82 106 86 109 Q90 106 86 99 Z" fill="#7cc4ff" />
          )}
        </g>
      </g>

      {mood === 'napping' && (
        <g key={wakes} className="chloe-zzz" fill="var(--muted)" fontFamily="var(--font-display)" fontWeight="800">
          <text x="148" y="62" fontSize="18">z</text>
          <text x="162" y="42" fontSize="23">z</text>
          <text x="177" y="20" fontSize="28">Z</text>
        </g>
      )}
      {boops > 0 && <path key={boops} className="chloe-boop-heart" d={HEART} fill="var(--danger)" />}
    </svg>
  )
}
