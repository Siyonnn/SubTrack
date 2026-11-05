import { useEffect, useState } from 'react'
import { formatDate, formatPrice } from '../lib/format.js'
import { watchPayments } from '../lib/subscriptions.js'

export default function PaymentHistory({ uid, subscription, onUndo }) {
  // null = still loading
  const [payments, setPayments] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    return watchPayments(uid, subscription.id, setPayments, () =>
      setError('Could not load the payment history.'),
    )
  }, [uid, subscription.id])

  if (error) return <p className="error" role="alert">{error}</p>
  if (payments === null) return <p className="muted">Loading…</p>
  if (payments.length === 0) return <p className="muted">No payments recorded yet.</p>

  return (
    <table className="history">
      <thead>
        <tr>
          <th>Period due</th>
          <th>Paid on</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {/* On phones each row is two lines with no column headings on screen, so the labels in
            the cells show instead. Screen readers skip them: they read the column headings. */}
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td className="history-due">
              <span className="history-label" aria-hidden="true">
                Period due{' '}
              </span>
              {formatDate(payment.dueDate)}
            </td>
            <td className="history-paid">
              <span className="history-label" aria-hidden="true">
                Paid on{' '}
              </span>
              {formatDate(payment.paidOn)}
            </td>
            <td className="history-amount">{formatPrice(payment.amount, payment.currency)}</td>
            <td className="history-undo">
              {/* Only the latest payment can be undone, so the paid periods stay in order. */}
              {payment.dueDate === subscription.lastPaidDate && (
                <button type="button" className="link" onClick={onUndo}>
                  Undo
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
