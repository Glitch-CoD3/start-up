import { ArrowRight, Check, Heart, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../app/providers'
import { formatCurrency } from '../../../lib/formatters'
import { getCustomerOrderConfirmation } from '../api'

const paymentLabels = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank_card: 'Bank card',
}

export default function OrderSuccessPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getCustomerOrderConfirmation(id, user.id)
      .then((data) => {
        if (!active) return
        if (!data) setError('We could not find this order in your account.')
        else setOrder(data)
      })
      .catch((cause) => {
        console.error('Could not load order confirmation.', cause)
        if (active) setError(cause.message || 'Your order confirmation could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, user.id])

  if (loading) return <div className="detail-loading" aria-label="Loading order confirmation"><span /></div>
  if (!order) {
    return <section className="order-success-page"><div className="notice notice--error" role="alert">{error}</div><Link className="button button--dark" to="/account">View your account <ArrowRight size={16} /></Link></section>
  }

  return (
    <section className="order-success-page">
      <div className="order-thankyou-card">
        <div className="order-thankyou-card__seal"><Check size={24} /></div>
        <span className="eyebrow">A little something to celebrate</span>
        <h1>Thank you for your order<span>.</span></h1>
        <p className="order-thankyou-card__intro">We’ve received your order and payment reference. Our team will verify the payment before preparing your pieces.</p>
        <div className="order-confirmation-number"><span>Order number</span><strong>{order.order_number}</strong></div>
        <div className="order-confirmation-items">
          {order.items.map((item) => (
            <div key={item.id}><span>{item.product_name} <small>× {item.quantity}</small></span><strong>{formatCurrency(item.total_amount)}</strong></div>
          ))}
        </div>
        <div className="order-confirmation-payment">
          <span><strong>Payment method</strong>{paymentLabels[order.payment_method] ?? order.payment_method}</span>
          <span><strong>{order.payment_method === 'bank_card' ? 'Card last 4 digits' : 'Sender number'}</strong>{order.payment_account_reference || 'Not provided'}</span>
          <span><strong>Transaction reference</strong>{order.transaction_number}</span>
          <span><strong>Payment status</strong><em>{(order.payment_status || '').replaceAll('_', ' ')}</em></span>
        </div>
        <div className="order-confirmation-total"><span>Items subtotal</span><strong>{formatCurrency(order.total_amount)}</strong></div>
        {Number(order.discount_amount) > 0 && <div className="order-confirmation-total"><span>Product discounts</span><strong>−{formatCurrency(order.discount_amount)}</strong></div>}
        <div className="order-confirmation-total"><span>Delivery</span><strong>{formatCurrency(order.shipping_charge)}</strong></div>
        <div className="order-confirmation-total order-confirmation-total--grand"><span>Order total</span><strong>{formatCurrency(order.net_amount ?? order.total_amount)}</strong></div>
        {order.shippingAddress && <p className="order-confirmation-address"><PackageCheck size={16} /> Delivering to {order.shippingAddress.city}, {order.shippingAddress.state}</p>}
        <div className="order-thankyou-card__heart"><Heart size={15} /> Made for you, with a little love.</div>
        <div className="order-thankyou-actions">
          <Link className="button button--dark" to="/shop">Keep exploring <ArrowRight size={16} /></Link>
          <Link className="button button--outline" to="/account">View your orders</Link>
        </div>
      </div>
    </section>
  )
}