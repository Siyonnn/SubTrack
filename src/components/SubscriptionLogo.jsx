import { useState } from 'react'
import { findService, logoInkFor, serviceNamed } from '../lib/services.js'

// A service's logo on its brand color. Decorative: its name is always written next to it.
export function ServiceLogo({ service, className = '' }) {
  const { hex, path } = service.icon
  return (
    <span
      className={`service-logo ${className}`}
      style={{ background: `#${hex}`, color: logoInkFor(hex) }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24">
        <path d={path} fill="currentColor" />
      </svg>
    </span>
  )
}

// The picture for a subscription, in this order:
// 1. the logo of the service picked for it,
// 2. a picture the person uploaded (or a web link, from before uploads),
// 3. the logo of a service with exactly its name, for ones saved before services could be picked,
// 4. the first letter of its name.
export default function SubscriptionLogo({ name, serviceId, image, className = '' }) {
  // Remembers which picture failed, so choosing a different one tries again.
  const [failedImage, setFailedImage] = useState(null)
  const picked = findService(serviceId)
  if (picked) return <ServiceLogo service={picked} className={className} />

  if (image && image !== failedImage) {
    return (
      <img className={className} src={image} alt="" onError={() => setFailedImage(image)} />
    )
  }

  const named = serviceNamed(name)
  if (named) return <ServiceLogo service={named} className={className} />

  return (
    <span className={`${className} logo-fallback`} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
