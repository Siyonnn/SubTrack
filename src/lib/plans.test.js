import { describe, expect, it } from 'vitest'
import {
  PLANS,
  PLAN_CURRENCIES,
  fillFromPlan,
  findPlan,
  planCycles,
  planPrice,
  plansFor,
  plansShownFor,
  priceSource,
} from './plans.js'
import { findService } from './services.js'
import { MAX_PRICE } from './validation.js'

describe('PLANS', () => {
  it('belongs to listed services, with unique ids the Firestore rules accept', () => {
    for (const [serviceId, plans] of Object.entries(PLANS)) {
      expect(findService(serviceId), serviceId).not.toBeNull()
      expect(plans.length).toBeGreaterThan(0)
      expect(new Set(plans.map((p) => p.id)).size).toBe(plans.length)
      for (const plan of plans) expect(plan.id.length).toBeLessThanOrEqual(40)
    }
  })

  it('prices plans only in known currencies and cycles the service bills in, within the price limit', () => {
    for (const [serviceId, plans] of Object.entries(PLANS)) {
      const service = findService(serviceId)
      for (const plan of plans) {
        const currencies = Object.keys(plan.prices)
        expect(currencies.length, `${serviceId} ${plan.id}`).toBeGreaterThan(0)
        for (const currency of currencies) {
          expect(PLAN_CURRENCIES).toContain(currency)
          for (const [cycle, amount] of Object.entries(plan.prices[currency])) {
            expect(service.cycles, `${serviceId} ${plan.id} ${cycle}`).toContain(cycle)
            expect(amount).toBeGreaterThan(0)
            expect(amount).toBeLessThanOrEqual(MAX_PRICE)
            // Prices are entered with at most 2 decimal places, like the form allows.
            expect(Math.round(amount * 100) / 100).toBe(amount)
          }
        }
      }
    }
  })
})

describe('lookups', () => {
  it('finds plans by service and id', () => {
    expect(plansFor('spotify').map((p) => p.id)).toEqual(['individual', 'student', 'duo', 'family'])
    expect(findPlan('spotify', 'duo').name).toBe('Duo')
    expect(findPlan('spotify', 'gone')).toBeNull()
    expect(findPlan(null, 'duo')).toBeNull()
    expect(plansFor('bitwarden')).toEqual([])
  })

  it('gives a price only where the plan is sold that way', () => {
    const duo = findPlan('spotify', 'duo')
    expect(planPrice(duo, 'PHP', 'monthly')).toBe(229)
    expect(planPrice(duo, 'PHP', 'yearly')).toBeNull()
    expect(planPrice(duo, 'EUR', 'monthly')).toBeNull()
    expect(planPrice(null, 'PHP', 'monthly')).toBeNull()
  })

  it('lists the cycles a plan is sold in, in any currency', () => {
    expect(planCycles(findPlan('apple-tv', 'apple-tv'))).toEqual(['monthly', 'yearly'])
    expect(planCycles(findPlan('netflix', 'mobile'))).toEqual(['monthly'])
  })

  it('shows the plans sold in a currency, or all of them for other currencies', () => {
    expect(plansShownFor('netflix', 'PHP').map((p) => p.id)).toEqual(['mobile', 'basic', 'standard', 'premium'])
    expect(plansShownFor('netflix', 'USD').map((p) => p.id)).toEqual(['standard-ads', 'standard', 'premium'])
    expect(plansShownFor('netflix', 'EUR')).toEqual(plansFor('netflix'))
    // Claude bills the Philippines in dollars, so peso users still see every plan.
    expect(plansShownFor('claude', 'PHP')).toEqual(plansFor('claude'))
  })
})

describe('fillFromPlan', () => {
  it('keeps the currency and cycle when the plan is sold that way', () => {
    const plan = findPlan('hbo-max', 'standard')
    expect(fillFromPlan(plan, { currency: 'PHP', cycle: 'yearly' })).toEqual({
      currency: 'PHP',
      cycle: 'yearly',
      price: 1890,
    })
  })

  it('moves to a currency the plan is priced in', () => {
    expect(fillFromPlan(findPlan('claude', 'pro'), { currency: 'PHP', cycle: 'monthly' })).toEqual({
      currency: 'USD',
      cycle: 'monthly',
      price: 20,
    })
    // Pesos come first when a plan has both.
    expect(fillFromPlan(findPlan('spotify', 'duo'), { currency: 'EUR', cycle: 'monthly' }).currency).toBe('PHP')
  })

  it('moves to a cycle the plan is sold in', () => {
    expect(fillFromPlan(findPlan('spotify', 'duo'), { currency: 'PHP', cycle: 'yearly' })).toEqual({
      currency: 'PHP',
      cycle: 'monthly',
      price: 229,
    })
  })

  it('never moves a cycle fixed by a payment, and then has no price to fill in', () => {
    expect(
      fillFromPlan(findPlan('spotify', 'duo'), { currency: 'PHP', cycle: 'yearly', cycleLocked: true }),
    ).toEqual({ currency: 'PHP', cycle: 'yearly', price: null })
  })
})

describe('priceSource', () => {
  it('says where and when the price was checked', () => {
    expect(priceSource('PHP')).toMatch(/the Philippines, checked November 2026/)
    expect(priceSource('USD')).toMatch(/the US/)
  })
})
