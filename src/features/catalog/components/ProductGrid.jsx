import ProductCard from './ProductCard'

export default function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">✳</span>
        <h3>Nothing here just yet</h3>
        <p>Try another search or clear a filter to see more of the collection.</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}