import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { getPaymentStatus } from '../lib/billing.js'
import { NO_FILTERS, filterSubscriptions } from '../lib/filters.js'
import {
  addSubscription,
  deleteSubscription,
  recordPayments,
  undoLastPayment,
  updateSubscription,
  watchSubscriptions,
} from '../lib/subscriptions.js'
import { turnOffReminders } from '../lib/pushReminders.js'
import { formatDate } from '../lib/format.js'
import { isNativeApp } from '../lib/platform.js'
import { Chloe, ChloePose, Logo } from './Brand.jsx'
import ChloeReaction from './ChloeReaction.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import ExpenseSummary from './ExpenseSummary.jsx'
import Filters from './Filters.jsx'
import Modal from './Modal.jsx'
import SubscriptionCard from './SubscriptionCard.jsx'
import RemindersToggle from './RemindersToggle.jsx'
import SubscriptionForm from './SubscriptionForm.jsx'

function watchOnline(onChange) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function dueLabel({ status, daysUntilDue: days, nextPaymentDate }) {
  if (status === 'overdue') return `is overdue since ${formatDate(nextPaymentDate)}`
  if (days === 0) return 'is due today'
  if (days === 1) return 'is due tomorrow'
  return `is due in ${days} days`
}

// Chloe speaks up only when a payment needs attention, or naps when everything is paid.
// Uses every subscription, not just the filtered ones.
function ChloeNote({ rows }) {
  const needsAttention = rows
    .filter(({ payment }) => payment.status === 'overdue' || payment.status === 'dueSoon')
    .sort((a, b) => a.payment.nextPaymentDate.localeCompare(b.payment.nextPaymentDate))

  if (needsAttention.length > 0) {
    const [{ subscription, payment }] = needsAttention
    const more = needsAttention.length - 1
    return (
      <div className="chloe-note">
        <Chloe mood="alert" size={52} />
        <p>
          <strong>Chloe caught a scent.</strong> {subscription.subscriptionName} {dueLabel(payment)}.
          {more > 0 && ` ${more} more ${more === 1 ? 'needs' : 'need'} attention.`}
        </p>
      </div>
    )
  }

  if (rows.length > 0 && rows.every(({ payment }) => payment.status === 'paid')) {
    const next = rows
      .map(({ payment }) => payment.nextPaymentDate)
      .sort((a, b) => a.localeCompare(b))[0]
    return (
      <div className="chloe-note">
        <Chloe mood="napping" size={52} />
        <p>
          <strong>Everything is paid.</strong> Chloe is napping until the next charge on{' '}
          {formatDate(next)}.
        </p>
      </div>
    )
  }

  return null
}

