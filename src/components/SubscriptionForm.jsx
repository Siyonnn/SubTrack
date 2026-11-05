import { useEffect, useRef, useState } from 'react'
import { todayString } from '../lib/billing.js'
import { CATEGORIES } from '../lib/categories.js'
import { formatPrice } from '../lib/format.js'
import { shrinkImage } from '../lib/imageFile.js'
import {
  fillFromPlan,
  findPlan,
  planCycles,
  planPrice,
  plansFor,
  plansShownFor,
  priceSource,
} from '../lib/plans.js'
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

const PER = { weekly: 'week', monthly: 'month', yearly: 'year' }

// "Duo — ₱239.00/month", or just "Duo" when it isn't sold for this currency and cycle.
function planLabel(plan, currency, cycle) {
  const amount = planPrice(plan, currency, cycle)
  return amount === null ? plan.name : `${plan.name} — ${formatPrice(amount, currency)}/${PER[cycle]}`
}

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
  const [planId, setPlanId] = useState(subscription?.planId ?? null)
  // True while the price is the one a plan filled in, so it follows the plan when the currency or
  // cycle changes. Typing a price turns it off, and a typed price is never overwritten.
  const [priceFollowsPlan, setPriceFollowsPlan] = useState(false)
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
  const plan = findPlan(serviceId, planId)

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
  // A chosen plan narrows it further, to the cycles that plan is sold in.
  const cycleOptions = BILLING_CYCLES.filter(
    ({ value }) =>
      value === billingCycle ||
      ((!service || service.cycles.includes(value)) && (!plan || planCycles(plan).includes(value))),
  )

  // The plans sold in the chosen currency. The chosen plan always stays in the list.
  const shownPlans = service ? plansShownFor(service.id, currency) : []
  if (plan && !shownPlans.includes(plan)) shownPlans.push(plan)
  const planHasNoPrice = plan && planPrice(plan, currency, billingCycle) === null

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
      // The name is filled in, so the plan (or, without plans, the price) comes next.
      focusNext.current = plansFor(picked.id).length > 0 ? 'plan' : 'price'
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
    // A plan belongs to its service, and so does a price it filled in.
    setPlanId(null)
    if (priceFollowsPlan) {
      setPrice('')
      setPriceFollowsPlan(false)
    }
    setHasPicked(true)
    setErrors({})
    setIsPicking(false)
  }

  function choosePlan(id) {
    const next = findPlan(serviceId, id)
    setPlanId(next?.id ?? null)
    if (!next) {
      // "Other plan": whatever price is there stays, as the person's own.
      setPriceFollowsPlan(false)
      return
    }
    const fill = fillFromPlan(next, { currency, cycle: billingCycle, cycleLocked: hasPayments })
    setCurrency(fill.currency)
    setBillingCycle(fill.cycle)
    setPrice(fill.price ?? '')
    setPriceFollowsPlan(true)
    setErrors(({ price: _, ...rest }) => rest)
  }

  // A price the plan filled in follows it to the new currency or cycle. Where the plan isn't sold
  // that way, the price is cleared rather than left showing an amount in the wrong currency.
  function followPlan(nextCurrency, nextCycle) {
    if (plan && priceFollowsPlan) setPrice(planPrice(plan, nextCurrency, nextCycle) ?? '')
  }

  function changeCurrency(code) {
    setCurrency(code)
    followPlan(code, billingCycle)
  }

  function changeCycle(cycle) {
    setBillingCycle(cycle)
    followPlan(currency, cycle)
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
      planId: plan?.id ?? null,
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
            {!service
              ? 'Adding your own picture is optional.'
              : shownPlans.length > 0
                ? 'Logo and category filled in. Pick your plan for its price.'
                : 'Logo, category, and billing cycle filled in.'}
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

      {shownPlans.length > 0 && (
        <label>
          Plan
          <select
            name="plan"
            value={plan?.id ?? ''}
            onChange={(e) => choosePlan(e.target.value)}
            aria-describedby="hint-plan"
          >
            <option value="">Other plan, or I'll type the price</option>
            {shownPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {planLabel(p, currency, billingCycle)}
              </option>
            ))}
          </select>
          <span id="hint-plan" className="field-hint">
            {planHasNoPrice
              ? `${service.name} ${plan.name} has no official ${currency} ${billingCycle} price here. Enter what you pay.`
              : plan && priceFollowsPlan
                ? priceSource(currency)
                : 'Prices are filled in for pesos and US dollars.'}
          </span>
        </label>
      )}

      <div className="form-row">
        <label>
          Price
          <input
            type="number"
            name="price"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              setPriceFollowsPlan(false)
            }}
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
          <select value={currency} onChange={(e) => changeCurrency(e.target.value)}>
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
            onChange={(e) => changeCycle(e.target.value)}
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
