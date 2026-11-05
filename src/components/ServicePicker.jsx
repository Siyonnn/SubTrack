import { useEffect, useRef, useState } from 'react'
import { searchServices } from '../lib/services.js'
import { ServiceLogo } from './SubscriptionLogo.jsx'

// The first step of adding a subscription: pick a well-known service, or Other.
// onPick(service, search) gets null for Other, along with what was typed, to use as the name.
export default function ServicePicker({ onPick }) {
  const [search, setSearch] = useState('')
  const matches = searchServices(search)
  const ref = useRef(null)

  // With a mouse, typing to search is quickest. On a touch screen, focusing the search box would
  // open the keyboard over the logos, so focus starts on the first one instead. The popup also
  // looks for this mark when it opens.
  const [startOnTiles] = useState(() => window.matchMedia?.('(pointer: coarse)').matches)
  useEffect(() => {
    ref.current.querySelector('[data-initial-focus]')?.focus()
  }, [])

  return (
    <div className="service-picker" ref={ref}>
      <label>
        Search
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. Netflix"
          data-initial-focus={startOnTiles ? undefined : true}
        />
      </label>

      <ul className="service-grid" aria-label="Services">
        {matches.map((service, index) => (
          <li key={service.id}>
            <button
              type="button"
              className="service-tile"
              onClick={() => onPick(service, search)}
              data-initial-focus={startOnTiles && index === 0 ? true : undefined}
            >
              <ServiceLogo service={service} />
              <span>{service.name}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="service-tile" onClick={() => onPick(null, search)}>
            <span className="service-logo logo-fallback" aria-hidden="true">
              +
            </span>
            <span>Other</span>
          </button>
        </li>
      </ul>

      <p className="field-hint" role="status">
        {matches.length === 0
          ? `"${search.trim()}" isn't listed. Choose Other to add it with your own picture.`
          : "Not listed? Choose Other to add it with your own picture."}
      </p>
    </div>
  )
}
