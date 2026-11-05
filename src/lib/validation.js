import { addCycles, todayString } from './billing.js'
import { formatDate } from './format.js'

export const MAX_PRICE = 1_000_000

// An uploaded picture is stored inside the subscription as a data: link. imageFile.js shrinks it
// to a few kilobytes; this cap, also in firestore.rules, keeps a subscription well within
// Firestore's 1 MB limit for a record.
export const MAX_IMAGE_LENGTH = 100_000

// Older dates would start a subscription dozens of periods overdue.
export function earliestFirstDueDate(today = todayString()) {
  return addCycles(today, 'monthly', -3)
}

function isValidUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

// An uploaded picture, or a web link saved before pictures could be uploaded.
function isValidImage(value) {
  if (value.length > MAX_IMAGE_LENGTH) return false
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) || isValidUrl(value)
}

// Returns one message per invalid field. An empty object means the values are valid.
export function validateSubscription(values, minDate) {
  const errors = {}
  const price = Number(values.price)

  if (!values.subscriptionName.trim()) {
    errors.subscriptionName = 'Enter a name for the subscription.'
  }
  if (values.image.trim() && !isValidImage(values.image.trim())) {
    errors.image = 'This picture could not be used. Choose another one, or remove it.'
  }
  if (values.price === '' || !Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a price greater than 0.'
  } else if (!/^\d+(\.\d{1,2})?$/.test(values.price.trim())) {
    // Also rejects forms like "1e3" that a number field accepts.
    errors.price = 'Use digits with at most 2 decimal places, such as 549.50.'
  } else if (price > MAX_PRICE) {
    errors.price = `Enter a price of ${MAX_PRICE.toLocaleString()} or less.`
  }
  if (!values.firstDueDate) {
    errors.firstDueDate = 'Choose a date.'
  } else if (values.firstDueDate < minDate) {
    errors.firstDueDate = `Choose ${formatDate(minDate)} or later.`
  }
  return errors
}