export default function Dashboard({ user }) {
  // null = still loading
  const [subscriptions, setSubscriptions] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  // Changing this number starts the list listener again after it has failed.
  const [loadAttempt, setLoadAttempt] = useState(0)
  // A change that the server refused. Shown in a notice that stays on screen while scrolling.
  const [notice, setNotice] = useState('')
  // null = form closed, 'new' = adding, otherwise the subscription being edited
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState(NO_FILTERS)
  // null = no question open, otherwise the props for ConfirmDialog
  const [confirming, setConfirming] = useState(null)
  const isOnline = useSyncExternalStore(watchOnline, () => navigator.onLine)

  useEffect(() => {
    return watchSubscriptions(
      user.uid,
      (list) => {
        setSubscriptions(list)
        setLoadFailed(false)
      },
      () => setLoadFailed(true),
    )
  }, [user.uid, loadAttempt])

  // Chloe pops up in the corner to react to what was just done. Each reaction gets a new id, so
  // a second action right after the first starts her over instead of being ignored.
  const [reaction, setReaction] = useState(null)
  const reactionCount = useRef(0)
  const clearReaction = useCallback(() => setReaction(null), [])

  // Firestore shows a change in the list straight away and sends it in the background. While
  // offline it keeps the change queued and its promise never settles, so nothing here waits for
  // the server. If the server refuses a change, Firestore takes it back out of the list and the
  // notice says so, which also sends Chloe away (see the end of the page).
  function send(write, failureMessage, reactionToShow) {
    const id = react(reactionToShow)
    write.catch(() => {
      // Her reaction to the change that failed is dropped, so it can't come back after the
      // notice is dismissed. A newer one, for a later action, stays.
      setReaction((current) => (current?.id === id ? null : current))
      setNotice(failureMessage)
    })
  }

  // An old problem notice goes away, since something new has just worked.
  function react([mood, effect, message]) {
    setNotice('')
    reactionCount.current += 1
    setReaction({ id: reactionCount.current, mood, effect, message })
    return reactionCount.current
  }

  function handleSave(data) {
    const name = data.subscriptionName
    if (editing === 'new') {
      send(
        addSubscription(user.uid, data),
        `Could not save ${name}. The change was not kept.`,
        ['happy', 'hearts', `Added ${name}! I'll keep my nose on it.`],
      )
    } else {
      send(
        updateSubscription(user.uid, editing.id, data),
        `Could not save ${name}. The change was not kept.`,
        ['curious', null, `Got it. ${name} is updated.`],
      )
    }
    setEditing(null)
  }

  function pay(subscription, count) {
    const name = subscription.subscriptionName
    send(
      recordPayments(user.uid, subscription, count),
      `Could not record the payment for ${name}. It was not kept.`,
      [
        'happy',
        'confetti',
        count > 1 ? `${count} payments for ${name}, all paid. Good human!` : `${name} is paid. Good human!`,
      ],
    )
  }

  // The button that opened a dialog can be gone once the dialog's action is done (a deleted card,
  // or "Mark paid" on a card that is now paid), which would drop keyboard focus to the page.
  // flushSync removes the dialog first, because nothing behind an open dialog can take focus.
  const headingRef = useRef(null)
  const addButtonRef = useRef(null)

  function closeConfirmAndFocus(target) {
    flushSync(() => setConfirming(null))
    target.current.focus()
  }

  function handleMarkPaid(subscription, overduePeriods) {
    if (overduePeriods > 1) {
      askHowManyToPay(subscription, overduePeriods)
    } else {
      pay(subscription, 1)
    }
  }

  function askHowManyToPay(subscription, overduePeriods) {
    setConfirming({
      title: `${subscription.subscriptionName} is ${overduePeriods} periods behind`,
      message: 'Mark all of them as paid today, or only the oldest one. Each period gets its own entry in the history.',
      confirmLabel: `Mark all ${overduePeriods} paid`,
      onConfirm: () => {
        pay(subscription, overduePeriods)
        closeConfirmAndFocus(headingRef)
      },
      alternative: {
        label: 'Oldest only',
        onConfirm: () => {
          pay(subscription, 1)
          setConfirming(null)
        },
      },
    })
  }

  function askToUndoPayment(subscription) {
    setConfirming({
      title: 'Undo this payment?',
      message: `The ${subscription.subscriptionName} payment for ${formatDate(subscription.lastPaidDate)} will be removed. If you mark it as paid again later, "Paid on" will show that day's date.`,
      confirmLabel: 'Undo payment',
      isDanger: true,
      onConfirm: () => {
        send(
          undoLastPayment(user.uid, subscription),
          `Could not undo the payment for ${subscription.subscriptionName}. It is still recorded.`,
          ['thinking', null, `Huh? Okay, I took back that ${subscription.subscriptionName} payment.`],
        )
        setConfirming(null)
      },
    })
  }

  function askToDelete(subscription) {
    // Deleting first reads the payment history from the server, so that none is left behind.
    if (!isOnline) {
      setNotice('Reconnect to delete a subscription.')
      return
    }
    setConfirming({
      title: `Delete ${subscription.subscriptionName}?`,
      message: "Its payment history is deleted too. This can't be undone.",
      confirmLabel: 'Delete subscription',
      isDanger: true,
      onConfirm: () => {
        send(
          deleteSubscription(user.uid, subscription.id),
          `Could not delete ${subscription.subscriptionName}. It is still in your list.`,
          ['sad', null, `Bye, ${subscription.subscriptionName}. One less bill to sniff out.`],
        )
        // The heading goes away with the last card, so use the button that is always there.
        closeConfirmAndFocus(subscriptions.length > 1 ? headingRef : addButtonRef)
      },
    })
  }

  function askToLogOut() {
    setConfirming({
      title: 'Log out?',
      // Changes made offline are only held in this tab, so logging out would drop them.
      message: isOnline
        ? 'You will need your email and password to log back in.'
        : "You're offline. Changes that have not been sent yet will be lost if you log out now.",
      confirmLabel: 'Log out',
      onConfirm: async () => {
        // Someone else may use this browser next, so it stops getting this account's reminders.
        // The record can only be removed while still logged in; give up after a few seconds
        // rather than hold up logging out when offline.
        const giveUp = new Promise((resolve) => setTimeout(resolve, 3000))
        await Promise.race([turnOffReminders(user.uid).catch(() => {}), giveUp])
        signOut(auth)
      },
    })
  }

  const hasSubscriptions = subscriptions?.length > 0
  // Each subscription's status is worked out once here and passed down, so the filters,
  // the order, and the cards all agree.
  const rows = (subscriptions ?? []).map((subscription) => ({
    subscription,
    payment: getPaymentStatus(subscription),
  }))
  const shown = filterSubscriptions(rows, filters).sort((a, b) =>
    a.payment.nextPaymentDate.localeCompare(b.payment.nextPaymentDate),
  )

  return (
    <main>
      <header className="topbar">
        <h1>
          <Logo size={40} />
        </h1>
        <div className="topbar-account">
          <span className="muted">{user.email}</span>
          <RemindersToggle
            uid={user.uid}
            onMessage={setNotice}
            onChange={(isOn, message) =>
              react(isOn ? ['alert', 'bark', message] : ['napping', null, message])
            }
          />
          <button type="button" className="secondary small" onClick={askToLogOut}>
            Log out
          </button>
        </div>
      </header>

      {hasSubscriptions && <ChloeNote rows={rows} />}

      {!isOnline && (
        <p className="page-message" role="status">
          You're offline. Changes show here now and are sent when you reconnect, so keep{' '}
          {isNativeApp ? 'the app' : 'this tab'} open until then.
        </p>
      )}
      {loadFailed && (
        <p className="page-message error" role="alert">
          Could not load your subscriptions.{' '}
          <button type="button" className="link" onClick={() => setLoadAttempt(loadAttempt + 1)}>
            Try again
          </button>
        </p>
      )}

      <div className="overview">
        {hasSubscriptions ? (
          <ExpenseSummary subscriptions={subscriptions} />
        ) : subscriptions === null ? (
          <p className="muted">{!loadFailed && 'Loading…'}</p>
        ) : (
          <div className="empty-state">
            <ChloePose mood="thinking" size={128} />
            <p className="muted">
              No subscriptions yet. Add your first one and Chloe will keep an eye on when it's due.
            </p>
          </div>
        )}
        <button type="button" ref={addButtonRef} onClick={() => setEditing('new')}>
          Add subscription
        </button>
      </div>

      {editing && (
        <Modal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'Add subscription' : 'Edit subscription'}
          onClose={() => setEditing(null)}
        >
          <SubscriptionForm
            subscription={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {hasSubscriptions && (
        <section>
          <h2 className="section-title" ref={headingRef} tabIndex={-1}>
            Your subscriptions
          </h2>
          <Filters filters={filters} onChange={setFilters} />
          {shown.length === 0 && <p className="muted">No subscriptions match these filters.</p>}

          <div className="card-grid">
            {shown.map(({ subscription, payment }) => (
              <SubscriptionCard
                key={subscription.id}
                uid={user.uid}
                subscription={subscription}
                payment={payment}
                onMarkPaid={() => handleMarkPaid(subscription, payment.overduePeriods)}
                onUndoPayment={() => askToUndoPayment(subscription)}
                onEdit={() => setEditing(subscription)}
                onDelete={() => askToDelete(subscription)}
              />
            ))}
          </div>
        </section>
      )}

      {confirming && <ConfirmDialog {...confirming} onCancel={() => setConfirming(null)} />}

      {/* Always on the page, so screen readers announce what Chloe says when she appears.
          A problem notice takes her place: she shouldn't cheer for a change that wasn't kept. */}
      <div className="chloe-reaction-region" role="status">
        {reaction && !notice && (
          <ChloeReaction key={reaction.id} reaction={reaction} onDone={clearReaction} />
        )}
      </div>

      {notice && (
        <div className="toast" role="alert">
          <p>{notice}</p>
          <button type="button" className="link" onClick={() => setNotice('')}>
            Dismiss
          </button>
        </div>
      )}
    </main>
  )
}
