import { useLayoutEffect, useRef, useState } from 'react'
import { formatDate, formatPrice } from '../lib/format.js'
import { findPlan } from '../lib/plans.js'
import Modal from './Modal.jsx'
import PaymentHistory from './PaymentHistory.jsx'
import SubscriptionLogo from './SubscriptionLogo.jsx'

const CYCLE_LABELS = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
}

function DueLine({ payment, justStamped }) {
  const { status, nextPaymentDate, daysUntilDue: days, overduePeriods } = payment
  const date = formatDate(nextPaymentDate)

  if (status === 'paid') {
    return (
      <p className="due">
        <span className={justStamped ? 'due-paid just-stamped' : 'due-paid'}>Paid</span>{' '}
        <span className="muted">Next {date}</span>
      </p>
    )
  }
  if (status === 'overdue') {
    return (
      <p className="due">
        <span className="due-overdue">
          Overdue{overduePeriods > 1 && `, ${overduePeriods} periods`}
        </span>{' '}
        <span className="muted">since {date}</span>
      </p>
    )
  }
  if (status === 'dueSoon') {
    const label = days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days} days`
    return (
      <p className="due">
        <mark className="due-soon">{label}</mark> <span className="muted">{date}</span>
      </p>
    )
  }
  return <p className="due">Due {date}</p>
}

export default function SubscriptionCard({
  uid,
  subscription,
  payment,
  onMarkPaid,
  onUndoPayment,
  onEdit,
  onDelete,
}) {
  const [showHistory, setShowHistory] = useState(false)
  const name = subscription.subscriptionName

  // Only a card that turns paid while on screen gets the stamp animation, not every paid card
  // on page load. A layout effect, so the stamp is never painted once without it.
  const wasPaid = useRef(payment.status === 'paid')
  const [justStamped, setJustStamped] = useState(false)
  useLayoutEffect(() => {
    const isPaid = payment.status === 'paid'
    if (isPaid && !wasPaid.current) setJustStamped(true)
    wasPaid.current = isPaid
  }, [payment.status])

  return (
    <article className="card">
      <div className="card-heading">
        <SubscriptionLogo
          className="card-image"
          name={subscription.subscriptionName}
          serviceId={subscription.serviceId}
          image={subscription.image}
        />
        <div className="card-title">
          <h3>{subscription.subscriptionName}</h3>
          {/* "Music · Duo". A plan no longer listed just leaves the category. */}
          <p className="muted">
            {[subscription.category, findPlan(subscription.serviceId, subscription.planId)?.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>

      <p className="card-price">
        {formatPrice(subscription.price, subscription.currency)}{' '}
        <span className="muted">/ {CYCLE_LABELS[subscription.billingCycle]}</span>
      </p>
      <DueLine payment={payment} justStamped={justStamped} />

      {/* The labels name the subscription so each button is distinct in a screen reader's list. */}
      <div className="card-footer">
        <div className="card-links">
          <button
            type="button"
            className="text"
            aria-label={`History for ${name}`}
            onClick={() => setShowHistory(true)}
          >
            History
          </button>
          <button type="button" className="text" aria-label={`Edit ${name}`} onClick={onEdit}>
            Edit
          </button>
          <button
            type="button"
            className="text text-danger"
            aria-label={`Delete ${name}`}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
        {payment.status !== 'paid' && (
          <button
            type="button"
            className="small"
            aria-label={`Mark paid, ${name}`}
            onClick={onMarkPaid}
          >
            Mark paid
          </button>
        )}
      </div>

      {showHistory && (
        <Modal
          title={`${subscription.subscriptionName} payments`}
          onClose={() => setShowHistory(false)}
        >
          <PaymentHistory uid={uid} subscription={subscription} onUndo={onUndoPayment} />
        </Modal>
      )}
    </article>
  )
}
