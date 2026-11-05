import { useEffect, useId, useRef, useState } from 'react'

// Chloe the dachshund, drawn from the artwork in art/chloe: the same shapes, colors,
// and line widths. The crying, celebrating, thinking, and sleeping drawings are the sad, happy,
// thinking, and napping moods. Curious and alert are drawn from the same parts in the same style.
//
// Her colors are fixed rather than themed: the white outline around her head and body keeps her
// visible on the dark theme too, as in the artwork.
const INK = '#1D1A22'
const TAN = '#E9973F'
const PINK = '#FF6B8B'
const WHITE = '#FFFFFF'
// Thin lines drawn on the page around her, such as Z's. Light on the dark theme (see index.css).
const LINE = 'var(--chloe-line)'

// Every drawing shares this ear, hanging from the side of the head. The right ear is its mirror.
const EAR = 'M -38 -40 C -66 -46 -86 -14 -84 26 C -82 56 -70 70 -56 64 C -44 58 -42 28 -36 0 Z'

// How each mood holds her head. Units are the artwork's: the head is 116 wide, centered on 0 0.
// tilt: the head's turn. ears: how far the ears swing out, in degrees. brows: x, y, turn.
// look: where the pupils sit, before they follow the pointer.
const MOODS = {
  curious: { tilt: 'rotate(-6)', ears: -2, brows: [[-22, -32, 0], [22, -32, 0]], eyes: 'open', look: [2, -1], mouth: 'smile' },
  alert: { tilt: 'translate(0 -2)', ears: 34, brows: [[-22, -39, 0], [22, -39, 0]], eyes: 'wide', look: [0, -1], mouth: 'o' },
  thinking: { tilt: 'translate(-12 12) rotate(-12)', ears: 4, brows: [[-22, -30, 8], [22, -38, -12]], eyes: 'open', look: [4, -5], mouth: 'wavy' },
  napping: { tilt: 'translate(-10 8) rotate(8)', ears: -4, brows: [[-22, -30, 0], [22, -30, 0]], eyes: 'closed', mouth: 'sleepy' },
  happy: { tilt: 'translate(0 8) rotate(-6)', ears: 12, brows: [[-22, -34, 0], [22, -34, 0]], eyes: 'joy', mouth: 'open' },
  sad: { tilt: 'rotate(4)', ears: -10, brows: [[-22, -32, 22], [22, -32, -22]], eyes: 'squeezed', mouth: 'cry' },
}

// A four-pointed sparkle, as in the celebrating drawing.
function sparkle(x, y, r) {
  const c = 0.28 * r
  return `M ${x} ${y - r} Q ${x + c} ${y - c} ${x + r} ${y} Q ${x + c} ${y + c} ${x} ${y + r} Q ${x - c} ${y + c} ${x - r} ${y} Q ${x - c} ${y - c} ${x} ${y - r} Z`
}

function Eyes({ type, look = [0, 0] }) {
  const [lx, ly] = look
  if (type === 'closed') {
    return (
      <g fill="none" stroke={WHITE} strokeWidth="5" strokeLinecap="round">
        <path d="M -32 -8 Q -22 2 -12 -8" />
        <path d="M 12 -8 Q 22 2 32 -8" />
      </g>
    )
  }
  if (type === 'joy') {
    return (
      <g fill="none" stroke={WHITE} strokeWidth="5.5" strokeLinecap="round">
        <path d="M -32 -3 Q -22 -17 -12 -3" />
        <path d="M 12 -3 Q 22 -17 32 -3" />
      </g>
    )
  }
  if (type === 'squeezed') {
    return (
      <g fill="none" stroke={WHITE} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -31 -16 L -14 -8 L -31 0" />
        <path d="M 31 -16 L 14 -8 L 31 0" />
      </g>
    )
  }
  const white = type === 'wide' ? 15 : 13
  const pupil = type === 'wide' ? 8.5 : 8
  return (
    <>
      {[-22, 22].map((x) => (
        <g key={x} className="chloe-eye">
          <circle cx={x} cy="-8" r={white} fill={WHITE} />
          <g className="chloe-pupil">
            <circle cx={x + lx} cy={-8 + ly} r={pupil} fill={INK} />
            <circle cx={x + lx + 2} cy={-8 + ly - 2} r="2.6" fill={WHITE} />
          </g>
        </g>
      ))}
    </>
  )
}

