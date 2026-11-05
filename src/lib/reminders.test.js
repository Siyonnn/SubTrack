import { describe, expect, it } from 'vitest'
import { ANDROID_CHANNEL_ID, dateInTimeZone, messageFor, remindersFor } from './reminders.js'

const TODAY = '2026-10-20'

function subscription(changes) {
  return {
    id: 'sub1',
    subscriptionName: 'Netflix',
    price: 549,
    currency: 'PHP',
    billingCycle: 'monthly',
    lastPaidDate: null,
    ...changes,
  }
}

describe('dateInTimeZone', () => {
  it('uses the date in the given time zone, not the server one', () => {
    const now = new Date('2026-10-20T20:00:00Z')
    expect(dateInTimeZone(now, 'Asia/Manila')).toBe('2026-10-21')
    expect(dateInTimeZone(now, 'America/Los_Angeles')).toBe('2026-10-20')
  })
})

describe('remindersFor', () => {
  it('reminds 3 days before and on the due date', () => {
    const [inThreeDays] = remindersFor([subscription({ firstDueDate: '2026-10-23' })], TODAY)
    expect(inThreeDays.title).toBe('Netflix')
    expect(inThreeDays.body).toMatch(/due in 3 days/)

    const [today] = remindersFor([subscription({ firstDueDate: TODAY })], TODAY)
    expect(today.body).toMatch(/due today/)
  })

  it('stays quiet on the other days before a payment', () => {
    for (const firstDueDate of ['2026-10-21', '2026-10-22', '2026-10-24', '2026-11-30']) {
      expect(remindersFor([subscription({ firstDueDate })], TODAY)).toEqual([])
    }
  })

  it('reminds every day while a payment is overdue', () => {
    const [one] = remindersFor([subscription({ firstDueDate: '2026-10-15' })], TODAY)
    expect(one.body).toMatch(/overdue since/)

    const [several] = remindersFor([subscription({ firstDueDate: '2026-08-15' })], TODAY)
    expect(several.body).toMatch(/^3 payments overdue/)
  })

  it('still reminds about the next payment after the current one is paid', () => {
    const paid = subscription({ firstDueDate: '2026-09-23', lastPaidDate: '2026-09-23' })
    expect(remindersFor([paid], TODAY)[0].body).toMatch(/due in 3 days/)
  })

  it('tags each reminder by subscription and day', () => {
    const [reminder] = remindersFor([subscription({ firstDueDate: TODAY })], TODAY)
    expect(reminder.tag).toBe('sub1:2026-10-20')
  })
})

describe('messageFor', () => {
  const reminder = { title: 'Netflix', body: '₱549.00 due today', tag: 'sub1:2026-10-20' }

  it('sends browsers data only, for the service worker to show', () => {
    const message = messageFor(reminder, 'web-token', 'web')
    expect(message).toEqual({ token: 'web-token', data: { ...reminder, url: '/' } })
    expect(message).not.toHaveProperty('notification')
  })

  it('treats a device saved before the app existed as a browser', () => {
    expect(messageFor(reminder, 'old-token', undefined)).toEqual(messageFor(reminder, 'old-token', 'web'))
  })

  it('gives Android a notification Android can show by itself, in the reminders channel', () => {
    expect(messageFor(reminder, 'phone-token', 'android')).toEqual({
      token: 'phone-token',
      notification: { title: 'Netflix', body: '₱549.00 due today' },
      android: { notification: { tag: 'sub1:2026-10-20', channelId: ANDROID_CHANNEL_ID } },
    })
  })
})
