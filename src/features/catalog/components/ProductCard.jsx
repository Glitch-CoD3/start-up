import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart } from '../../../app/providers'
import { formatCurrency } from '../../../lib/formatters'

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)
  const variant =
    product.variants.find((option) => Number(option.stock_quantity) > 0) ??
    product.variants[0]
  const stock = variant ? Number(variant.stock_quantity) : product.stock
  const price = variant?.price ?? product.price
  const image = variant?.images[0] ?? product.image

  const handleAdd = async (event) => {
    event.preventDefault()
    if (adding || stock <= 0) return

    setAdding(true)
    try {
      await addItem(product, variant)
      toast.success('Added to your bag')
    } catch (error) {
      toast.error(error.message || 'Could not add this item.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="product-card" style={{ '--card-index': index }}>
      <Link
        className="product-card__visual"
        to={`/product/${product.url_slug || product.id}`}
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <img src={image} alt={product.name} loading={index < 4 ? 'eager' : 'lazy'} />
        ) : (
          <div className="product-card__placeholder">
            <span>{product.category}</span>
          </div>
        )}
        {product.brand && <span className="product-card__tag">{product.brand}</span>}
        <span className="product-card__quick-view" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="product-card__details">
        <div className="product-card__copy">
          <p className="eyebrow">{product.category}</p>
          <Link to={`/product/${product.url_slug || product.id}`} className="product-card__name">
            {product.name}
          </Link>
          <p className="product-card__price">
            {variant?.discount_amount > 0 || (!variant && product.discount_amount > 0) ? (
              <><del>{formatCurrency(variant?.base_price ?? product.base_price)}</del> {formatCurrency(price)}</>
            ) : formatCurrency(price)}
          </p>
        </div>
        <button
          className="icon-button product-card__add"
          type="button"
          onClick={handleAdd}
          disabled={adding || stock <= 0}
          aria-label={stock <= 0 ? 'Out of stock' : `Add ${product.name} to bag`}
          title={stock <= 0 ? 'Out of stock' : 'Add to bag'}
        >
          <ShoppingBag size={18} />
        </button>
      </div>
    </article>
  )
}