function Mouth({ type, clipId }) {
  const line = { fill: 'none', stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round' }
  if (type === 'smile') return <path d="M -10 38 Q 0 46 10 38" {...line} />
  if (type === 'sleepy') return <path d="M -8 38 Q 0 44 8 38" {...line} />
  if (type === 'wavy') return <path d="M -8 40 Q 2 35 13 41" {...line} />
  if (type === 'o') return <ellipse cx="0" cy="42" rx="5" ry="6" fill={INK} />
  if (type === 'open') {
    const shape = 'M -18 31 Q 0 31 18 31 Q 16 58 0 58 Q -16 58 -18 31 Z'
    return (
      <>
        <clipPath id={clipId}>
          <path d={shape} />
        </clipPath>
        <path d={shape} fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="0" cy="58" rx="13" ry="11" fill={PINK} clipPath={`url(#${clipId})`} />
      </>
    )
  }
  // Crying: wide open, with a little tongue.
  return (
    <>
      <path d="M -13 48 Q -14 32 0 32 Q 14 32 13 48 Q 0 44 -13 48 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M -8 46 Q 0 38 8 46 Q 0 44 -8 46 Z" fill={PINK} />
    </>
  )
}

function PartyHat({ clipId }) {
  const cone = 'M -24 -48 L 30 -48 L 6 -122 Z'
  return (
    <g className="chloe-hat">
      <g transform="rotate(14 10 -50)">
        <clipPath id={clipId}>
          <path d={cone} />
        </clipPath>
        <path d={cone} fill={TAN} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <g clipPath={`url(#${clipId})`}>
          <rect x="-40" y="-72" width="90" height="9" fill={PINK} transform="rotate(-14 5 -68)" />
          <rect x="-40" y="-98" width="90" height="8" fill={PINK} transform="rotate(-14 5 -94)" />
        </g>
        <path d={cone} fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <circle cx="6" cy="-124" r="10" fill={PINK} stroke={INK} strokeWidth="4" />
      </g>
    </g>
  )
}

// Her head in the artwork's units, centered on 0 0, turned as the mood holds it.
function Head({ mood, transform, ids }) {
  const m = MOODS[mood]
  const ear = (
    <path d={EAR} fill={INK} stroke={WHITE} strokeWidth="5" strokeLinejoin="round" transform={`rotate(${m.ears} -38 -40)`} />
  )
  return (
    <g transform={transform ?? m.tilt}>
      {mood === 'happy' && <PartyHat clipId={ids.hat} />}
      {/* Each ear sits in its own group, so the stylesheet can swing it from where it joins the head. */}
      <g className="chloe-ear">{ear}</g>
      <g transform="scale(-1,1)">
        <g className="chloe-ear">{ear}</g>
      </g>
      <ellipse cx="0" cy="-6" rx="58" ry="52" fill={INK} stroke={WHITE} strokeWidth="6" />
      {m.brows.map(([x, y, turn]) => (
        <ellipse key={x} cx={x} cy={y} rx="9.5" ry="6" fill={TAN} transform={`rotate(${turn} ${x} ${y})`} />
      ))}
      <Eyes type={m.eyes} look={m.look} />
      <ellipse cx="0" cy="31" rx="35" ry="26" fill={TAN} stroke={INK} strokeWidth="5" />
      <Mouth type={m.mouth} clipId={ids.mouth} />
      <g className="chloe-nose">
        <ellipse cx="0" cy="17" rx="13.5" ry="9.5" fill={INK} />
        <ellipse cx="-4" cy="13.5" rx="4" ry="2.3" fill={WHITE} />
      </g>
      {mood === 'napping' && (
        <g className="chloe-snot">
          <circle cx="24" cy="24" r="9" fill={WHITE} stroke={INK} strokeWidth="3" />
          <path d="M 20 20 Q 22 17 26 17" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {mood === 'sad' && (
        <g className="chloe-streams" fill={WHITE} stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
          <path d="M -28 -2 L -16 -2 C -20 14 -26 26 -26 44 Q -34 52 -40 44 C -36 28 -28 14 -28 -2 Z" />
          <path d="M 16 -2 L 28 -2 C 36 14 30 26 42 44 Q 34 52 28 44 C 20 28 16 14 16 -2 Z" />
        </g>
      )}
    </g>
  )
}

// What floats around her head: Z's, tear drops, a thought bubble, sparkles. Drawn in the head's
// units, but not turned with it.
function Around({ mood }) {
  if (mood === 'napping') {
    return (
      <g className="chloe-zzz" fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 50 -62 H 58 L 50 -54 H 58" />
        <path d="M 62 -77 H 72 L 62 -67 H 72" />
        <path d="M 76 -94 H 89 L 76 -81 H 89" />
      </g>
    )
  }
  if (mood === 'sad') {
    const drop = { fill: WHITE, stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' }
    // Each drop is wrapped, since an animation's transform would replace the drop's own turn.
    return (
      <g>
        <g className="chloe-drop">
          <path {...drop} d="M -98 -60.45 C -95.8 -54.95 -92.5 -51.65 -92.5 -48.625 A 5.5 5.5 0 1 1 -103.5 -48.625 C -103.5 -51.65 -100.2 -54.95 -98 -60.45 Z" transform="rotate(-40 -98 -50)" />
        </g>
        <g className="chloe-drop">
          <path {...drop} d="M -106 -27.6 C -104.4 -23.6 -102 -21.2 -102 -19 A 4 4 0 1 1 -110 -19 C -110 -21.2 -107.6 -23.6 -106 -27.6 Z" transform="rotate(-60 -106 -20)" />
        </g>
        <g className="chloe-drop">
          <path {...drop} d="M 98 -60.45 C 100.2 -54.95 103.5 -51.65 103.5 -48.625 A 5.5 5.5 0 1 1 92.5 -48.625 C 92.5 -51.65 95.8 -54.95 98 -60.45 Z" transform="rotate(40 98 -50)" />
        </g>
        <g className="chloe-drop">
          <path {...drop} d="M 106 -27.6 C 107.6 -23.6 110 -21.2 110 -19 A 4 4 0 1 1 102 -19 C 102 -21.2 104.4 -23.6 106 -27.6 Z" transform="rotate(60 106 -20)" />
        </g>
      </g>
    )
  }
  if (mood === 'thinking') {
    return (
      <g className="chloe-thought" stroke={INK}>
        <circle cx="42" cy="-58" r="2.8" fill={WHITE} strokeWidth="2.2" />
        <circle cx="50" cy="-69" r="4" fill={WHITE} strokeWidth="2.2" />
        <rect x="52" y="-98" width="48" height="24" rx="12" fill={WHITE} strokeWidth="2.8" />
        <circle className="chloe-dot" cx="65" cy="-86" r="4" fill={INK} strokeWidth="0" />
        <circle className="chloe-dot" cx="76" cy="-86" r="4" fill={TAN} strokeWidth="1.8" />
        <circle className="chloe-dot" cx="87" cy="-86" r="4" fill={PINK} strokeWidth="1.8" />
      </g>
    )
  }
  if (mood === 'happy') {
    return (
      <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
        <path className="chloe-sparkle" d={sparkle(-84, -64, 9)} fill={TAN} />
        <path className="chloe-sparkle" d={sparkle(84, -40, 7)} fill={PINK} />
      </g>
    )
  }
  return null
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
      const reach = Math.min(1, distance / 160) * 3
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

// What both drawings share: the pointer, tapping, and perking up when her mood changes.
function useChloe(mood) {
  const ref = useRef(null)
  useLookAtPointer(ref, MOODS[mood].eyes === 'open' || MOODS[mood].eyes === 'wide')

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

  // React's ids contain characters that are awkward inside url(#...), so keep only safe ones.
  const base = 'chloe-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const ids = { hat: `${base}-hat`, mouth: `${base}-mouth`, chest: `${base}-chest` }

  return {
    ref,
    ids,
    wakes,
    boops,
    stageKey: moodChanged ? mood : 'first',
    stageClass: `chloe-stage ${moodChanged ? 'is-entering' : ''}`,
    svgClass: (extra) => `chloe chloe-${mood} ${boops ? 'is-booped' : ''} ${extra}`,
    onPointerDown: () => {
      setBoops((count) => count + 1)
      setWakes((count) => count + 1)
    },
  }
}

const HEART = 'M150 62 C138 52 136 44 142 40 C146 37 150 40 150 44 C150 40 154 37 158 40 C164 44 162 52 150 62 Z'

// Chloe's head. mood: 'curious' | 'alert' | 'thinking' | 'napping' | 'happy' | 'sad'.
// Each mood has its own idle animation in index.css. Tapping her makes her wiggle.
// Decorative: the text next to her always says the same thing.
export function Chloe({ mood = 'curious', size = 72, className = '' }) {
  const c = useChloe(mood)
  // Places the artwork's head in a 200 x 200 box, leaving room above for her hat and Z's.
  const place = 'translate(100 96) scale(1.05)'
  return (
    <svg
      ref={c.ref}
      className={c.svgClass(className)}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      onPointerDown={c.onPointerDown}
    >
      <g key={c.stageKey} className={c.stageClass}>
        <g key={c.wakes} className="chloe-body">
          <g transform={place}>
            <Head mood={mood} ids={c.ids} />
          </g>
        </g>
      </g>
      <g key={c.wakes} transform={place}>
        <Around mood={mood} />
      </g>
      {c.boops > 0 && <path key={c.boops} className="chloe-boop-heart" d={HEART} fill={PINK} />}
    </svg>
  )
}

// A white edge around the tail, like the one around her body, so it shows on the dark theme.
function Tail({ d, base }) {
  return (
    <g className="chloe-tail" style={{ transformOrigin: base }} fill="none" strokeLinecap="round">
      <path d={d} stroke={WHITE} strokeWidth="25" />
      <path d={d} stroke={INK} strokeWidth="17" />
    </g>
  )
}

function Leg({ x, y, height, front, angle = 0 }) {
  return (
    <g transform={`rotate(${angle} ${x + 15} ${y})`}>
      <rect x={x} y={y} width="30" height={height} rx="14" fill={INK} className={front ? undefined : 'chloe-back-leg'} {...(front && { stroke: WHITE, strokeWidth: 5 })} />
      <rect x={x - 3} y={y + height - 19} width="36" height="21" rx="10.5" fill={TAN} stroke={INK} strokeWidth="4" />
    </g>
  )
}

// The standing poses share a body and legs; only the tail and the head change.
const STANDING = {
  alert: { head: 'translate(282 160) rotate(-4)', at: [282, 160], tail: 'M 96 232 C 82 208 78 180 86 148', tailBase: '96px 232px' },
  thinking: { head: 'translate(270 168) rotate(-12)', at: [270, 168], tail: 'M 96 236 C 72 222 58 196 62 160', tailBase: '96px 236px' },
  happy: { head: 'translate(286 162) rotate(-6)', at: [286, 162], tail: 'M 96 232 C 70 214 54 188 52 156', tailBase: '96px 232px', dancing: true },
  sad: { head: 'translate(286 172) rotate(6)', at: [286, 172], tail: 'M 96 252 C 72 262 56 276 44 284', tailBase: '96px 252px' },
}

// Chloe from nose to tail, as in the artwork's poses: 'alert', 'thinking', 'happy', 'sad',
// or 'napping' (curled up on her cushion). Animated like her head, plus a wagging tail.
export function ChloePose({ mood = 'alert', size = 160, className = '' }) {
  const c = useChloe(mood)
  const standing = STANDING[mood]
  const shift = 'translate(20 10)'
  return (
    <svg
      ref={c.ref}
      className={c.svgClass(`chloe-pose ${className}`)}
      width={size}
      height={Math.round((size * 420) / 440)}
      viewBox="0 0 440 420"
      aria-hidden="true"
      onPointerDown={c.onPointerDown}
    >
      <g key={c.stageKey} className={c.stageClass}>
        <g key={c.wakes} className="chloe-body">
          <g transform={shift}>
            {standing ? (
              <g transform={standing.dancing ? 'translate(0 -14)' : undefined}>
                <Tail d={standing.tail} base={standing.tailBase} />
                {/* Wag lines, as in the celebrating drawing. */}
                {standing.dancing && (
                  <g className="chloe-wag-lines" fill="none" stroke={LINE} strokeWidth="4.5" strokeLinecap="round">
                    <path d="M 30 150 Q 22 165 28 180" />
                    <path d="M 74 138 Q 84 148 82 162" />
                  </g>
                )}
                <Leg x={140} y={268} height={standing.dancing ? 54 : 58} angle={standing.dancing ? 28 : 0} />
                <Leg x={266} y={268} height={standing.dancing ? 54 : 58} angle={standing.dancing ? -28 : 0} />
                <Leg x={102} y={270} height={standing.dancing ? 54 : 58} angle={standing.dancing ? 28 : 0} front />
                <Leg x={228} y={270} height={standing.dancing ? 54 : 58} angle={standing.dancing ? -28 : 0} front />
                <clipPath id={c.ids.chest}>
                  <rect x="84" y="204" width="228" height="92" rx="46" />
                </clipPath>
                <rect x="84" y="204" width="228" height="92" rx="46" fill={INK} stroke={WHITE} strokeWidth="6" />
                <g clipPath={`url(#${c.ids.chest})`}>
                  <ellipse cx="292" cy="276" rx="36" ry="32" fill={TAN} stroke={INK} strokeWidth="5" />
                </g>
                <Head mood={mood} transform={standing.head} ids={c.ids} />
              </g>
            ) : (
              <g transform="translate(-14 0)">
                <ellipse cx="200" cy="330" rx="178" ry="32" fill={TAN} stroke={INK} strokeWidth="5" />
                <Tail d="M 84 296 C 50 290 34 312 52 326 C 62 334 76 330 80 322" base="84px 296px" />
                <rect x="72" y="248" width="236" height="76" rx="38" fill={INK} stroke={WHITE} strokeWidth="6" />
                <Head mood="napping" transform="translate(290 256) rotate(10) scale(0.96)" ids={c.ids} />
                <ellipse cx="262" cy="320" rx="22" ry="11" fill={TAN} stroke={INK} strokeWidth="4" />
                <ellipse cx="312" cy="322" rx="22" ry="11" fill={TAN} stroke={INK} strokeWidth="4" />
              </g>
            )}
          </g>
        </g>
      </g>
      <g key={c.wakes} transform={shift}>
        <g transform={standing ? `translate(${standing.at[0]} ${standing.at[1] - (standing.dancing ? 14 : 0)})` : 'translate(276 256)'}>
          <Around mood={mood} />
        </g>
      </g>
      {/* Placed by its group: the heart's own animation replaces any transform on the path. */}
      {c.boops > 0 && (
        <g transform="translate(90 20) scale(1.4)">
          <path key={c.boops} className="chloe-boop-heart" d={HEART} fill={PINK} />
        </g>
      )}
    </svg>
  )
}
