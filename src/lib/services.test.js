import { describe, expect, it } from 'vitest'
import { CATEGORIES } from './categories.js'
import { SERVICES, findService, logoInkFor, searchServices, serviceNamed } from './services.js'

describe('SERVICES', () => {
  it('gives every service a unique id, a known category and cycle, and a logo', () => {
    expect(new Set(SERVICES.map((s) => s.id)).size).toBe(SERVICES.length)
    for (const s of SERVICES) {
      expect(CATEGORIES).toContain(s.category)
      expect(s.icon.path).toMatch(/^[Mm]/)
      expect(s.icon.hex).toMatch(/^[0-9A-F]{6}$/)
      // The Firestore rules cap the stored id at 40 characters.
      expect(s.id.length).toBeLessThanOrEqual(40)
    }
  })
})

describe('billing cycles', () => {
  it('lists only cycles the app tracks, none of them weekly, and fills in the first', () => {
    for (const s of SERVICES) {
      expect(s.cycles.length).toBeGreaterThan(0)
      expect(new Set(s.cycles).size).toBe(s.cycles.length)
      for (const cycle of s.cycles) expect(['monthly', 'yearly']).toContain(cycle)
      expect(s.billingCycle).toBe(s.cycles[0])
    }
  })

  it('offers only the plans a service sells', () => {
    expect(findService('netflix').cycles).toEqual(['monthly'])
    expect(findService('icloud').cycles).toEqual(['monthly'])
    expect(findService('tidal').cycles).toEqual(['monthly'])
    expect(findService('bitwarden').cycles).toEqual(['yearly'])
  })

  it('offers both where a service sells both, starting with the usual one', () => {
    expect(findService('spotify').cycles).toEqual(['monthly', 'yearly'])
    expect(findService('1password').cycles).toEqual(['yearly', 'monthly'])
  })
})

describe('findService', () => {
  it('finds a service by id', () => {
    expect(findService('netflix').name).toBe('Netflix')
  })

  it('returns null for no id or an id that is no longer listed', () => {
    expect(findService(null)).toBeNull()
    expect(findService(undefined)).toBeNull()
    expect(findService('removed-service')).toBeNull()
  })
})

describe('serviceNamed', () => {
  it('matches names regardless of case, spaces, and symbols', () => {
    expect(serviceNamed('netflix').id).toBe('netflix')
    expect(serviceNamed('  ICLOUD ').id).toBe('icloud')
    expect(serviceNamed('Apple TV+').id).toBe('apple-tv')
  })

  it('only matches the whole name', () => {
    expect(serviceNamed('Netflix Family')).toBeNull()
    expect(serviceNamed('My gym')).toBeNull()
    expect(serviceNamed('')).toBeNull()
  })
})

describe('searchServices', () => {
  it('lists everything for an empty search', () => {
    expect(searchServices('  ')).toEqual(SERVICES)
  })

  it('finds services by part of their name', () => {
    expect(searchServices('tube').map((s) => s.id)).toEqual(['youtube-premium', 'youtube-music'])
    expect(searchServices('zzz')).toEqual([])
  })
})

describe('logoInkFor', () => {
  it('uses white wherever it is readable, like most app icons', () => {
    expect(logoInkFor('E50914')).toBe('#FFFFFF') // Netflix red
    expect(logoInkFor('FF0000')).toBe('#FFFFFF') // YouTube red
    expect(logoInkFor('000000')).toBe('#FFFFFF')
  })

  it('uses black on colors too light for white', () => {
    expect(logoInkFor('1ED760')).toBe('#000000') // Spotify green
    expect(logoInkFor('FFFFFF')).toBe('#000000')
  })
})
