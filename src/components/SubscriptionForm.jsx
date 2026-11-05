import { useEffect, useRef, useState } from 'react'
import { todayString } from '../lib/billing.js'
import { CATEGORIES } from '../lib/categories.js'
import { shrinkImage } from '../lib/imageFile.js'
import { findService } from '../lib/services.js'
import { MAX_PRICE, earliestFirstDueDate, validateSubscription } from '../lib/validation.js'
import ServicePicker from './ServicePicker.jsx'
import SubscriptionLogo from './SubscriptionLogo.jsx'

const CURRENCIES = ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD']

const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

// "Netflix only bills monthly." or "Spotify bills monthly or yearly."
function cycleHint(service) {
  const names = service.cycles.join(' or ')
  return service.cycles.length === 1
    ? `${service.name} only bills ${names}.`
    : `${service.name} bills ${names}.`
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <span id={id} className="field-error" role="alert">
      {message}
    </span>
  )
}

export default function SubscriptionForm({ subscription, onSave, onCancel }) {
  // Adding starts by picking a service. Editing goes straight to the details, and "Change" goes
  // back to the picker. Everything typed so far is kept either way.
  const [isPicking, setIsPicking] = useState(!subscription)
  const [hasPicked, setHasPicked] = useState(Boolean(subscription))
  const [serviceId, setServiceId] = useState(subscription?.serviceId ?? null)
  const [subscriptionName, setSubscriptionName] = useState(subscription?.subscriptionName ?? '')
  const [image, setImage] = useState(subscription?.image ?? '')
  const [imageError, setImageError] = useState('')
  const [price, setPrice] = useState(subscription?.price ?? '')
  const [currency, setCurrency] = useState(subscription?.currency ?? CURRENCIES[0])
  const [billingCycle, setBillingCycle] = useState(subscription?.billingCycle ?? 'monthly')
  const [category, setCategory] = useState(subscription?.category ?? CATEGORIES[0])
  const [firstDueDate, setFirstDueDate] = useState(subscription?.firstDueDate ?? todayString())
  const [errors, setErrors] = useState({})
  const service = findService(serviceId)

  const formRef = useRef(null)
  const fileRef = useRef(null)

  // The picker and the details replace each other, so the button that was pressed is gone.
  // Focus moves to the field that comes next instead of dropping to the page.
  const focusNext = useRef(null)
  useEffect(() => {
    if (isPicking || !focusNext.current) return
    formRef.current.elements[focusNext.current]?.focus()
    focusNext.current = null
  }, [isPicking])

  // Later due dates are counted from the first one, so the schedule is fixed once a payment exists.
  const hasPayments = Boolean(subscription?.lastPaidDate)

  // A picked service only offers the cycles it really bills in. The current one always stays in
  // the list, so a subscription saved before this (or one whose cycle is fixed by a payment) still
  // shows what it has instead of silently changing.
  const cycleOptions = BILLING_CYCLES.filter(
    ({ value }) => !service || service.cycles.includes(value) || value === billingCycle,
  )

  // A subscription saved before the date limit existed keeps its own date as the limit.
  const earliest = earliestFirstDueDate()
  const minDate =
    subscription && subscription.firstDueDate < earliest ? subscription.firstDueDate : earliest

  function handlePick(picked, search) {
    if (picked) {
      setServiceId(picked.id)
      setSubscriptionName(picked.name)
      setCategory(picked.category)
      if (!hasPayments) setBillingCycle(picked.billingCycle)
      // The name is filled in, so the price is the next thing to enter.
      focusNext.current = 'price'
    } else {
      // A new subscription takes the name that was searched for. One whose name was filled in by
      // an earlier pick starts blank instead, so it isn't saved under that service's name.
      if (!subscription) {
        const typed = search.trim()
        if (typed) setSubscriptionName(typed)
        else if (service && subscriptionName === service.name) setSubscriptionName('')
        setCategory('Other')
      }
      setServiceId(null)
      focusNext.current = 'subscriptionName'
    }
    setHasPicked(true)
    setErrors({})
    setIsPicking(false)
  }

  function keepCurrentChoice() {
    focusNext.current = 'changeService'
    setIsPicking(false)
  }

  async function handleImageFile(event) {
    const file = event.target.files[0]
    // Cleared so that choosing the same file again still counts as a change.
    event.target.value = ''
    if (!file) return
    setImageError('')
    try {
      setImage(await shrinkImage(file))
      setErrors(({ image: _, ...rest }) => rest)
    } catch {
      setImageError('Could not open that picture. Try a PNG or JPG file.')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    // A picked service shows its own logo, so an uploaded picture isn't kept with it.
    const savedImage = service ? '' : image
    const values = { subscriptionName, image: savedImage, price: String(price), firstDueDate }
    const found = validateSubscription(values, minDate)
    setErrors(found)
    // Errors come back in form order, so the first key is the first invalid field on screen.
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      event.currentTarget.elements[firstInvalid].focus()
      return
    }

    onSave({
      subscriptionName: subscriptionName.trim(),
      serviceId: service?.id ?? null,
      image: savedImage.trim(),
      price: Number(price),
      currency,
      billingCycle,
      category,
      firstDueDate,
    })
  }

  if (isPicking) {
    return (
      <div className="sub-form">
        <p className="muted picker-intro">
          Pick what you're paying for to fill in its name, logo, and category.
        </p>
        <ServicePicker onPick={handlePick} />
        {hasPicked && (
          <div className="form-actions">
            <button type="button" className="secondary" onClick={keepCurrentChoice}>
              Back
            </button>
          </div>
        )}
      </div>
    )
  }

  // The form shows its own messages under each field, so the browser's popups are turned off.
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="sub-form" noValidate>
      <div className="service-choice">
        <SubscriptionLogo
          className="choice-logo"
          name={subscriptionName}
          serviceId={serviceId}
          image={image}
        />
        <div className="service-choice-text">
          <strong>{service ? service.name : 'Other subscription'}</strong>
          <span className="field-hint">
            {service
              ? 'Logo, category, and billing cycle filled in.'
              : 'Adding your own picture is optional.'}
          </span>
        </div>
        <button
          type="button"
          className="text"
          name="changeService"
          aria-label="Change service"
          onClick={() => setIsPicking(true)}
        >
          Change
        </button>
      </div>

      {!service && (
        <div className="image-actions">
          <button
            type="button"
            className="secondary small"
            name="image"
            onClick={() => fileRef.current.click()}
            aria-describedby="error-image"
          >
            {image ? 'Choose another picture' : 'Add a picture'}
          </button>
          {image && (
            <button type="button" className="text" onClick={() => setImage('')}>
              Remove picture
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleImageFile}
          />
          <FieldError id="error-image" message={imageError || errors.image} />
        </div>
      )}

      <label>
        Name
        <input
          name="subscriptionName"
          value={subscriptionName}
          onChange={(e) => setSubscriptionName(e.target.value)}
          placeholder="e.g. Netflix"
          maxLength={60}
          aria-invalid={Boolean(errors.subscriptionName)}
          aria-describedby="error-name"
        />
        <FieldError id="error-name" message={errors.subscriptionName} />
      </label>

      <div className="form-row">
        <label>
          Price
          <input
            type="number"
            name="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            max={MAX_PRICE}
            step="0.01"
            aria-invalid={Boolean(errors.price)}
            aria-describedby="error-price"
          />
          <FieldError id="error-price" message={errors.price} />
        </label>

        <label>
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Billing cycle
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
            disabled={hasPayments}
            aria-describedby={service ? 'hint-cycle' : undefined}
          >
            {cycleOptions.map((cycle) => (
              <option key={cycle.value} value={cycle.value}>
                {cycle.label}
              </option>
            ))}
          </select>
          {service && (
            <span id="hint-cycle" className="field-hint">
              {cycleHint(service)}
            </span>
          )}
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        First payment date
        <input
          type="date"
          name="firstDueDate"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
          min={minDate}
          disabled={hasPayments}
          aria-invalid={Boolean(errors.firstDueDate)}
          aria-describedby="error-date hint-date"
        />
        <FieldError id="error-date" message={errors.firstDueDate} />
        <span id="hint-date" className="field-hint">
          {hasPayments
            ? "This and the billing cycle can't be changed after a payment is recorded."
            : 'The first charge you want to track. Later dates are counted from it.'}
          {!hasPayments &&
            service &&
            ` Your next charge date is in your ${service.name} account settings, or on your last receipt.`}
        </span>
      </label>

      <div className="form-actions">
        <button type="submit">
          {subscription ? 'Save changes' : 'Add subscription'}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
