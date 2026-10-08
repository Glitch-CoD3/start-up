import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useCart } from '../../../app/providers'
import { getUserAddresses } from '../../account/api'
import { formatCurrency } from '../../../lib/formatters'
import AddressSelect from '../components/AddressSelect'
import OrderReview from '../components/OrderReview'
import PaymentMethod from '../components/PaymentMethod'
import usePlaceOrder from '../hooks/usePlaceOrder'
import { getCheckoutQuote } from '../api'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { items, loading: cartLoading, refreshCart } = useCart()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState([])
  const [addressLoading, setAddressLoading] = useState(true)
  const [addressError, setAddressError] = useState('')
  const [addressId, setAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bkash')
  const [paymentAccountReference, setPaymentAccountReference] = useState('')
  const [transactionNumber, setTransactionNumber] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const { submitOrder, placing, error: orderError } = usePlaceOrder()

  useEffect(() => {
    let active = true
    getUserAddresses(user.id)
      .then((data) => {
        if (!active) return
        setAddresses(data)
        const selectedAddressId = data.find((address) => address.is_default)?.id ?? data[0]?.id ?? ''
        setAddressId(selectedAddressId)
      })
      .catch((cause) => {
        console.error('Could not load checkout addresses.', cause)
        if (active) setAddressError(cause.message || 'Saved addresses or checkout totals could not be loaded.')
      })
      .finally(() => active && setAddressLoading(false))
    return () => { active = false }
  }, [user.id])

  useEffect(() => {
    if (!addressId) return undefined
    let active = true
    getCheckoutQuote(addressId)
      .then((data) => {
        if (!active) return
        setQuote(data)
        setQuoteError('')
      })
      .catch((cause) => {
        console.error('Could not calculate checkout totals.', cause)
        if (active) setQuoteError(cause.message || 'Checkout totals could not be calculated.')
      })
    return () => { active = false }
  }, [addressId])

  const submit = async (event) => {
    event.preventDefault()
    if (!addressId) return
    const order = await submitOrder({
      addressId,
      paymentMethod,
      paymentAccountReference,
      transactionNumber,
    })
    if (!order) return
    await refreshCart()
    navigate(`/order-success/${order.id}`, { state: { orderNumber: order.order_number } })
  }

  if (cartLoading || addressLoading) {
    return <div className="detail-loading" aria-label="Preparing checkout"><span /></div>
  }

  if (!items.length) {
    return (
      <section className="checkout-page">
        <div className="checkout-empty">
          <span className="eyebrow">Almost there</span>
          <h1>Your bag is empty.</h1>
          <Link className="button button--dark" to="/shop">Explore the collection <ArrowRight size={16} /></Link>
        </div>
      </section>
    )
  }

  return (
    <section className="checkout-page">
      <Link className="back-link checkout-back" to="/cart"><ArrowLeft size={15} /> Back to your bag</Link>
      <div className="checkout-heading"><span className="eyebrow">The final little details</span><h1>Place your order<span>.</span></h1><p>Choose a delivery address and add your payment reference.</p></div>
      {(addressError || quoteError || orderError) && <div className="notice notice--error" role="alert">{addressError || quoteError || orderError}</div>}
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card__heading"><span className="checkout-step">01</span><div><span className="eyebrow">Where should we send it?</span><h2>Delivery address</h2></div></div>
            <AddressSelect addresses={addresses} value={addressId} onChange={(nextAddressId) => { setQuote(null); setAddressId(nextAddressId) }} />
            {quote && <p className="checkout-delivery-charge">Delivery to this address <strong>{formatCurrency(quote.delivery_charge)}</strong>{quote.delivery_area === 'dhaka' ? ' · Dhaka' : quote.delivery_area === 'outside_dhaka' ? ' · Outside Dhaka' : ''}</p>}
            <Link className="text-link checkout-manage-address" to="/account/addresses">Add or manage addresses <ArrowRight size={14} /></Link>
          </section>
          <section className="checkout-card">
            <div className="checkout-card__heading"><span className="checkout-step">02</span><div><span className="eyebrow">Pay your way</span><h2>Payment details</h2></div></div>
            <PaymentMethod
              method={paymentMethod}
              onMethodChange={(method) => {
                setPaymentMethod(method)
                setPaymentAccountReference('')
                setTransactionNumber('')
              }}
              paymentAccountReference={paymentAccountReference}
              onPaymentAccountReferenceChange={setPaymentAccountReference}
              transactionNumber={transactionNumber}
              onTransactionChange={setTransactionNumber}
            />
          </section>
        </div>
        <aside className="checkout-summary">
          <span className="eyebrow">Just one last look</span>
          <h2>Your order</h2>
          <OrderReview quote={quote} />
          <button className="button button--dark button--full checkout-submit" type="submit" disabled={placing || !addressId || !paymentAccountReference.trim() || !transactionNumber.trim() || !quote}>
            {placing ? 'Placing your order…' : 'Place my order'} {!placing && <ArrowRight size={16} />}
          </button>
          <p className="checkout-secure"><ShieldCheck size={15} /> Your payment reference is recorded securely with your order.</p>
          <p className="checkout-total-note">Order total · {quote ? formatCurrency(quote.total) : 'Calculating…'}</p>
        </aside>
      </form>
    </section>
  )
}