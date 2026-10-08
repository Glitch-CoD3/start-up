import { formatCurrency } from '../../../lib/formatters'
import OrderStatusBadge from './OrderStatusBadge'

export default function OrderCard({ order }) {
  const orderDate = order.created_at
    ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(order.created_at))
    : 'Date unavailable'

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
    </article>
  )
}