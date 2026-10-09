import { useState } from 'react'
import toast from 'react-hot-toast'
import { requestOrderCancellation } from '../api'
import { formatCurrency } from '../../../lib/formatters'
import OrderStatusBadge from './OrderStatusBadge'

export default function OrderCard({ order }) {
  const [cancellationStatus, setCancellationStatus] = useState(
    order.cancellation_request_status,
  )
  const [requestingCancellation, setRequestingCancellation] = useState(false)
  const orderDate = order.created_at
    ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(order.created_at))
    : 'Date unavailable'
  const canRequestCancellation =
    ['pending', 'confirmed', 'processing'].includes(order.status) &&
    order.payment_status?.toUpperCase() !== 'PAID' &&
    cancellationStatus !== 'requested'

  const requestCancellation = async () => {
    setRequestingCancellation(true)
    try {
      await requestOrderCancellation(order.id)
      setCancellationStatus('requested')
      toast.success('Cancellation request sent to the store.')
    } catch (cause) {
      console.error('Could not request order cancellation.', cause)
      toast.error(cause.message || 'Could not request order cancellation.')
    } finally {
      setRequestingCancellation(false)
    }
  }

  return (
    <article className="order-card">
      <div className="order-card__top">
        <div>
          <span className="eyebrow">Order {order.order_number || order.id.slice(0, 8)}</span>
          <p>{orderDate}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="order-card__items">
        {order.items.map((item) => (
          <div className="order-card__item" key={item.id}>
            <span>{item.product_name}<small> × {item.quantity}</small></span>
            <strong>{formatCurrency(item.total_amount ?? Number(item.price) * Number(item.quantity))}</strong>
          </div>
        ))}
      </div>
      {order.shippingAddress && (
        <p className="order-card__delivery">
          Delivered to · {[
            order.shippingAddress.full_address,
            order.shippingAddress.city,
            order.shippingAddress.state,
            order.shippingAddress.zip_code,
          ].filter(Boolean).join(', ')}
        </p>
      )}
      <div className="order-card__bottom">
        <span>
          Payment · {(order.payment_status || 'pending').replaceAll('_', ' ')}
          {order.payment_method && ` · ${order.payment_method.replace('_', ' ')}`}
        </span>
        <strong>{formatCurrency(order.net_amount ?? order.total_amount)}</strong>
      </div>
      {(cancellationStatus === 'requested' || cancellationStatus === 'declined' || canRequestCancellation) && (
        <div className="order-card__cancellation">
          {cancellationStatus === 'requested' && <span role="status">Cancellation request pending admin review.</span>}
          {cancellationStatus === 'declined' && <span role="status">Your previous cancellation request was declined.</span>}
          {canRequestCancellation && (
            <button
              type="button"
              onClick={requestCancellation}
              disabled={requestingCancellation}
            >
              {requestingCancellation
                ? 'Sending request…'
                : cancellationStatus === 'declined'
                  ? 'Request cancellation again'
                  : 'Request cancellation'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}