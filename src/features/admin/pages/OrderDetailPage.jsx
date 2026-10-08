import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAdminOrder, updateAdminOrder } from '../api'
import StatusSelect from '../components/StatusSelect'

const money = (value) => `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('pending')
  const [paymentStatus, setPaymentStatus] = useState('UNPAID')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminOrder(id)
      .then((data) => {
        if (!active) return
        setOrder(data)
        if (data) {
          setStatus(data.status)
          setPaymentStatus(data.payment_status)
        } else setError('This order could not be found.')
      })
      .catch((cause) => {
        console.error('Could not load order details.', cause)
        if (active) setError(cause.message || 'Order details could not be loaded.')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateAdminOrder(id, { status, payment_status: paymentStatus })
      toast.success('Order updated.')
    } catch (cause) {
      console.error('Could not update order.', cause)
      setError(cause.message || 'Order could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-page"><p className="admin-message">Loading order…</p></div>
  if (!order) return <div className="admin-page"><Link className="admin-back-link admin-back-link--inline" to="/admin/orders"><ArrowLeft size={15} /> All orders</Link>{error && <div className="notice notice--error" role="alert">{error}</div>}</div>
  const customerPhone = order.customer?.phone_number || order.shipping_address?.phone_number

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><Link className="admin-back-link admin-back-link--inline" to="/admin/orders"><ArrowLeft size={15} /> All orders</Link><span className="eyebrow">Order details</span><h1>{order.order_number}</h1></div>
        <span className={`admin-pill admin-pill--${order.status}`}>{order.status}</span>
      </header>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <div className="admin-order-layout">
        <section className="admin-form-card">
          <div className="admin-section__heading"><div><span className="eyebrow">What was ordered</span><h2>Items</h2></div></div>
          <div className="admin-order-items">
            {order.items.map((item) => (
              <div className="admin-order-item" key={item.id}>
                <div><strong>{item.product_name}</strong><small>Qty {item.quantity} · {money(item.price)} each</small></div>
                <strong>{money(item.total_amount)}</strong>
              </div>
            ))}
          </div>
          <div className="admin-order-total"><span>Items subtotal</span><strong>{money(order.total_amount)}</strong></div>
          <div className="admin-order-total"><span>Discount</span><strong>−{money(order.discount_amount)}</strong></div>
          <div className="admin-order-total"><span>Shipping</span><strong>{money(order.shipping_charge)}</strong></div>
          <div className="admin-order-total admin-order-total--grand"><span>Net total</span><strong>{money(order.net_amount)}</strong></div>
        </section>
        <div className="admin-order-aside">
          <section className="admin-form-card">
            <span className="eyebrow">Customer</span>
            <h2 className="admin-card-title">{order.customer?.full_name || 'Customer'}</h2>
            <p>{customerPhone || 'No phone number'}</p>
          </section>
          <section className="admin-form-card">
            <span className="eyebrow">Payment reference</span>
            <h2 className="admin-card-title">{order.payment_method?.replace('_', ' ') || 'Not specified'}</h2>
            <p>{order.payment_method === 'bank_card' ? 'Card last 4 digits' : 'Sender number'}: {order.payment_account_reference || 'Not provided'}</p>
            <p>{order.transaction_number || 'No transaction reference provided.'}</p>
            <span className={`admin-pill admin-pill--${order.payment_status === 'PAID' ? 'delivered' : 'pending'}`}>{order.payment_status?.replaceAll('_', ' ') || 'UNPAID'}</span>
          </section>
          <section className="admin-form-card">
            <span className="eyebrow">Delivery address</span>
            {order.shipping_address ? (
              <address>{order.shipping_address.full_address}<br />{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}<br />{order.shipping_address.phone_number}</address>
            ) : <p>No shipping address was recorded.</p>}
          </section>
          <form className="admin-form-card admin-order-update" onSubmit={save}>
            <div className="admin-section__heading"><div><span className="eyebrow">Fulfilment</span><h2>Update order</h2></div></div>
            <StatusSelect value={status} onChange={setStatus} disabled={saving} />
            <label className="admin-field"><span>Payment status</span><input required maxLength="100" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} /></label>
            <button className="admin-button" type="submit" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save updates'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}