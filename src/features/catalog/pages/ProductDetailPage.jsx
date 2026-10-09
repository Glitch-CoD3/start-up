import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart, useCatalog } from '../../../app/providers'
import { formatCurrency, getVariantLabel } from '../../../lib/formatters'
import ProductGrid from '../components/ProductGrid'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { products, loading, error } = useCatalog()
  const { addItem } = useCart()
  const product = products.find((item) => item.url_slug === slug || item.id === slug)
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [activeImage, setActiveImage] = useState('')
  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedId) ??
    product?.variants.find((variant) => Number(variant.stock_quantity) > 0) ??
    product?.variants[0] ??
    null
  const stock = selectedVariant
    ? Number(selectedVariant.stock_quantity || 0)
    : Number(product?.stock || 0)
  const images = product
    ? [...new Set(product.variants.flatMap((variant) => variant.images))]
    : []
  const displayImage = activeImage || selectedVariant?.images[0] || product?.image || ''

  const handleAdd = async () => {
    if (!product || stock < 1 || adding) return
    setAdding(true)
    try {
      await addItem(product, selectedVariant, quantity)
      toast.success('Added to your bag')
    } catch (cause) {
      toast.error(cause.message || 'Could not add this item.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div className="detail-loading" aria-label="Loading product"><span /></div>
  }

  if (error) {
    return <div className="page-message notice--error" role="alert"><h2>We couldn’t find the collection.</h2><p>{error}</p></div>
  }

  if (!product) {
    return (
      <div className="page-message">
        <span className="eyebrow">A little detour</span>
        <h1>This piece has moved on.</h1>
        <p>Have a look at the rest of the collection — your next favorite might be there.</p>
        <Link className="button button--dark" to="/shop"><ArrowLeft size={16} /> Back to shop</Link>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <Link className="back-link" to="/shop"><ArrowLeft size={16} /> Back to the collection</Link>
      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-gallery__main">
            {displayImage ? (
              <img src={displayImage} alt={product.name} />
            ) : (
              <div className="detail-gallery__placeholder"><span>{product.category}</span><strong>TL.</strong></div>
            )}
            <span className="detail-gallery__caption">A Trendlama everyday piece</span>
          </div>
          {images.length > 1 && (
            <div className="detail-gallery__thumbs" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  type="button"
                  className={displayImage === image ? 'is-active' : ''}
                  onClick={() => setActiveImage(image)}
                  aria-label={`View product image ${index + 1}`}
                  key={image}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <span className="eyebrow">{product.brand || product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">
            {(selectedVariant?.discount_amount ?? product.discount_amount) > 0 && (
              <del>{formatCurrency(selectedVariant?.base_price ?? product.base_price)}</del>
            )}{' '}
            {formatCurrency(selectedVariant?.price ?? product.price)}
          </p>
          <p className="detail-description">
            {product.description || product.short_description || 'A considered staple, made to feel good from the first wear to the hundredth.'}
          </p>
          <div className="detail-divider" />
          {product.variants.length > 0 && (
            <div className="variant-picker">
              <div className="variant-picker__heading">
                <span>Choose your option</span>
                <span className="variant-picker__selected">{getVariantLabel(selectedVariant)}</span>
              </div>
              <div className="variant-picker__options">
                {product.variants.map((variant) => {
                  const available = Number(variant.stock_quantity || 0) > 0
                  const chosen = variant.id === selectedVariant?.id
                  return (
                    <button
                      className={`variant-option${chosen ? ' is-selected' : ''}`}
                      type="button"
                      key={variant.id}
                      disabled={!available}
                      onClick={() => {
                        setSelectedId(variant.id)
                        setActiveImage(variant.images[0] ?? '')
                        setQuantity(1)
                      }}
                    >
                      {getVariantLabel(variant)}
                      {chosen && <Check size={14} />}
                      {!available && <span className="sr-only">Out of stock</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="detail-buy-row">
            <div className="quantity-control" aria-label="Quantity">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => Math.min(Math.max(stock, 1), value + 1))} aria-label="Increase quantity" disabled={quantity >= stock}><Plus size={15} /></button>
            </div>
            <button className="button button--dark detail-add" type="button" onClick={handleAdd} disabled={stock < 1 || adding}>
              <span>{adding ? 'Adding to bag…' : stock < 1 ? 'Currently unavailable' : 'Add to bag'}</span>
              <ArrowRight size={17} />
            </button>
            <button className="icon-button detail-favorite" type="button" aria-label="Save this piece" onClick={() => toast('Your wish list is coming soon.')}>
              <Heart size={19} />
            </button>
          </div>
          <p className={`stock-note${stock < 1 ? ' is-unavailable' : ''}`} aria-live="polite">
            {stock > 0
              ? `${stock} ${stock === 1 ? 'unit' : 'units'} in stock and ready to find a home.`
              : 'Out of stock — this one is taking a little break.'}
          </p>
          <div className="detail-perks">
            <div><Truck size={17} /><span>Delivery fee based on your address</span></div>
            <div><ShieldCheck size={17} /><span>Easy exchanges within 7 days</span></div>
          </div>
        </div>
      </div>
      {products.filter((item) => item.id !== product.id).length > 0 && (
        <section className="section related-section">
          <div className="section-heading">
            <div><span className="eyebrow">A good match</span><h2>More to <em>love.</em></h2></div>
            <Link className="text-link" to="/shop">See everything <ArrowRight size={15} /></Link>
          </div>
          <ProductGrid products={products.filter((item) => item.id !== product.id).slice(0, 4)} />
        </section>
      )}
    </div>
  )
}