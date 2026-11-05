import { useEffect, useState } from 'react'
import { Chloe } from './Brand.jsx'

// How long she stays: long enough to read the message, then out of the way.
const LEAVE_MS = 300
function showFor(message) {
  return Math.min(6500, 2600 + message.length * 35)
}

const CONFETTI_COLORS = ['var(--accent)', 'var(--highlight)', 'var(--paid)', 'var(--danger)']

// The flourish around her. Decorative, and hidden when reduced motion is asked for.
function Effect({ type }) {
  if (type === 'confetti') {
    return (
      <span className="chloe-effect" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={`confetti ${i % 3 === 0 ? 'round' : ''}`}
            style={{
              '--angle': `${i * 30 + (i % 2) * 12}deg`,
              '--distance': `${46 + (i % 3) * 12}px`,
              '--color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              '--delay': `${(i % 4) * 30}ms`,
            }}
          />
        ))}
      </span>
    )
  }
  if (type === 'hearts') {
    return (
      <span className="chloe-effect" aria-hidden="true">
        {[-18, 4, 22].map((x, i) => (
          <svg
            key={x}
            className="float-heart"
            viewBox="0 0 24 24"
            style={{ '--x': `${x}px`, '--delay': `${i * 220}ms` }}
          >
            <path
              d="M12 21 C4 14 2 10 4.5 6.5 C6.5 4 10 4.5 12 7.5 C14 4.5 17.5 4 19.5 6.5 C22 10 20 14 12 21 Z"
              fill="var(--danger)"
            />
          </svg>
        ))}
      </span>
    )
  }
  if (type === 'question' || type === 'bark') {
    return (
      <span className={`chloe-effect mark mark-${type}`} aria-hidden="true">
        {type === 'question' ? '?' : '!'}
      </span>
    )
  }
  return null
}

// Chloe pops up in the corner to react to something the person just did, with a short message.
// reaction: { mood, effect, message }. Tapping her sends her away early.
export default function ChloeReaction({ reaction, onDone }) {
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const total = showFor(reaction.message)
    const leave = setTimeout(() => setIsLeaving(true), total - LEAVE_MS)
    const done = setTimeout(onDone, total)
    return () => {
      clearTimeout(leave)
      clearTimeout(done)
    }
  }, [reaction, onDone])

  return (
    <div className={`chloe-reaction ${isLeaving ? 'is-leaving' : ''}`} onClick={onDone}>
      <span className="chloe-reaction-pet">
        <Chloe mood={reaction.mood} size={72} />
        <Effect type={reaction.effect} />
      </span>
      <p className="chloe-bubble">{reaction.message}</p>
    </div>
  )
}
