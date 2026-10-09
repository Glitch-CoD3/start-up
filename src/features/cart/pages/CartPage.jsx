import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth, useCart, useCatalog } from '../../../app/providers'
import { formatCurrency, getVariantLabel } from '../../../lib/formatters'
import { getCheckoutQuote } from '../../checkout/api'

export default function CartPage() {
  const { user } = useAuth()
  const { items, count, loading, error, updateQuantity, removeItem } = useCart()
  const { products } = useCatalog()
  const [quote, setQuote] = useState(null)
  const lines = items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.product_id)
      if (!product) return null
      const variant =
        product.variants.find((entry) => entry.id === item.product_variant_id) ?? null
      return {
        item,
        product,
        variant,
        price: Number(variant?.price ?? product.price),
        stock: Number(variant?.stock_quantity ?? product.stock ?? 0),
      }
    })
    .filter(Boolean)
  const subtotal = lines.reduce((total, line) => total + line.price * line.item.quantity, 0)
  const quoteMatchesCart = quote?.items?.length === items.length &&
    quote.items.every((line) =>
      items.some((item) => item.id === line.cart_id && item.quantity === line.quantity),
    )
  const lineTotals = new Map((quoteMatchesCart ? quote.items : []).map((line) => [line.cart_id, line.line_total]))
  const displayedSubtotal = quoteMatchesCart
    ? Number(quote.subtotal) - Number(quote.discount_amount)
    : subtotal

  useEffect(() => {
    if (!user || loading || !items.length) return undefined
    let active = true
    getCheckoutQuote()
      .then((data) => active && setQuote(data))
      .catch((cause) => {
        console.error('Could not load database cart totals.', cause)
      })
    return () => { active = false }
  }, [items, loading, user])

  const changeQuantity = async (item, quantity) => {
    try {
      await updateQuantity(item, quantity)
    } catch (cause) {
      toast.error(cause.message || 'Could not update the quantity.')
    }
  }

  const deleteLine = async (item) => {
    try {
      await removeItem(item)
      toast.success('Removed from your bag')
    } catch (cause) {
      toast.error(cause.message || 'Could not remove this item.')
    }
  }

  if (loading) {
    return <div className="detail-loading" aria-label="Loading your bag"><span /></div>
  }

  return (
    <section className="cart-page">
      <div className="cart-heading">
        <div><span className="eyebrow">The good stuff</span><h1>Your bag<span>.</span></h1></div>
        <Link className="text-link" to="/shop"><ArrowLeft size={15} /> Keep browsing</Link>
      </div>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {!lines.length ? (
        <div className="cart-empty">
          <div className="cart-empty__icon"><ShoppingBag size={28} /></div>
          <span className="eyebrow">A blank canvas</span>
          <h2>Your bag is taking a little breather.</h2>
          <p>When something catches your eye, you’ll find it right here.</p>
          <Link className="button button--dark" to="/shop">Find your next favorite <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            <div className="shipping-progress"><p>Delivery charges are based on your saved address and shown at checkout.</p></div>
            {lines.map(({ item, product, variant, price, stock }) => (
              <article className="cart-line" key={item.id ?? `${item.product_id}-${item.product_variant_id}`}>
                <Link className="cart-line__image" to={`/product/${product.url_slug || product.id}`}>
                  {variant?.images[0] || product.image ? (
                    <img src={variant?.images[0] || product.image} alt={product.name} />
                  ) : <span>{product.category}</span>}
                </Link>
                <div className="cart-line__body">
                  <span className="eyebrow">{product.brand || product.category}</span>
                  <Link className="cart-line__name" to={`/product/${product.url_slug || product.id}`}>{product.name}</Link>
                  {variant && <span className="cart-line__variant">{getVariantLabel(variant)}</span>}
                  <span className={`cart-line__stock${stock < 1 ? ' is-unavailable' : ''}`}>
                    {stock > 0 ? `${stock} ${stock === 1 ? 'unit' : 'units'} available` : 'Out of stock'}
                  </span>
                  {item.quantity > stock && (
                    <span className="cart-line__stock is-unavailable" role="alert">
                      Only {stock} available. Reduce the quantity to continue.
                    </span>
                  )}
                  <button className="cart-line__remove" type="button" onClick={() => deleteLine(item)}><Trash2 size={14} /> Remove</button>
                </div>
                <div className="cart-line__end">
                  <span className="cart-line__price">{formatCurrency(lineTotals.get(item.id) ?? price * item.quantity)}</span>
                  <div className="quantity-control quantity-control--small">
                    <button type="button" onClick={() => item.quantity === 1 ? deleteLine(item) : changeQuantity(item, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(item, item.quantity + 1)} disabled={item.quantity >= stock} aria-label="Increase quantity"><Plus size={13} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="order-summary">
            <span className="eyebrow">A little recap</span>
            <h2>Order summary</h2>
            <div className="summary-row"><span>Subtotal · {count} {count === 1 ? 'piece' : 'pieces'}</span><strong>{formatCurrency(displayedSubtotal)}</strong></div>
            <div className="summary-row"><span>Delivery</span><strong>Calculated at checkout</strong></div>
            <div className="summary-rule" />
            <div className="summary-row summary-row--total"><span>Items subtotal</span><strong>{formatCurrency(displayedSubtotal)}</strong></div>
            <p className="summary-note">Product discounts are included. Delivery is calculated from your address at checkout.</p>
            <Link className="button button--dark button--full" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link>
            <p className="summary-secure">A good choice, just one click away.</p>
          </aside>
        </div>
      )}
    </section>
  )
}