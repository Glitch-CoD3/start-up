import { formatCurrency } from '../../../lib/formatters'

export default function OrderReview({ quote }) {
  return (
    <div className="checkout-review">
      <div className="checkout-review__items">
        {(quote?.items ?? []).map((item) => (
          <div className="checkout-review__item" key={item.cart_id}>
            <span>{item.product_name}{item.variant_label && <small>{item.variant_label}</small>}<small>Qty {item.quantity}</small></span>
            <strong>{formatCurrency(item.line_total)}</strong>
          </div>
        ))}
      </div>
      <div className="checkout-review__total"><span>Subtotal</span><strong>{formatCurrency(quote?.subtotal ?? 0)}</strong></div>
      {Number(quote?.discount_amount) > 0 && <div className="summary-row"><span>Product discounts</span><strong>−{formatCurrency(quote.discount_amount)}</strong></div>}
      <div className="summary-row"><span>Delivery</span><strong>{formatCurrency(quote?.delivery_charge ?? 0)}</strong></div>
      <div className="checkout-review__total"><span>Total</span><strong>{formatCurrency(quote?.total ?? 0)}</strong></div>
      <p className="checkout-review__note">Prices, discounts, and delivery are calculated from current store settings.</p>
    </div>
  )
}